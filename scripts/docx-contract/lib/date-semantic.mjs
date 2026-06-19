// Date semantic suggestion helper for the DOCX-first audit pipeline.
//
// SEPARATION OF CONCERNS:
//   - inferDateParts(text)        → only detects slot presence (ngày … tháng … năm …)
//   - suggestDateSemantic(...)    → only SUGGESTS canonical path, does NOT assert truth
//
// Both functions are heuristic. All output must have reviewRequired: true
// until human review confirms the semantic binding.

/**
 * Suggest the canonical data path for a date slot based on surrounding context.
 * Returns a suggestion object; does NOT set source or assert truth.
 *
 * @param {string} context - the full paragraph/line text
 * @param {string[]} nearbyBlocks - preceding/succeeding block texts for wider context
 * @returns {{suggestedCanonicalPath: string, suggestedBy: string, suggestedReason: string}}
 */
export function suggestDateSemantic(context, nearbyBlocks = []) {
  const combinedText = [context, ...nearbyBlocks].join(" ").toLowerCase();

  // "Sinh ngày … tháng … năm …" → birth date of person
  if (/sinh\s+ngày/.test(combinedText)) {
    return {
      suggestedCanonicalPath: "informant.birthDate",
      suggestedBy: "heuristic",
      suggestedReason: "context contains 'Sinh ngày'",
    };
  }

  // "Cấp ngày … tháng … năm …" near CMND/CCCD/ID document → document issue date
  if (/cấp\s+ngày/.test(combinedText) && /(?:cmnd|cccd|hộ\s*chiếu|thẻ\s*cc|giấy\s*tờ)/.test(combinedText)) {
    return {
      suggestedCanonicalPath: "informant.idDocument.issueDate",
      suggestedBy: "heuristic",
      suggestedReason: "context contains ID document issue date",
    };
  }

  // "Ngày cấp" near identity document → ID document issue date (generic)
  if (/ngày\s+cấp/.test(combinedText) && /(?:cmnd|cccd|hộ\s*chiếu|thẻ\s*cc|giấy\s*tờ)/.test(combinedText)) {
    return {
      suggestedCanonicalPath: "informant.idDocument.issueDate",
      suggestedBy: "heuristic",
      suggestedReason: "context contains generic ID document issue date",
    };
  }

  // "kết thúc" / "ngày kết thúc" → completion date
  if (/kết\s*thúc/.test(combinedText)) {
    return {
      suggestedCanonicalPath: "document.completedAt",
      suggestedBy: "heuristic",
      suggestedReason: "context contains completion/end date",
    };
  }

  // "hết hạn" / "thời hạn" → expiration date
  if (/hết\s*hạn|thời\s*hạn/.test(combinedText)) {
    return {
      suggestedCanonicalPath: "document.expirationDate",
      suggestedBy: "heuristic",
      suggestedReason: "context contains expiration date",
    };
  }

  // Header-like "…, ngày … tháng … năm …" near agency/official docs → issue date
  if (/[,，]?\s*ngày/.test(context) && /(?:độc\s*lập|tự\s*do|hạnh\s*phúc|số:|viện\s*kiểm\s*sát|văn\s*bản)/.test(combinedText)) {
    return {
      suggestedCanonicalPath: "document.issueDate",
      suggestedBy: "heuristic",
      suggestedReason: "header-like issue date context",
    };
  }

  // Generic date line at bottom of document → document date
  if (/,?\s*ngày\s+\d+\s*tháng\s+\d+\s*năm\s+\d{4}/.test(context)) {
    return {
      suggestedCanonicalPath: "document.dateCandidate",
      suggestedBy: "heuristic",
      suggestedReason: "generic document date line",
    };
  }

  // Default fallback — generic date candidate, must be reviewed
  return {
    suggestedCanonicalPath: "document.dateCandidate",
    suggestedBy: "heuristic",
    suggestedReason: "generic date candidate, needs reviewer confirmation",
  };
}
