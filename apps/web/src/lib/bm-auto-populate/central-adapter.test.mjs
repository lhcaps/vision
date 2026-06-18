// Tests for the central BM auto-populate helpers.
//
// We load the .ts files with the same trick used by
// `case-payload-normalizer.test.mjs`: transpile to CJS via the
// TypeScript compiler, write to a tmp file, then `require` it.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";

import ts from "typescript";

const require = createRequire(import.meta.url);

const modulesToLoad = [
  "./case-field-resolver.ts",
  "./source-priority.ts",
  "./bm-field-map.ts",
  "./apply-case-payload-to-form.ts",
  "../case-payload-normalizer.ts",
];

const testFileDir = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bm-auto-"));

for (const source of modulesToLoad) {
  const sourcePath = path.resolve(testFileDir, source);
  const raw = fs.readFileSync(sourcePath, "utf8");
  // Rewrite relative imports so they resolve to the matching compiled
  // file in tmpDir. All compiled files are written as `.cjs`; the
  // rewrite drops the original `.ts` extension from the basename and
  // appends `.cjs` so CJS require resolves them.
  const rewritten = raw.replace(
    /from\s+["'](\.\.?\/[^"']+)["']/gu,
    (_match, relPath) => {
      const referenced = path.resolve(path.dirname(sourcePath), relPath);
      const baseName = path.basename(referenced, path.extname(referenced));
      return `from "./${baseName}.cjs"`;
    },
  );
  const compiled = ts.transpileModule(rewritten, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  });
  const outBase = path.basename(source, path.extname(source)) + ".cjs";
  fs.writeFileSync(path.join(tmpDir, outBase), compiled.outputText);
}

const resolver = require(path.join(tmpDir, "case-field-resolver.cjs"));
const sourcePriority = require(path.join(tmpDir, "source-priority.cjs"));
const fieldMap = require(path.join(tmpDir, "bm-field-map.cjs"));
const applyAdapter = require(path.join(tmpDir, "apply-case-payload-to-form.cjs"));

function fullPayload() {
  return {
    case: {
      id: "c1",
      caseCode: "VKS-2026-0001",
      nationalCaseCode: null,
      caseTitle: "Vu an A",
      caseSummary: "Tom tat",
      caseType: null,
      sourceType: null,
      currentStage: null,
      currentStatus: null,
      priority: null,
      receivedDate: "01/06/2026",
      acceptedDate: null,
      prosecutedDate: null,
      closedDate: null,
      note: null,
      agency: {
        id: "a1",
        agencyCode: "VKSKV7",
        agencyName: "Vien kiem sat nhan dan khu vuc 7",
        agencyType: null,
        parentAgencyId: "a0",
        parentAgencyName: "Vien kiem sat nhan dan TP. HCM",
        address: "Dia chi VKS",
        phone: null,
      },
    },
    people: [
      {
        casePersonId: "cp1",
        id: "p1",
        fullName: "Nguyen Van A",
        roleType: "ACCUSED",
        legalStatus: null,
        isPrimary: true,
        personOrder: 1,
        birthYear: 1990,
        currentAddress: "Noi o hien tai",
        residenceAddress: "Noi thuong tru",
      },
    ],
    offenses: [
      {
        id: "o1",
        personId: "p1",
        offenseId: "of1",
        offenseName: "Trom cap tai san",
        offenseCode: "173",
        offenseGroup: null,
        legalArticle: "Dieu 173 BLHS",
        isPrimary: true,
      },
    ],
    assignments: [
      {
        id: "as1",
        roleType: "PROSECUTOR",
        legalStatus: null,
        isPrimary: true,
        personOrder: 1,
        assignedDate: null,
        endedDate: null,
        decisionNo: "01/QD",
        decisionDate: "04/06/2026",
        note: null,
        official: {
          id: "off1",
          fullName: "Tran Thi B",
          positionTitle: "Kiem sat vien",
          rankTitle: null,
          phone: null,
        },
      },
    ],
  };
}

test("resolveCaseField returns empty string for missing data", () => {
  assert.equal(resolver.resolveCaseField("agency.parentName", null), "");
  assert.equal(resolver.resolveCaseField("person.fullName", { case: null, people: [], offenses: [], assignments: [] }), "");
});

