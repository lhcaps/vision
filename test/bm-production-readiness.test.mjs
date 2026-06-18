import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateBmProductionReadiness,
  formatReadinessReport,
} from "../scripts/lib/bm-production-readiness.mjs";

function readyFixture() {
  return {
    autoPopulate: {
      summary: {
        formCount: 213,
        hasRenderPayloadCount: 213,
        hasUseCasePayloadCount: 213,
        hasTakeFromCaseOrContextCount: 213,
        hardcodedPersonRiskCount: 0,
        noPayloadSource: [],
      },
    },
    docxSync: {
      summary: {
        requirementDocx: { path: "docs/requirement.docx" },
        corpusCodes: 213,
        corpusFindings: 0,
        formComponentFiles: 213,
        genericTemplatePanelWrappers: 0,
        normalizedDocx: 213,
        normalizedDocxWithExplicitMargin: 213,
        renderSummaryJsonOkCount: 213,
        renderSummaryMdOkCount: 213,
        noCasePayloadContext: [],
        genericPanelCodes: [],
        hardcodedPersonRiskCodes: [],
      },
    },
  };
}

describe("evaluateBmProductionReadiness", () => {
  it("marks a full 213-form case/context/docx/render state as ready", () => {
    const result = evaluateBmProductionReadiness(readyFixture());

    assert.equal(result.ready, true);
    assert.deepEqual(result.blockers, []);
    assert.equal(result.metrics.totalForms, 213);
  });

  it("reports concrete blockers for the current incomplete production shape", () => {
    const fixture = readyFixture();
    fixture.autoPopulate.summary.hasUseCasePayloadCount = 0;
    fixture.autoPopulate.summary.hasTakeFromCaseOrContextCount = 0;
    fixture.autoPopulate.summary.hardcodedPersonRiskCount = 125;
    fixture.docxSync.summary.formComponentFiles = 130;
    fixture.docxSync.summary.genericTemplatePanelWrappers = 83;
    fixture.docxSync.summary.renderSummaryJsonOkCount = 113;
    fixture.docxSync.summary.noCasePayloadContext = ["BM-001", "BM-002"];
    fixture.docxSync.summary.genericPanelCodes = ["BM-004"];
    fixture.docxSync.summary.hardcodedPersonRiskCodes = ["BM-001"];

    const result = evaluateBmProductionReadiness(fixture);

    assert.equal(result.ready, false);
    assert.deepEqual(
      result.blockers.map((blocker) => blocker.id),
      [
        "case-context-not-consumed",
        "take-from-case-missing",
        "generic-wrapper-panels",
        "hardcoded-sample-risk",
        "render-json-incomplete",
      ],
    );
  });
});

describe("formatReadinessReport", () => {
  it("prints a compact report with blocker ids and evidence", () => {
    const fixture = readyFixture();
    fixture.autoPopulate.summary.hasUseCasePayloadCount = 0;
    fixture.docxSync.summary.noCasePayloadContext = ["BM-001"];

    const report = formatReadinessReport(evaluateBmProductionReadiness(fixture));

    assert.match(report, /BM Production Readiness: NOT READY/u);
    assert.match(report, /case-context-not-consumed/u);
    assert.match(report, /BM-001/u);
  });
});
