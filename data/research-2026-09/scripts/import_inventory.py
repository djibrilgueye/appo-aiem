#!/usr/bin/env python3
"""
AIEM — import of researched INVENTORIES (refineries, storage/LNG, petrochem,
pipelines, basins, blocks, fields, training, R&D, national companies) and
country profiles into the SQLite prod DB.

Policy (enrich, never delete):
- Records below --min-confidence are skipped.
- A researched record that matches an existing DB row (acronym / token
  overlap / city, same country) UPDATES only the fields listed per table,
  and only where the new value is non-null and differs. Coordinates are
  written on an existing row only if the row has none; "approximate"
  coordinates never overwrite existing ones.
- A researched record with no match is INSERTED, unless its notes mark it
  CANCELLED / SHELVED / dissolved, or a NOT NULL column cannot be filled.
- Blocks and fields are attached to a basin resolved by name; if no basin
  can be resolved they are skipped (basinId is NOT NULL).
- Provenance goes to the JSON log (schema has no source column).
Default is DRY-RUN; --apply writes.
"""
import argparse, json, os, re, secrets, sqlite3, time, unicodedata

CONF = {"low": 0, "medium": 1, "high": 2}
STATUS_OK = {"operational", "under construction", "proposed", "concept", "offline", "decommissioned"}
STOP = {'refinery','raffinerie','terminal','oil','gas','lng','plant','complex','pipeline','the','de','du','des','la','le','et','and','of','sa','spa','ltd','co','company','depot','field','basin','bassin','block','bloc','project','projet','station','institute','institut','national','nationale','centre','center','school','ecole','university','universite','petroleum','petrole','petroleos','petrol','training','formation','research','recherche','development','developpement','societe','corporation','limited','plc','group','groupe','export','import','system','systeme'}
ACR_SKIP = {'LNG','FSO','FSRU','FPSO','SA','SPA','LTD','PLC','JV','GTL','CTL','PP','PE','PVC','HDPE','II','III','IV','NOC','RA','GL','CP'}

def asc(s): return unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode()
def toks(s): return {t for t in re.split(r'[^a-z0-9]+', asc(s).lower()) if t and t not in STOP and len(t) > 1}
def acr(s): return {a for a in re.findall(r'\b[A-Z][A-Z0-9&]{1,9}\b', asc(s)) if a not in ACR_SKIP}
def score(an, ac, bn, bc):
    if acr(an) & acr(bn): return 1.0
    A, B = toks(an), toks(bn)
    if not A or not B: return 0
    j = len(A & B) / len(A | B)
    cityhit = bool(toks(ac or '') & toks(bc or '')) or bool(toks(ac or '') & B) or bool(toks(bc or '') & A)
    return j + (0.25 if cityhit and j >= 0.2 else 0)
def cuid(): return "c" + secrets.token_hex(12)
def is_dead(rec):
    n = (rec.get("notes") or "").upper()
    return any(k in n for k in ("CANCELLED", "SHELVED", "DISSOLVED", "DISSOUTE"))
