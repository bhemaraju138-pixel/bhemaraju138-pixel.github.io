#!/usr/bin/env python3
"""Offline census repeatability and deterministic component-substitution diagnostics."""
import csv
import itertools
import json
from collections import Counter
from pathlib import Path
from run_atracc_replication_v5 import MODELS, FIELDS, derive

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'output/experiments/atracc_v6'
OLD=ROOT/'output/experiments/atracc_v5'

def jsonl(p):return [json.loads(s) for s in p.read_text().splitlines()]
def csvrows(p):
    with p.open(newline='') as f:return list(csv.DictReader(f))
def writecsv(p,rows):
    if not rows:return
    with p.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
def statuses(rows):return {s:sum(r['derived_status']==s for r in rows) for s in ['S','U','D']}
def vector(r):return tuple(r['parsed'][k] for k in FIELDS)

def minimal_substitutions(a,b):
    """All inclusion-minimal component sets that turn a's status into b's.

    This replaces coded fields, never text. Distinct sufficient sets can overlap.
    """
    if derive(a)==derive(b):return []
    changed=[k for k in FIELDS if a[k]!=b[k]]
    minimal=[]
    for size in range(1,len(changed)+1):
        for subset in itertools.combinations(changed,size):
            if any(set(found)<=set(subset) for found in minimal):continue
            hybrid=dict(a);hybrid.update({k:b[k] for k in subset})
            if derive(hybrid)==derive(b):minimal.append(subset)
    assert minimal
    return minimal

def pair_diagnostic(a,b,kind,ident,occurrences):
    fields=[k for k in FIELDS if a['parsed'][k]!=b['parsed'][k]]
    forward=minimal_substitutions(a['parsed'],b['parsed'])
    reverse=minimal_substitutions(b['parsed'],a['parsed'])
    return dict(comparison=kind,template_id=ident,occurrences=occurrences,
        first_status=a['derived_status'],second_status=b['derived_status'],
        status_agreement=int(a['derived_status']==b['derived_status']),
        vector_agreement=int(not fields),changed_fields='|'.join(fields),
        forward_minimal_sets=json.dumps(forward),reverse_minimal_sets=json.dumps(reverse),
        narrow_role_alone_sufficient_either_direction=int(('W_nar',) in forward or ('W_nar',) in reverse))

def summarize_pairs(pairs):
    return dict(valid_pairs=len(pairs),status_agreement=sum(r['status_agreement'] for r in pairs),
        vector_agreement=sum(r['vector_agreement'] for r in pairs),
        mapped_records=sum(r['occurrences'] for r in pairs),
        mapped_status_agreement=sum(r['occurrences']*r['status_agreement'] for r in pairs),
        mapped_vector_agreement=sum(r['occurrences']*r['vector_agreement'] for r in pairs),
        same_status_different_vector=sum(r['status_agreement'] and not r['vector_agreement'] for r in pairs),
        component_disagreements={k:sum(k in r['changed_fields'].split('|') for r in pairs) for k in FIELDS},
        status_transitions=dict(sorted(Counter(r['first_status']+'->'+r['second_status'] for r in pairs).items())),
        narrow_role_alone_sufficient_either_direction=sum(r['narrow_role_alone_sufficient_either_direction'] for r in pairs))

