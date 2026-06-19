#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 3 — Draft contracts.
// Đọc các file extract.json sinh contract.draft.json cho từng BM.
// Mỗi blank candidate + paragraph context → docxSlot (reviewRequired=true).
// Không tự ý lock; mọi unknown source phải được report.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXTRACT_DIR = path.join(ROOT, "docs", "audit", "docx", "extracted");
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const FIELD_TAXONOMY = path.join(ROOT, "docs", "contracts", "field-taxonomy.json");
const SOURCE_TAXONOMY = path.join(ROOT, "docs", "contracts", "source-taxonomy.json");
const TRANSFORM_TAXONOMY = path.join(ROOT, "docs", "contracts", "transform-taxonomy.json");

// ============== helpers ==============

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const inferDateParts = (text) => {
  // Nếu text chứa pattern "ngày ... tháng ... năm ..." → split thành 3 slots.
  if (/ngày\s*\.{3,}\s*tháng\s*\.{3,}\s*năm\s*\.{3,}/iu.test(text)) {
    return ["day", "month", "year"];
  }
  if (/ngày\s*\.{3,}\s*tháng\s*\.{3,}/iu.test(text)) {
    return ["day", "month"];
  }
  return null;
};

const NAMESPACES = [
  "agency",
  "document",
  "case",
  "sourceReport",
  "informant",
  "receiver",
  "reporter",
  "prosecutor",
  "inspector",
  "assignment",
  "decision",
  "legalBasis",
  "recipients",
  "signature",
  "renderMeta",
];

const guessNamespace = (text) => {
  const t = text.toLowerCase();
  if (/viện kiểm sát|cơ quan|cấp trên|cơ quan cấp/.test(t)) return "agency";
  if (/ngày|số:|mẫu số|văn bản/.test(t)) return "document";
  if (/vụ án|tội phạm|nguồn tin/.test(t)) return "case";
  if (/họ tên|ngày sinh|nghề nghiệp|cmnd|cccd|quốc tịch|nơi ở|địa chỉ/.test(t)) return "informant";
  if (/người tiếp nhận|chức danh|đơn vị công tác/.test(t)) return "receiver";
  if (/ksv|kiểm sát viên/.test(t)) return "prosecutor";
  if (/điều\s*\d|quyết định|nội dung|tóm tắt/.test(t)) return "decision";
  if (/căn cứ|luật|điều luật/.test(t)) return "legalBasis";
  if (/nơi nhận|lưu|hsva|hsvv|vp/.test(t)) return "recipients";
  if (/ký|chức danh|ký tên/.test(t)) return "signature";
  return "document";
};

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/gu, " ")
    .trim()
    .split(/\s+/u)[0]
    ?.toLowerCase() ?? "field";

const DATE_TRANSFORMS = {
  day: "date.day",
  month: "date.month",
  year: "date.year",
};

// ============== draft ==============

