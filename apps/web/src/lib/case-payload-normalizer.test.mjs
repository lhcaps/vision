import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

import ts from "typescript";

const require = createRequire(import.meta.url);

function loadNormalizer() {
  const sourcePath = new URL("./case-payload-normalizer.ts", import.meta.url);
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "case-payload-"));
  const compiledPath = path.join(tmpDir, "case-payload-normalizer.cjs");
  fs.writeFileSync(compiledPath, compiled.outputText);

  return require(compiledPath);
}

const { buildCasePayloadFromRenderPayload } = loadNormalizer();

test("buildCasePayloadFromRenderPayload returns empty arrays without a payload", () => {
  assert.deepEqual(buildCasePayloadFromRenderPayload(null), {
    case: null,
    people: [],
    offenses: [],
    assignments: [],
  });
});

test("buildCasePayloadFromRenderPayload preserves the full case context", () => {
  const result = buildCasePayloadFromRenderPayload({
    case: {
      id: "42",
      caseCode: "VKS-2026-0001",
      nationalCaseCode: "HSQG-001",
      caseTitle: "Vu an danh bac",
      caseSummary: "Tom tat vu an",
      caseType: "CRIMINAL",
      sourceType: "CRIME_REPORT",
      currentStage: "INVESTIGATION",
      currentStatus: "OPEN",
      priority: "HIGH",
      receivedDate: "01/06/2026",
      acceptedDate: "02/06/2026",
      prosecutedDate: "03/06/2026",
      closedDate: null,
      note: "Ghi chu",
      agency: {
        id: "7",
        agencyCode: "VKSKV7",
        agencyName: "Vien kiem sat nhan dan khu vuc 7",
        agencyType: "PROCURACY",
        parentAgencyId: "1",
        parentAgencyName: "Vien kiem sat nhan dan TP. Ho Chi Minh",
        address: "TP. Ho Chi Minh",
        phone: "0280000000",
      },
    },
    people: [
      {
        casePersonId: "501",
        personId: "601",
        roleType: "ACCUSED",
        legalStatus: "BI_CAN",
        isPrimary: true,
        personOrder: 2,
        fullName: "Nguyen Van A",
        birthYear: 1990,
        currentAddress: "Dia chi hien tai",
        residenceAddress: "Noi cu tru",
      },
    ],
    offenses: [
      {
        id: "701",
        personId: "601",
        offenseId: "801",
        offenseName: "Danh bac",
        offenseCode: "321",
        offenseGroup: "XAM_PHAM_TRAT_TU_CONG_CONG",
        legalArticle: "khoan 1 Dieu 321",
        isPrimary: true,
      },
    ],
    assignments: [
      {
        id: "901",
        roleType: "PROSECUTOR",
        legalStatus: "ACTIVE",
        isPrimary: true,
        personOrder: 1,
        assignedDate: "04/06/2026",
        endedDate: null,
        decisionNo: "01/QD-VKS",
        decisionDate: "04/06/2026",
        note: "Phan cong chinh",
        official: {
          id: "1001",
          fullName: "Tran Thanh Nam",
          positionTitle: "Pho Vien truong",
          rankTitle: "Kiem sat vien cao cap",
          phone: "0900000000",
        },
      },
    ],
  });

  assert.equal(result.case.id, "42");
  assert.equal(result.case.receivedDate, "01/06/2026");
  assert.equal(result.case.agency.agencyName, "Vien kiem sat nhan dan khu vuc 7");
  assert.equal(result.people[0].casePersonId, "501");
  assert.equal(result.people[0].id, "601");
  assert.equal(result.offenses[0].legalArticle, "khoan 1 Dieu 321");
  assert.equal(result.assignments[0].official.fullName, "Tran Thanh Nam");
});
