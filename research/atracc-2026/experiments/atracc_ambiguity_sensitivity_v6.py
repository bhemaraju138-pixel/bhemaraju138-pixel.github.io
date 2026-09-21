#!/usr/bin/env python3
"""Post-run sensitivity to the codebook's ambiguity override, using saved statuses.

Model-reported statuses are retained verbatim, not adjudicated by this script.
Circuit/reported differences must not automatically be called model errors.
"""
import json
from collections import Counter
from pathlib import Path
from score_atracc_repeat_v6 import jsonl,csvrows,writecsv
from run_atracc_replication_v5 import MODELS

ROOT=Path(__file__).resolve().parents[1]
B=ROOT/'output/experiments/atracc_v6'
O=ROOT/'output/experiments/atracc_v5'

def main():
    initial=jsonl(O/'replication_v2/results.jsonl')
    repeat=jsonl(B/'exact_repeat/results.jsonl')
    templates={r['template_id']:r for r in csvrows(O/'templates.csv')}
    first={(r['requested_model'],r['id']):r for r in initial if r['dataset']=='inventory'}
    second={(r['requested_model'],r['id']):r for r in repeat}
    assert len(first)==len(second)==140
    assert all(r['reported_status'] in ['S','U','D'] for r in initial+repeat)
    differences=[]
    for name,rs in [('initial',initial),('exact_repeat',repeat)]:
        for r in rs:
            if r['reported_status']==r['derived_status']:continue
            differences.append(dict(round=name,model=r['requested_model'],id=r['id'],dataset=r['dataset'],
                circuit_status=r['derived_status'],reported_status=r['reported_status'],
                ambiguity_note=r['parsed'].get('ambiguity',''),
                interpretation='The codebook allows U when reasonable readings yield different statuses. This note and reported label are preserved; no expert adjudication is available.'))
    summary=dict(design='Additional post-run sensitivity prompted by reading codebook Discourse rule 5 and the saved ambiguity notes. Not prospectively specified in the exact-repeat manifest.',
        primary_boundary='Circuit-only results measure the declared component circuit. Model-reported results can incorporate the ambiguity override. Neither is criterion truth.',
        differing_outputs=len(differences),difference_directions=dict(Counter(r['circuit_status']+'->'+r['reported_status'] for r in differences)),
        all_differences_have_ambiguity_notes=all(bool(r['ambiguity_note']) for r in differences),models={})
    for model in MODELS:
        out={}
        for name,lookup in [('first',first),('repeat',second)]:
            rows=[lookup[(model,i)] for i in templates]
            out[name]=dict(reported_template_counts={s:sum(r['reported_status']==s for r in rows) for s in ['S','U','D']},
                reported_mapped_record_counts={s:sum(int(templates[r['id']]['occurrences']) for r in rows if r['reported_status']==s) for s in ['S','U','D']},
                circuit_reported_disagreements=sum(r['reported_status']!=r['derived_status'] for r in rows))
        out['reported_status_repeat_agreement']=sum(first[(model,i)]['reported_status']==second[(model,i)]['reported_status'] for i in templates)
        summary['models'][model]=out
    summary['reported_between_model_agreement']={name:sum(lookup[(MODELS[0],i)]['reported_status']==lookup[(MODELS[1],i)]['reported_status'] for i in templates) for name,lookup in [('first',first),('repeat',second)]}
    same=[i for i in templates if len({lookup[(m,i)]['reported_status'] for lookup in [first,second] for m in MODELS})==1]
    summary['reported_four_output_unanimity']=len(same)
    summary['reported_unanimous_template_counts']=dict(Counter(first[(MODELS[0],i)]['reported_status'] for i in same))
    summary['initial_reported_agreement_not_preserved']=sum(first[(MODELS[0],i)]['reported_status']==first[(MODELS[1],i)]['reported_status'] and i not in same for i in templates)
    (B/'ambiguity_sensitivity.json').write_text(json.dumps(summary,indent=2)+'\n')
    writecsv(B/'reported_circuit_disagreements.csv',differences)
    print(json.dumps(summary,indent=2))

if __name__=='__main__':main()
