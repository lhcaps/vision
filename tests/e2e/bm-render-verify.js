#!/usr/bin/env node
/**
 * BM Render Verification Harness
 *
 * Mục đích: render tất cả 213 biểu mẫu (theo TT 03/2026-VKSTC) với dữ liệu mẫu,
 * kiểm tra không còn placeholder `{{...}}` trong output, tổng hợp báo cáo.
 *
 * Cách dùng:
 *   node tests/e2e/bm-render-verify.js
 *
 * Yêu cầu:
 *   - Backend dev đang chạy ở http://localhost:3001
 *   - Frontend dev đang chạy ở http://localhost:3000
 *   - Đã login được với admin/admin123
 *   - Có case test (id = 7) để tạo document
 *
 * Output:
 *   - audit_renders/BM-XXX-render-result.json (kết quả mỗi biểu)
 *   - audit_renders/BM-XXX.docx (file đã render)
 *   - audit_renders/SUMMARY.md (báo cáo tổng hợp)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const API_HOST = 'localhost';
const API_PORT = 3001;
const API_BASE = '/api/v1';
const TEST_CASE_ID = '7';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const OUT_DIR = path.join(__dirname, '..', '..', 'audit_renders');

function request(p, method, body, sessionId) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (sessionId) headers['Cookie'] = `qlv_session=${sessionId}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const url = new URL(p, `http://${API_HOST}:${API_PORT}`);
    const req = http.request({
      hostname: API_HOST,
      port: API_PORT,
      path: url.pathname + url.search,
      method,
      headers,
      timeout: 60000,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const text = buf.toString('utf8');
        let parsed;
        try { parsed = JSON.parse(text); } catch { parsed = text; }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers, raw: buf });
      });
    });
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Request with retry/backoff on 429 (ThrottlerException) and 5xx. */
async function requestWithRetry(p, method, body, sessionId, { maxRetries = 5, baseDelayMs = 1500 } = {}) {
  let attempt = 0;
  for (;;) {
    const res = await request(p, method, body, sessionId);
    if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
      attempt += 1;
      if (attempt > maxRetries) return res;
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 400);
      const retryAfter = parseInt(res.headers['retry-after'] || '0', 10);
      const wait = Math.max(delay, retryAfter * 1000);
      process.stdout.write(` [429/5xx retry ${attempt}/${maxRetries} in ${wait}ms]`);
      await sleep(wait);
      continue;
    }
    return res;
  }
}

async function login() {
  const res = await request(`${API_BASE}/auth/login`, 'POST', {
    username: ADMIN_USER,
    password: ADMIN_PASS,
  });
  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) throw new Error('No session cookie');
  const m = setCookie[0].match(/qlv_session=([^;]+)/);
  if (!m) throw new Error('No qlv_session cookie');
  return m[1];
}

async function listTemplates(sessionId) {
  const res = await request(`${API_BASE}/templates?limit=300`, 'GET', null, sessionId);
  if (res.status !== 200) throw new Error(`List templates failed: ${res.status}`);
  return Array.isArray(res.body) ? res.body : (res.body.items || []);
}

async function createDocument(sessionId, templateId) {
  const res = await requestWithRetry(
    `${API_BASE}/documents/cases/${TEST_CASE_ID}/batches`,
    'POST',
    {
      templateIds: [String(templateId)],
      formats: ['DOCX'],
      note: 'BM render verification harness',
    },
    sessionId,
    { maxRetries: 6, baseDelayMs: 2000 },
  );
  if (res.status >= 400) {
    return { error: `HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}` };
  }
  const docs = res.body.documents || res.body.items || [];
  if (docs.length === 0) {
    return { error: 'No document created', body: res.body };
  }
  return { document: docs[0] };
}

async function getPayload(sessionId, documentId) {
  const res = await request(
    `${API_BASE}/documents/generated/${documentId}/render-payload`,
    'GET',
    null,
    sessionId,
  );
  if (res.status >= 400) {
    return { error: `HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}` };
  }
  return { payload: res.body };
}