test("resolveCaseField picks primary person, offense, assignment", () => {
  const value = resolver.resolveCaseField("person.fullName", fullPayload());
  assert.equal(value, "Nguyen Van A");
  assert.equal(resolver.resolveCaseField("offense.legalArticle", fullPayload()), "Dieu 173 BLHS");
  assert.equal(resolver.resolveCaseField("assignment.official.fullName", fullPayload()), "Tran Thi B");
});

test("source-priority: incoming non-empty wins; empty incoming preserves existing", () => {
  const result = sourcePriority.applyPriorityStack([
    { value: "lower", source: "default" },
    { value: "", source: "case" },
    { value: "", source: "saved" },
  ]);
  assert.equal(result.value, "lower");
  assert.equal(result.source, "default");

  const caseWins = sourcePriority.applyPriorityStack([
    { value: "lower", source: "default" },
    { value: "from-case", source: "case" },
    { value: "", source: "saved" },
  ]);
  assert.equal(caseWins.value, "from-case");
  assert.equal(caseWins.source, "case");
});

test("bm-field-map: BM-039 has a registered mapping; unknown BM returns empty list", () => {
  const bm039 = fieldMap.getBmFieldMap("BM-039");
  assert.ok(bm039.length > 0);
  const accused = bm039.find((t) => t.section === "detentionArrest" && t.field === "accusedName");
  assert.equal(accused.from, "person.fullName");
  assert.deepEqual(fieldMap.getBmFieldMap("BM-999"), []);
});

test("applyCasePayloadToForm fills empty fields and respects priority", () => {
  const form = {
    agency: { parentName: "", name: "" },
    detentionArrest: { accusedName: "" },
    signature: { signerName: "" },
  };
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets: [
      { section: "agency", field: "parentName", from: "agency.parentName" },
      { section: "agency", field: "name", from: "agency.name" },
      { section: "detentionArrest", field: "accusedName", from: "person.fullName" },
      { section: "signature", field: "signerName", from: "assignment.official.fullName" },
    ],
  });
  assert.equal(result.form.agency.parentName, "Vien kiem sat nhan dan TP. HCM");
  assert.equal(result.form.agency.name, "Vien kiem sat nhan dan khu vuc 7");
  assert.equal(result.form.detentionArrest.accusedName, "Nguyen Van A");
  assert.equal(result.form.signature.signerName, "Tran Thi B");
  assert.deepEqual(result.appliedFields.sort(), [
    "agency.name",
    "agency.parentName",
    "detentionArrest.accusedName",
    "signature.signerName",
  ]);
});

test("applyCasePayloadToForm does not clobber populated values unless overwrite", () => {
  const form = {
    detentionArrest: { accusedName: "User typed this" },
  };
  const preserve = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets: [{ section: "detentionArrest", field: "accusedName", from: "person.fullName" }],
  });
  assert.equal(preserve.form.detentionArrest.accusedName, "User typed this");
  assert.deepEqual(preserve.appliedFields, []);

  const overwrite = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    overwrite: true,
    targets: [{ section: "detentionArrest", field: "accusedName", from: "person.fullName" }],
  });
  assert.equal(overwrite.form.detentionArrest.accusedName, "Nguyen Van A");
  assert.deepEqual(overwrite.appliedFields, ["detentionArrest.accusedName"]);
});

test("applyCasePayloadToForm applies `upper` transform", () => {
  const form = { agency: { nameUpper: "" } };
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets: [{ section: "agency", field: "nameUpper", from: "agency.name", transform: "upper" }],
  });
  assert.equal(result.form.agency.nameUpper, "VIEN KIEM SAT NHAN DAN KHU VUC 7");
});

test("applyCasePayloadToForm is a no-op when casePayload is null", () => {
  const form = { agency: { name: "" } };
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: null,
    targets: [{ section: "agency", field: "name", from: "agency.name" }],
  });
  assert.deepEqual(result.appliedFields, []);
  assert.equal(result.form.agency.name, "");
});