const buildDraft = (extract) => {
  const { templateCode, fileName, relativePath, sha256, format, textBlocks, placeholders, blankCandidates, warnings, error } = extract;

  const docxSlots = [];
  const canonicalFields = [];
  const renderBindings = [];
  const rejectedCandidates = [];
  const unresolvedQuestions = [];
  const contractWarnings = [...(warnings ?? [])];

  if (error) {
    contractWarnings.push(`Extract error: ${error}`);
  }

  // 1) Dùng blank candidates để sinh docxSlot.
  //    Mỗi blank candidate sẽ map thành 1 slot (nếu không phải duplicate).
  const seenSlotIds = new Set();
  const makeSlotId = (ns, fname) => {
    const base = `${ns}.${fname}`;
    let id = base;
    let i = 2;
    while (seenSlotIds.has(id)) {
      id = `${base}_${i}`;
      i += 1;
    }
    seenSlotIds.add(id);
    return id;
  };

  const addCanonicalField = (path, type, label, source, uiComponent, section, required) => {
    if (canonicalFields.some((f) => f.path === path)) return null;
    const field = {
      path,
      type,
      label,
      source,
      required,
      uiComponent,
      section,
      reviewRequired: source === "unknown",
    };
    canonicalFields.push(field);
    return field;
  };

  // 1.1) Date parts (ngày … tháng … năm …).
  let dateFieldIndex = 0;
  for (const blk of textBlocks) {
    const parts = inferDateParts(blk.text);
    if (parts) {
      const ns = guessNamespace(blk.text);
      const canonicalPath = `${ns}.issueDate`;
      addCanonicalField(canonicalPath, "date", `Ngày tháng năm (split từ DOCX)`, "unknown", "date", "Thời gian", true);
      for (const part of parts) {
        const slotId = makeSlotId(ns, `issueDate${part[0].toUpperCase()}${part.slice(1)}`);
        docxSlots.push({
          slotId,
          location: { partName: "WordDocument", blockId: blk.blockId, tableCellId: null },
          context: blk.text.slice(0, 200),
          label: `${part.toUpperCase()} (${ns})`,
          slotType: "datePart",
          required: true,
          confidence: 0.6,
          evidence: { textBefore: blk.text.slice(0, 100), textAfter: blk.text.slice(-100), rawPattern: "ngày … tháng … năm …" },
          reviewRequired: true,
        });
        renderBindings.push({
          slotId,
          from: canonicalPath,
          transform: DATE_TRANSFORMS[part],
          fallback: "",
          reviewRequired: true,
        });
        dateFieldIndex += 1;
      }
    }
  }
  void dateFieldIndex;

  // 1.2) Ellipsis (...) blank lines.
  for (const blank of blankCandidates) {
    if (blank.kind === "ellipsis") {
      // Tìm paragraph gần nhất (chứa blank) để đoán namespace.
      const containingBlock = textBlocks.find((b) => b.text.includes(blank.raw));
      const ns = containingBlock ? guessNamespace(containingBlock.text) : "document";
      const fieldName = `blank${docxSlots.length + 1}`;
      const slotId = makeSlotId(ns, fieldName);
      docxSlots.push({
        slotId,
        location: containingBlock
          ? { partName: "WordDocument", blockId: containingBlock.blockId, tableCellId: null }
          : { partName: "WordDocument", blockId: null, tableCellId: null },
        context: containingBlock ? containingBlock.text.slice(0, 200) : blank.raw,
        label: `Ô trống dạng "..." (${ns})`,
        slotType: "text",
        required: false,
        confidence: 0.4,
        evidence: { textBefore: "", textAfter: "", rawPattern: blank.raw },
        reviewRequired: true,
      });
      const canonicalPath = `${ns}.field${docxSlots.length}`;
      addCanonicalField(canonicalPath, "string", `Trường cần điền (${ns})`, "unknown", "text", ns, false);
      renderBindings.push({
        slotId,
        from: canonicalPath,
        transform: "identity",
        fallback: "",
        reviewRequired: true,
      });
    } else if (blank.kind === "vn-date-line") {
      // Date line dạng "…, ngày … tháng … năm …" → document.issuePlaceDateLine.
      const slotId = makeSlotId("document", "issuePlaceDateLine");
      if (!docxSlots.some((s) => s.slotId === slotId)) {
        const containingBlock = textBlocks.find((b) => b.text.includes(blank.raw));
        docxSlots.push({
          slotId,
          location: containingBlock
            ? { partName: "WordDocument", blockId: containingBlock.blockId, tableCellId: null }
            : { partName: "WordDocument", blockId: null, tableCellId: null },
          context: blank.raw,
          label: "Dòng địa danh, ngày tháng năm",
          slotType: "date",
          required: true,
          confidence: 0.85,
          evidence: { textBefore: "", textAfter: "", rawPattern: "…, ngày … tháng … năm …" },
          reviewRequired: true,
        });
        addCanonicalField("document.issueDate", "date", "Ngày ban hành", "manualOrDefault", "date", "Văn bản", true);
        addCanonicalField("document.issuePlace", "string", "Địa danh ban hành", "agencyConfig", "text", "Văn bản", true);
        renderBindings.push({
          slotId,
          from: "{issuePlace:document.issuePlace, issueDate:document.issueDate}",
          transform: "date.issuePlaceDateLine",
          fallback: "",
          reviewRequired: true,
        });
      }
    } else if (blank.kind === "numbered-blank") {
      const slotId = makeSlotId("document", `numberedBlank${docxSlots.length + 1}`);
      const containingBlock = textBlocks.find((b) => b.text.includes(blank.raw));
      docxSlots.push({
        slotId,
        location: containingBlock
          ? { partName: "WordDocument", blockId: containingBlock.blockId, tableCellId: null }
          : { partName: "WordDocument", blockId: null, tableCellId: null },
        context: blank.raw,
        label: "Vị trí đánh số (1), (2), …",
        slotType: "text",
        required: false,
        confidence: 0.5,
        evidence: { textBefore: "", textAfter: "", rawPattern: blank.raw },
        reviewRequired: true,
      });
      const canonicalPath = `document.numberedSlot${docxSlots.length}`;
      addCanonicalField(canonicalPath, "string", "Trường đánh số", "unknown", "text", "Nội dung", false);
      renderBindings.push({
        slotId,
        from: canonicalPath,
        transform: "identity",
        fallback: "",
        reviewRequired: true,
      });
    }
  }

  // 1.3) Placeholder {{...}} nếu có (DOCX có thể có sẵn).
  for (const ph of placeholders) {
    const value = ph.value;
    if (!value) continue;
    const parts = value.split(".");
    if (parts.length < 2) {
      rejectedCandidates.push({
        slotId: value,
        reason: `Placeholder không theo format namespace.field: ${ph.raw}`,
      });
      continue;
    }
    const ns = parts[0];
    const field = parts.slice(1).join(".");
    if (!NAMESPACES.includes(ns)) {
      rejectedCandidates.push({
        slotId: value,
        reason: `Namespace "${ns}" không thuộc field-taxonomy`,
      });
      continue;
    }
    const slotId = makeSlotId(ns, field);
    if (docxSlots.some((s) => s.slotId === slotId)) continue;
    docxSlots.push({
      slotId,
      location: { partName: "word/document.xml", blockId: null, tableCellId: null },
      context: ph.raw,
      label: field,
      slotType: field.includes("Date") || field.includes("Day") || field.includes("Month") || field.includes("Year") ? "datePart" : "text",
      required: true,
      confidence: 0.9,
      evidence: { textBefore: "", textAfter: "", rawPattern: ph.raw },
      reviewRequired: true,
    });
    const canonicalPath = value;
    addCanonicalField(canonicalPath, "string", field, "unknown", "text", ns, true);
    renderBindings.push({
      slotId,
      from: canonicalPath,
      transform: "identity",
      fallback: "",
      reviewRequired: true,
    });
  }

  // 2) Báo cáo các paragraph không matched (giúp reviewer thấy rõ chỗ cần xem).
  const unmatched = textBlocks.filter(
    (b) => !docxSlots.some((s) => s.location.blockId === b.blockId),
  );
  if (unmatched.length > 0 && unmatched.length < 20) {
    unresolvedQuestions.push(
      `${unmatched.length} paragraph có nội dung đặc thù cần reviewer xem xét: ` +
        unmatched
          .slice(0, 5)
          .map((b) => `${b.blockId}="${b.text.slice(0, 40).replace(/"/g, "'")}"`)
          .join("; "),
    );
  }

  if (canonicalFields.length === 0) {
    contractWarnings.push("Không tự động sinh được canonicalField nào. Cần reviewer đọc toàn bộ DOCX.");
  }

  return {
    schemaVersion: "1.0",
    templateCode,
    templateTitle: extract.detectedTitle ?? "",
    docx: {
      sha256,
      fileName,
      relativePath,
      format,
    },
    status: "draft",
    docxSlots,
    canonicalFields,
    renderBindings,
    rejectedCandidates,
    unresolvedQuestions,
    warnings: contractWarnings,
    generatedAt: new Date().toISOString(),
  };
};