async function saveFormInputs(sessionId, documentId, formInputs) {
  const res = await request(
    `${API_BASE}/documents/generated/${documentId}/form-inputs`,
    'POST',
    { formInputs },
    sessionId,
  );
  if (res.status >= 400) {
    return { error: `HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}` };
  }
  return { ok: true };
}

async function renderDocx(sessionId, documentId) {
  const res = await request(
    `${API_BASE}/documents/generated/${documentId}/render-docx`,
    'POST',
    { force: true },
    sessionId,
  );
  if (res.status >= 400) {
    return { error: `HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}` };
  }
  return { result: res.body };
}

const SYNTHETIC_INPUTS = {
  agency: {
    parentName: 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
    name: 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
    bodyName: 'Viện kiểm sát nhân dân khu vực 7',
    shortName: 'VKSKV7',
    issuePlace: 'TP. Hồ Chí Minh',
  },
  document: {
    documentCode: 'TEST/2026/BM',
    issueDate: '2026-06-17',
    issuePlace: 'TP. Hồ Chí Minh',
    issuePlaceAndDateLine: 'TP. Hồ Chí Minh, ngày 17 tháng 6 năm 2026',
  },
  case: {
    caseCode: 'VKS-2026-0001',
    caseTitle: 'Vụ án đánh bạc tại phường Trung Mỹ Tây',
    caseName: 'Vụ đánh bạc Trung Mỹ Tây',
    summary: 'Ông Nguyễn Văn A có hành vi đánh bạc tại địa chỉ phường Trung Mỹ Tây, quận 12, TP. Hồ Chí Minh.',
    receivedDate: '2026-05-15',
  },
  offense: {
    offenseName: 'Đánh bạc',
    legalArticle: 'khoản 1 Điều 321',
    criminalCodeText: 'Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025',
  },
  person: {
    fullName: 'Nguyễn Văn A',
    genderLabel: 'Nam',
    birthDate: '1985-09-08',
    birthPlace: 'tỉnh Quảng Ngãi',
    nationality: 'Việt Nam',
    occupation: 'Kinh doanh',
    identityNo: '051080000314',
    currentAddress: 'số 49/37, đường TCH 16, phường Trung Mỹ Tây, TP. Hồ Chí Minh',
    phone: '0901234567',
  },
  content: {
    legalBasisLine: 'Căn cứ các điều 41, 42, 43, 159 và 160 của Bộ luật Tố tụng hình sự;',
    summaryLine: 'Qua công tác kiểm sát, phát hiện vụ việc có dấu hiệu tội phạm.',
    decisionLine: 'Quyết định khởi tố vụ án hình sự.',
  },
  recipients: {
    primaryLine: 'Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây',
    archiveLine: 'Lưu: HSVA, HSKS, VP.',
  },
  signature: {
    signMode: 'KT. VIỆN TRƯỞNG',
    positionTitle: 'PHÓ VIỆN TRƯỞNG',
    signerName: 'Trần Thanh Nam',
  },
};

async function findPlaceholdersInFile(filePath) {
  const fsLocal = require('fs');
  const path = require('path');
  if (!fsLocal.existsSync(filePath)) return { found: false, count: 0, samples: [] };
  let buf;
  try {
    buf = fsLocal.readFileSync(filePath);
  } catch (e) {
    return { found: false, count: 0, samples: [`ERR: ${e.message}`] };
  }
  // DOCX = zip; check word/document.xml inside
  const { execSync } = require('child_process');
  let xml = '';
  try {
    // Use PowerShell to extract (works without extra deps)
    const tmp = path.join(OUT_DIR, '_tmp_extract');
    if (!fsLocal.existsSync(tmp)) fsLocal.mkdirSync(tmp, { recursive: true });
    execSync(`powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${filePath.replace(/'/g, "''")}', '${tmp.replace(/'/g, "''")}')"`, { stdio: 'ignore' });
    const xmlPath = path.join(tmp, 'word', 'document.xml');
    if (fsLocal.existsSync(xmlPath)) {
      xml = fsLocal.readFileSync(xmlPath, 'utf8');
    }
    // Cleanup
    try {
      execSync(`powershell -NoProfile -Command "Remove-Item -Recurse -Force '${tmp.replace(/'/g, "''")}'"`, { stdio: 'ignore' });
    } catch {}
  } catch (e) {
    return { found: false, count: 0, samples: [`Extract error: ${e.message}`] };
  }
  if (!xml) return { found: false, count: 0, samples: ['No word/document.xml'] };
  const matches = xml.match(/\{\{[^}]+\}\}/g) || [];
  return {
    found: matches.length > 0,
    count: matches.length,
    samples: matches.slice(0, 10),
  };
}

