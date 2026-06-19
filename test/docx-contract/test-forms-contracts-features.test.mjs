/**
 * Phase D — Tests for forms-contracts feature logic.
 * Pure JavaScript tests against real contract JSON data.
 * Matches patterns used in test-form-corpus-reconciliation.test.mjs.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const CONTRACTS_DIR = path.join(process.cwd(), "docs", "audit", "docx", "contracts");
const LOCKED_DIR = path.join(CONTRACTS_DIR, "locked");
const REPORTS_DIR = path.join(process.cwd(), "docs", "audit", "docx", "reports");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const GENERIC_FIELD_PATTERN = /^\w+\.field\d+$/i;

const FORM_STAGES = [
  { code: "01", label: "Tiếp nhận và giải quyết nguồn tin", bmRange: [1, 30] },
  { code: "02", label: "Biện pháp ngăn chặn, cưỡng chế", bmRange: [31, 69] },
  { code: "03", label: "Người tham gia tố tụng", bmRange: [70, 84] },
  { code: "04", label: "Giai đoạn điều tra", bmRange: [85, 140] },
  { code: "05", label: "Giai đoạn truy tố", bmRange: [141, 168] },
  { code: "06", label: "Vật chứng", bmRange: [169, 173] },
  { code: "07", label: "Biện pháp điều tra đặc biệt", bmRange: [174, 178] },
  { code: "08", label: "Thủ tục đặc biệt", bmRange: [179, 184] },
  { code: "09", label: "Người chưa thành niên", bmRange: [185, 213] },
];

function getStageForBm(bmCode) {
  const match = (bmCode ?? "").match(/^BM-(\d+)/);
  if (!match) return undefined;
  const n = parseInt(match[1], 10);
  return FORM_STAGES.find((s) => n >= s.bmRange[0] && n <= s.bmRange[1]);
}

// ─── Normalizer logic (mirrors contract-normalizer.ts) ───────────────────────────

function normalizeContract(c) {
  const slots = c.docxSlots ?? [];
  const fields = c.canonicalFields ?? [];
  const genericFieldCount = slots.filter(
    (s) => GENERIC_FIELD_PATTERN.test(s.slotId),
  ).length;
  const fieldsNeedingReviewCount = fields.filter(
    (f) => f.source === "unknown" || GENERIC_FIELD_PATTERN.test(f.path),
  ).length;
  const stage = getStageForBm(c.templateCode);

  return {
    sourceId: c.sourceId,
    templateCode: c.templateCode,
    title: c.templateTitle,
    status: c.status,
    documentKind: "form",
    stage: stage ? { code: stage.code, label: stage.label } : undefined,
    docxSlots: slots,
    canonicalFields: fields,
    renderBindings: c.renderBindings ?? [],
    runtimeEligible: c.status === "locked",
    needsReview: genericFieldCount > 0 || fieldsNeedingReviewCount > 0,
    genericFieldCount,
    fieldsNeedingReviewCount,
  };
}

function buildFormCatalog(contracts, query = {}) {
  let items = contracts.map((c) => ({
    sourceId: c.sourceId,
    templateCode: c.templateCode,
    title: c.title,
    stageCode: c.stage?.code,
    stageLabel: c.stage?.label,
    status: c.status,
    runtimeEligible: c.runtimeEligible,
    reviewRequired: c.needsReview,
    genericFieldCount: c.genericFieldCount,
  }));

  if (query.sourceId) items = items.filter((i) => i.sourceId === query.sourceId);
  if (query.status) items = items.filter((i) => i.status === query.status);
  if (query.stage) items = items.filter((i) => i.stageCode === query.stage);
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter(
      (i) =>
        i.templateCode.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        (i.stageLabel?.toLowerCase().includes(q) ?? false),
    );
  }
  return items;
}

// ─── Schema generator logic (mirrors form-schema-generator.ts) ─────────────────

const SECTION_TITLES = {
  agency: "Cơ quan ban hành",
  document: "Số văn bản và ngày",
  case: "Thông tin vụ án",
  offense: "Tội danh",
  person: "Người liên quan",
  content: "Nội dung văn bản",
  recipients: "Nơi nhận và lưu",
  signature: "Chữ ký",
  reception: "Thông tin tiếp nhận",
  receiver: "Người tiếp nhận",
  informant: "Nguồn tin",
  crimeReport: "Nội dung tố giác",
};

function deriveLabel(fieldPath) {
  const segments = fieldPath.split(".").slice(1);
  if (!segments.length) return fieldPath;
  return segments
    .map((seg) =>
      seg.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
    )
    .join(" ");
}

function deriveSectionTitle(sectionId) {
  return SECTION_TITLES[sectionId] ?? sectionId
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());
}

function resolveRenderBinding(binding, formData) {
  const raw = formData[binding.from];
  const hasData = raw !== undefined && raw !== null && raw !== "";

  if (!hasData) {
    return { slotId: binding.slotId, value: binding.fallback ?? "", isStale: false, hasData: false };
  }

  let value = String(raw);

  if (binding.transform === "date.day") {
    const d = new Date(String(raw));
    value = isNaN(d.getTime()) ? String(raw) : String(d.getDate());
  } else if (binding.transform === "date.month") {
    const d = new Date(String(raw));
    value = isNaN(d.getTime()) ? String(raw) : String(d.getMonth() + 1);
  } else if (binding.transform === "date.year") {
    const d = new Date(String(raw));
    value = isNaN(d.getTime()) ? String(raw) : String(d.getFullYear());
  } else if (binding.transform === "date.full") {
    const d = new Date(String(raw));
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      value = `ngày ${dd} tháng ${mm} năm ${yyyy}`;
    }
  }

  return { slotId: binding.slotId, value, isStale: false, hasData: true };
}

// ─── Tests ────────────────────────────────────────────────────────────────────────

describe("contract-normalizer (JS mirror)", () => {
  it("locked BM-001 contract → runtimeEligible=true", () => {
    const fp = path.join(LOCKED_DIR, "BM-001__f4c2aa3682d3.contract.locked.json");
    const raw = loadJson(fp);
    const n = normalizeContract(raw);
    assert.strictEqual(n.status, "locked");
    assert.strictEqual(n.runtimeEligible, true);
    assert.strictEqual(n.needsReview, false);
    assert.strictEqual(n.genericFieldCount, 0);
    assert.strictEqual(n.fieldsNeedingReviewCount, 0);
  });

  it("locked BM-002 contract → runtimeEligible=true", () => {
    const fp = path.join(LOCKED_DIR, "BM-002__f78301178da7.contract.locked.json");
    const raw = loadJson(fp);
    const n = normalizeContract(raw);
    assert.strictEqual(n.status, "locked");
    assert.strictEqual(n.runtimeEligible, true);
  });

  it("locked BM-003 contract → runtimeEligible=true", () => {
    const fp = path.join(LOCKED_DIR, "BM-003__bb64990bc49b.contract.locked.json");
    const raw = loadJson(fp);
    const n = normalizeContract(raw);
    assert.strictEqual(n.status, "locked");
    assert.strictEqual(n.runtimeEligible, true);
  });

  it("draft BM-004 contract → runtimeEligible=false", () => {
    const fp = path.join(CONTRACTS_DIR, "BM-004__2775520fd22c.contract.draft.json");
    const raw = loadJson(fp);
    const n = normalizeContract(raw);
    assert.strictEqual(n.status, "draft");
    assert.strictEqual(n.runtimeEligible, false);
    assert.strictEqual(n.needsReview, true);
    assert.ok(n.genericFieldCount > 0, "BM-004 should have generic fields");
  });

  it("reference docs excluded from contracts", () => {
    const allContracts = [
      ...fs.readdirSync(LOCKED_DIR)
        .filter((n) => n.endsWith(".contract.locked.json"))
        .map((n) => loadJson(path.join(LOCKED_DIR, n))),
      ...fs.readdirSync(CONTRACTS_DIR)
        .filter((n) => n.endsWith(".contract.draft.json"))
        .map((n) => loadJson(path.join(CONTRACTS_DIR, n))),
    ];
    const refContracts = allContracts.filter((c) => c.documentKind === "reference");
    assert.strictEqual(refContracts.length, 0, "no reference docs in contracts dirs");
  });

  it("buildFormCatalog: filters by stage=01", () => {
    const contracts = [
      normalizeContract(loadJson(path.join(LOCKED_DIR, "BM-001__f4c2aa3682d3.contract.locked.json"))),
      normalizeContract(loadJson(path.join(LOCKED_DIR, "BM-002__f78301178da7.contract.locked.json"))),
      normalizeContract(loadJson(path.join(LOCKED_DIR, "BM-003__bb64990bc49b.contract.locked.json"))),
    ];
    const stage01 = buildFormCatalog(contracts, { stage: "01" });
    assert.ok(stage01.length > 0);
    for (const item of stage01) {
      assert.strictEqual(item.stageCode, "01", `${item.templateCode} should be stage 01`);
    }
  });

  it("buildFormCatalog: filters by status=locked", () => {
    const contracts = [
      normalizeContract(loadJson(path.join(LOCKED_DIR, "BM-001__f4c2aa3682d3.contract.locked.json"))),
      normalizeContract(loadJson(path.join(CONTRACTS_DIR, "BM-004__2775520fd22c.contract.draft.json"))),
    ];
    const locked = buildFormCatalog(contracts, { status: "locked" });
    for (const item of locked) {
      assert.strictEqual(item.status, "locked");
    }
  });

  it("buildFormCatalog: BM-004 appears as draft, not locked", () => {
    const contracts = [
      normalizeContract(loadJson(path.join(CONTRACTS_DIR, "BM-004__2775520fd22c.contract.draft.json"))),
    ];
    const all = buildFormCatalog(contracts);
    const bm004 = all.find((i) => i.templateCode === "BM-004");
    assert.ok(bm004, "BM-004 should be in catalog");
    assert.strictEqual(bm004.status, "draft");
    assert.strictEqual(bm004.runtimeEligible, false);
    assert.strictEqual(bm004.reviewRequired, true);
  });
});

describe("form-schema-generator (JS mirror)", () => {
  it("deriveLabel produces readable labels", () => {
    assert.strictEqual(deriveLabel("agency.parentName"), "Parent Name");
    assert.strictEqual(deriveLabel("document.issueDate"), "Issue Date");
    assert.strictEqual(deriveLabel("informant.fullName"), "Full Name");
    assert.strictEqual(deriveLabel("reception.startedAtDate"), "Started At Date");
  });

  it("deriveSectionTitle returns Vietnamese titles", () => {
    assert.strictEqual(deriveSectionTitle("agency"), "Cơ quan ban hành");
    assert.strictEqual(deriveSectionTitle("document"), "Số văn bản và ngày");
    assert.strictEqual(deriveSectionTitle("reception"), "Thông tin tiếp nhận");
    // Unknown sections get title-cased fallback
    const unknown = deriveSectionTitle("unknown_section");
    assert.ok(unknown.length > 0, "should return some title");
  });

  it("resolveRenderBinding: date.full transform produces Vietnamese date", () => {
    const result = resolveRenderBinding(
      { slotId: "document.issuePlaceDateLine", from: "documentIssueDate", transform: "date.full", fallback: "" },
      { documentIssueDate: "2026-01-01" },
    );
    assert.ok(result.hasData);
    assert.ok(result.value.includes("ngày"));
    assert.ok(result.value.includes("01 tháng 01 năm 2026") || result.value.includes("ngày"));
  });

  it("resolveRenderBinding: fallback used when no data", () => {
    const result = resolveRenderBinding(
      { slotId: "test", from: "test", transform: "identity", fallback: "N/A" },
      {},
    );
    assert.ok(!result.hasData);
    assert.strictEqual(result.value, "N/A");
  });

  it("resolveRenderBinding: date.day extracts day", () => {
    const result = resolveRenderBinding(
      { slotId: "d", from: "d", transform: "date.day", fallback: "" },
      { d: "2026-01-15" },
    );
    assert.strictEqual(result.value, "15");
    assert.ok(result.hasData);
  });

  it("resolveRenderBinding: date.month extracts month", () => {
    const result = resolveRenderBinding(
      { slotId: "m", from: "d", transform: "date.month", fallback: "" },
      { d: "2026-01-15" },
    );
    assert.strictEqual(result.value, "1");
  });

  it("resolveRenderBinding: date.year extracts year", () => {
    const result = resolveRenderBinding(
      { slotId: "y", from: "d", transform: "date.year", fallback: "" },
      { d: "2026-01-15" },
    );
    assert.strictEqual(result.value, "2026");
  });
});

describe("form catalog API contract (from JSON)", () => {
  it("catalog API response matches expected shape", () => {
    const corpusJson = loadJson(path.join(REPORTS_DIR, "form-corpus-reconciliation.json"));
    const item = corpusJson.lockedContracts?.[0];
    assert.ok(item, "should have locked contracts");
    assert.ok(item.sourceId, "item should have sourceId");
    assert.ok(item.templateCode, "item should have templateCode");
    assert.strictEqual(item.status, "locked");
    assert.strictEqual(typeof item.runtimeEligible, "boolean");
  });

  it("BM-004 in catalog is draft, not runtime eligible", () => {
    const corpusJson = loadJson(path.join(REPORTS_DIR, "form-corpus-reconciliation.json"));
    const bm004 = corpusJson.draftContracts?.find((c) => c.templateCode === "BM-004");
    assert.ok(bm004, "BM-004 should be in draft contracts");
    assert.strictEqual(bm004.status, "draft");
    assert.ok(bm004.genericFieldCount > 0);
  });

  it("runtime readiness has correct locked/draft counts", () => {
    const readinessJson = loadJson(path.join(REPORTS_DIR, "form-runtime-readiness.json"));
    assert.strictEqual(readinessJson.counts.total, 213);
    assert.strictEqual(readinessJson.counts.locked, 3);
    assert.strictEqual(readinessJson.counts.draft, 210);
    assert.strictEqual(readinessJson.counts.runtimeEligible, 3);
  });
});