def approx(rec): return "approx" in (rec.get("notes") or "").lower()
def clean_status(s):
    s = (s or "operational").lower().strip()
    return s if s in STATUS_OK else ("operational" if s in ("operating", "active", "unverified") else "concept")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("db"); ap.add_argument("--research", required=True)
    ap.add_argument("--apply", action="store_true"); ap.add_argument("--min-confidence", default="medium", choices=list(CONF))
    ap.add_argument("--log", default="import_inventory_log.json")
    ap.add_argument("--aliases", default=None, help="JSON {table: {research_name: db_name}}")
    a = ap.parse_args(); minc = CONF[a.min_confidence]
    con = sqlite3.connect(a.db); con.row_factory = sqlite3.Row
    ts = int(time.time() * 1000)
    members = {r["code"]: r["id"] for r in con.execute("select code, id from Country where appoMember = 1")}
    id2code = {v: k for k, v in members.items()}
    log = {"applied": a.apply, "tables": {}}

    def rows(table):
        return [dict(r) for r in con.execute(f"select * from {table}")]
    def next_ext_id(existing, prefix, code):
        # `existing` is the live set of ids for the table; mutate it so ids
        # generated earlier in the same run are never reused.
        n = 1
        while True:
            cand = f"{prefix}-{code}-{n:03d}"
            if cand not in existing: existing.add(cand); return cand
            n += 1
    aliases = json.load(open(a.aliases)) if a.aliases and os.path.exists(a.aliases) else {}
    def find(rec, code, dbrows, ccol="countryId", table=None):
        # Manual alias (research name → DB name) wins over fuzzy matching.
        target = (aliases.get(table) or {}).get(rec.get("name"))
        if target:
            for r in dbrows:
                if r["name"] == target: return r, 1.0
        best, bs = None, 0
        for r in dbrows:
            if ccol == "countries":
                if code not in (r.get("countries") or ""): continue
            elif r.get(ccol) != members.get(code): continue
            s = score(rec.get("name", ""), rec.get("city"), r["name"], None)
            if s > bs: bs, best = s, r
        return (best if bs >= 0.5 else None), round(bs, 2)

    def run(table, fname, prefix, ext_col, upd_fields, build_insert, ccol="countryId"):
        path = os.path.join(a.research, fname)
        if not os.path.exists(path): print(f"== {table}: {fname} missing"); return
        recs = json.load(open(path)); dbrows = rows(table)
        ext_ids = {r[ext_col] for r in dbrows}
        ins, upd, skip = [], [], []
        for rec in recs:
            code = rec.get("country") or (rec.get("countries") or [None])[0]
            if code not in members: skip.append((rec.get("name"), "non-member")); continue
            if CONF.get(rec.get("confidence", "low"), 0) < minc: skip.append((rec.get("name"), f"confidence {rec.get('confidence')}")); continue
            m, s = find(rec, code, dbrows, ccol, table=table)
            prov = {"source": rec.get("source"), "confidence": rec.get("confidence"), "notes": rec.get("notes")}
            if m:
                changes = {}
                for f, getter in upd_fields.items():
                    nv = getter(rec)
                    if nv is None or nv == "": continue
                    ov = m.get(f)
                    if f in ("lat", "lon") and (ov is not None or approx(rec)): continue
                    if f in ("description", "focus", "website", "coords") and ov not in (None, "", "[]"): continue
                    if ov is None or (isinstance(nv, (int, float)) and isinstance(ov, (int, float)) and abs(float(nv) - float(ov)) > 1e-9) or (not isinstance(nv, (int, float)) and str(nv) != str(ov)):
                        changes[f] = nv
                if changes: upd.append({"id": m["id"], "db_name": m["name"], "research": rec.get("name"), "score": s, "changes": changes, **prov})
            else:
                if is_dead(rec): skip.append((rec.get("name"), "cancelled/shelved")); continue
                vals = build_insert(rec, code)
                if vals is None: skip.append((rec.get("name"), "missing required field")); continue
                vals[ext_col] = next_ext_id(ext_ids, prefix, code)
                ins.append({"values": vals, "research": rec.get("name"), **prov})
        print(f"== {table}: update {len(upd)}, insert {len(ins)}, skipped {len(skip)}")
        for reason in sorted({x[1] for x in skip}): print(f"   skipped[{reason}]: {sum(1 for x in skip if x[1]==reason)}")
        log["tables"][table] = {"updates": upd, "inserts": ins, "skipped": skip}
        if a.apply:
            for u in upd:
                sets = ", ".join(f"{f} = ?" for f in u["changes"]) + ", updatedAt = ?"
                con.execute(f"update {table} set {sets} where id = ?", list(u["changes"].values()) + [ts, u["id"]])
            for i in ins:
                v = dict(i["values"]); v.update({"id": cuid(), "createdAt": ts, "updatedAt": ts})
                con.execute(f"insert into {table} ({','.join(v)}) values ({','.join('?'*len(v))})", list(v.values()))
            con.commit(); print(f"   applied to {table}")
        return ins

    num = lambda k: (lambda r: r.get(k) if isinstance(r.get(k), (int, float)) else None)
    intnum = lambda k: (lambda r: int(round(r[k])) if isinstance(r.get(k), (int, float)) else None)
    st = lambda r: clean_status(r.get("status"))

    # ── Refinery ──
    run("Refinery", "refineries.json", "REF", "refineryId",
        {"capacityKbd": intnum("capacityKbd"), "status": st, "year": intnum("year"), "nelsonIndex": num("nelsonIndex"),
         "storageOilMb": num("storageOilMb"), "storageProductsMb": num("storageProductsMb"), "lat": num("lat"), "lon": num("lon")},
        lambda r, c: None if r.get("lat") is None or r.get("lon") is None else
            {"name": r["name"], "countryId": members[c], "lat": r["lat"], "lon": r["lon"], "capacityKbd": int(round(r.get("capacityKbd") or 0)),
             "status": clean_status(r.get("status")), "year": r.get("year"), "nelsonIndex": r.get("nelsonIndex"),
             "storageOilMb": r.get("storageOilMb"), "storageProductsMb": r.get("storageProductsMb")})
    # ── Storage (incl. LNG) ──
    run("Storage", "storage.json", "STO", "storageId",
        {"type": lambda r: r.get("type"), "lngSubtype": lambda r: r.get("lngSubtype"), "capacityMb": num("capacityMb"),
         "regasCapacity": num("regasCapacity"), "liquefCapacity": num("liquefCapacity"), "status": st, "lat": num("lat"), "lon": num("lon")},
        lambda r, c: None if r.get("lat") is None or r.get("lon") is None or not r.get("type") else
            {"name": r["name"], "countryId": members[c], "lat": r["lat"], "lon": r["lon"], "type": r["type"], "lngSubtype": r.get("lngSubtype"),
             "capacityMb": float(r.get("capacityMb") or 0), "regasCapacity": r.get("regasCapacity"), "liquefCapacity": r.get("liquefCapacity"),
             "status": clean_status(r.get("status"))})
    # ── Petrochemical ──
    run("Petrochemical", "petrochem.json", "PET", "plantId",
        {"products": lambda r: r.get("products"), "capacity": lambda r: r.get("capacity"), "status": st, "lat": num("lat"), "lon": num("lon")},
        lambda r, c: None if r.get("lat") is None or r.get("lon") is None else
            {"name": r["name"], "countryId": members[c], "lat": r["lat"], "lon": r["lon"], "products": r.get("products") or "—",
             "capacity": r.get("capacity") or "—", "status": clean_status(r.get("status"))})
    # ── Pipeline (countries JSON, coords JSON) ──
    run("Pipeline", "pipelines.json", "PIP", "pipelineId",
        {"status": st, "lengthKm": intnum("lengthKm"), "diametre": lambda r: r.get("diametre"), "capacity": lambda r: r.get("capacity"),
         "coords": lambda r: json.dumps(r["coords"]) if isinstance(r.get("coords"), list) and len(r["coords"]) >= 2 else None},
        lambda r, c: None if not (isinstance(r.get("coords"), list) and len(r["coords"]) >= 2) else
            {"name": r["name"], "countries": json.dumps([x for x in (r.get("countries") or []) if x]), "coords": json.dumps(r["coords"]),
             "status": clean_status(r.get("status")), "lengthKm": int(round(r["lengthKm"])) if isinstance(r.get("lengthKm"), (int, float)) else None,
             "diametre": r.get("diametre"), "capacity": r.get("capacity")},
        ccol="countries")
    # ── Basin ──
    run("Basin", "basins.json", "BAS", "basinId",
        {"type": lambda r: r.get("type"), "location": lambda r: r.get("location"), "areaKm2": intnum("areaKm2"),
         "description": lambda r: r.get("description"), "status": st, "lat": num("lat"), "lon": num("lon")},
        lambda r, c: None if r.get("lat") is None or r.get("lon") is None else
            {"name": r["name"], "countryId": members[c], "type": r.get("type") or "Oil & Gas", "location": r.get("location") or "Onshore & Offshore",
             "lat": r["lat"], "lon": r["lon"], "areaKm2": int(round(r["areaKm2"])) if isinstance(r.get("areaKm2"), (int, float)) else None,
             "description": r.get("description"), "status": clean_status(r.get("status"))})
    # ── Blocks & Fields (need basinId) ──
    basins = rows("Basin")
    def basin_for(rec, code):
        bname = rec.get("basin") or ""
        best, bs = None, 0
        for b in basins:
            if b["countryId"] != members.get(code): continue
            s = score(bname, None, b["name"], None)
            if s > bs: bs, best = s, b
        return best if bs >= 0.34 else None
    def blk_insert(r, c):
        b = basin_for(r, c)
        if not b: return None
        return {"name": r["name"], "basinId": b["id"], "countryId": members[c], "status": clean_status(r.get("status") or r.get("phase")),
                "type": r.get("type") or "Oil & Gas", "operator": r.get("operator"), "partners": r.get("partners"),
                "areaKm2": int(round(r["areaKm2"])) if isinstance(r.get("areaKm2"), (int, float)) else None,
                "lat": r.get("lat"), "lon": r.get("lon"), "description": r.get("notes")}
    run("Block", "blocks.json", "BLK", "blockId",
        {"operator": lambda r: r.get("operator"), "partners": lambda r: r.get("partners"), "areaKm2": intnum("areaKm2"), "lat": num("lat"), "lon": num("lon")},
        blk_insert)
    def fld_insert(r, c):
        b = basin_for(r, c)
        if not b or r.get("lat") is None or r.get("lon") is None: return None
        return {"name": r["name"], "basinId": b["id"], "countryId": members[c], "type": r.get("type") or "Oil & Gas",
                "status": clean_status(r.get("status")), "operator": r.get("operator"), "partners": r.get("partners"),
                "discoveryYear": r.get("discoveryYear"), "productionStart": r.get("firstOilYear"),
                "peakOilKbd": r.get("peakOilKbd"), "peakGasMmcmd": r.get("peakGasMmcmd"), "oilMmb": r.get("oilMmb"), "gasBcf": r.get("gasBcf"),
                "lat": r["lat"], "lon": r["lon"], "description": r.get("notes")}
    run("HydrocarbonField", "fields.json", "FLD", "fieldId",
        {"operator": lambda r: r.get("operator"), "status": st, "discoveryYear": intnum("discoveryYear"), "productionStart": intnum("firstOilYear"),
         "peakOilKbd": num("peakOilKbd"), "peakGasMmcmd": num("peakGasMmcmd"), "oilMmb": num("oilMmb"), "gasBcf": num("gasBcf")},
        fld_insert)
    # ── Training / R&D / National companies ──
    run("Training", "training.json", "TRN", "centerId",
        {"type": lambda r: r.get("type"), "year": intnum("founded"), "status": st, "lat": num("lat"), "lon": num("lon")},
        lambda r, c: None if r.get("lat") is None or r.get("lon") is None else
            {"name": r["name"], "countryId": members[c], "lat": r["lat"], "lon": r["lon"], "type": r.get("type") or "university",
             "year": r.get("founded"), "status": clean_status(r.get("status"))})
    run("RnDCenter", "rnd_centers.json", "RND", "centerId",
        {"focus": lambda r: r.get("focus"), "year": intnum("founded"), "status": st, "lat": num("lat"), "lon": num("lon")},
        lambda r, c: None if r.get("lat") is None or r.get("lon") is None else
            {"name": r["name"], "countryId": members[c], "lat": r["lat"], "lon": r["lon"], "focus": r.get("focus") or "—",
             "year": r.get("founded"), "status": clean_status(r.get("status"))})
    desc = lambda r: (json.dumps(r["description"], ensure_ascii=False) if isinstance(r.get("description"), dict) else r.get("description"))
    run("NationalCompany", "national_companies.json", "NOC", "companyId",
        {"acronym": lambda r: r.get("acronym"), "founded": intnum("founded"), "website": lambda r: r.get("website"), "description": desc},
        lambda r, c: {"name": r["name"], "acronym": r.get("acronym"), "countryId": members[c], "founded": r.get("founded"),
                      "website": r.get("website"), "description": desc(r), "status": "operational"})

    # ── Country profiles ──
    path = os.path.join(a.research, "country_profiles.json")
    if os.path.exists(path):
        cur = {r["code"]: dict(r) for r in con.execute("select * from Country")}
        ups = []
        for p in json.load(open(path)):
            c = cur.get(p["country"]);
            if not c: continue
            ch = {}
            pop = p.get("population") or {}; gdp = p.get("gdpBnUsd") or {}
            latest_pop = max((int(y) for y in pop if pop[y]), default=None)
            latest_gdp = max((int(y) for y in gdp if y.isdigit() and gdp[y] and int(y) <= 2024), default=None)
            if latest_pop and c.get("population") != int(pop[str(latest_pop)]): ch["population"] = int(pop[str(latest_pop)])
            if latest_gdp and abs((c.get("gdpBnUsd") or 0) - float(gdp[str(latest_gdp)])) > 0.05: ch["gdpBnUsd"] = round(float(gdp[str(latest_gdp)]), 2)
            for f in ("capital", "currency", "independence", "flagEmoji"):
                if p.get(f) and not c.get(f): ch[f] = p[f]
            if isinstance(p.get("economyDesc"), dict) and not c.get("economyDesc"): ch["economyDesc"] = json.dumps(p["economyDesc"], ensure_ascii=False)
            if ch: ups.append({"id": c["id"], "code": p["country"], "changes": ch, "source": p.get("source")})
        print(f"== Country: update {len(ups)} (population {sum('population' in u['changes'] for u in ups)}, gdp {sum('gdpBnUsd' in u['changes'] for u in ups)})")
        log["tables"]["Country"] = {"updates": ups}
        if a.apply:
            for u in ups:
                sets = ", ".join(f"{f} = ?" for f in u["changes"]) + ", updatedAt = ?"
                con.execute(f"update Country set {sets} where id = ?", list(u["changes"].values()) + [ts, u["id"]])
            con.commit(); print("   applied to Country")

    json.dump(log, open(a.log, "w"), ensure_ascii=False, indent=1)
    print(("APPLIED" if a.apply else "DRY-RUN") + f" — log: {a.log}")

if __name__ == "__main__":
    main()
