import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import {
  buildTemplateCorpusFindings,
  buildTemplateCorpusRows,
  buildTemplateCorpusSnapshot,
} from "./template-foundation-utils.mjs";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "docs", "audit", "bm-auto-populate-sot");
const REQUIREMENT_DOCX = findRequirementDocx();
const AUTO_POPULATE_JSON = join(OUT_DIR, "bm-auto-populate-sot.json");
const RENDER_SUMMARY_JSON = join(ROOT, "audit_renders", "summary.json");
const RENDER_SUMMARY_MD = join(ROOT, "audit_renders", "SUMMARY.md");

const requireFromApi = createRequire(join(ROOT, "apps", "api", "package.json"));
const PizZip = requireFromApi("pizzip");

function findRequirementDocx() {
  const docsDir = join(ROOT, "docs");
  if (!existsSync(docsDir)) return null;

  const matches = [...walkFiles(docsDir)].filter((filePath) => {
    const fileName = filePath.split(/[\\/]/u).pop() ?? "";
    return fileName.toLowerCase().endsWith(".docx") && fileName.includes("QUANLYNOIBOVKS");
  });

  return matches.sort()[0] ?? null;
}

function* walkFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const filePath = join(dir, entry);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      yield* walkFiles(filePath);
    } else if (stat.isFile()) {
      yield filePath;
    }
  }
}

function toPortable(filePath) {
  return relative(ROOT, filePath).split("\\").join("/");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function decodeXml(text) {
  return text
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&amp;/gu, "&")
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&#(\d+);/gu, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/giu, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)));
}

function paragraphsFromDocumentXml(documentXml) {
  const paragraphs = [];

  for (const paragraphMatch of documentXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/gu)) {
    const paragraphXml = paragraphMatch[0];
    const chunks = [...paragraphXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu)].map(
      (match) => decodeXml(match[1]),
    );
    const text = chunks.join("").replace(/\s+/gu, " ").trim();
    if (text) paragraphs.push(text);
  }

  return paragraphs;
}

function getXmlAttr(attributes, name) {
  const pattern = new RegExp(`(?:^|\\s)${name}="([^"]+)"`, "u");
  return attributes.match(pattern)?.[1] ?? null;
}

function twipsToCm(value) {
  if (value === null) return null;
  return Number((Number(value) / 567).toFixed(2));
}

function twipsToIn(value) {
  if (value === null) return null;
  return Number((Number(value) / 1440).toFixed(2));
}

function inspectDocx(filePath) {
  const buffer = readFileSync(filePath);
  const zip = new PizZip(buffer);
  const documentXml = zip.file("word/document.xml")?.asText() ?? "";
  const stylesXml = zip.file("word/styles.xml")?.asText() ?? "";
  const settingsXml = zip.file("word/settings.xml")?.asText() ?? "";
  const coreXml = zip.file("docProps/core.xml")?.asText() ?? "";
  const paragraphs = paragraphsFromDocumentXml(documentXml);
  const sectionMargins = [...documentXml.matchAll(/<w:pgMar\b([^>]*)\/?>/gu)].map(
    (match) => {
      const attrs = match[1];
      const top = getXmlAttr(attrs, "w:top");
      const right = getXmlAttr(attrs, "w:right");
      const bottom = getXmlAttr(attrs, "w:bottom");
      const left = getXmlAttr(attrs, "w:left");
      return {
        topTwips: top === null ? null : Number(top),
        rightTwips: right === null ? null : Number(right),
        bottomTwips: bottom === null ? null : Number(bottom),
        leftTwips: left === null ? null : Number(left),
        topCm: twipsToCm(top),
        rightCm: twipsToCm(right),
        bottomCm: twipsToCm(bottom),
        leftCm: twipsToCm(left),
        topIn: twipsToIn(top),
        rightIn: twipsToIn(right),
        bottomIn: twipsToIn(bottom),
        leftIn: twipsToIn(left),
      };
    },
  );

  return {
    path: toPortable(filePath),
    bytes: buffer.byteLength,
    sha256: sha256(buffer),
    paragraphCount: paragraphs.length,
    textPreview: paragraphs.slice(0, 20),
    fullText: paragraphs.join("\n"),
    sectionMarginCount: sectionMargins.length,
    sectionMargins,
    hasStyles: Boolean(stylesXml),
    hasSettings: Boolean(settingsXml),
    corePropertiesPresent: Boolean(coreXml),
  };
}

