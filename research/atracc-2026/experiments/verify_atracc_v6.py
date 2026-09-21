#!/usr/bin/env python3
"""Verify identity of repeated requests, complete outputs and published arithmetic offline."""
import hashlib
import itertools
import json
from datetime import datetime
from pathlib import Path
from run_atracc_replication_v5 import MODELS,FIELDS,derive,prompt,sha
from run_tas_official_apis_v5 import openai_text
from score_atracc_repeat_v6 import csvrows,jsonl,minimal_substitutions

ROOT=Path(__file__).resolve().parents[1]
B=ROOT/'output/experiments/atracc_v6'
O=ROOT/'output/experiments/atracc_v5/replication_v2'
checks=[]
def check(ok,label):
    if not ok:raise AssertionError(label)
    checks.append(label)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    manifest=json.loads((B/'exact_repeat/prospective_manifest.json').read_text())
    spec=manifest['specification']
    for key,path in [('old_results_sha256',O/'results.jsonl'),('old_inputs_sha256',O/'all_inputs.jsonl'),('old_manifest_sha256',O/'prospective_manifest.json'),('codebook_sha256',ROOT/'protocols/atracc_locked_codebook_v3.md'),('runner_sha256',ROOT/'experiments/run_atracc_exact_repeat_v6.py'),('shared_runner_sha256',ROOT/'experiments/run_atracc_replication_v5.py')]:
        check(digest(path)==spec[key],key)
    requests={(r['model'],r['id']):r for r in spec['requests']}
    inputs={r['id']:r for r in jsonl(B/'exact_repeat/all_inputs.jsonl')}
    original_inputs={r['id']:r for r in jsonl(O/'all_inputs.jsonl') if r['dataset']=='inventory'}
    check(inputs==original_inputs,'All 70 original input objects preserved including identifiers')
    first={(r['requested_model'],r['id']):r for r in jsonl(O/'results.jsonl') if r['dataset']=='inventory'}
    rows=jsonl(B/'exact_repeat/results.jsonl')
    second={(r['requested_model'],r['id']):r for r in rows}
    check(len(rows)==len(second)==len(requests)==140,'Exactly 140 unique additional requests')
    check(set(first)==set(second)==set(requests),'Same 70 templates and two model snapshots')
    check(not ({r['response_id'] for r in first.values()} & {r.get('response_id') for r in rows}),'No response reused from initial run')
    check(len({r.get('response_id') for r in rows})==140,'All 140 response identifiers unique')
    for key,r in sorted(second.items()):
        model,ident=key;p=prompt(inputs[ident]);q=requests[key]
        check((B/'exact_repeat/prompts'/f'{ident}.txt').read_bytes()==p.encode()==(O/'prompts'/f'{ident}.txt').read_bytes(),f'{key} byte-identical prompts')
        payload=dict(model=model,input=p,reasoning={'effort':'medium'},max_output_tokens=12288,tools=[],store=False,text={'verbosity':'low'})
        check(sha(json.dumps(payload,sort_keys=True))==q['payload_sha256'],f'{key} fixed payload hash')
        check(q['prompt_sha256']==r['prompt_sha256']==first[key]['prompt_sha256']==sha(p),f'{key} logged prompt hashes')
        check(q['original_response_id']==first[key]['response_id'],f'{key} original response link')
        check(datetime.fromisoformat(r['started_utc'])>=datetime.fromisoformat(manifest['created_utc']),f'{key} manifest precedes request')
        check(r.get('parse_ok') and r.get('response_status')=='completed',f'{key} valid completed response')
        check(r['requested_model']==r['resolved_model']==model and r['reasoning_effort']=='medium' and r['max_output_tokens']==12288,f'{key} pinned model and settings')
        rawpath=B/'exact_repeat/raw'/f'{model}_{ident}_{r["response_id"]}.json'
        raw=json.loads(rawpath.read_text())
        check(raw['id']==r['response_id'] and raw['model']==model and openai_text(raw)==r['raw_text'],f'{key} full raw response correspondence')
        check(r['derived_status']==derive(r['parsed']),f'{key} status follows circuit')
        check(r['reported_status']==r['parsed']['status'] and r['reported_status'] in ['S','U','D'],f'{key} reported status preserved')
        for field,excerpt in r['parsed'].get('excerpts',{}).items():
            check(r['excerpt_substring_check'][field]==(not str(excerpt) or str(excerpt) in inputs[ident]['rationale']),f'{key} excerpt {field}')
    summary=json.loads((B/'repeat_summary.json').read_text())
    templates={r['template_id']:r for r in csvrows(ROOT/'output/experiments/atracc_v5/templates.csv')}
    for model in MODELS:
        m=summary['models'][model];keys=[(model,i) for i in inputs]
        check(m['status_agreement']==sum(derive(first[k]['parsed'])==derive(second[k]['parsed']) for k in keys),f'{model} independent status tally')
        check(m['vector_agreement']==sum(all(first[k]['parsed'][f]==second[k]['parsed'][f] for f in FIELDS) for k in keys),f'{model} independent vector tally')
        check(sum(m['repeat_template_counts'].values())==70 and sum(m['repeat_mapped_record_counts'].values())==110,f'{model} denominators')
        for status in ['S','U','D']:
            check(m['repeat_mapped_record_counts'][status]==sum(int(templates[i]['occurrences']) for i in inputs if derive(second[(model,i)]['parsed'])==status),f'{model} mapped {status}')
    for row in csvrows(B/'pair_diagnostics.csv'):
        ident=row['template_id'];kind=row['comparison']
        if kind.startswith('between models '):
            lookup=first if kind.endswith('initial') else second
            a,b=(lookup[(m,ident)]['parsed'] for m in MODELS)
        else:
            model=kind.removesuffix(' exact repeat');a,b=first[(model,ident)]['parsed'],second[(model,ident)]['parsed']
        for key,x,y in [('forward_minimal_sets',a,b),('reverse_minimal_sets',b,a)]:
            found=json.loads(row[key])
            if derive(x)==derive(y):
                check(found==[],f'{kind} {ident} no substitution needed')
                continue
            check(bool(found),f'{kind} {ident} nonempty diagnostic')
            for subset in found:
                hybrid=dict(x);hybrid.update({f:y[f] for f in subset})
                check(derive(hybrid)==derive(y),f'{kind} {ident} sufficient {subset}')
                for size in range(len(subset)):
                    for sub in itertools.combinations(subset,size):
                        test=dict(x);test.update({f:y[f] for f in sub})
                        check(derive(test)!=derive(y),f'{kind} {ident} minimal {subset} versus {sub}')
    flags=csvrows(B/'template_stability.csv')
    check(len(flags)==70 and sum(int(r['four_output_status_unanimity']) for r in flags)==summary['four_outputs']['status_unanimity'],'Four-output unanimity tally')
    for row in flags:
        ident=row['template_id'];states=[derive(lookup[(m,ident)]['parsed']) for lookup in [first,second] for m in MODELS]
        check('|'.join(states)==row['four_statuses'] and int(row['four_output_status_unanimity'])==int(len(set(states))==1),f'{ident} all four statuses')
    queue=csvrows(B/'record_review_queue.csv')
    check(len(queue)==110 and len({r['id'] for r in queue})==110,'Review queue covers all records without adding labels')
    ambiguity=json.loads((B/'ambiguity_sensitivity.json').read_text())
    differences=csvrows(B/'reported_circuit_disagreements.csv')
    check(len(differences)==12 and all(r['circuit_status']=='D' and r['reported_status']=='U' and r['ambiguity_note'] for r in differences),'All twelve circuit/reported differences retain ambiguity notes')
    for model in MODELS:
        metrics=ambiguity['models'][model]
        check(metrics['reported_status_repeat_agreement']==sum(first[(model,i)]['parsed']['status']==second[(model,i)]['parsed']['status'] for i in inputs),f'{model} reported-status repeat agreement')
        for name,lookup in [('first',first),('repeat',second)]:
            for status in ['S','U','D']:
                check(metrics[name]['reported_template_counts'][status]==sum(lookup[(model,i)]['parsed']['status']==status for i in inputs),f'{model} {name} reported template count {status}')
                check(metrics[name]['reported_mapped_record_counts'][status]==sum(int(templates[i]['occurrences']) for i in inputs if lookup[(model,i)]['parsed']['status']==status),f'{model} {name} reported record count {status}')
    check(ambiguity['reported_four_output_unanimity']==sum(len({lookup[(m,i)]['parsed']['status'] for lookup in [first,second] for m in MODELS})==1 for i in inputs),'Reported-status four-output unanimity')
    report=dict(result='PASS',checks=len(checks),additional_requests=140,exact_prompt_pairs=140,human_annotations=0,
        boundaries='Verifies preserved requests, outputs, diagnostics and arithmetic; not semantic validity.')
    (B/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