test("applyCasePayloadToForm clones the form (does not mutate input)", () => {
  const form = { agency: { name: "" } };
  applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets: [{ section: "agency", field: "name", from: "agency.name" }],
  });
  assert.equal(form.agency.name, ""); // input untouched
});

// ---------------------------------------------------------------------------
// 5 specific-candidate samples (BM-001, BM-002, BM-003, BM-005, BM-006).
// These confirm the central registry + adapter produce the expected
// form-shape output for the panel that will be wired next.
// ---------------------------------------------------------------------------

function emptyFormFor(entries) {
  const form = {};
  for (const target of entries) {
    if (!form[target.section]) form[target.section] = {};
    form[target.section][target.field] = "";
  }
  return form;
}

test("BM-001: registered mapping fills agency + informant + reception from payload", () => {
  const targets = fieldMap.getBmFieldMap("BM-001");
  const form = emptyFormFor(targets);
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets,
  });
  assert.equal(result.form.agency.parentName, "VIEN KIEM SAT NHAN DAN TP. HCM");
  assert.equal(result.form.agency.name, "VIEN KIEM SAT NHAN DAN KHU VUC 7");
  assert.equal(result.form.informant.fullName, "Nguyen Van A");
  assert.equal(result.form.informant.currentAddress, "Noi o hien tai");
  assert.equal(result.form.reception.locationName, "Dia chi VKS");
  // receivedDate is in DD/MM/YYYY display format already, so the
  // transform is a no-op (only ISO inputs are reformatted).
  assert.equal(result.form.document.issueDate, "01/06/2026");
});

test("BM-002: reporter block + received date pulled from case", () => {
  const targets = fieldMap.getBmFieldMap("BM-002");
  const form = emptyFormFor(targets);
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets,
  });
  assert.equal(result.form.reporter.fullName, "Nguyen Van A");
  assert.equal(result.form.reporter.permanentResidence, "Noi thuong tru");
  assert.equal(result.form.reporter.currentResidence, "Noi o hien tai");
  assert.equal(result.form.sourceReport.receivedDate, "01/06/2026");
});

test("BM-003: sourceAssignment + signature pull from case", () => {
  const targets = fieldMap.getBmFieldMap("BM-003");
  const form = emptyFormFor(targets);
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets,
  });
  assert.equal(result.form.agency.parentName, "VIEN KIEM SAT NHAN DAN TP. HCM");
  assert.equal(result.form.sourceAssignment.caseSummary, "Tom tat");
  assert.equal(result.form.sourceAssignment.prosecutorName, "Tran Thi B");
  assert.equal(result.form.signature.signerName, "Tran Thi B");
});

test("BM-005: sourceVerification.reasonLine + receiver + signature", () => {
  const targets = fieldMap.getBmFieldMap("BM-005");
  const form = emptyFormFor(targets);
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets,
  });
  assert.equal(result.form.sourceVerification.reasonLine, "Tom tat");
  assert.equal(result.form.receiver.fullName, "Tran Thi B");
  assert.equal(result.form.signature.signerName, "Tran Thi B");
});

test("BM-006: sourceRequest + signature", () => {
  const targets = fieldMap.getBmFieldMap("BM-006");
  const form = emptyFormFor(targets);
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: fullPayload(),
    targets,
  });
  assert.equal(result.form.sourceRequest.caseSummary, "Tom tat");
  assert.equal(result.form.sourceRequest.receiverName, "Tran Thi B");
  assert.equal(result.form.signature.signerName, "Tran Thi B");
});

// ---------------------------------------------------------------------------
// 17 bespoke snapshot. We only assert the structural shape (a non-empty
// list of targets with valid CaseFieldName values) and the agency-name
// transform — not every field, because per-BM specifics live in the
// panel and would be brittle to assert here.
// ---------------------------------------------------------------------------

const BESPOKE_CODES = [
  "BM-001",
  "BM-002",
  "BM-008",
  "BM-010",
  "BM-012",
  "BM-039",
  "BM-053",
  "BM-097",
  "BM-148",
  "BM-156",
  "BM-166",
  "BM-169",
  "BM-171",
  "BM-173",
];

