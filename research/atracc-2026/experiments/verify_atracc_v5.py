#!/usr/bin/env python3
"""Offline integrity and numerical checks for the ATRACC revision. No API calls."""
import csv
import hashlib
import json
import statistics
from collections import Counter,defaultdict
from pathlib import Path
from atracc_revision_v5 import read_csv,norm,derive
from atracc_conformance_v1 import code_case

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'output/experiments/atracc_v5'
def readj(p):return json.loads(p.read_text())
def rows(p):return [json.loads(x) for x in p.read_text().splitlines()]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(condition,label):
    if not condition:raise AssertionError(label)
    checks.append(label)
checks=[]

def main():
    manifest=readj(ROOT/'output/experiments/atracc_v3/validation_manifest.json')
    check(sha(ROOT/manifest['source_path'])==manifest['source_sha256'],'Source snapshot matches original SHA-256')
    check(sha(ROOT/manifest['codebook_path'])==manifest['codebook_sha256'],'Locked codebook unchanged')
    source=read_csv(ROOT/manifest['source_path'])
    chosen=[r for r in source if r['is_high_impact']=='Presumed High-Impact, but Not High-impact']
    check(len(source)==3611 and len(chosen)==110,'Exact population filter gives 110 of 3611 rows')
    archived=read_csv(ROOT/'output/experiments/atracc_v3/atracc_consensus_codings.csv')
    check(Counter(norm(r['HI_justification']) for r in chosen)==Counter(norm(r['rationale']) for r in archived),'Archived rationales match source multiset')
    check(sum(not r['id'].strip() for r in chosen)==13,'Thirteen blank source identifiers')
    human=read_csv(ROOT/'outputs/atracc_human_validation/ATRACC_110_Independent_Human_Annotation.csv')
    fields=list(human[0]);label_fields=fields[fields.index('coder_id'):]
    check(len(human)==110 and all(not r[k].strip() for r in human for k in label_fields),'No completed human annotation fields')
    panel=read_csv(ROOT/'output/experiments/atracc_v3/atracc_panel_codings.csv')
    check(len(panel)==550 and all(derive(r)==r['status'] for r in panel),'All 550 original statuses follow their component formula')
    counts=defaultdict(Counter)
    for r in panel:counts[r['id']][r['status']]+=1
    check(len(counts)==110 and all(sum(c.values())==5 for c in counts.values()),'Exactly five archived readings per record')
    agreement=statistics.mean(sum(n*(n-1) for n in c.values())/20 for c in counts.values())
    cats=Counter(r['status'] for r in panel);pe=sum((cats[k]/550)**2 for k in ['S','U','D'])
    check(abs(agreement-.9072727272727272)<1e-12 and abs((agreement-pe)/(1-pe)-.8451713326856839)<1e-12,'Archived agreement and Fleiss kappa independently reproduced')
    revised=read_csv(BASE/'reconciled_records.csv');templates=read_csv(BASE/'templates.csv')
    check(Counter(r['status'] for r in revised)==Counter(S=24,U=70,D=16),'Reconciled record counts 24/70/16')
    check(len(templates)==70 and Counter(r['status'] for r in templates)==Counter(S=22,U=35,D=13),'Template counts 22/35/13')
    check(sum(bool(r['rationale']) for r in templates)==69,'69 nonempty rationale groups')
    check([r['id'] for r in revised if r['archived_status']!=r['status']]==['DHS-2543'],'Exactly one changed record status')
    check(Counter(r['status'] for r in revised if r['agency']!='DOJ')==Counter(S=24,U=38,D=16),'DOJ removal counts 24/38/16')
    for t in templates:
        rr=[r for r in revised if r['template_id']==t['template_id']]
        check(len(rr)==int(t['occurrences']) and len({r['status'] for r in rr})==1,'Within-template status invariant '+t['template_id'])
    repairs=read_csv(BASE/'repair_routes.csv');ur=[r for r in repairs if r['status']=='U']
    check(Counter(int(r['missing_role_count']) for r in ur)==Counter({0:6,1:12,2:43,3:9}),'Repair depths 6/12/43/9')
    synthetics=read_csv(ROOT/'output/experiments/atracc_v4/conformance/atracc_50_synthetic_conformance_cases.csv')
    scoreable=[r for r in synthetics if r['expected_status']!='contested']
    check(len(scoreable)==47 and sum(code_case(r['rationale'])['status']==r['expected_status'] for r in scoreable)==43,'Lexical conformance 43 of 47 reproduced')
    check(sum(code_case(r['rationale'])['O']==r['expected_O'] for r in scoreable)==30,'Lexical output/workflow conformance 30 of 47 reproduced')
    rp=BASE/'replication_v2';inputs=rows(rp/'all_inputs.jsonl');results=rows(rp/'results.jsonl');man=readj(rp/'prospective_manifest.json')
    check(hashlib.sha256(json.dumps(inputs,sort_keys=True).encode()).hexdigest()==man['inputs_sha256'],'Prospective input manifest hash matches')
    check(Counter(r['dataset'] for r in inputs)==Counter(inventory=70,synthetic=50,external=8,repeat=10),'138 planned inputs with declared composition')
    check(len(results)==276 and len({(r['id'],r['requested_model']) for r in results})==276,'276 unique completed model/input pairs')
    lookup={r['id']:r for r in inputs}
    for r in results:
        check(r['parse_ok'] and r['response_status']=='completed' and r['requested_model']==r['resolved_model'],'Complete pinned-model result '+r['requested_model']+' '+r['id'])
        check(derive(r['parsed'])==r['derived_status'],'Mechanically derived status '+r['requested_model']+' '+r['id'])
        check(sha(rp/'prompts'/(r['id']+'.txt'))==r['prompt_sha256'],'Saved prompt hash '+r['requested_model']+' '+r['id'])
        raw=readj(next((rp/'raw').glob(r['requested_model']+'_'+r['id']+'_'+r['response_id']+'.json')))
        check(raw['model']==r['resolved_model'] and raw['id']==r['response_id'],'Raw API identity '+r['requested_model']+' '+r['id'])
    for r in inputs:
        if r['dataset']=='repeat':check(r['rationale']==lookup[r['repeat_of']]['rationale'],'Repeat preserves rationale '+r['id'])
    arts=rows(ROOT/'output/experiments/atracc_v3/artifacts/artifact_records.jsonl')
    check(len(arts)==22 and len({r['url'] for r in arts})==18 and sum(r['inventory_status']=='U' for r in arts)==9,'Artifact denominator 22 pairs, 18 URLs, 9 U cases')
    fp=BASE/'full_document_audit';fs=rows(fp/'results.jsonl')
    check(len(fs)==14 and len({(r['case_id'],r['requested_model']) for r in fs})==14,'Fourteen unique complete-document model/case pairs')
    pm=readj(fp/'manifest.json')
    for f in pm['files']:
        txt=BASE/'full_documents'/(f['case_id']+'.txt')
        check(sha(txt)==f['sha256'] and len(txt.read_text())==f['characters'],'Full text hash and length '+f['case_id'])
    check(len({sha(BASE/'full_documents'/(f['case_id']+'.pdf')) for f in pm['files']})==6,'Six distinct original PDFs')
    for r in fs:
        check(sha(fp/'prompts'/(r['case_id']+'.txt'))==r['prompt_sha256'],'Full-document prompt hash '+r['case_id']+' '+r['requested_model'])
        pages=(BASE/'full_documents'/(r['case_id']+'.txt')).read_text().split('\f')
        for k,e in r['parsed']['evidence'].items():
            page=e.get('pdf_page');quote=e.get('quote','')
            actual=bool(quote) and isinstance(page,int) and 1<=page<=len(pages) and norm(quote) in norm(pages[page-1])
            check(actual==r['source_quote_checks'][k],'Page quotation check '+r['case_id']+' '+r['requested_model']+' '+k)
    ds=readj(fp/'summary.json')
    check(ds['strict_recoveries']==0 and ds['recoveries_without_time_requirement']==1 and ds['verified_mechanism_and_anchor_pairs']==2,'Strict 0, no-time 1, verified mechanism/anchor 2')
    result={'checks_passed':len(checks),'status':'PASS','scope':'Offline integrity, arithmetic, raw-output provenance, text invariance and quotation checks. Does not validate semantic judgments against humans.','checks':checks}
    (BASE/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))

if __name__=='__main__':main()