function normalizeForSearch(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gu, "d")
    .replace(/Đ/gu, "D")
    .toLowerCase();
}

function requirementKeywordHits(text) {
  const normalized = normalizeForSearch(text);
  const keywords = [
    "bieu mau",
    "can le",
    "du lieu",
    "docx",
    "dong bo",
    "mau van ban",
    "pdf",
    "tu dong",
    "tt 03",
    "vks",
  ];

  return Object.fromEntries(
    keywords.map((keyword) => [keyword, normalized.includes(keyword)]),
  );
}

function requirementExcerpts(fullText) {
  const normalizedKeywords = [
    "bieu mau",
    "can le",
    "du lieu",
    "docx",
    "dong bo",
    "tu dong",
  ];

  return fullText
    .split(/\r?\n/u)
    .filter((line) => {
      const normalized = normalizeForSearch(line);
      return normalizedKeywords.some((keyword) => normalized.includes(keyword));
    })
    .slice(0, 30);
}

function loadAutoPopulateByCode() {
  if (!existsSync(AUTO_POPULATE_JSON)) return new Map();
  const data = JSON.parse(readFileSync(AUTO_POPULATE_JSON, "utf8"));
  return new Map((data.forms ?? []).map((form) => [form.code, form]));
}

function loadRenderAudit() {
  const jsonCodes = new Set();
  const mdCodes = new Set();

  if (existsSync(RENDER_SUMMARY_JSON)) {
    const data = JSON.parse(readFileSync(RENDER_SUMMARY_JSON, "utf8"));
    for (const result of data.results ?? []) {
      if (result.status === "OK" && /^BM-\d{3}$/u.test(result.code)) {
        jsonCodes.add(result.code);
      }
    }
  }

  if (existsSync(RENDER_SUMMARY_MD)) {
    const text = readFileSync(RENDER_SUMMARY_MD, "utf8");
    for (const match of text.matchAll(/\|\s*\d+\s*\|\s*(BM-\d{3})\s*\|[^|\n]*\|[^|\n]*\|\s*OK\s*\|\s*0\s*\|\s*0\s*\|/gu)) {
      mdCodes.add(match[1]);
    }
  }

  return {
    summaryJsonPath: existsSync(RENDER_SUMMARY_JSON) ? toPortable(RENDER_SUMMARY_JSON) : null,
    summaryMdPath: existsSync(RENDER_SUMMARY_MD) ? toPortable(RENDER_SUMMARY_MD) : null,
    summaryJsonOkCount: jsonCodes.size,
    summaryMdOkCount: mdCodes.size,
    jsonOnlyCodes: [...jsonCodes].filter((code) => !mdCodes.has(code)).sort(),
    mdOnlyCodes: [...mdCodes].filter((code) => !jsonCodes.has(code)).sort(),
    mdCodes,
    jsonCodes,
  };
}

function marginSignature(margins) {
  if (!margins.length) return "missing";
  const first = margins[0];
  return [
    `T${first.topCm ?? "?"}`,
    `R${first.rightCm ?? "?"}`,
    `B${first.bottomCm ?? "?"}`,
    `L${first.leftCm ?? "?"}`,
  ].join("/");
}

