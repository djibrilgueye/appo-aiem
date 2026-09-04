import json, os, re, sys, unicodedata
R=sys.argv[1]; db=json.load(open(os.path.join(R,'db_current.json')))
members={c['code'] for c in db['countries'] if c['appoMember']}
STOP={'refinery','raffinerie','terminal','oil','gas','lng','plant','complex','pipeline','the','de','du','des','la','le','et','and','of','sa','spa','ltd','co','company','depot','field','basin','bassin','block','bloc','project','projet','station','institute','institut','national','nationale','centre','center','school','ecole','university','universite','petroleum','petrole','petroleos','petrol','training','formation','research','recherche','development','developpement','societe','company','corporation','limited','plc','group','groupe','export','import','system','systeme'}
def asc(s): return unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode()
def toks(s): return {t for t in re.split(r'[^a-z0-9]+',asc(s).lower()) if t and t not in STOP and len(t)>1}
def acr(s): return {a for a in re.findall(r'\b[A-Z][A-Z0-9&]{1,9}\b',asc(s)) if a not in {'LNG','FSO','FSRU','FPSO','SA','SPA','LTD','PLC','JV','GTL','CTL','PP','PE','PVC','HDPE','II','III','IV','NOC'}}
def score(a_name,a_city,b_name,b_city):
    A,B=toks(a_name),toks(b_name)
    if acr(a_name)&acr(b_name): return 1.0
    if not A or not B: return 0
    j=len(A&B)/len(A|B)
    cityhit = bool(toks(a_city or '')&toks(b_city or '')) or bool(toks(a_city or '')&B) or bool(toks(b_city or '')&A)
    return j + (0.25 if cityhit and j>=0.2 else 0)
def match(x, code, rows, ccol='countryCode'):
    best=None; bs=0
    for r in rows:
        rc = r.get(ccol); rcs = r.get('countries') or ''
        if rc!=code and code not in rcs: continue
        s=score(x.get('name',''), x.get('city'), r['name'], r.get('city'))
        if s>bs: bs=s; best=r
    return (best,round(bs,2)) if bs>=0.5 else (None,round(bs,2))
sets=[('refineries','refineries'),('storage','storages'),('petrochem','petrochem'),('pipelines','pipelines'),('basins','basins'),('training','training'),('rnd_centers','rnd'),('national_companies','nationalCompanies')]
out={}
for fname,dbkey in sets:
    p=os.path.join(R,fname+'.json')
    if not os.path.exists(p): print(f"== {fname}: file missing"); continue
    new=json.load(open(p)); rows=db.get(dbkey,[])
    matched=[]; created=[]
    for x in new:
        code=x.get('country') or (x.get('countries') or [None])[0]
        if code not in members: continue
        m,s=match(x, code, rows)
        (matched if m else created).append((x,m,s))
    used={id(m) for _,m,_ in matched}
    stale=[r['name'] for r in rows if id(r) not in used and (r.get('countryCode') in members or fname=='pipelines')]
    conf={}
    for x,_,_ in created: conf[x.get('confidence')]=conf.get(x.get('confidence'),0)+1
    print(f"== {fname}: researched {len(new)} | matched {len(matched)} | new {len(created)} (conf {conf}) | DB {len(rows)} | DB w/o counterpart {len(stale)}")
    print("   sample matches:", [(x['name'][:38], '→', m['name'][:38], s) for x,m,s in matched[:4]])
    print("   sample new:", [ (x.get('country'), x['name'][:45], x.get('confidence')) for x,_,_ in created[:5]])
    out[fname]={'matched':[{'research':x.get('name'),'db_id':m.get('id'),'db_name':m.get('name'),'score':s} for x,m,s in matched],'new':[x.get('name') for x,_,_ in created],'stale_db':stale}
json.dump(out, open(os.path.join(R,'reconcile_infra.json'),'w'), ensure_ascii=False, indent=1)
