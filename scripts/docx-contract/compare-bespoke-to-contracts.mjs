#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 6 — Compare BESPOKE vs DOCX contract.
// Scan tất cả apps/web/src/components/documents/bm-*-form-inputs.tsx.
// Phân tích: TypeScript fields, fetch, hardcode, UI gene violations.
// So sánh với contract.draft.json theo slot coverage (không so 1-1).

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FORM_DIR = path.join(ROOT, "apps", "web", "src", "components", "documents");
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");
const SHARED_BM_FORM_DIR = path.join(FORM_DIR, "bm-form");

const FORBIDDEN_SHELL_PATTERNS = [
  { name: "local-inputClass", regex: /\b(?:const|let|var)\s+inputClass\s*=/u },
  { name: "local-textareaClass", regex: /\b(?:const|let|var)\s+textareaClass\s*=/u },
  { name: "local-labelClass", regex: /\b(?:const|let|var)\s+labelClass\s*=/u },
  { name: "local-Section-component", regex: /\bfunction\s+Section\s*\(/u },
  { name: "local-SectionCard-component", regex: /\bfunction\s+SectionCard\s*\(/u },
  { name: "local-Field-component", regex: /\bfunction\s+Field\s*\(/u },
  { name: "local-TextAreaField-component", regex: /\bfunction\s+TextAreaField\s*\(/u },
  { name: "local-StatusMessage-component", regex: /\bfunction\s+StatusMessage\s*\(/u },
  { name: "direct-fetch", regex: /\bfetch\s*\(\s*[`'"]/u },
  { name: "API_BASE_URL", regex: /\bAPI_BASE_URL\b/u },
  { name: "bg-slate-950-custom", regex: /\bbg-slate-950\b/u },
  { name: "bg-blue-50-custom", regex: /\bbg-blue-50\b/u },
];

const SHARED_IMPORTS = [
  "BmFormMetaBar",
  "BmFormSection",
  "BmFieldText",
  "BmFieldTextarea",
  "BmFieldDate",
  "BmFieldSelect",
  "BmFormStatus",
  "BmFormActions",
];

// Tìm các field path trong TypeScript code: agency.name, document.issueDate, ...
const FIELD_PATH_PATTERN = /\b([a-z][a-zA-Z0-9]*)\.([a-z][a-zA-Z0-9]*)\b/gu;
const RESERVED_WORDS = new Set([
  "useState", "useEffect", "useMemo", "useCallback", "useRef", "useReducer",
  "useContext", "JSON", "Math", "Object", "Array", "Promise", "Date",
  "String", "Number", "Boolean", "localStorage", "sessionStorage",
  "console", "window", "document", "process", "require", "module",
  "Buffer", "URL", "URLSearchParams", "Map", "Set", "Error",
  "toString", "valueOf", "typeof", "instanceof",
  "className", "onChange", "onClick", "onSubmit", "onBlur", "onFocus",
  "htmlFor", "aria-label", "tabIndex", "autoComplete",
  "placeholder", "required", "disabled", "readOnly", "value", "defaultValue",
  "type", "min", "max", "step", "maxLength", "minLength",
  "fullWidth", "rows", "cols",
  "id", "key", "ref", "index", "i", "j", "k", "e", "err",
  "React", "useClient",
  "true", "false", "null", "undefined", "this", "self",
  "fetch", "axios", "api",
  "getDate", "getMonth", "getFullYear", "getHours", "getMinutes",
  "padStart", "match", "slice", "split", "join", "replace", "trim",
  "map", "filter", "forEach", "find", "findIndex", "some", "every",
  "sort", "reduce", "concat", "includes", "indexOf", "push", "pop",
  "shift", "unshift", "reverse",
  "vi", "en",
]);

const NAMESPACES = new Set([
  "agency", "document", "case", "sourceReport", "informant", "receiver",
  "reporter", "prosecutor", "inspector", "assignment", "decision",
  "legalBasis", "recipients", "signature", "renderMeta",
]);

const extractBespokeFields = (text) => {
  const paths = new Set();
  let m;
  FIELD_PATH_PATTERN.lastIndex = 0;
  while ((m = FIELD_PATH_PATTERN.exec(text))) {
    const ns = m[1];
    const field = m[2];
    if (RESERVED_WORDS.has(ns) || RESERVED_WORDS.has(field)) continue;
    if (!NAMESPACES.has(ns)) continue;
    if (/^(true|false|null|undefined|number|string|boolean)$/iu.test(field)) continue;
    paths.add(`${ns}.${field}`);
  }
  return Array.from(paths);
};

const extractImport = (text) => {
  const out = { shared: [], others: [] };
  const importRe = /import\s+(?:\{([^}]+)\}\s+from\s+|(\w+)\s+from\s+)?["']([^"']+)["']/gu;
  let m;
  while ((m = importRe.exec(text))) {
    const names = (m[1] ?? m[2] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const source = m[3];
    if (source.includes("bm-form") || source.endsWith("/bm-form")) {
      out.shared.push(...names);
    } else {
      out.others.push(...names);
    }
  }
  return out;
};

const hasAllowException = (text, patternName) => {
  // Allow exception: "// bm-gene-audit-allow: lý do"
  const m = text.match(new RegExp(`//\\s*bm-gene-audit-allow:[^\\n]*${patternName}`, "iu"));
  return Boolean(m);
};

const classifyBespoke = (file) => {
  const fileName = path.basename(file);
  const text = fs.readFileSync(file, "utf8");
  const codeMatch = fileName.match(/bm-(\d{3})-form-inputs\.tsx$/u);
  const code = codeMatch ? `BM-${codeMatch[1]}` : fileName;

  const fields = extractBespokeFields(text);
  const imports = extractImport(text);

  const geneViolations = [];
  for (const { name, regex } of FORBIDDEN_SHELL_PATTERNS) {
    if (regex.test(text) && !hasAllowException(text, name)) {
      geneViolations.push(name);
    }
  }

  // Check shared kit usage
  const usesSharedKit = SHARED_IMPORTS.some((i) => imports.shared.includes(i));
  const usesGenericPanel = text.includes("GenericTemplateFormInputsPanel");

  return {
    code,
    file: path.relative(ROOT, file).replaceAll(path.sep, "/"),
    fields,
    sharedImports: imports.shared,
    usesSharedKit,
    usesGenericPanel,
    geneViolations,
  };
};

const compareToContract = (bespoke, contract) => {
  if (!contract) {
    return { kind: "noContract", reason: "Không tìm thấy contract draft" };
  }
  const docxFieldSet = new Set();
  for (const f of contract.canonicalFields ?? []) {
    docxFieldSet.add(f.path);
  }
  // Nhóm field DOCX theo canonical namespace. Tìm "equivalent" cho mỗi field
  // bespoke: nếu bespoke có agency.name, contract có agency.name hoặc field
  // derived từ agency.name → match.
  const bespokeSet = new Set(bespoke.fields);
  const missing = [];
  const equivalent = [];
  const extraSuspicious = [];

  for (const f of bespoke.fields) {
    if (docxFieldSet.has(f)) {
      equivalent.push(f);
      continue;
    }
    // Tìm slot tương đương theo pattern Day/Month/Year vs Date
    const dateBase = f.replace(/(Day|Month|Year|Date)$/u, "");
    const dayEq = docxFieldSet.has(dateBase + "Day");
    const monthEq = docxFieldSet.has(dateBase + "Month");
    const yearEq = docxFieldSet.has(dateBase + "Year");
    const dateEq = docxFieldSet.has(dateBase + "Date");
    if (dayEq && monthEq && yearEq) {
      equivalent.push(`${f} ↔ ${dateBase}Day/Month/Year`);
      continue;
    }
    if (dateEq) {
      equivalent.push(`${f} ↔ ${dateBase}Date`);
      continue;
    }
    extraSuspicious.push(f);
  }

  for (const f of docxFieldSet) {
    const base = f.replace(/(Day|Month|Year|Date)$/u, "");
    const hasBespokeDateBase = bespokeSet.has(base + "Date")
      || bespokeSet.has(base + "Day")
      || bespokeSet.has(base + "Month")
      || bespokeSet.has(base + "Year");
    if (!bespokeSet.has(f) && !hasBespokeDateBase && !extraSuspicious.includes(f)) {
      missing.push(f);
    }
  }

  return {
    kind: "compared",
    equivalent,
    extraSuspicious,
    missing,
  };
};

const main = () => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const bespokeFiles = fs
    .readdirSync(FORM_DIR)
    .filter((n) => /^bm-\d{3}-form-inputs\.tsx$/u.test(n))
    .map((n) => path.join(FORM_DIR, n));
  bespokeFiles.sort();

  // Load all contracts
  const contracts = new Map();
  for (const f of fs.readdirSync(CONTRACTS_DIR).filter((n) => n.endsWith(".contract.draft.json"))) {
    const c = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8"));
    if (c.templateCode) contracts.set(c.templateCode, c);
  }

  const rows = [];
  let totalBespoke = 0;
  let totalEquivalent = 0;
  let totalMissing = 0;
  let totalExtra = 0;
  let totalGeneViolations = 0;
  let totalGeneric = 0;
  let totalNoContract = 0;

  for (const f of bespokeFiles) {
    const bespoke = classifyBespoke(f);
    const contract = contracts.get(bespoke.code);
    const cmp = compareToContract(bespoke, contract);
    totalBespoke += 1;
    if (bespoke.usesGenericPanel) totalGeneric += 1;
    if (cmp.kind === "noContract") totalNoContract += 1;
    totalGeneViolations += bespoke.geneViolations.length;
    totalEquivalent += cmp.equivalent?.length ?? 0;
    totalMissing += cmp.missing?.length ?? 0;
    totalExtra += cmp.extraSuspicious?.length ?? 0;
    rows.push({ bespoke, contract: contract ?? null, comparison: cmp });
  }

  const md = ["# BESPOKE vs DOCX Contract — Comparison Report"];
  md.push("");
  md.push(`Sinh lúc: ${new Date().toISOString()}`);
  md.push("");
  md.push("## Tổng quan");
  md.push("");
  md.push(`- Tổng BESPOKE files: **${totalBespoke}**`);
  md.push(`- Có contract tương ứng: **${rows.filter((r) => r.contract).length}**`);
  md.push(`- Không có contract: **${totalNoContract}**`);
  md.push(`- Dùng GenericTemplateFormInputsPanel (stub): **${totalGeneric}**`);
  md.push(`- Tổng field tương đương (slot coverage OK): **${totalEquivalent}**`);
  md.push(`- Tổng field nghi ngờ thiếu trong BESPOKE: **${totalMissing}**`);
  md.push(`- Tổng field thừa/suspicious trong BESPOKE: **${totalExtra}**`);
  md.push(`- Tổng UI gene violation: **${totalGeneViolations}**`);
  md.push("");
  md.push("## UI Gene Violations (top 30)");
  md.push("");
  md.push("| BM | File | Violations |");
  md.push("|---|---|---|");
  const violRows = rows
    .filter((r) => r.bespoke.geneViolations.length > 0)
    .sort((a, b) => b.bespoke.geneViolations.length - a.bespoke.geneViolations.length)
    .slice(0, 30);
  for (const r of violRows) {
    md.push(`| ${r.bespoke.code} | ${r.bespoke.file} | ${r.bespoke.geneViolations.join(", ")} |`);
  }
  md.push("");
  md.push("## Missing fields vs DOCX contract (top 30)");
  md.push("");
  md.push("Cảnh báo: BESPOKE không cover field mà contract đề xuất.");
  md.push("");
  md.push("| BM | Missing fields |");
  md.push("|---|---|");
  const missRows = rows
    .filter((r) => r.comparison.kind === "compared" && r.comparison.missing.length > 0)
    .sort((a, b) => b.comparison.missing.length - a.comparison.missing.length)
    .slice(0, 30);
  for (const r of missRows) {
    md.push(`| ${r.bespoke.code} | ${r.comparison.missing.slice(0, 10).join(", ")}${r.comparison.missing.length > 10 ? " …" : ""} |`);
  }
  md.push("");
  md.push("## Per-BM comparison");
  md.push("");
  md.push("| BM | Field count | Equivalent | Missing | Extra | Gene | Stub |");
  md.push("|---|---:|---:|---:|---:|---:|:-:|");
  for (const r of rows) {
    const b = r.bespoke;
    const c = r.comparison;
    md.push(
      `| ${b.code} | ${b.fields.length} | ${c.equivalent?.length ?? 0} | ${c.missing?.length ?? 0} | ${c.extraSuspicious?.length ?? 0} | ${b.geneViolations.length} | ${b.usesGenericPanel ? "yes" : "no"} |`,
    );
  }
  md.push("");
  fs.writeFileSync(path.join(REPORTS_DIR, "BESPOKE-VS-DOCX-CONTRACT.md"), md.join("\n"), "utf8");

  const jsonReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalBespoke,
      withContract: rows.filter((r) => r.contract).length,
      withoutContract: totalNoContract,
      generic: totalGeneric,
      equivalentFields: totalEquivalent,
      missingFields: totalMissing,
      extraFields: totalExtra,
      geneViolations: totalGeneViolations,
    },
    rows: rows.map((r) => ({
      code: r.bespoke.code,
      file: r.bespoke.file,
      fields: r.bespoke.fields,
      geneViolations: r.bespoke.geneViolations,
      usesSharedKit: r.bespoke.usesSharedKit,
      usesGenericPanel: r.bespoke.usesGenericPanel,
      comparison: r.comparison,
    })),
  };
  fs.writeFileSync(
    path.join(REPORTS_DIR, "bespoke-vs-docx-contract.json"),
    `${JSON.stringify(jsonReport, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify(jsonReport.summary, null, 2));
};

main();
