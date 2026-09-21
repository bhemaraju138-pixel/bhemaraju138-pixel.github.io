#!/usr/bin/env python3
"""Reproduce the post-review ATRACC robustness revision without modifying v3/v4.

No semantic labels are invented. Repeated-text conflicts are made explicit;
the conservative reconciliation is a sensitivity policy, not expert adjudication.
"""
import csv
import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/experiments/atracc_v5'
FIELDS = ['P', 'O', 'W_ind', 'W_opt', 'W_nar', 'H']


def read_csv(path):
    with Path(path).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def write_csv(path, rows):
    with Path(path).open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)


def norm(text):
    return ' '.join(text.split())


def counts(rows, key='status'):
    c = Counter(r[key] for r in rows)
    return {k: c[k] for k in ['S', 'U', 'D']}


def derive(row):
    w = any(row[k] == 'YES' for k in ['W_ind', 'W_opt', 'W_nar'])
    return 'S' if row['P'] == row['O'] == 'YES' and w else ('D' if row['H'] == 'YES' and not w else 'U')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    original = read_csv(ROOT / 'output/experiments/atracc_v3/atracc_consensus_codings.csv')
    panel = read_csv(ROOT / 'output/experiments/atracc_v3/atracc_panel_codings.csv')
    groups = defaultdict(list)
    for r in original:
        groups[norm(r['rationale'])].append(r)
    revised, templates, differences = [], [], []
    for text, members in sorted(groups.items()):
        tid = 'T-' + hashlib.sha256(text.encode()).hexdigest()[:12]
        statuses = {r['consensus_status'] for r in members}
        # Require identical status across occurrences; otherwise retain uncertainty.
        status = next(iter(statuses)) if len(statuses) == 1 else 'U'
        components = {}
        disagree_fields = []
        for field in FIELDS:
            values = {r['consensus_' + field] for r in members}
            components[field] = next(iter(values)) if len(values) == 1 else 'UNCLEAR'
            if len(values) != 1:
                disagree_fields.append(field)
        base = dict(template_id=tid, rationale=text, status=status, **components)
        template = dict(base, occurrences=len(members), ids='|'.join(r['id'] for r in members))
        templates.append(template)
        for r in members:
            revised.append(dict(id=r['id'], agency=r['agency'], use_case_name=r['use_case_name'],
                                development_stage=r['development_stage'], **base,
                                archived_status=r['consensus_status'],
                                status_reconciled=int(r['consensus_status'] != status),
                                component_conflict_fields='|'.join(disagree_fields)))
        if len(statuses) > 1 or disagree_fields:
            differences.append(dict(template_id=tid, ids=template['ids'], occurrences=len(members),
                                    archived_statuses='|'.join(sorted(statuses)), revised_status=status,
                                    component_conflicts='|'.join(disagree_fields), rationale=text))
    revised.sort(key=lambda r: r['id'])
    write_csv(OUT / 'reconciled_records.csv', revised)
    write_csv(OUT / 'templates.csv', templates)
    write_csv(OUT / 'duplicate_conflicts.csv', differences)
    agencies = sorted({r['agency'] for r in revised})
    ag = []
    for a in agencies:
        own = [r for r in revised if r['agency'] == a]
        rem = [r for r in revised if r['agency'] != a]
        ag.append(dict(agency=a, n=len(own), **counts(own), remaining_n=len(rem),
                       remaining_U=counts(rem)['U'], remaining_U_fraction=counts(rem)['U']/len(rem)))
    write_csv(OUT / 'agency_sensitivity.csv', ag)
    stages = []
    for stage in sorted({r['development_stage'] for r in revised}):
        rr = [r for r in revised if r['development_stage'] == stage]
        stages.append(dict(stage=stage, n=len(rr), **counts(rr)))
    write_csv(OUT / 'stage_sensitivity.csv', stages)
    repair = []
    for r in revised:
        deficits = []
        if r['P'] != 'YES': deficits.append('P')
        if r['O'] != 'YES': deficits.append('O')
        if not any(r[k] == 'YES' for k in ['W_ind', 'W_opt', 'W_nar']): deficits.append('W')
        repair.append(dict(id=r['id'], status=r['status'], template_id=r['template_id'],
                           missing_roles='|'.join(deficits), missing_role_count=len(deficits),
                           route='interpretation review' if r['status']=='U' and not deficits else
                                 ('supply and verify missing premises' if r['status']=='U' else
                                  ('answer objection with evidence' if r['status']=='D' else 'verify mechanism'))))
    write_csv(OUT / 'repair_routes.csv', repair)
    votes = defaultdict(Counter)
    for r in panel:
        assert derive(r) == r['status']
        votes[r['id']][r['status']] += 1
    threshold_rows=[]
    for k in (3,4,5):
        assigned={i:next((s for s,n in v.items() if n>=k),'U') for i,v in votes.items()}
        reconciled=[]
        for members in groups.values():
            ss={assigned[r['id']] for r in members}
            s=next(iter(ss)) if len(ss)==1 else 'U'
            reconciled.extend({'status':s} for _ in members)
        threshold_rows.append(dict(votes_required=k,**counts(reconciled)))
    write_csv(OUT/'threshold_sensitivity.csv',threshold_rows)
    rr=[r for r in repair if r['status']=='U']
    summary=dict(records=len(revised),templates_including_blank=len(templates),
                 nonempty_templates=sum(bool(r['rationale']) for r in templates),
                 archived_counts=counts(original,'consensus_status'),reconciled_counts=counts(revised),
                 template_counts=counts(templates),changed_record_ids=[r['id'] for r in revised if r['status_reconciled']],
                 duplicate_conflict_groups=len(differences),
                 unresolved_repair_depth=dict(Counter(r['missing_role_count'] for r in rr)),
                 unresolved_missing_roles=dict(Counter(k for r in rr for k in r['missing_roles'].split('|') if k)),
                 equal_agency_mean_U_fraction=sum(x['U']/x['n'] for x in ag)/len(ag),
                 leave_agency_out_U_range=[min(x['remaining_U_fraction'] for x in ag),max(x['remaining_U_fraction'] for x in ag)],
                 thresholds=threshold_rows,
                 primary_interpretation='Reconciled disclosed-text classification, not latent legal correctness or expert ground truth.',
                 uncertainty='The archived labels and post-review rules are retained separately; no unidentifiable support interval is reported.')
    (OUT/'robustness_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    # Prospective models receive rationale and opaque ID only, never existing labels or metadata.
    inputs=[dict(id=t['template_id'],rationale=t['rationale'],dataset='inventory') for t in templates]
    synthetics=read_csv(ROOT/'output/experiments/atracc_v4/conformance/atracc_50_synthetic_conformance_cases.csv')
    inputs.extend(dict(id='SYN-'+r['id'],rationale=r['rationale'],dataset='synthetic') for r in synthetics)
    (OUT/'replication_inputs.jsonl').write_text(''.join(json.dumps(r)+'\n' for r in inputs))
    print(json.dumps(summary,indent=2))


if __name__=='__main__': main()
