export type DocxFormatAuditStatus = 'pass' | 'fail' | 'warning';
export type DocxFormatCheckStatus =
  | 'pass'
  | 'fail'
  | 'warning'
  | 'not_applicable'
  | 'not_detectable';

export type DocxFormatCheck = Readonly<{
  id: string;
  requirement: string;
  status: DocxFormatCheckStatus;
  evidence?: string;
}>;

export type DocxFormatAudit = Readonly<{
  status: DocxFormatAuditStatus;
  checks: readonly DocxFormatCheck[];
}>;

interface DocxOoxmlParts {
  documentXml: string;
  stylesXml?: string;
  settingsXml?: string;
  headerXmls?: string[];
  footerXmls?: string[];
}

function regexInXml(xml: string, pattern: RegExp): boolean {
  return pattern.test(xml);
}

export function auditDocxFormat(parts: DocxOoxmlParts): DocxFormatAudit {
  const { documentXml, stylesXml, settingsXml, headerXmls, footerXmls } = parts;

  const allXml = [
    documentXml,
    ...(stylesXml ? [stylesXml] : []),
    ...(settingsXml ? [settingsXml] : []),
    ...(headerXmls ?? []),
    ...(footerXmls ?? []),
  ].join('\n');

  const checks: DocxFormatCheck[] = [];

  // FMT-001: Times New Roman base font
  const hasTimesNewRoman = regexInXml(allXml, /Times New Roman/i);
  checks.push({
    id: 'FMT-001',
    requirement: 'Times New Roman size 13 baseline',
    status: hasTimesNewRoman ? 'pass' : 'not_detectable',
    evidence: hasTimesNewRoman
      ? 'Times New Roman found in document XML'
      : undefined,
  });

  // FMT-002: Header agency line 1
  const hasVKSHeader = regexInXml(allXml, /VIỆN KIỂM SÁT NHÂN DÂN/i);
  checks.push({
    id: 'FMT-002',
    requirement: 'Header: VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
    status: hasVKSHeader ? 'pass' : 'not_detectable',
    evidence: hasVKSHeader ? 'Agency header found in document XML' : undefined,
  });

  // FMT-003: KHU VỰC 7 bold in header
  const hasKhuVucBold = regexInXml(allXml, /KHU VỰC 7/i);
  const khuVucBoldWithTag = regexInXml(
    allXml,
    /KHU VỰC\s*7[\s\S]{0,200}<w:b[\s/]/i,
  );
  checks.push({
    id: 'FMT-003',
    requirement: 'Header: VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 bold',
    status: hasKhuVucBold
      ? khuVucBoldWithTag
        ? 'pass'
        : 'warning'
      : 'not_detectable',
    evidence: hasKhuVucBold
      ? `KHU VỰC 7 found; bold tag proximity: ${khuVucBoldWithTag}`
      : undefined,
  });

  // FMT-005: Legal basis line
  const hasLegalBasis = regexInXml(
    allXml,
    /Thông tư\s*số\s*03[/-]?2026[/-]?TT[/-]?VKSTC/i,
  );
  const legalBasisSize8 = regexInXml(
    allXml,
    /Thông tư[\s\S]{0,300}<w:sz\s[^>]*w:val="16"/i,
  );
  checks.push({
    id: 'FMT-005',
    requirement: 'Legal basis line size 8 (w:sz val=16 in half-points)',
    status: hasLegalBasis
      ? legalBasisSize8
        ? 'pass'
        : 'warning'
      : 'not_detectable',
    evidence: hasLegalBasis
      ? 'Legal basis line found; font size 8 proximity check'
      : undefined,
  });

  // FMT-006: Quốc hiệu size 13
  const hasQuocHieu = regexInXml(
    allXml,
    /CỘNG\s*HÒA\s*XÃ\s*HỘI\s*CHỦ\s*NGHĨA\s*VIỆT\s*NAM/i,
  );
  checks.push({
    id: 'FMT-006',
    requirement: 'Quốc hiệu size 13',
    status: hasQuocHieu ? 'pass' : 'not_detectable',
    evidence: hasQuocHieu ? 'National motto found in document XML' : undefined,
  });

  // FMT-007: Độc lập - Tự do - Hạnh phúc size 14
  const hasMotto = regexInXml(
    allXml,
    /Độc\s*lập\s*-\s*Tự\s*do\s*-\s*Hạnh\s*phúc/i,
  );
  const mottoSize14 = regexInXml(
    allXml,
    /Độc[\s\S]{0,500}<w:sz\s[^>]*w:val="28"/i,
  );
  checks.push({
    id: 'FMT-007',
    requirement: 'Độc lập - Tự do - Hạnh phúc size 14',
    status: hasMotto ? (mottoSize14 ? 'pass' : 'warning') : 'not_detectable',
    evidence: hasMotto
      ? 'Motto found; size 14 (w:val=28) proximity check'
      : undefined,
  });

  // FMT-009: Issue date italic size 14
  const hasIssueDate = regexInXml(
    allXml,
    /ngày\s*\d{1,2}\s*tháng\s*\d{1,2}\s*năm\s*\d{4}/i,
  );
  checks.push({
    id: 'FMT-009',
    requirement: 'Issue date line italic size 14',
    status: hasIssueDate ? 'pass' : 'not_detectable',
    evidence: hasIssueDate
      ? 'Issue date pattern found in document XML'
      : undefined,
  });

  // FMT-011: Body titles bold size 14
  const hasTitleBold14 = regexInXml(
    allXml,
    /<w:sz\s[^>]*w:val="28"[\s\S]{0,100}<w:b[\s/]/i,
  );
  checks.push({
    id: 'FMT-011',
    requirement: 'Body titles / main title bold size 14',
    status: hasTitleBold14 ? 'pass' : 'warning',
    evidence: hasTitleBold14
      ? 'Bold + size 14 (w:val=28) combination found'
      : 'Bold + size 14 combination not detected in proximity',
  });

  // FMT-012: Điều paragraphs bold
  const hasDieuBold = regexInXml(allXml, /<w:b[\s/][\s\S]{0,200}Điều\s*\d+/i);
  const hasSectionBold = regexInXml(
    allXml,
    /<w:b[\s/][\s\S]{0,200}>\s*\d+\s*<\/?w:t>/i,
  );
  checks.push({
    id: 'FMT-012',
    requirement: 'Điều 1, Điều 2, or section headings 1., 2. bold',
    status: hasDieuBold || hasSectionBold ? 'pass' : 'warning',
    evidence: hasDieuBold
      ? 'Điều paragraph with bold found'
      : hasSectionBold
        ? 'Numbered section with bold found'
        : 'Điều or numbered section bold not detected',
  });

  // FMT-013: Nơi nhận bold italic size 12
  const hasNoiNhan = regexInXml(allXml, /Nơi\s*nhận\s*:/i);
  checks.push({
    id: 'FMT-013',
    requirement: 'Footer: Nơi nhận: bold italic size 12',
    status: hasNoiNhan ? 'pass' : 'not_detectable',
    evidence: hasNoiNhan ? 'Nơi nhận: label found' : undefined,
  });

  // FMT-014: Footer recipient lines size 11
  const noiNhanSize11 = regexInXml(
    allXml,
    /Nơi\s*nhận[\s\S]{0,500}<w:sz\s[^>]*w:val="22"/i,
  );
  checks.push({
    id: 'FMT-014',
    requirement: 'Footer recipient lines size 11',
    status: noiNhanSize11 ? 'pass' : 'not_detectable',
    evidence: noiNhanSize11
      ? 'Size 11 (w:val=22) found near Nơi nhận'
      : undefined,
  });

  // FMT-015: Signature title bold size 14
  const hasChucVu = regexInXml(
    allXml,
    /(Viện\s*trưởng|Kiểm\s*sát\s*viên|Kiểm\s*sát\s*viên\s*trung\s*ương)/i,
  );
  checks.push({
    id: 'FMT-015',
    requirement:
      'Signature title bold size 14; 2-3 lines between title and name',
    status: hasChucVu ? 'warning' : 'not_detectable',
    evidence: hasChucVu
      ? 'Signature title found; vertical spacing not verifiable structurally'
      : undefined,
  });

  // FMT-016: Page number for long documents
  const hasPageNumber = regexInXml(
    allXml,
    /<w:fldChar[\s\S]*?w:fldCharType="begin"[\s\S]*?PAGE/i,
  );
  checks.push({
    id: 'FMT-016',
    requirement: 'Page number present for documents > 2 pages',
    status: hasPageNumber ? 'pass' : 'not_detectable',
    evidence: hasPageNumber ? 'PAGE field found in document' : undefined,
  });

  // FMT-017: Different First Page enabled
  const hasDifferentFirstPage = settingsXml
    ? regexInXml(settingsXml, /<w:titlePg[\s/]/i)
    : false;
  checks.push({
    id: 'FMT-017',
    requirement: 'Different First Page section property enabled',
    status: hasDifferentFirstPage ? 'pass' : 'not_detectable',
    evidence: hasDifferentFirstPage
      ? 'w:titlePg element found in settings.xml'
      : 'settings.xml not available or w:titlePg not found',
  });

  // Compute overall status
  const statuses = checks.map((c) => c.status);
  const hasFail = statuses.includes('fail');
  const hasWarning = statuses.includes('warning');
  const allDetectable = statuses.every((s) => s !== 'not_detectable');

  const overallStatus: DocxFormatAuditStatus = hasFail
    ? 'fail'
    : hasWarning
      ? 'warning'
      : allDetectable
        ? 'pass'
        : 'warning';

  return Object.freeze({
    status: overallStatus,
    checks: Object.freeze(checks),
  });
}

export async function extractOoxmlPartsFromDocx(
  zipBuffer: Buffer,
): Promise<DocxOoxmlParts> {
  const PizZip = require('pizzip') as typeof import('pizzip');
  const zip = new PizZip(zipBuffer);

  const docXml = zip.file('word/document.xml');
  if (!docXml) {
    throw new Error('word/document.xml not found in DOCX archive.');
  }
  const documentXml = docXml.asText();

  const stylesXml = zip.file('word/styles.xml')?.asText();
  const settingsXml = zip.file('word/settings.xml')?.asText();

  const headerXmls: string[] = [];
  const footerXmls: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const header = zip.file(`word/header${i}.xml`);
    if (header) headerXmls.push(header.asText());
    const footer = zip.file(`word/footer${i}.xml`);
    if (footer) footerXmls.push(footer.asText());
  }

  return { documentXml, stylesXml, settingsXml, headerXmls, footerXmls };
}
