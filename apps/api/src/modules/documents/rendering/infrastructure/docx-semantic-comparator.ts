export type DocxSemanticComparisonStatus = 'pass' | 'fail' | 'warning';

export type DocxSemanticComparison = Readonly<{
  status: DocxSemanticComparisonStatus;
  legacyTextLength: number;
  contractTextLength: number;
  missingExpectedText: readonly string[];
  unexpectedUnresolvedPlaceholders: readonly string[];
  notes: readonly string[];
}>;

const PLACEHOLDER_PATTERNS = [
  /\{[^{}]+\}/g,
  /\{\{[^{}]+\}\}/g,
  /……+/g,
  /_{3,}/g,
];

function extractTextFromDocxXml(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findUnresolvedPlaceholders(text: string): {
  all: string[];
  harmful: string[];
} {
  const found = new Set<string>();

  // Collect all placeholder-like patterns
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        found.add(match);
      }
    }
  }

  const dotPatterns = /[.。]{2,}/g;
  const dotMatches = text.match(dotPatterns);
  if (dotMatches) {
    for (const match of dotMatches) {
      found.add(match);
    }
  }

  const all = Array.from(found);

  // Ellipsis dots and underscores in templates are harmless template markers, not errors
  const harmful = all.filter((p) => {
    return p.startsWith('{') && !p.startsWith('……') && !p.startsWith('___');
  });

  return { all, harmful };
}

function whitespaceOnlyDifference(
  legacyText: string,
  contractText: string,
): boolean {
  const normLegacy = legacyText.replace(/\s+/g, ' ').trim();
  const normContract = contractText.replace(/\s+/g, ' ').trim();
  return normLegacy === normContract;
}

export function compareDocxSemantic(
  legacyXmlContent: string,
  contractXmlContent: string,
  expectedFilledValues: string[],
): DocxSemanticComparison {
  const legacyText = extractTextFromDocxXml(legacyXmlContent);
  const contractText = extractTextFromDocxXml(contractXmlContent);

  const legacyLength = legacyText.length;
  const contractLength = contractText.length;

  const missingExpectedText: string[] = [];
  for (const expected of expectedFilledValues) {
    const trimmed = expected.trim();
    if (trimmed && !contractText.includes(trimmed)) {
      missingExpectedText.push(trimmed);
    }
  }

  // Track unresolved placeholders in contract output
  const unresolvedContract = findUnresolvedPlaceholders(contractText);

  const unexpectedUnresolvedPlaceholders: string[] = unresolvedContract.harmful;

  const notes: string[] = [];
  if (legacyLength > 0 && contractLength > 0) {
    const ratio = contractLength / legacyLength;
    if (ratio < 0.5) {
      notes.push(
        `Contract text is significantly shorter (${ratio.toFixed(2)}x) than legacy.`,
      );
    } else if (ratio > 2.0) {
      notes.push(
        `Contract text is significantly longer (${ratio.toFixed(2)}x) than legacy.`,
      );
    }
  }

  if (missingExpectedText.length > 0) {
    notes.push(
      `${missingExpectedText.length} expected value(s) not found in contract output.`,
    );
  }

  let status: DocxSemanticComparisonStatus = 'pass';

  if (missingExpectedText.length > 0) {
    status = 'fail';
  } else if (unexpectedUnresolvedPlaceholders.length > 0) {
    status = 'fail';
  } else if (notes.length > 0) {
    status = 'warning';
  } else if (
    legacyText.length > 0 &&
    contractText.length > 0 &&
    !whitespaceOnlyDifference(legacyText, contractText)
  ) {
    const lengthDiff = Math.abs(legacyLength - contractLength);
    const maxLength = Math.max(legacyLength, contractLength);
    if (maxLength > 0 && lengthDiff / maxLength > 0.1) {
      status = 'warning';
      notes.push(
        `Text length differs by ${((lengthDiff / maxLength) * 100).toFixed(1)}% but no specific missing values found.`,
      );
    }
  }

  return Object.freeze({
    status,
    legacyTextLength: legacyLength,
    contractTextLength: contractLength,
    missingExpectedText: Object.freeze([...missingExpectedText]),
    unexpectedUnresolvedPlaceholders: Object.freeze([
      ...unexpectedUnresolvedPlaceholders,
    ]),
    notes: Object.freeze([...notes]),
  });
}

export async function extractDocumentXmlFromZip(
  zipBuffer: Buffer,
): Promise<string> {
  const PizZip = require('pizzip') as typeof import('pizzip');
  const zip = new PizZip(zipBuffer);
  const docXml = zip.file('word/document.xml');
  if (!docXml) {
    throw new Error('word/document.xml not found in DOCX archive.');
  }
  return docXml.asText();
}
