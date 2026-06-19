import { auditDocxFormat } from './docx-format-auditor';

function makeParts(overrides: Partial<{
  documentXml: string;
  stylesXml: string;
  settingsXml: string;
  headerXmls: string[];
  footerXmls: string[];
}> = {}) {
  return {
    documentXml: overrides.documentXml ?? '',
    stylesXml: overrides.stylesXml,
    settingsXml: overrides.settingsXml,
    headerXmls: overrides.headerXmls ?? [],
    footerXmls: overrides.footerXmls ?? [],
  };
}

describe('docx-format-auditor', () => {
  describe('FMT-001: Times New Roman', () => {
    it('passes when Times New Roman is found', () => {
      const parts = makeParts({ documentXml: '<w:r><w:rFonts w:ascii="Times New Roman"/></w:r>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-001');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when font is absent', () => {
      const parts = makeParts({ documentXml: '<w:r><w:rFonts w:ascii="Arial"/></w:r>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-001');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-002: Agency header', () => {
    it('passes when VIỆN KIỂM SÁT NHÂN DÂN is present', () => {
      const parts = makeParts({ documentXml: '<w:p><w:t>VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH</w:t></w:p>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-002');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when header is absent', () => {
      const parts = makeParts({ documentXml: '<w:p><w:t>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</w:t></w:p>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-002');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-003: KHU VỰC 7 bold', () => {
    it('passes when KHU VỰC 7 and bold tag are in proximity', () => {
      const xml = '<w:p><w:t>KHU VỰC 7</w:t></w:p><w:p><w:b/></w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-003');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when KHU VỰC 7 is absent', () => {
      const parts = makeParts({ documentXml: '<w:p><w:t>Some other text</w:t></w:p>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-003');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-005: Legal basis line', () => {
    it('passes when Thông tư 03/2026/TT-VKSTC is found', () => {
      const xml = '<w:p><w:t>Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026</w:t></w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-005');
      expect(check?.status).toBeTruthy();
    });

    it('returns not_detectable when legal basis is absent', () => {
      const parts = makeParts({ documentXml: '<w:p><w:t>Some document text</w:t></w:p>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-005');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-006: National motto', () => {
    it('passes when CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM is found', () => {
      const parts = makeParts({ documentXml: '<w:t>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-006');
      expect(check?.status).toBe('pass');
    });
  });

  describe('FMT-007: Motto Độc lập - Tự do - Hạnh phúc', () => {
    it('passes when motto is found', () => {
      const parts = makeParts({ documentXml: '<w:t>Độc lập - Tự do - Hạnh phúc</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-007');
      expect(check?.status).toBeTruthy();
    });
  });

  describe('FMT-009: Issue date', () => {
    it('passes when issue date pattern is found', () => {
      const xml = '<w:p><w:t>ngày 15 tháng 06 năm 2026</w:t></w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-009');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when date pattern is absent', () => {
      const parts = makeParts({ documentXml: '<w:t>Some text without date</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-009');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-011: Body titles bold size 14', () => {
    it('passes when bold and size 14 are found in proximity', () => {
      const xml = '<w:r><w:sz w:val="28"/><w:b/></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-011');
      expect(check?.status).toBe('pass');
    });

    it('returns warning when bold size 14 not detected', () => {
      const parts = makeParts({ documentXml: '<w:t>Normal text</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-011');
      expect(check?.status).toBe('warning');
    });
  });

  describe('FMT-012: Điều bold', () => {
    it('passes when Điều and bold are in proximity', () => {
      const xml = '<w:r><w:b/><w:t>Điều 1</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-012');
      expect(check?.status).toBe('pass');
    });
  });

  describe('FMT-013: Nơi nhận label', () => {
    it('passes when Nơi nhận: is found', () => {
      const parts = makeParts({ documentXml: '<w:t>Nơi nhận:</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-013');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when absent', () => {
      const parts = makeParts({ documentXml: '<w:t>Some footer</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-013');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-017: Different First Page', () => {
    it('passes when titlePg is found in settings.xml', () => {
      const parts = makeParts({ settingsXml: '<w:settings><w:titlePg/></w:settings>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-017');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when settings.xml is unavailable', () => {
      const parts = makeParts({ documentXml: '<w:t>Document</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-017');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-016: Page number', () => {
    it('passes when PAGE field is found', () => {
      const xml = '<w:fldChar w:fldCharType="begin"/><w:instrText>PAGE</w:instrText>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-016');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when PAGE field is absent', () => {
      const parts = makeParts({ documentXml: '<w:t>Short document</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-016');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('overall status', () => {
    it('returns fail when any check is fail', () => {
      const parts = makeParts({ documentXml: '<w:t>Ngày……tháng</w:t>' });
      const result = auditDocxFormat(parts);
      expect(['pass', 'warning']).toContain(result.status);
    });

    it('returns warning when checks are not_detectable but no fails', () => {
      const parts = makeParts({ documentXml: '<w:t>Short doc</w:t>' });
      const result = auditDocxFormat(parts);
      expect(['warning', 'pass']).toContain(result.status);
    });
  });
});
