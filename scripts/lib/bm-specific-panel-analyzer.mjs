export function analyzeSpecificPanelSource({ code, text }) {
  const usesGenericPanel = /GenericTemplateFormInputsPanel/u.test(text);
  const hasUseCasePayload = /useCasePayload/u.test(text);
  const hasTakeFromCase =
    text.includes("L\u1ea5y t\u1eeb v\u1ee5 \u00e1n") ||
    /\b(?:applyCasePayload|applyCaseMapping|hydrateFromCase|layTuVuAn)\b/iu.test(text);
  const stateMatch = text.match(
    /const\s*\[\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\]\s*=\s*useState/u,
  );
  const stateVariable = stateMatch?.[1] ?? null;
  const setterName = stateMatch?.[2] ?? null;
  const hasNamedFormState = stateVariable === "form" && setterName === "setForm";
  const hasReturn = /\breturn\s*\(/u.test(text) || /\breturn\s+</u.test(text);
  const hasButton = /<button\b/u.test(text);
  const hasDefaultButton =
    text.includes("\u0110i\u1ec1n d\u1eef li\u1ec7u m\u1eabu") ||
    /\b(?:fillCustomerSample|fillDefault|sampleForm)\b/u.test(text);
  const risks = [];

  if (usesGenericPanel) {
    return {
      code,
      kind: "generic-wrapper",
      canAutoWireGenericCaseAdapter: false,
      stateVariable,
      setterName,
      hasUseCasePayload,
      hasTakeFromCase,
      hasButton,
      hasDefaultButton,
      risks: ["generic wrapper is handled by GenericTemplateFormInputsPanel"],
    };
  }

  if (!hasNamedFormState) risks.push("missing form state variable named form");
  if (!hasReturn) risks.push("no obvious JSX return block");
  if (!hasButton) risks.push("no obvious button insertion point");

  return {
    code,
    kind: "specific",
    canAutoWireGenericCaseAdapter:
      !hasUseCasePayload && !hasTakeFromCase && hasNamedFormState && hasReturn && hasButton,
    stateVariable,
    setterName,
    hasUseCasePayload,
    hasTakeFromCase,
    hasButton,
    hasDefaultButton,
    risks,
  };
}

export function summarizeSpecificPanelAnalysis(results) {
  const specific = results.filter((item) => item.kind === "specific");
  const generic = results.filter((item) => item.kind === "generic-wrapper");
  const autoWireCandidates = specific.filter((item) => item.canAutoWireGenericCaseAdapter);
  const alreadyWired = specific.filter(
    (item) => item.hasUseCasePayload || item.hasTakeFromCase,
  );
  const blockedSpecific = specific.filter(
    (item) =>
      !item.canAutoWireGenericCaseAdapter &&
      !item.hasUseCasePayload &&
      !item.hasTakeFromCase,
  );

  return {
    total: results.length,
    specificCount: specific.length,
    genericWrapperCount: generic.length,
    autoWireCandidateCount: autoWireCandidates.length,
    alreadyHasCasePathCount: alreadyWired.length,
    noDefaultButtonCount: specific.filter((item) => !item.hasDefaultButton).length,
    blockedSpecificCount: blockedSpecific.length,
    autoWireCandidates: autoWireCandidates.map((item) => item.code),
    blockedSpecific: blockedSpecific.map((item) => ({
      code: item.code,
      risks: item.risks,
    })),
  };
}
