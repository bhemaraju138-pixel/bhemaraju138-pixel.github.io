#!/usr/bin/env python3
"""One additional request per inventory template/model, with identical prompt bytes.

The protocol is fixed after seeing v5, before this run. It is a post-review
repeatability diagnostic, not independent validation or preregistration.
"""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
from run_atracc_replication_v5 import MODELS, ROOT, call_one, load_env, now, prompt, sha

OUT = ROOT/'output/experiments/atracc_v6/exact_repeat'
OLD = ROOT/'output/experiments/atracc_v5/replication_v2'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workers', type=int, default=10)
    args = parser.parse_args()
    rows = [json.loads(s) for s in (OLD/'all_inputs.jsonl').read_text().splitlines()]
    rows = sorted((r for r in rows if r['dataset']=='inventory'), key=lambda r:r['id'])
    assert len(rows)==70 and len({r['id'] for r in rows})==70
    previous = {(r['requested_model'],r['id']):r for r in
                map(json.loads,(OLD/'results.jsonl').read_text().splitlines())}
    requests = []
    for row in rows:
        p = prompt(row)
        assert p.encode()==(OLD/'prompts'/f'{row["id"]}.txt').read_bytes()
        for model in MODELS:
            old = previous[(model,row['id'])]
            assert old['parse_ok'] and old['resolved_model']==model
            assert old['prompt_sha256']==sha(p)
            assert old['reasoning_effort']=='medium' and old['max_output_tokens']==12288
            payload = dict(model=model,input=p,reasoning={'effort':'medium'},
                           max_output_tokens=12288,tools=[],store=False,text={'verbosity':'low'})
            requests.append(dict(id=row['id'], model=model, prompt_sha256=sha(p),
                                 payload_sha256=sha(json.dumps(payload,sort_keys=True)),
                                 original_response_id=old['response_id']))
    specification = dict(
        design='Post-review census repeatability diagnostic; fixed before this repeat run, after v5 results. Not preregistered or independent criterion validation.',
        population='All 70 whitespace-normalized inventory rationale groups, including the blank group; unchanged opaque identifiers.',
        rounds='One additional exact-prompt request per template and model; compare with the first v5 inventory reading. No selective semantic reruns.',
        models=MODELS, endpoint='https://api.openai.com/v1/responses',
        settings=dict(reasoning_effort='medium',max_output_tokens=12288,tools=[],store=False,verbosity='low',temperature='not supplied',seed='not supplied'),
        identity_boundary='Prompt bytes and client request settings match v5. Provider execution, elapsed time and backend state are not controlled.',
        primary_metrics=['valid paired outputs / planned pairs','status agreement / valid pairs','six-component vector agreement / valid pairs','component transition counts','repeat status partitions, template and mapped-record weighting'],
        secondary_metrics=['four-output status unanimity and vector unanimity across two models by two rounds','loss of initial two-model agreement on repetition','minimal component-substitution sets accounting for status disagreements'],
        interpretation='Component substitutions inspect the deterministic scoring circuit, not the causal effect of changing prose. Stability is not semantic correctness. Two observations per template cannot estimate its long-run reliability.',
        failure_rule='Preserve every first substantive response; retry transport failures only. Missing/malformed outputs are failures, never U; report planned and valid denominators.',
        old_results_sha256=digest(OLD/'results.jsonl'), old_inputs_sha256=digest(OLD/'all_inputs.jsonl'),
        old_manifest_sha256=digest(OLD/'prospective_manifest.json'),
        codebook_sha256=digest(ROOT/'protocols/atracc_locked_codebook_v3.md'),
        runner_sha256=digest(Path(__file__)), shared_runner_sha256=digest(ROOT/'experiments/run_atracc_replication_v5.py'),
        requests=requests)
    (OUT/'raw').mkdir(parents=True,exist_ok=True)
    (OUT/'prompts').mkdir(exist_ok=True)
    manifest = OUT/'prospective_manifest.json'
    if manifest.exists():
        saved=json.loads(manifest.read_text())
        assert saved['specification']==specification,'Protocol changed; preserve this run and use a new directory.'
    else:
        manifest.write_text(json.dumps(dict(created_utc=now(),specification=specification),indent=2)+'\n')
    (OUT/'all_inputs.jsonl').write_text(''.join(json.dumps(r)+'\n' for r in rows))
    for row in rows:
        (OUT/'prompts'/f'{row["id"]}.txt').write_text(prompt(row))
    result=OUT/'results.jsonl'
    prior=[json.loads(s) for s in result.read_text().splitlines()] if result.exists() else []
    completed={(r['id'],r['requested_model']) for r in prior}
    assert len(completed)==len(prior)
    tasks=[(r,m) for r in rows for m in MODELS if (r['id'],m) not in completed]
    key=load_env(ROOT/'.env')['OPEN_AI_API_KEY']
    with concurrent.futures.ThreadPoolExecutor(args.workers) as pool,result.open('a') as f:
        futures=[pool.submit(call_one,r,m,key,OUT) for r,m in tasks]
        for i,future in enumerate(concurrent.futures.as_completed(futures),1):
            row=future.result();f.write(json.dumps(row)+'\n');f.flush()
            if i%10==0 or not row.get('parse_ok'):
                print(json.dumps(dict(completed=i,total=len(tasks),id=row['id'],model=row['requested_model'],valid=row['parse_ok'],error=row.get('error',row.get('parse_error','')))),flush=True)
    print('Finished',len(tasks),'requests',flush=True)

if __name__=='__main__':
    main()
