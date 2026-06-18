#!/usr/bin/env node
/**
 * Smoke test: verify the 4 deployed docs (BM-024, BM-025, BM-026, BM-029) still render OK
 * after the dispatcher changes (83 new stub components wired in).
 */
const http = require('http');

const API = { host: 'localhost', port: 3001, base: '/api/v1' };

function request(p, method, body, sid) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (sid) headers['Cookie'] = `qlv_session=${sid}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const url = new URL(p, `http://${API.host}:${API.port}`);
    const req = http.request({ hostname: API.host, port: API.port, path: url.pathname + url.search, method, headers, timeout: 30000 }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        let parsed;
        try { parsed = JSON.parse(buf.toString('utf8')); } catch { parsed = buf.toString('utf8'); }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers });
      });
    });
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  // 1. Login
  const loginRes = await request(`${API.base}/auth/login`, 'POST', { username: 'admin', password: 'admin123' });
  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.status, loginRes.body);
    process.exit(1);
  }
  const sid = loginRes.headers['set-cookie'][0].match(/qlv_session=([^;]+)/)[1];
  console.log('Login OK');

  // 2. Find template IDs for the 4 BM
  const targetCodes = ['BM-024', 'BM-025', 'BM-026', 'BM-029'];
  const tRes = await request(`${API.base}/templates?limit=300`, 'GET', null, sid);
  const ts = Array.isArray(tRes.body) ? tRes.body : (tRes.body.items || []);
  const targets = ts.filter((t) => targetCodes.includes(t.templateCode));
  console.log(`Found ${targets.length} templates: ${targets.map(t => t.templateCode).join(', ')}`);

  // 3. For each, create document + save inputs + get payload + render
  for (const t of targets) {
    process.stdout.write(`[${t.templateCode}] ... `);
    const cRes = await request(`${API.base}/documents/cases/7/batches`, 'POST', { templateIds: [String(t.id)], formats: ['DOCX'], note: 'smoke-test' }, sid);
    if (cRes.status >= 400) {
      console.log(`CREATE FAILED: ${JSON.stringify(cRes.body).slice(0, 100)}`);
      continue;
    }
    const doc = (cRes.body.documents || cRes.body.items || [])[0];
    if (!doc) { console.log('NO DOC'); continue; }
    const docId = doc.id;
    const sRes = await request(`${API.base}/documents/generated/${docId}/form-inputs`, 'POST', {
      formInputs: {
        agency: { parentName: 'VKSND TPHCM', name: 'VKSKV7', issuePlace: 'TP.HCM' },
        document: { documentCode: `SMK/${t.templateCode}/2026`, issueDate: '2026-06-17' },
        case: { caseCode: 'VKS-2026-0001', caseTitle: 'Vụ án đánh bạc Trung Mỹ Tây' },
        content: { legalBasisLine: 'Căn cứ BLTTHS 2015' },
        recipients: { archiveLine: 'Lưu: HSVA' },
        signature: { signMode: 'KT. VIỆN TRƯỞNG', positionTitle: 'PHÓ VIỆN TRƯỞNG', signerName: 'Trần Thanh Nam' },
      },
    }, sid);
    if (sRes.status >= 400) {
      console.log(`SAVE FAILED: ${JSON.stringify(sRes.body).slice(0, 100)}`);
      continue;
    }
    const rRes = await request(`${API.base}/documents/generated/${docId}/render-docx`, 'POST', { force: true }, sid);
    if (rRes.status >= 400) {
      console.log(`RENDER FAILED: ${JSON.stringify(rRes.body).slice(0, 100)}`);
      continue;
    }
    const file = rRes.body.file || (rRes.body.files && rRes.body.files[0]);
    console.log(`OK (docId=${docId}, file=${file ? file.fileName : 'no-file'})`);
    await sleep(800);
  }
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
