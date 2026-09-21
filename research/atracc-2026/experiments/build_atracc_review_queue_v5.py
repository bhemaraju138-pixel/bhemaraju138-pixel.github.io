#!/usr/bin/env python3
"""Build review flags from observed disagreement, without adding semantic labels."""
import json
from pathlib import Path
from atracc_revision_v5 import read_csv,write_csv
ROOT=Path(__file__).resolve().parents[1];B=ROOT/'output/experiments/atracc_v5'
def main():
    scores=read_csv(B/'replication_v2/case_scores.csv')
    models=sorted({r['model'] for r in scores})
    labels={(r['model'],r['id']):r['status'] for r in scores}
    inputs=[json.loads(x) for x in (B/'replication_v2/all_inputs.jsonl').read_text().splitlines()]
    unstable={r['repeat_of'] for r in inputs if r['dataset']=='repeat' and any(labels[m,r['id']]!=labels[m,r['repeat_of']] for m in models)}
    conflicts={r['template_id']:r for r in read_csv(B/'duplicate_conflicts.csv')}
    repairs={r['id']:r for r in read_csv(B/'repair_routes.csv')}
    linked={json.loads(x)['case_id'] for x in (ROOT/'output/experiments/atracc_v3/artifacts/artifact_records.jsonl').read_text().splitlines() if json.loads(x)['inventory_status']=='U'}
    rows=[]
    for r in read_csv(B/'reconciled_records.csv'):
        t=r['template_id'];statuses=[r['status']]+[labels[m,t] for m in models]
        flags=[]
        if t in conflicts:flags.append('archived duplicate-text conflict')
        if len(set(statuses))>1:flags.append('panel/model status disagreement')
        if t in unstable:flags.append('unchanged-text status reversal')
        if r['id'] in linked:flags.append('linked-document provenance review')
        if repairs[r['id']]['route']=='interpretation review':flags.append('zero-deficit unresolved composition')
        rows.append({'id':r['id'],'agency':r['agency'],'template_id':t,'review_flags':'|'.join(flags),
          'reconciled_status':r['status'],'gpt_5_4_status':labels[models[0],t],'gpt_5_4_mini_status':labels[models[1],t],
          'missing_roles':repairs[r['id']]['missing_roles'],'rationale':r['rationale'],
          'boundary':'Review triage only; no expert labels or legal determinations'})
    write_csv(B/'review_queue.csv',rows)
    print('Wrote',len(rows),'records; no new semantic labels')
if __name__=='__main__':main()
