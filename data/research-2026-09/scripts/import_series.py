#!/usr/bin/env python3
"""
AIEM — import of researched time series (Reserve, Production, TradeExport,
TradeImport) into the SQLite prod database, keyed on (country, year).

Default is DRY-RUN: prints the plan and writes an import log, touches nothing.
Pass --apply to write. Provenance (source name/url/table, confidence, notes)
is written to <log> as JSON since the Prisma schema has no source column.

Rules
- Only APPO member countries present in Country (ISO3 code) are imported.
- confidence below --min-confidence is skipped (low < medium < high).
- Reserve/Production: a record with both oil and gas null is skipped.
  On INSERT, a null oil or gas becomes 0 only if the other is present
  (the columns are NOT NULL); on UPDATE, null fields are left untouched.
- Trade: numeric nulls become 0 on INSERT (columns default 0), untouched
  on UPDATE; `partners` becomes partnersDetail JSON and the partner names
  become mainDestinations / mainSources.
- ids are cuid-like unique strings; createdAt/updatedAt are epoch ms.
"""
import argparse, json, os, secrets, sqlite3, sys, time

CONF = {"low": 0, "medium": 1, "high": 2}

def cuid() -> str:
    return "c" + secrets.token_hex(12)

def now_ms() -> int:
    return int(time.time() * 1000)