function inspectNormalizedMargins(rows) {
  const byCode = new Map();

  for (const row of rows) {
    if (!row.normalizedPath) continue;

    const filePath = join(ROOT, row.normalizedPath);
    if (!existsSync(filePath)) continue;

    const inspected = inspectDocx(filePath);
    byCode.set(row.code, {
      sectionMarginCount: inspected.sectionMarginCount,
      firstMargin: inspected.sectionMargins[0] ?? null,
      signature: marginSignature(inspected.sectionMargins),
    });
  }

  return byCode;
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function markdownTable(rows) {
  const header =
    "| BM | Source | Panel | Prefill | Context | Normalized DOCX | DOCX PH | Margin | Render MD | Risks |\n" +
    "|---|---|---|---|---:|---|---:|---|---:|---|\n";

  return (
    header +
    rows
      .map((row) =>
        [
          row.code,
          row.sourceExt ? row.sourceExt.toUpperCase() : "NO",
          row.usesGenericTemplatePanel
            ? "generic-wrapper"
            : row.hasSpecificComponent
              ? "specific"
              : row.hasFePanel
                ? "generic"
                : "NO",
          row.prefillStatus ?? "unknown",
          row.hasUseCasePayload ? "yes" : "no",
          row.hasNormalizedDocx ? row.docxStatus : "NO",
          String(row.placeholderCount),
          row.marginSignature,
          row.renderOkInSummaryMd ? "yes" : "no",
          row.risks.join("; ") || "-",
        ]
          .map((cell) => String(cell).replaceAll("|", "\\|"))
          .join(" | "),
      )
      .map((line) => `| ${line} |`)
      .join("\n")
  );
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const snapshot = buildTemplateCorpusSnapshot(ROOT);
  const corpusRows = buildTemplateCorpusRows(snapshot);
  const corpusFindings = buildTemplateCorpusFindings(snapshot);
  const autoPopulateByCode = loadAutoPopulateByCode();
  const renderAudit = loadRenderAudit();
  const marginByCode = inspectNormalizedMargins(corpusRows);
  const requirement = REQUIREMENT_DOCX ? inspectDocx(REQUIREMENT_DOCX) : null;
  const requirementText = requirement?.fullText ?? "";

  const rows = corpusRows.map((row) => {
    const autoPopulate = autoPopulateByCode.get(row.code);
    const margin = marginByCode.get(row.code);
    const risks = [];

    if (!autoPopulate?.hasUseCasePayload) risks.push("form does not consume CasePayload context");
    if (!autoPopulate?.hasDefaultButton) risks.push("no explicit default/sample action");
    if (autoPopulate?.hasHardcodedPerson) risks.push("hardcoded person/official sample signal");
    if (autoPopulate?.hasGenericPanel) risks.push("generic panel, not a bespoke BM field map");
    if (!margin || margin.sectionMarginCount === 0) risks.push("normalized DOCX has no explicit section margin");
    if (!renderAudit.mdCodes.has(row.code)) risks.push("not found as OK in audit_renders/SUMMARY.md");

    return {
      ...row,
      prefillStatus: autoPopulate?.prefillStatus ?? "unknown",
      usesGenericTemplatePanel: Boolean(autoPopulate?.hasGenericPanel),
      hasUseCasePayload: Boolean(autoPopulate?.hasUseCasePayload),
      hasDefaultButton: Boolean(autoPopulate?.hasDefaultButton),
      hasHardcodedPerson: Boolean(autoPopulate?.hasHardcodedPerson),
      marginSignature: margin?.signature ?? "missing",
      firstMargin: margin?.firstMargin ?? null,
      renderOkInSummaryMd: renderAudit.mdCodes.has(row.code),
      renderOkInSummaryJson: renderAudit.jsonCodes.has(row.code),
      risks,
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    requirementDocx: requirement
      ? {
          path: requirement.path,
          bytes: requirement.bytes,
          sha256: requirement.sha256,
          paragraphCount: requirement.paragraphCount,
          sectionMarginCount: requirement.sectionMarginCount,
          firstMargin: requirement.sectionMargins[0] ?? null,
          keywordHits: requirementKeywordHits(requirementText),
          excerpts: requirementExcerpts(requirementText),
        }
      : null,
    corpusCodes: rows.length,
    corpusFindings: corpusFindings.length,
    formComponentFiles: rows.filter((row) => row.hasSpecificComponent).length,
    genericTemplatePanelWrappers: rows.filter((row) => row.usesGenericTemplatePanel).length,
    normalizedDocx: rows.filter((row) => row.hasNormalizedDocx && row.docxStatus === "ok").length,
    normalizedDocxWithExplicitMargin: rows.filter((row) => row.marginSignature !== "missing").length,
    marginSignatureCounts: countBy(rows.map((row) => row.marginSignature)),
    renderSummaryJsonOkCount: renderAudit.summaryJsonOkCount,
    renderSummaryMdOkCount: renderAudit.summaryMdOkCount,
    renderAuditJsonVsMdMismatch: {
      jsonOnlyCodes: renderAudit.jsonOnlyCodes,
      mdOnlyCodes: renderAudit.mdOnlyCodes,
    },
    noCasePayloadContext: rows
      .filter((row) => !row.hasUseCasePayload)
      .map((row) => row.code),
    genericPanelCodes: rows
      .filter((row) => row.usesGenericTemplatePanel)
      .map((row) => row.code),
    hardcodedPersonRiskCodes: rows
      .filter((row) => row.hasHardcodedPerson)
      .map((row) => row.code),
  };

  const jsonPath = join(OUT_DIR, "bm-docx-requirement-sync.json");
  const mdPath = join(OUT_DIR, "BM_DOCX_REQUIREMENT_SYNC.md");
  writeFileSync(jsonPath, `${JSON.stringify({ summary, rows }, null, 2)}\n`, "utf8");
  writeFileSync(
    mdPath,
    [
      "# BM DOCX Requirement Sync Audit",
      "",
      `Generated: ${summary.generatedAt}`,
      "",
      "## Summary",
      "",
      `- Requirement DOCX: ${summary.requirementDocx?.path ?? "missing"}`,
      `- Requirement paragraphs: ${summary.requirementDocx?.paragraphCount ?? 0}`,
      `- Requirement first margin: ${JSON.stringify(summary.requirementDocx?.firstMargin ?? null)}`,
      `- Requirement keyword hits: ${JSON.stringify(summary.requirementDocx?.keywordHits ?? {})}`,
      `- Corpus rows: ${summary.corpusCodes}`,
      `- Corpus findings: ${summary.corpusFindings}`,
      `- Form component files: ${summary.formComponentFiles}/${summary.corpusCodes}`,
      `- Generic template panel wrappers: ${summary.genericTemplatePanelWrappers}/${summary.corpusCodes}`,
      `- Normalized DOCX OK: ${summary.normalizedDocx}/${summary.corpusCodes}`,
      `- Normalized DOCX with explicit margin: ${summary.normalizedDocxWithExplicitMargin}/${summary.corpusCodes}`,
      `- Render SUMMARY.md OK: ${summary.renderSummaryMdOkCount}/${summary.corpusCodes}`,
      `- Render summary.json OK: ${summary.renderSummaryJsonOkCount}/${summary.corpusCodes}`,
      "",
      "## Requirement Excerpts",
      "",
      ...(summary.requirementDocx?.excerpts.length
        ? summary.requirementDocx.excerpts.map((line) => `- ${line}`)
        : ["- No relevant excerpts extracted."]),
      "",
      "## Margin Signatures",
      "",
      ...Object.entries(summary.marginSignatureCounts).map(
        ([signature, count]) => `- ${signature}: ${count}`,
      ),
      "",
      "## Per-form Matrix",
      "",
      markdownTable(rows),
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(JSON.stringify(summary, null, 2));
  console.log(`Wrote ${toPortable(jsonPath)}`);
  console.log(`Wrote ${toPortable(mdPath)}`);

  if (!requirement) {
    console.error("Requirement DOCX was not found.");
    process.exitCode = 1;
  } else if (corpusFindings.length) {
    console.error(`Corpus findings detected: ${corpusFindings.length}`);
    process.exitCode = 1;
  }
}

main();