// ============== main ==============

const main = () => {
  if (!fs.existsSync(EXTRACT_DIR)) {
    console.error("Run extract first");
    process.exit(2);
  }
  // Sanity check taxonomy tồn tại.
  for (const t of [FIELD_TAXONOMY, SOURCE_TAXONOMY, TRANSFORM_TAXONOMY]) {
    if (!fs.existsSync(t)) {
      console.error("Missing taxonomy file:", t);
      process.exit(2);
    }
  }
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });

  const files = fs
    .readdirSync(EXTRACT_DIR)
    .filter((n) => n.endsWith(".extract.json"));
  let ok = 0;
  let failed = 0;
  for (const f of files) {
    try {
      const ext = JSON.parse(fs.readFileSync(path.join(EXTRACT_DIR, f), "utf8"));
      const draft = buildDraft(ext);
      const code = draft.templateCode ?? f.replace(/\.extract\.json$/u, "");
      const outName = `${code}.contract.draft.json`;
      fs.writeFileSync(
        path.join(CONTRACTS_DIR, outName),
        `${JSON.stringify(draft, null, 2)}\n`,
        "utf8",
      );
      ok += 1;
    } catch (err) {
      failed += 1;
      console.error("FAIL", f, err.message);
    }
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    total: files.length,
    draftedOk: ok,
    draftedFailed: failed,
  };
  fs.writeFileSync(
    path.join(CONTRACTS_DIR, "_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
};

main();
