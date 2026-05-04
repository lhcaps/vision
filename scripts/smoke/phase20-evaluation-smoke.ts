#!/usr/bin/env tsx
/**
 * Phase 20 runtime smoke test — runs evaluation endpoints against live API.
 */

import * as http from 'node:http';

const API = 'http://localhost:3000';
const PROJECT = 'proj_parking_lot';
const JOB_ID = 'job_2026_04_28_2036';

function request(method: string, path: string, body?: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API);
    const opts: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function smoke() {
  console.log('=== Phase 20 Runtime Smoke ===\n');

  // 1. Health
  const health = (await request('GET', '/api/health')) as { ok: boolean };
  console.log(`[${health.ok ? 'PASS' : 'FAIL'}] API health: ${JSON.stringify(health)}`);

  // 2. GET existing evaluation
  const evalGet = (await request(
    'GET',
    `/api/projects/${PROJECT}/inference-jobs/${JOB_ID}/evaluation`
  )) as { report: Record<string, unknown> | null };
  console.log(
    `[${evalGet.report ? 'PASS' : 'FAIL'}] GET evaluation: report exists=${Boolean(evalGet.report)}`
  );
  if (evalGet.report) {
    const r = evalGet.report;
    console.log(`  jobId: ${r.jobId}`);
    console.log(`  inputHash: ${r.inputHash}`);
    console.log(`  algorithmVersion: ${r.algorithmVersion}`);
    console.log(`  precision: ${r.precision}, recall: ${r.recall}, f1: ${r.f1}`);
    console.log(
      `  perClassMetrics: ${(r.perClassMetrics as unknown[]).map((m: any) => `${m.label}(P=${m.precision},R=${m.recall},F1=${m.f1})`).join(', ')}`
    );
  }

  // 3. POST run evaluation
  const evalPost = (await request('POST', `/api/projects/${PROJECT}/inference-jobs/evaluate`, {
    jobId: JOB_ID,
  })) as { report: Record<string, unknown> | null };
  console.log(
    `[${evalPost.report ? 'PASS' : 'FAIL'}] POST evaluate: report exists=${Boolean(evalPost.report)}`
  );
  if (evalPost.report) {
    const r = evalPost.report;
    console.log(`  id: ${r.id}`);
    console.log(`  inputHash: ${r.inputHash}`);
    console.log(`  algorithmVersion: ${r.algorithmVersion}`);
    console.log(`  precision: ${r.precision}, recall: ${r.recall}, f1: ${r.f1}`);
    console.log(`  meanIoU: ${r.meanIoU}`);
    console.log(
      `  truePositives: ${r.truePositives}, falsePositives: ${r.falsePositives}, falseNegatives: ${r.falseNegatives}`
    );
    console.log(
      `  perClassMetrics: ${(r.perClassMetrics as unknown[]).map((m: any) => `${m.label}(P=${(m.precision as number).toFixed(3)},R=${(m.recall as number).toFixed(3)},F1=${(m.f1 as number).toFixed(3)},IoU=${(m.meanIou as number).toFixed(3)})`).join(', ')}`
    );

    // 4. Verify determinism — same inputs should produce same report
    const evalPost2 = (await request('POST', `/api/projects/${PROJECT}/inference-jobs/evaluate`, {
      jobId: JOB_ID,
    })) as { report: Record<string, unknown> | null };
    if (evalPost2.report) {
      const hash1 = evalPost.report.inputHash as string;
      const hash2 = evalPost2.report!.inputHash as string;
      console.log(
        `[${hash1 === hash2 ? 'PASS' : 'FAIL'}] Determinism: inputHash unchanged after re-run (${hash1} === ${hash2})`
      );
    }
  }

  // 5. GET predictions
  const preds = (await request(
    'GET',
    `/api/projects/${PROJECT}/inference-jobs/${JOB_ID}/predictions`
  )) as { predictions: unknown[] };
  console.log(
    `[${preds.predictions.length > 0 ? 'PASS' : 'FAIL'}] GET predictions: ${preds.predictions.length} predictions`
  );
  if (preds.predictions.length > 0) {
    const p = preds.predictions[0] as any;
    console.log(
      `  First pred: label=${p.label}, confidence=${p.confidence}, geometry=(${p.geometry.x},${p.geometry.y},${p.geometry.width}x${p.geometry.height})`
    );
  }

  console.log('\n=== Smoke Complete ===');
}

smoke().catch((err) => {
  console.error('Smoke failed:', err);
  process.exit(1);
});