def load(path):
    with open(path) as f:
        return json.load(f)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("db")
    ap.add_argument("--research", required=True, help="dir with reserves.json etc.")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--min-confidence", default="medium", choices=list(CONF))
    ap.add_argument("--log", default="import_log.json")
    ap.add_argument("--tables", default="reserves,production,trade_exports,trade_imports")
    a = ap.parse_args()

    con = sqlite3.connect(a.db)
    con.row_factory = sqlite3.Row
    countries = {r["code"]: r["id"] for r in con.execute("select id, code from Country where appoMember = 1")}
    minc = CONF[a.min_confidence]
    log = {"applied": a.apply, "at": time.strftime("%Y-%m-%dT%H:%M:%S"), "tables": {}}
    ts = now_ms()

    def plan_series(fname, table, fields):
        recs = load(os.path.join(a.research, fname))
        cur = {(r["countryId"], r["year"]): dict(r) for r in con.execute(f"select * from {table}")}
        inserts, updates, skipped = [], [], []
        for r in recs:
            cid = countries.get(r["country"])
            if not cid:
                skipped.append((r["country"], r["year"], "not an APPO member in DB")); continue
            if CONF.get(r.get("confidence", "low"), 0) < minc:
                skipped.append((r["country"], r["year"], f"confidence {r.get('confidence')}")); continue
            vals = {f: r.get(f) for f in fields}
            if vals.get("oil") is None and vals.get("gas") is None:
                skipped.append((r["country"], r["year"], "no oil/gas value")); continue
            prov = {"source": r.get("source"), "confidence": r.get("confidence"), "notes": r.get("notes")}
            key = (cid, r["year"])
            if key in cur:
                old = cur[key]
                changes = {f: v for f, v in vals.items() if v is not None and (old.get(f) is None or abs(float(old.get(f) or 0) - float(v)) > 1e-9)}
                if changes:
                    updates.append({"country": r["country"], "year": r["year"], "id": old["id"], "old": {f: old.get(f) for f in changes}, "new": changes, **prov})
            else:
                ins = dict(vals)
                if ins.get("oil") is None: ins["oil"] = 0.0
                if ins.get("gas") is None: ins["gas"] = 0.0
                inserts.append({"country": r["country"], "year": r["year"], "countryId": cid, "values": ins, **prov})
        return inserts, updates, skipped

    def plan_trade(fname, table, partner_col):
        recs = load(os.path.join(a.research, fname))
        num = ["oilIntraKbD", "oilExtraKbD", "gasIntraBcm", "gasExtraBcm", "essenceM3", "gasoilM3", "gplTM", "jetFuelTM"]
        cur = {(r["countryId"], r["year"]): dict(r) for r in con.execute(f"select * from {table}")}
        inserts, updates, skipped = [], [], []
        for r in recs:
            cid = countries.get(r["country"])
            if not cid:
                skipped.append((r["country"], r["year"], "not an APPO member in DB")); continue
            if CONF.get(r.get("confidence", "low"), 0) < minc:
                skipped.append((r["country"], r["year"], f"confidence {r.get('confidence')}")); continue
            vals = {f: r.get(f) for f in num}
            if all(v is None for v in vals.values()):
                skipped.append((r["country"], r["year"], "no numeric value")); continue
            partners = r.get("partners") or []
            pd = json.dumps([{"partner": p.get("partner"), "hydro": p.get("hydro"), "qty": p.get("qty"), "unit": p.get("unit")} for p in partners], ensure_ascii=False)
            names = json.dumps(sorted({p.get("partner") for p in partners if p.get("partner")}), ensure_ascii=False)
            prov = {"source": r.get("source"), "confidence": r.get("confidence"), "notes": r.get("notes")}
            key = (cid, r["year"])
            if key in cur:
                old = cur[key]
                changes = {f: v for f, v in vals.items() if v is not None and (old.get(f) is None or abs(float(old.get(f) or 0) - float(v)) > 1e-9)}
                if partners:
                    changes["partnersDetail"] = pd; changes[partner_col] = names
                if changes:
                    updates.append({"country": r["country"], "year": r["year"], "id": old["id"], "old": {f: old.get(f) for f in changes if f in old}, "new": changes, **prov})
            else:
                ins = {f: (0.0 if (v is None and f in num[:4]) else v) for f, v in vals.items()}
                ins["partnersDetail"] = pd; ins[partner_col] = names
                inserts.append({"country": r["country"], "year": r["year"], "countryId": cid, "values": ins, **prov})
        return inserts, updates, skipped

    specs = {
        "reserves":      ("reserves.json",      "Reserve",     lambda: plan_series("reserves.json", "Reserve", ["oil", "gas", "condensat"])),
        "production":    ("production.json",    "Production",  lambda: plan_series("production.json", "Production", ["oil", "gas", "condensat"])),
        "trade_exports": ("trade_exports.json", "TradeExport", lambda: plan_trade("trade_exports.json", "TradeExport", "mainDestinations")),
        "trade_imports": ("trade_imports.json", "TradeImport", lambda: plan_trade("trade_imports.json", "TradeImport", "mainSources")),
    }

    for name in a.tables.split(","):
        fname, table, planner = specs[name]
        if not os.path.exists(os.path.join(a.research, fname)):
            print(f"== {table}: {fname} missing — skipped"); continue
        inserts, updates, skipped = planner()
        print(f"== {table}: insert {len(inserts)}, update {len(updates)}, skipped {len(skipped)}")
        for s in sorted({x[2] for x in skipped}):
            print(f"   skipped[{s}]: {sum(1 for x in skipped if x[2]==s)}")
        for u in updates:
            big = [f for f in u["new"] if f in u["old"] and u["old"][f] not in (None, 0) and isinstance(u["new"][f], (int, float)) and abs(u["new"][f]-u["old"][f])/abs(u["old"][f]) > 0.15]
            if big:
                print(f"   Δ>15% {u['country']} {u['year']}: " + ", ".join(f"{f} {u['old'][f]}→{u['new'][f]}" for f in big) + f"  [{(u['source'] or {}).get('name')}]")
        log["tables"][table] = {"inserts": inserts, "updates": updates, "skipped": skipped}

        if a.apply:
            for ins in inserts:
                cols = ["id", "countryId", "year", "createdAt", "updatedAt"] + list(ins["values"])
                vals = [cuid(), ins["countryId"], ins["year"], ts, ts] + list(ins["values"].values())
                con.execute(f"insert into {table} ({','.join(cols)}) values ({','.join('?'*len(cols))})", vals)
            for u in updates:
                sets = ", ".join(f"{f} = ?" for f in u["new"]) + ", updatedAt = ?"
                con.execute(f"update {table} set {sets} where id = ?", list(u["new"].values()) + [ts, u["id"]])
            con.commit()
            print(f"   applied to {table}")

    with open(a.log, "w") as f:
        json.dump(log, f, ensure_ascii=False, indent=1)
    print(("APPLIED" if a.apply else "DRY-RUN") + f" — log: {a.log}")

if __name__ == "__main__":
    main()
