#!/usr/bin/env python3
"""Score conformance and agreement separately; neither is expert accuracy."""
import csv
import json
from collections import Counter
from pathlib import Path
from atracc_revision_v5 import read_csv,write_csv,counts

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'output/experiments/atracc_v5'
FIELDS=['P','O','W_ind','W_opt','W_nar','H']

def main():
    p=BASE/'replication_v2'
    inputs=[json.loads(x) for x in (p/'all_inputs.jsonl').read_text().splitlines()]
    records=[json.loads(x) for x in (p/'results.jsonl').read_text().splitlines()]
    models=sorted({r['requested_model'] for r in records})
    assert len(records)==len(inputs)*len(models),'Replication still incomplete'
    assert len({(r['id'],r['requested_model']) for r in records})==len(records)
    ts={r['template_id']:r for r in read_csv(BASE/'templates.csv')}
    syn={r['id']:r for r in read_csv(ROOT/'output/experiments/atracc_v4/conformance/atracc_50_synthetic_conformance_cases.csv')}
    ext={r['id']:r for r in json.loads((BASE/'external_expectations.json').read_text())}
    repeat={r['id']:r['repeat_of'] for r in inputs if r['dataset']=='repeat'}
    summary={'total_requests':len(records),'human_labels':0,'models':{},'interpretation':'Agreement with archived/reconciled codings and conformance with construction-time expectations are not independent criterion accuracy.'}
    case_rows=[]
    lookup={(r['requested_model'],r['id']):r for r in records}
    for model in models:
        rr=[r for r in records if r['requested_model']==model]
        inv=[r for r in rr if r['dataset']=='inventory' and r['parse_ok']]
        synthetic=[r for r in rr if r['dataset']=='synthetic' and syn[r['id'][4:]]['expected_status']!='contested']
        external=[r for r in rr if r['dataset']=='external']
        repeat_rows=[r for r in rr if r['dataset']=='repeat']
        cc=Counter(r['derived_status'] for r in inv)
        weighted=Counter()
        for r in inv:weighted[r['derived_status']]+=int(ts[r['id']]['occurrences'])
        metrics=dict(valid=sum(r['parse_ok'] for r in rr),requests=len(rr),inventory_n=len(inv),template_counts=dict(cc),mapped_record_counts=dict(weighted),
                     agreement_with_reconciled_templates=sum(r['derived_status']==ts[r['id']]['status'] for r in inv),
                     mapped_record_agreement=sum(int(ts[r['id']]['occurrences']) for r in inv if r['derived_status']==ts[r['id']]['status']),
                     conformance_scoreable=len(synthetic),
                     conformance_correct=sum(r.get('derived_status')==syn[r['id'][4:]]['expected_status'] for r in synthetic),
                     external_n=len(external),external_correct=sum(r.get('derived_status')==ext[r['id']]['expected_status'] for r in external),
                     repeat_n=len(repeat_rows),repeat_status_agreement=sum(r.get('derived_status')==lookup[(model,repeat[r['id']])].get('derived_status') for r in repeat_rows),
                     repeat_component_vector_agreement=sum(all(r.get('parsed',{}).get(k)==lookup[(model,repeat[r['id']])].get('parsed',{}).get(k) for k in FIELDS) for r in repeat_rows),
                     formula_status_mismatches=sum(r.get('derived_status')!=r.get('reported_status') for r in rr if r['parse_ok']))
        metric_components={}
        mapping={'W_ind':'Wind','W_opt':'Wopt','W_nar':'Wnar'}
        for field in FIELDS:metric_components[field]=sum(r.get('parsed',{}).get(field)==syn[r['id'][4:]]['expected_'+mapping.get(field,field)] for r in synthetic)
        metrics['conformance_components_out_of_47']=metric_components
        record_map=read_csv(BASE/'reconciled_records.csv')
        by_template={r['id']:r['derived_status'] for r in inv}
        without_doj=[r for r in record_map if r['agency']!='DOJ']
        metrics['without_DOJ_counts']=dict(Counter(by_template[r['template_id']] for r in without_doj))
        metrics['nonempty_template_counts']=dict(Counter(r['derived_status'] for r in inv if ts[r['id']]['rationale']))
        metrics['nonempty_excerpt_checks']=sum(bool(v) for r in rr for v in r.get('parsed',{}).get('excerpts',{}).values())
        metrics['nonliteral_excerpt_checks']=sum(not ok for r in rr for ok in r.get('excerpt_substring_check',{}).values())
        summary['models'][model]=metrics
        for r in rr:
            ds=r['dataset'];expected=ts[r['id']]['status'] if ds=='inventory' else (syn[r['id'][4:]]['expected_status'] if ds=='synthetic' else (ext[r['id']]['expected_status'] if ds=='external' else lookup[(model,repeat[r['id']])].get('derived_status')))
            case_rows.append(dict(model=model,id=r['id'],dataset=ds,valid=r['parse_ok'],status=r.get('derived_status','MISSING'),
                                  comparator_status=expected,agreement=int(r.get('derived_status')==expected),
                                  ambiguity=r.get('parsed',{}).get('ambiguity',''),
                                  **{k:r.get('parsed',{}).get(k,'MISSING') for k in FIELDS}))
    shared=[i for i in ts if all(lookup[(m,i)]['parse_ok'] for m in models)]
    summary['between_models']={'inventory_templates':len(shared),
        'status_agreement':sum(len({lookup[(m,i)]['derived_status'] for m in models})==1 for i in shared),
        'component_vector_agreement':sum(all(len({lookup[(m,i)]['parsed'][k] for m in models})==1 for k in FIELDS) for i in shared),
        'both_agree_with_reconciled':sum(all(lookup[(m,i)]['derived_status']==ts[i]['status'] for m in models) for i in shared)}
    summary['usage']={k:sum(r.get('usage',{}).get(k,0) for r in records) for k in ['input_tokens','output_tokens','total_tokens']}
    write_csv(p/'case_scores.csv',case_rows)
    (p/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    # Retrieval is an observed property of the loaded PDF, not an LLM label.
    fp=BASE/'full_document_audit'
    fs=[json.loads(x) for x in (fp/'results.jsonl').read_text().splitlines()]
    assert len(fs)==14,'Full-document audit still incomplete'
    rows=[];fields=['same_system','temporally_applicable','same_predicate','qualifying_mechanism','passage_anchor']
    for ident in sorted({r['case_id'] for r in fs}):
        rr=[r for r in fs if r['case_id']==ident]
        valid=all(r.get('parsed',{}).get('case_id')==ident and all(r['parsed'].get(k) in ['YES','NO','UNCLEAR'] for k in fields) for r in rr)
        # A missing retrieval echo is normalized from the independently observed input.
        echo_missing=sum('retrievable' not in r.get('parsed',{}) for r in rr)
        result={'case_id':ident,'models':len(rr),'semantic_schema_valid':int(valid),'retrievable':'YES','missing_retrieval_echoes':echo_missing}
        for k in fields:
            values={r.get('parsed',{}).get(k,'UNCLEAR') for r in rr}
            result[k]=next(iter(values)) if len(values)==1 else 'UNCLEAR'
        result['strict_recovery']=int(valid and all(result[k]=='YES' for k in fields) and all(all(r.get('source_quote_checks',{}).get(k,False) for k in fields) for r in rr))
        relaxed=[k for k in fields if k!='temporally_applicable']
        result['recovery_without_time_requirement']=int(valid and all(result[k]=='YES' for k in relaxed) and all(all(r.get('source_quote_checks',{}).get(k,False) for k in relaxed) for r in rr))
        result['verified_mechanism_and_anchor']=int(valid and all(result[k]=='YES' for k in ['qualifying_mechanism','passage_anchor']) and all(all(r.get('source_quote_checks',{}).get(k,False) for k in ['qualifying_mechanism','passage_anchor']) for r in rr))
        result['reasons']=' || '.join(str(r.get('parsed',{}).get('overall_reason','')) for r in rr)
        rows.append(result)
    write_csv(fp/'reconciled_full_document_findings.csv',rows)
    docsum={'target_records':9,'pdf_record_pairs':7,'distinct_pdfs':6,'unresolved_document_identity':2,
            'complete_semantic_outputs':sum(all(r.get('parsed',{}).get(k) in ['YES','NO','UNCLEAR'] for k in fields) for r in fs),
            'missing_retrieval_echoes':sum(r['missing_retrieval_echoes'] for r in rows),
            'strict_recoveries':sum(r['strict_recovery'] for r in rows),
            'recoveries_without_time_requirement':sum(r['recovery_without_time_requirement'] for r in rows),
            'verified_mechanism_and_anchor_pairs':sum(r['verified_mechanism_and_anchor'] for r in rows),
            'fieldwise_unanimous_yes':{k:sum(r[k]=='YES' for r in rows) for k in fields},
            'normalization':'Successful full PDF extraction establishes retrievability independently. Four model responses omitted that redundant key; all semantic labels and raw responses are retained.',
            'coverage':'Seven record-document pairs assessed with complete page-indexed PDF text; two collection URLs did not identify a matching document in a bounded follow-up search. No claim of exhaustive web discovery.'}
    (fp/'summary.json').write_text(json.dumps(docsum,indent=2)+'\n')
    print(json.dumps(summary,indent=2));print(json.dumps(docsum,indent=2))

if __name__=='__main__':main()
