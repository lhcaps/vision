#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 3 — Draft contracts.
// Đọc các file extract.json sinh contract.draft.json cho từng BM.
// Mỗi blank candidate + paragraph context → docxSlot (reviewRequired=true).
// Không tự ý lock; mọi unknown source phải được report.

import fs from "node:fs";
import path from "node:path";
import { suggestDateSemantic } from "./lib/date-semantic.mjs";
import { detectBlanksInBlock } from "./lib/blank-detector.mjs";

const ROOT = process.cwd();
const EXTRACT_DIR = path.join(ROOT, "docs", "audit", "docx", "extracted");
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const FIELD_TAXONOMY = path.join(ROOT, "docs", "contracts", "field-taxonomy.json");
const SOURCE_TAXONOMY = path.join(ROOT, "docs", "contracts", "source-taxonomy.json");
const TRANSFORM_TAXONOMY = path.join(ROOT, "docs", "contracts", "transform-taxonomy.json");

// ============== helpers ==============

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// Blank pattern (shared, used for date line detection).
const BLANK_PATTERN = String.raw`(?:\.{3,}|…+|…+|_{3,})`;

const inferDateParts = (text) => {
  if (
    new RegExp(
      `ngày\\s*${BLANK_PATTERN}\\s*tháng\\s*${BLANK_PATTERN}\\s*năm\\s*${BLANK_PATTERN}`,
      "iu",
    ).test(text)
  ) {
    return ["day", "month", "year"];
  }
  if (
    new RegExp(
      `ngày\\s*${BLANK_PATTERN}\\s*tháng\\s*${BLANK_PATTERN}`,
      "iu",
    ).test(text)
  ) {
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

const suggestNamespace = (text) => {
  const t = text.toLowerCase();
  if (/viện kiểm sát|cơ quan|cấp trên|cơ quan cấp/.test(t))
    return "agency";
  if (/ngày|số:|mẫu số|văn bản/.test(t)) return "document";
  if (/vụ án|tội phạm|nguồn tin/.test(t)) return "case";
  if (
    /họ tên|ngày sinh|nghề nghiệp|cmnd|cccd|quốc tịch|nơi ở|địa chỉ/.test(
      t,
    )
  )
    return "informant";
  if (/người tiếp nhận|chức danh|đơn vị công tác/.test(t))
    return "receiver";
  if (/ksv|kiểm sát viên/.test(t)) return "prosecutor";
  if (/điều\s*\d|quyết định|nội dung|tóm tắt/.test(t))
    return "decision";
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

const STAGE_CODES = {
  "01": "TIẾP NHẬN, GIẢI QUYẾT NGUỒN TIN VỀ TỘI PHẠM",
  "02": "BIỆN PHÁP NGĂN CHẶN VÀ CƯỠNG CHẾ",
  "03": "NGƯỜI THAM GIA TỐ TỤNG",
  "04": "KHỞI TỐ, ĐIỀU TRA",
  "05": "TRUY TỐ",
  "06": "XỬ LÝ VẬT CHỨNG",
  "07": "BIỆN PHÁP ĐIỀU TRA ĐẶC BIỆT",
  "08": "THỦ TỤC ĐẶC BIỆT",
  "09": "NGƯỜI CHƯA THÀNH NIÊN",
};

const inferStageFromPath = (relativePath) => {
  const match = relativePath.match(/(\d{2})\.\s*[\w\s]*?(?=\/|$)/u);
  if (match) {
    const code = match[1];
    if (STAGE_CODES[code]) {
      return { code, label: STAGE_CODES[code] };
    }
  }
  return null;
};

// ============== draft ==============

const buildDraft = (extract) => {
  const {
    sourceId,
    templateCode,
    fileName,
    relativePath,
    sha256,
    format,
    textBlocks,
    placeholders,
    blankCandidates,
    warnings,
    error,
    documentKind,
    duplicateIndex,
    duplicateCount,
    isDuplicateCode,
    docxOriginal,
    extractionSource,
    extractionKind,
  } = extract;

  const docxSlots = [];
  const canonicalFields = [];
  const renderBindings = [];
  const rejectedCandidates = [];
  const unresolvedQuestions = [];
  const contractWarnings = [...(warnings ?? [])];

  if (error) {
    contractWarnings.push(`Extract error: ${error}`);
  }

  // Index textBlocks by blockId for fast lookup.
  const blockById = new Map(textBlocks.map((b) => [b.blockId, b]));

  // Nearby blocks for date semantic context (1 before + 1 after each block).
  const nearbyBlocksMap = new Map(
    textBlocks.map((b, i) => [
      b.blockId,
      [textBlocks[i - 1]?.text ?? "", textBlocks[i + 1]?.text ?? ""],
    ]),
  );

  // 1) Dùng blank candidates để sinh docxSlot.
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

  // ReviewRequired invariant: ALL draft heuristic fields use source="unknown" and reviewRequired=true.
  const addCanonicalField = (fpath, type, label, uiComponent, section, required) => {
    if (canonicalFields.some((f) => f.path === fpath)) return null;
    canonicalFields.push({
      path: fpath,
      type,
      label,
      source: "unknown",
      required,
      uiComponent,
      section,
      reviewRequired: true,
    });
    return null;
  };

  // 1.1) Date parts (ngày … tháng … năm …) — use suggestDateSemantic.
  let dateFieldIndex = 0;
  for (const blk of textBlocks) {
    const parts = inferDateParts(blk.text);
    if (parts) {
      const nearby = nearbyBlocksMap.get(blk.blockId) ?? [];
      const semantic = suggestDateSemantic(blk.text, nearby);
      const basePath = semantic.suggestedCanonicalPath;

      addCanonicalField(
        basePath,
        "date",
        `Ngày tháng năm (${semantic.suggestedReason})`,
        "date",
        "Thời gian",
        true,
      );
      for (const part of parts) {
        const slotId = makeSlotId(
          basePath.split(".")[0],
          `${part[0].toUpperCase()}${part.slice(1)}`,
        );
        docxSlots.push({
          slotId,
          location: {
            partName: "WordDocument",
            blockId: blk.blockId,
            tableCellId: null,
          },
          context: blk.text.slice(0, 200),
          label: `${part.toUpperCase()} (từ ${blk.blockId})`,
          slotType: "datePart",
          required: true,
          confidence: 0.6,
          suggestedCanonicalPath: basePath,
          suggestedBy: "heuristic",
          suggestedReason: semantic.suggestedReason,
          evidence: {
            textBefore: nearby[0] || "",
            textAfter: nearby[1] || "",
            rawPattern: "ngày … tháng … năm …",
          },
          reviewRequired: true,
        });
        renderBindings.push({
          slotId,
          from: basePath,
          transform: DATE_TRANSFORMS[part],
          fallback: "",
          reviewRequired: true,
        });
        dateFieldIndex += 1;
      }
    }
  }
  void dateFieldIndex;

  // 1.2) Blank candidates — use blank.blockId directly, NOT text.includes search.
  for (const blank of blankCandidates) {
    if (blank.kind === "vn-date-line") {
      const slotId = makeSlotId("document", "issuePlaceDateLine");
      if (!docxSlots.some((s) => s.slotId === slotId)) {
        docxSlots.push({
          slotId,
          location: {
            partName: "WordDocument",
            blockId: blank.blockId ?? null,
            tableCellId: blank.tableCellId,
          },
          context: blank.context,
          label: "Dòng địa danh, ngày tháng năm",
          slotType: "date",
          required: true,
          confidence: 0.85,
          suggestedNamespace: "document",
          suggestedBy: "heuristic",
          evidence: { textBefore: "", textAfter: "", rawPattern: blank.raw },
          reviewRequired: true,
        });
        // ReviewRequired invariant: source must be "unknown" in draft phase.
        addCanonicalField(
          "document.issueDate",
          "date",
          "Ngày ban hành",
          "date",
          "Văn bản",
          true,
        );
        addCanonicalField(
          "document.issuePlace",
          "string",
          "Địa danh ban hành",
          "text",
          "Văn bản",
          true,
        );
        renderBindings.push({
          slotId,
          from: "{issuePlace:document.issuePlace, issueDate:document.issueDate}",
          transform: "date.issuePlaceDateLine",
          fallback: "",
          reviewRequired: true,
        });
      }
    } else if (
      blank.kind === "ellipsis-dots" ||
      blank.kind === "ellipsis-unicode" ||
      blank.kind === "underscore"
    ) {
      // Use blank.blockId/tableCellId directly from the candidate.
      const ns = blank.blockId
        ? blockById.get(blank.blockId)?.text
          ? suggestNamespace(blockById.get(blank.blockId).text)
          : "document"
        : "document";
      const slotCount = docxSlots.length + 1;
      const slotId = makeSlotId(ns, `field${slotCount}`);
      docxSlots.push({
        slotId,
        location: {
          partName: "WordDocument",
          blockId: blank.blockId ?? null,
          tableCellId: blank.tableCellId,
        },
        context: blank.context,
        label: `Ô trống dạng "..." (${ns})`,
        slotType: "text",
        required: false,
        confidence: 0.4,
        suggestedNamespace: ns,
        suggestedBy: "heuristic",
        evidence: { textBefore: "", textAfter: "", rawPattern: blank.raw },
        reviewRequired: true,
      });
      const canonicalPath = `${ns}.field${slotCount}`;
      addCanonicalField(
        canonicalPath,
        "string",
        `Trường cần điền (${ns})`,
        "text",
        ns,
        false,
      );
      renderBindings.push({
        slotId,
        from: canonicalPath,
        transform: "identity",
        fallback: "",
        reviewRequired: true,
      });
    } else if (blank.kind === "numbered-blank") {
      const slotId = makeSlotId(
        "document",
        `numberedBlank${docxSlots.length + 1}`,
      );
      docxSlots.push({
        slotId,
        location: {
          partName: "WordDocument",
          blockId: blank.blockId ?? null,
          tableCellId: blank.tableCellId,
        },
        context: blank.context,
        label: "Vị trí đánh số (1), (2), …",
        slotType: "text",
        required: false,
        confidence: 0.5,
        suggestedNamespace: "document",
        suggestedBy: "heuristic",
        evidence: { textBefore: "", textAfter: "", rawPattern: blank.raw },
        reviewRequired: true,
      });
      const canonicalPath = `document.numberedSlot${docxSlots.length}`;
      addCanonicalField(
        canonicalPath,
        "string",
        "Trường đánh số",
        "text",
        "Nội dung",
        false,
      );
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
      slotType:
        field.includes("Date") ||
        field.includes("Day") ||
        field.includes("Month") ||
        field.includes("Year")
          ? "datePart"
          : "text",
      required: true,
      confidence: 0.9,
      evidence: { textBefore: "", textAfter: "", rawPattern: ph.raw },
      reviewRequired: true,
    });
    const canonicalPath = value;
    addCanonicalField(canonicalPath, "string", field, "text", ns, true);
    renderBindings.push({
      slotId,
      from: canonicalPath,
      transform: "identity",
      fallback: "",
      reviewRequired: true,
    });
  }

  // 2) Báo cáo các paragraph không matched (giúp reviewer thấy rõ chỗ cần xem).
  const matchedBlockIds = new Set(
    docxSlots.map((s) => s.location?.blockId).filter(Boolean),
  );
  const unmatched = textBlocks.filter((b) => !matchedBlockIds.has(b.blockId));
  if (unmatched.length > 0 && unmatched.length < 20) {
    unresolvedQuestions.push(
      `${unmatched.length} paragraph có nội dung đặc thù cần reviewer xem xét: ` +
        unmatched
          .slice(0, 5)
          .map(
            (b) =>
              `${b.blockId}="${b.text.slice(0, 40).replace(/"/g, "'")}"`,
          )
          .join("; "),
    );
  }

  if (canonicalFields.length === 0) {
    contractWarnings.push(
      "Không tự động sinh được canonicalField nào. Cần reviewer đọc toàn bộ DOCX.",
    );
  }

  // Infer stage from folder path.
  const stage = inferStageFromPath(relativePath);
  const formNumber = templateCode ? templateCode.replace("BM-", "") + "/HS" : null;
  const docSuffixMatch = relativePath.match(/(QĐ|LBTG|LV|LĐ|TB|BC|KN|GC|BB)-\w*/i);
  const documentNumberSuffix = docSuffixMatch ? docSuffixMatch[0] : null;

  return {
    schemaVersion: "1.0",
    sourceId,
    templateCode,
    documentKind: documentKind ?? (templateCode ? "form" : "reference"),
    duplicateIndex: duplicateIndex ?? 1,
    duplicateCount: duplicateCount ?? 1,
    isDuplicateCode: isDuplicateCode ?? false,
    templateTitle: extract.detectedTitle ?? "",
    docx: {
      sha256,
      fileName,
      relativePath,
      format,
    },
    // Extraction source lineage
    extractionSource: extractionSource ?? null,
    status: "draft",
    docxSlots,
    canonicalFields,
    renderBindings,
    rejectedCandidates,
    unresolvedQuestions,
    warnings: contractWarnings,
    // Product metadata hints (draft — all reviewRequired: true)
    productMetadata: {
      stage: stage
        ? {
            code: stage.code,
            label: stage.label,
            suggestedBy: "path-heuristic",
            reviewRequired: true,
          }
        : { code: null, label: null, suggestedBy: null, reviewRequired: true },
      formNumber: formNumber ?? null,
      legalBasisLine:
        "Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026",
      documentNumberSuffix: documentNumberSuffix ?? null,
      reviewRequired: true,
    },
    renderFormatHints: {
      fontFamily: "Times New Roman",
      baseFontSize: 13,
      requiresDifferentFirstPage: true,
      requiresPageNumberIfMoreThanPages: 2,
      headerRules: [],
      footerRules: [],
      titleRules: [],
      reviewRequired: true,
    },
    formInputHints: {
      primaryEntities: [],
      suggestedControls: [],
      previewRequired: true,
      reviewRequired: true,
    },
    reportingHints: {
      dimensions: ["time", "ward", "offense"],
      reviewRequired: true,
    },
    generatedAt: new Date().toISOString(),
  };
};

// ============== main ==============

const main = () => {
  if (!fs.existsSync(EXTRACT_DIR)) {
    console.error("Run extract first");
    process.exit(2);
  }
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
  let skippedReference = 0;
  const skippedReferenceFiles = [];
  for (const f of files) {
    try {
      const ext = JSON.parse(fs.readFileSync(path.join(EXTRACT_DIR, f), "utf8"));
      if (ext.documentKind === "reference" || !ext.templateCode) {
        skippedReference += 1;
        skippedReferenceFiles.push({
          sourceId: ext.sourceId,
          file: ext.relativePath,
        });
        continue;
      }
      const draft = buildDraft(ext);
      const outName = `${ext.sourceId}.contract.draft.json`;
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
    skippedReference,
    skippedReferenceFiles,
  };
  fs.writeFileSync(
    path.join(CONTRACTS_DIR, "_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
};

main();
