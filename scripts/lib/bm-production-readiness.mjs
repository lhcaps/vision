const REQUIRED_FORM_COUNT = 213;

function listSample(values, limit = 12) {
  if (!Array.isArray(values) || values.length === 0) return "";

  const sample = values.slice(0, limit).join(", ");
  const suffix = values.length > limit ? `, ... +${values.length - limit}` : "";
  return `${sample}${suffix}`;
}

function number(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function addBlocker(blockers, id, message, evidence = "") {
  blockers.push({ id, message, evidence });
}

export function evaluateBmProductionReadiness({ autoPopulate, docxSync }) {
  const auto = autoPopulate?.summary ?? {};
  const docx = docxSync?.summary ?? {};
  const totalForms = number(auto.formCount || docx.corpusCodes);
  const noCasePayloadContext = array(docx.noCasePayloadContext);
  const genericPanelCodes = array(docx.genericPanelCodes);
  const hardcodedPersonRiskCodes = array(docx.hardcodedPersonRiskCodes);
  const noPayloadSource = array(auto.noPayloadSource);
  const blockers = [];

  if (totalForms !== REQUIRED_FORM_COUNT) {
    addBlocker(
      blockers,
      "form-count-mismatch",
      `Expected ${REQUIRED_FORM_COUNT} BM forms in the audit SOT.`,
      `found=${totalForms}`,
    );
  }

  if (!docx.requirementDocx?.path) {
    addBlocker(
      blockers,
      "requirement-docx-missing",
      "Requirement DOCX was not found by the DOCX sync audit.",
    );
  }

  if (number(auto.hasRenderPayloadCount) !== REQUIRED_FORM_COUNT || noPayloadSource.length > 0) {
    addBlocker(
      blockers,
      "render-payload-source-incomplete",
      "Every BM form must have an auditable render-payload/case data source.",
      noPayloadSource.length ? listSample(noPayloadSource) : `count=${number(auto.hasRenderPayloadCount)}`,
    );
  }

  if (number(auto.hasUseCasePayloadCount) !== REQUIRED_FORM_COUNT || noCasePayloadContext.length > 0) {
    addBlocker(
      blockers,
      "case-context-not-consumed",
      "Every BM form must consume the shared case payload context or equivalent central adapter before production-ready auto-populate can be claimed.",
      noCasePayloadContext.length
        ? listSample(noCasePayloadContext)
        : `count=${number(auto.hasUseCasePayloadCount)}`,
    );
  }

  if (number(auto.hasTakeFromCaseOrContextCount) !== REQUIRED_FORM_COUNT) {
    addBlocker(
      blockers,
      "take-from-case-missing",
      "Every BM form must expose an auditable case-derived populate path.",
      `count=${number(auto.hasTakeFromCaseOrContextCount)}`,
    );
  }

  if (number(docx.genericTemplatePanelWrappers) > 0 || genericPanelCodes.length > 0) {
    addBlocker(
      blockers,
      "generic-wrapper-panels",
      "Generic wrapper panels do not prove BM-specific field logic/UX from the requirement DOCX.",
      genericPanelCodes.length
        ? listSample(genericPanelCodes)
        : `count=${number(docx.genericTemplatePanelWrappers)}`,
    );
  }

  if (number(auto.hardcodedPersonRiskCount) > 0 || hardcodedPersonRiskCodes.length > 0) {
    addBlocker(
      blockers,
      "hardcoded-sample-risk",
      "Hardcoded person/official sample signals conflict with the requirement to avoid stale patched data in Save/render.",
      hardcodedPersonRiskCodes.length
        ? listSample(hardcodedPersonRiskCodes)
        : `count=${number(auto.hardcodedPersonRiskCount)}`,
    );
  }

  if (number(docx.corpusFindings) !== 0) {
    addBlocker(
      blockers,
      "template-corpus-findings",
      "Template corpus audit must have zero blocking findings.",
      `findings=${number(docx.corpusFindings)}`,
    );
  }

  if (number(docx.normalizedDocx) !== REQUIRED_FORM_COUNT) {
    addBlocker(
      blockers,
      "normalized-docx-incomplete",
      "Every BM must have a clean normalized DOCX.",
      `count=${number(docx.normalizedDocx)}`,
    );
  }

  if (number(docx.normalizedDocxWithExplicitMargin) !== REQUIRED_FORM_COUNT) {
    addBlocker(
      blockers,
      "docx-margin-incomplete",
      "Every normalized DOCX must expose explicit section margin metadata.",
      `count=${number(docx.normalizedDocxWithExplicitMargin)}`,
    );
  }

  if (number(docx.renderSummaryJsonOkCount) !== REQUIRED_FORM_COUNT) {
    addBlocker(
      blockers,
      "render-json-incomplete",
      "Canonical render JSON must prove 213/213 OK; Markdown-only merged evidence is not enough for production readiness.",
      `jsonOk=${number(docx.renderSummaryJsonOkCount)}`,
    );
  }

  if (number(docx.renderSummaryMdOkCount) !== REQUIRED_FORM_COUNT) {
    addBlocker(
      blockers,
      "render-md-incomplete",
      "Render Markdown summary must prove 213/213 OK.",
      `mdOk=${number(docx.renderSummaryMdOkCount)}`,
    );
  }

  return {
    ready: blockers.length === 0,
    metrics: {
      totalForms,
      renderPayloadForms: number(auto.hasRenderPayloadCount),
      caseContextForms: number(auto.hasUseCasePayloadCount),
      takeFromCaseForms: number(auto.hasTakeFromCaseOrContextCount),
      specificFormComponents: number(docx.formComponentFiles),
      genericWrappers: number(docx.genericTemplatePanelWrappers),
      hardcodedSampleRiskForms: number(auto.hardcodedPersonRiskCount),
      normalizedDocx: number(docx.normalizedDocx),
      explicitMarginDocx: number(docx.normalizedDocxWithExplicitMargin),
      renderJsonOk: number(docx.renderSummaryJsonOkCount),
      renderMdOk: number(docx.renderSummaryMdOkCount),
    },
    blockers,
  };
}

export function formatReadinessReport(result) {
  const lines = [
    `BM Production Readiness: ${result.ready ? "READY" : "NOT READY"}`,
    "",
    "Metrics:",
    ...Object.entries(result.metrics).map(([key, value]) => `- ${key}: ${value}`),
  ];

  if (result.blockers.length > 0) {
    lines.push("", "Blockers:");
    for (const blocker of result.blockers) {
      lines.push(`- ${blocker.id}: ${blocker.message}`);
      if (blocker.evidence) lines.push(`  evidence: ${blocker.evidence}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
