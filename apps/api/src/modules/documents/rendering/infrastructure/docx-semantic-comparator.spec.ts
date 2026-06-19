import { compareDocxSemantic } from './docx-semantic-comparator';

describe('docx-semantic-comparator', () => {
  describe('missing expected text', () => {
    it('fails when expected text is missing from contract output', () => {
      const legacyXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';
      const contractXml = '<w:p><w:t></w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, [
        'Nguyễn Văn Minh',
      ]);

      expect(result.status).toBe('fail');
      expect(result.missingExpectedText).toContain('Nguyễn Văn Minh');
    });

    it('passes when all expected values are present', () => {
      const legacyXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';
      const contractXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, [
        'Nguyễn Văn Minh',
      ]);

      expect(result.status).toBe('pass');
      expect(result.missingExpectedText).toHaveLength(0);
    });
  });

  describe('unresolved placeholders', () => {
    it('fails on unresolved {{placeholder}} syntax', () => {
      const legacyXml = '<w:p><w:t>Hello</w:t></w:p>';
      const contractXml = '<w:p><w:t>{{receiver.fullName}}</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('fail');
      expect(result.unexpectedUnresolvedPlaceholders).toContain('{{receiver.fullName}}');
    });

    it('fails on unresolved {placeholder} syntax', () => {
      const legacyXml = '<w:p><w:t>Hello</w:t></w:p>';
      const contractXml = '<w:p><w:t>{informant.fullName}</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('fail');
      expect(result.unexpectedUnresolvedPlaceholders).toContain('{informant.fullName}');
    });

    it('passes on ellipsis (...) template markers without missing expected text', () => {
      const legacyXml = '<w:p><w:t>Ngày……tháng……năm</w:t></w:p>';
      const contractXml = '<w:p><w:t>Ngày……tháng……năm</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('pass');
      expect(result.unexpectedUnresolvedPlaceholders).toHaveLength(0);
    });

    it('warns on template with ellipsis when filled values change text length significantly', () => {
      const legacyXml = '<w:p><w:t>Ngày……tháng……năm</w:t></w:p>';
      const contractXml = '<w:p><w:t>Ngày 15 tháng 06 năm 2026</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, ['15', '06', '2026']);

      expect(result.status).toBe('warning');
    });
  });

  describe('whitespace differences', () => {
    it('passes when text differs only by whitespace', () => {
      const legacyXml = '<w:p><w:t>  Nguyễn   Văn   Minh  </w:t></w:p>';
      const contractXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, [
        'Nguyễn Văn Minh',
      ]);

      expect(result.status).toBe('pass');
    });
  });

  describe('length comparison', () => {
    it('warns when contract is significantly shorter', () => {
      const legacyXml = '<w:p><w:t>' + 'a'.repeat(500) + '</w:t></w:p>';
      const contractXml = '<w:p><w:t>abc</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('warning');
      expect(result.notes.some((n) => n.includes('shorter'))).toBe(true);
    });

    it('warns when contract is significantly longer', () => {
      const legacyXml = '<w:p><w:t>abc</w:t></w:p>';
      const contractXml = '<w:p><w:t>' + 'a'.repeat(500) + '</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('warning');
      expect(result.notes.some((n) => n.includes('longer'))).toBe(true);
    });
  });

  describe('entity encoding', () => {
    it('normalizes XML entities for comparison', () => {
      const legacyXml = '<w:p><w:t>Ngày &lt; 10</w:t></w:p>';
      const contractXml = '<w:p><w:t>Ngày &lt; 10</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, ['Ngày < 10']);

      expect(result.status).toBe('pass');
    });
  });
});