function findPlaceholders(obj, path = '') {
  const found = [];
  if (obj === null || obj === undefined) return found;
  if (typeof obj === 'string') {
    const matches = obj.match(/\{\{[^}]+\}\}/g);
    if (matches) {
      for (const m of matches) found.push({ path, placeholder: m });
    }
    return found;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => found.push(...findPlaceholders(v, `${path}[${i}]`)));
    return found;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      found.push(...findPlaceholders(v, path ? `${path}.${k}` : k));
    }
  }
  return found;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Parse args: --limit N, --start N (resume from Nth template, 1-based), --offset N
  const args = process.argv.slice(2);
  let limit = null;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx >= 0 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
  }
  let startIdx = 0;
  const startArgIdx = args.indexOf('--start');
  if (startArgIdx >= 0 && args[startArgIdx + 1]) {
    startIdx = Math.max(0, parseInt(args[startArgIdx + 1], 10) - 1);
  }

  console.log('Logging in...');
  const sessionId = await login();
  console.log('  OK\n');

  console.log('Listing templates...');
  let templates = await listTemplates(sessionId);
  console.log(`  ${templates.length} templates in DB`);
  if (startIdx > 0) {
    templates = templates.slice(startIdx);
    console.log(`  --start ${startIdx + 1}: skipping first ${startIdx}`);
  }
  if (limit) {
    templates = templates.slice(0, limit);
    console.log(`  --limit ${limit}: rendering first ${templates.length}`);
  }
  console.log('');

  const summary = {
    startedAt: new Date().toISOString(),
    apiHost: `${API_HOST}:${API_PORT}`,
    totalTemplates: templates.length,
    results: [],
    errors: [],
  };

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    const code = t.templateCode;
    const tname = t.templateName;
    process.stdout.write(`[${i + 1}/${templates.length}] ${code}: ${tname} ... `);

    const result = {
      code,
      name: tname,
      stage: t.stageCode,
      group: t.group?.groupCode,
      templateId: t.id,
    };

    try {
      const created = await createDocument(sessionId, t.id);
      if (created.error) {
        result.status = 'CREATE_FAILED';
        result.error = created.error;
        summary.errors.push({ code, stage: 'create', error: created.error });
        console.log(`CREATE_FAILED: ${created.error.slice(0, 100)}`);
        continue;
      }
      const docId = created.document.id;
      result.documentId = docId;

      const saveRes = await saveFormInputs(sessionId, docId, SYNTHETIC_INPUTS);
      if (saveRes.error) {
        result.status = 'SAVE_INPUTS_FAILED';
        result.error = saveRes.error;
        summary.errors.push({ code, stage: 'save', error: saveRes.error });
        console.log(`SAVE_INPUTS_FAILED: ${saveRes.error.slice(0, 100)}`);
        continue;
      }

      const payloadRes = await getPayload(sessionId, docId);
      if (payloadRes.error) {
        result.status = 'GET_PAYLOAD_FAILED';
        result.error = payloadRes.error;
        summary.errors.push({ code, stage: 'payload', error: payloadRes.error });
        console.log(`GET_PAYLOAD_FAILED: ${payloadRes.error.slice(0, 100)}`);
        continue;
      }

      const placeholders = findPlaceholders(payloadRes.payload);
      result.placeholderCount = placeholders.length;
      result.placeholderSamples = placeholders.slice(0, 5).map(p => p.placeholder);

      const renderRes = await renderDocx(sessionId, docId);
      if (renderRes.error) {
        result.status = 'RENDER_FAILED';
        result.error = renderRes.error;
        summary.errors.push({ code, stage: 'render', error: renderRes.error });
        console.log(`RENDER_FAILED: ${renderRes.error.slice(0, 100)}`);
      } else {
        result.status = 'OK';
        const rj = renderRes.result;
        const file = rj.file || (rj.files && rj.files[0]);
        if (file) {
          result.renderedFile = {
            fileName: file.fileName,
            fileSize: file.fileSizeBytes || file.size,
            filePath: file.filePath,
            format: file.fileFormat || 'DOCX',
          };
          // Check actual DOCX content for placeholders
          const fp = file.filePath;
          if (fp && require('fs').existsSync(fp)) {
            const ph = await findPlaceholdersInFile(fp);
            result.docxPlaceholders = ph;
            if (ph.found) {
              result.docxPlaceholderCount = ph.count;
            }
          }
        } else if (rj.skipped && rj.file) {
          result.renderedFile = {
            fileName: rj.file.fileName,
            fileSize: rj.file.fileSizeBytes,
            filePath: rj.file.filePath,
            format: rj.file.fileFormat,
          };
          result.skipped = true;
        }
        const phCount = result.docxPlaceholderCount || placeholders.length;
        console.log(
          `OK (payload placeholders=${placeholders.length}, docx placeholders=${result.docxPlaceholderCount ?? 'n/a'}, file=${(result.renderedFile && result.renderedFile.fileName) || 'none'})`,
        );
      }

      fs.writeFileSync(
        path.join(OUT_DIR, `${code}-result.json`),
        JSON.stringify(result, null, 2),
      );
    } catch (e) {
      result.status = 'EXCEPTION';
      result.error = e.message;
      summary.errors.push({ code, stage: 'exception', error: e.message });
      console.log(`EXCEPTION: ${e.message.slice(0, 100)}`);
    }

    summary.results.push(result);
  }

  summary.endedAt = new Date().toISOString();
  summary.okCount = summary.results.filter(r => r.status === 'OK').length;
  summary.failedCount = summary.results.filter(r => r.status !== 'OK').length;
  summary.withPlaceholders = summary.results.filter(r => r.placeholderCount > 0).length;

  fs.writeFileSync(
    path.join(OUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2),
  );

  const md = [];
  md.push(`# BM Render Verification — ${new Date().toLocaleString('vi-VN')}`);
  md.push('');
  md.push(`- Tổng templates: **${summary.totalTemplates}**`);
  md.push(`- Render OK: **${summary.okCount}**`);
  md.push(`- Failed: **${summary.failedCount}**`);
  md.push(`- Còn placeholder: **${summary.withPlaceholders}**`);
  md.push('');
  md.push('## Errors by stage');
  const errByStage = {};
  for (const e of summary.errors) {
    errByStage[e.stage] = (errByStage[e.stage] || 0) + 1;
  }
  for (const [stage, count] of Object.entries(errByStage)) {
    md.push(`- ${stage}: ${count}`);
  }
  md.push('');
  md.push('## Biểu mẫu còn placeholder');
  md.push('');
  md.push('| Mã BM | Tên | Stage | Số placeholder | Sample |');
  md.push('|---|---|---|---|---|');
  for (const r of summary.results) {
    if (r.placeholderCount > 0) {
      md.push(`| ${r.code} | ${r.name} | ${r.stage} | ${r.placeholderCount} | ${(r.placeholderSamples || []).join(', ')} |`);
    }
  }
  md.push('');
  md.push('## Failed');
  md.push('');
  md.push('| Mã BM | Tên | Stage | Lý do |');
  md.push('|---|---|---|---|');
  for (const r of summary.results) {
    if (r.status !== 'OK') {
      md.push(`| ${r.code} | ${r.name} | ${r.stage} | ${r.status}: ${(r.error || '').slice(0, 80)} |`);
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'SUMMARY.md'), md.join('\n'));

  console.log(`\n========= SUMMARY =========`);
  console.log(`Total: ${summary.totalTemplates}`);
  console.log(`OK:    ${summary.okCount}`);
  console.log(`Failed: ${summary.failedCount}`);
  console.log(`With placeholders: ${summary.withPlaceholders}`);
  console.log(`Report: ${path.join(OUT_DIR, 'SUMMARY.md')}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