const BESPOKE_FLAT_CODES = ["BM-070", "BM-071", "BM-090", "BM-172"];

const VALID_FROM = new Set([
  "agency.parentName",
  "agency.name",
  "agency.address",
  "case.code",
  "case.title",
  "case.summary",
  "case.receivedDate",
  "person.fullName",
  "person.birthYear",
  "person.residenceAddress",
  "person.currentAddress",
  "offense.name",
  "offense.legalArticle",
  "assignment.official.fullName",
  "assignment.official.positionTitle",
  "assignment.decisionNo",
  "assignment.decisionDate",
]);

test("17 bespoke BMs each have a registered mapping with valid fields", () => {
  for (const code of BESPOKE_CODES) {
    const targets = fieldMap.getBmFieldMap(code);
    assert.ok(targets.length > 0, `${code} should have at least one target`);
    for (const target of targets) {
      assert.ok(target && typeof target.section === "string" && target.section.length > 0, `${code}: section is non-empty`);
      assert.ok(target && typeof target.field === "string" && target.field.length > 0, `${code}: field is non-empty`);
      assert.ok(VALID_FROM.has(target.from), `${code}.${target.section}.${target.field}: unknown from=${target.from}`);
    }

    // Every bespoke BM has an agency-name target with `upper` transform.
    // BM-039 uses the legacy `*Upper` field name; all other bespoke
    // BMs use the canonical `name` field.
    const agencyName = targets.find(
      (t) => t.field === "name" || t.field === "nameUpper",
    );
    assert.ok(agencyName, `${code}: should map agency.name (or nameUpper)`);
    assert.equal(agencyName.transform, "upper", `${code}.${agencyName.field} must be transformed to upper`);
  }
});

test("4 flat-state BMs each have a registered flat mapping", () => {
  for (const code of BESPOKE_FLAT_CODES) {
    const targets = fieldMap.getBmFlatFieldMap(code);
    assert.ok(targets.length > 0, `${code} should have at least one flat target`);
    for (const target of targets) {
      assert.ok(typeof target.field === "string" && target.field.length > 0, `${code}: field is non-empty`);
      assert.ok(VALID_FROM.has(target.from), `${code}.${target.field}: unknown from=${target.from}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Flat adapter (BM-070, BM-071, BM-090, BM-172).
// ---------------------------------------------------------------------------

test("applyCasePayloadToFlatForm fills only empty fields and applies upper transform", () => {
  const result = applyAdapter.applyCasePayloadToFlatForm({
    form: {
      agencyParentName: "",
      agencyName: "",
      signerName: "User kept this",
      offenseName: "",
    },
    casePayload: fullPayload(),
    targets: [
      { field: "agencyParentName", from: "agency.parentName", transform: "upper" },
      { field: "agencyName", from: "agency.name", transform: "upper" },
      { field: "signerName", from: "assignment.official.fullName" },
      { field: "offenseName", from: "offense.name" },
    ],
  });
  assert.equal(result.form.agencyParentName, "VIEN KIEM SAT NHAN DAN TP. HCM");
  assert.equal(result.form.agencyName, "VIEN KIEM SAT NHAN DAN KHU VUC 7");
  assert.equal(result.form.signerName, "User kept this"); // preserve
  assert.equal(result.form.offenseName, "Trom cap tai san");
  assert.deepEqual(result.appliedFields.sort(), [
    "agencyName",
    "agencyParentName",
    "offenseName",
  ]);
});

// ---------------------------------------------------------------------------
// formatVnDate transform (regression for ISO -> DD/MM/YYYY).
// ---------------------------------------------------------------------------

test("formatVnDate transform re-ISO-formats a `yyyy-mm-dd` payload to DD/MM/YYYY", () => {
  const isoPayload = {
    ...fullPayload(),
    case: { ...fullPayload().case, receivedDate: "2026-06-04" },
  };
  const form = { document: { issueDate: "" } };
  const result = applyAdapter.applyCasePayloadToForm({
    form,
    casePayload: isoPayload,
    targets: [{ section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" }],
  });
  assert.equal(result.form.document.issueDate, "04/06/2026");
});