def main():
    templates={r['template_id']:r for r in csvrows(OLD/'templates.csv')}
    initial=[r for r in jsonl(OLD/'replication_v2/results.jsonl') if r['dataset']=='inventory']
    repeated=jsonl(BASE/'exact_repeat/results.jsonl')
    assert len(initial)==len(repeated)==140,'Wait for the complete planned run.'
    a={(r['requested_model'],r['id']):r for r in initial}
    b={(r['requested_model'],r['id']):r for r in repeated}
    assert len(a)==len(b)==140 and set(a)==set(b)
    summary=dict(planned_additional_requests=140,observed_requests=len(repeated),templates=70,records=110,
        human_annotations=0,models={},between_models={},four_outputs={},
        interpretation='Two observations per template/model. Repeatability is not validity; all results are finite-corpus descriptions. Component substitutions concern the scoring circuit, not causal textual interventions.')
    diagnostics=[]
    for model in MODELS:
        valid=[i for i in sorted(templates) if a[(model,i)].get('parse_ok') and b[(model,i)].get('parse_ok')]
        pairs=[pair_diagnostic(a[(model,i)],b[(model,i)],model+' exact repeat',i,int(templates[i]['occurrences'])) for i in valid]
        diagnostics.extend(pairs)
        fresh=[b[(model,i)] for i in valid]
        metrics=summarize_pairs(pairs)
        metrics.update(planned_pairs=70,invalid_pairs=70-len(valid),
            first_template_counts=statuses([a[(model,i)] for i in valid]),repeat_template_counts=statuses(fresh),
            repeat_mapped_record_counts={s:sum(int(templates[r['id']]['occurrences']) for r in fresh if r['derived_status']==s) for s in ['S','U','D']},
            reported_circuit_disagreements=sum(r['derived_status']!=r.get('reported_status') for r in fresh),
            nonempty_excerpts=sum(bool(v) for r in fresh for v in r['parsed'].get('excerpts',{}).values()),
            nonliteral_excerpts=sum(not ok for r in fresh for ok in r.get('excerpt_substring_check',{}).values()))
        summary['models'][model]=metrics
    for name,lookup in [('initial',a),('repeat',b)]:
        valid=[i for i in sorted(templates) if all(lookup[(m,i)].get('parse_ok') for m in MODELS)]
        pairs=[pair_diagnostic(lookup[(MODELS[0],i)],lookup[(MODELS[1],i)],'between models '+name,i,int(templates[i]['occurrences'])) for i in valid]
        diagnostics.extend(pairs)
        summary['between_models'][name]=summarize_pairs(pairs)
    complete=[i for i in sorted(templates) if all(lookup[(m,i)].get('parse_ok') for lookup in [a,b] for m in MODELS)]
    stable=[];flags=[]
    for i in complete:
        rr=[lookup[(m,i)] for lookup in [a,b] for m in MODELS]
        unanimous=len({r['derived_status'] for r in rr})==1
        initial_agree=a[(MODELS[0],i)]['derived_status']==a[(MODELS[1],i)]['derived_status']
        flag=dict(template_id=i,occurrences=int(templates[i]['occurrences']),
            four_statuses='|'.join(r['derived_status'] for r in rr),
            initial_two_model_agreement=int(initial_agree),four_output_status_unanimity=int(unanimous),
            four_output_vector_unanimity=int(len({vector(r) for r in rr})==1),
            initial_agreement_not_preserved=int(initial_agree and not unanimous),
            gpt54_repeat_disagreement=int(a[(MODELS[0],i)]['derived_status']!=b[(MODELS[0],i)]['derived_status']),
            mini_repeat_disagreement=int(a[(MODELS[1],i)]['derived_status']!=b[(MODELS[1],i)]['derived_status']))
        flags.append(flag)
        if unanimous:stable.append(rr[0])
    summary['four_outputs']=dict(complete_templates=len(complete),status_unanimity=len(stable),
        mapped_record_status_unanimity=sum(int(templates[r['id']]['occurrences']) for r in stable),
        vector_unanimity=sum(r['four_output_vector_unanimity'] for r in flags),
        unanimous_status_counts=statuses(stable),
        initial_two_model_agreement=sum(r['initial_two_model_agreement'] for r in flags),
        initial_agreement_not_preserved=sum(r['initial_agreement_not_preserved'] for r in flags))
    summary['additional_usage']={k:sum(r.get('usage',{}).get(k,0) for r in repeated) for k in ['input_tokens','output_tokens','total_tokens']}
    writecsv(BASE/'pair_diagnostics.csv',diagnostics)
    writecsv(BASE/'template_stability.csv',flags)
    lookup={r['template_id']:r for r in flags}
    queue=[]
    for row in csvrows(OLD/'reconciled_records.csv'):
        f=lookup.get(row['template_id'],{})
        queue.append(dict(id=row['id'],agency=row['agency'],template_id=row['template_id'],
            reconciled_status=row['status'],
            **{k:f.get(k,'MISSING') for k in ['four_statuses','four_output_status_unanimity','four_output_vector_unanimity','initial_agreement_not_preserved','gpt54_repeat_disagreement','mini_repeat_disagreement']},
            review_reason='Missing valid output' if not f else ('Computational disagreement; interpretation review' if not f['four_output_status_unanimity'] else 'Repeated status agreement; still requires semantic validation')))
    writecsv(BASE/'record_review_queue.csv',queue)
    (BASE/'repeat_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))

if __name__=='__main__':main()
