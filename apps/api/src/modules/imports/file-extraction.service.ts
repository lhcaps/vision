import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import {
  type CandidateConfidence,
  type ImportDetectedCandidate,
  type ImportDetectedColumn,
  type ImportExtractionResult,
  type ImportTablePreview,
} from './import.types';

const MAX_TEXT_LENGTH = 250_000;
const MAX_PREVIEW_TEXT_LENGTH = 4_000;
const MAX_TABLE_ROWS = 10;
const MAX_TABLES = 3;

type CandidateSeed = Omit<ImportDetectedCandidate, 'id'>;

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function cleanText(value: string): string {
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/g, '')
      .replace(/\r\n/g, '\n')
      .trim()
  );
}

function detectDelimiterSample(content: string): string {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? '';
  const delimiters = [',', ';', '\t', '|'];
  const scored = delimiters.map((delimiter) => ({
    delimiter,
    score: firstLine.split(delimiter).length,
  }));

  return scored.sort((a, b) => b.score - a.score)[0]?.delimiter ?? ',';
}

function snippetAround(source: string, index: number, length: number): string {
  const start = Math.max(0, index - 28);
  const end = Math.min(source.length, index + length + 28);

  return source.slice(start, end).replace(/\s+/g, ' ').trim();
}

function pushCandidate(
  bucket: Map<string, ImportDetectedCandidate>,
  candidate: CandidateSeed,
): void {
  const value = candidate.value.trim();

  if (!value) {
    return;
  }

  const key = `${candidate.type}:${value.toLocaleLowerCase('vi-VN')}`;

  if (bucket.has(key)) {
    return;
  }

  bucket.set(key, {
    id: `cand_${bucket.size + 1}`,
    ...candidate,
    value,
  });
}

function detectColumns(headers: string[]): ImportDetectedColumn[] {
  const mappings: Array<{
    matcher: RegExp;
    mappedField: string;
    confidence: CandidateConfidence;
  }> = [
    {
      matcher: /m[aã]\s*h[ồo]\s*s[ơo]|case\s*code/i,
      mappedField: 'Mã hồ sơ',
      confidence: 'cao',
    },
    {
      matcher: /t[eê]n\s*v[ụu]\s*[áa]n|case\s*title/i,
      mappedField: 'Tên vụ án',
      confidence: 'cao',
    },
    {
      matcher: /b[ịi]\s*can|ng[ườu]i\s*li[êe]n\s*quan|h[ọo]\s*t[êe]n/i,
      mappedField: 'Tên bị can/người liên quan',
      confidence: 'vừa',
    },
    {
      matcher: /t[ộo]i\s*danh|t[ộo]i/i,
      mappedField: 'Tội danh',
      confidence: 'vừa',
    },
    {
      matcher: /ng[aà]y|date/i,
      mappedField: 'Ngày',
      confidence: 'thấp',
    },
    {
      matcher: /c[ơo]\s*quan|đ[ơo]n\s*v[ịi]|agency/i,
      mappedField: 'Cơ quan',
      confidence: 'thấp',
    },
    {
      matcher: /đ[ịi]a\s*ch[ỉi]|address/i,
      mappedField: 'Địa chỉ',
      confidence: 'thấp',
    },
  ];

  return headers
    .map((header, index) => {
      const matched = mappings.find((item) => item.matcher.test(header));

      if (!matched) {
        return null;
      }

      return {
        id: `col_${index + 1}`,
        columnName: header,
        mappedField: matched.mappedField,
        confidence: matched.confidence,
      };
    })
    .filter((item): item is ImportDetectedColumn => Boolean(item));
}

function detectCandidatesFromText(source: string): ImportDetectedCandidate[] {
  const bucket = new Map<string, ImportDetectedCandidate>();

  const text = cleanText(source);

  if (!text) {
    return [];
  }

  const caseCodeRegex = /\b[A-ZĐ]{2,10}[-/]\d{2,4}[-/]\d{2,8}\b/gu;
  const documentCodeRegex = /Số\s*:\s*([^\n\r]{1,80})/giu;
  const dateSlashRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/gu;
  const vietnameseDateRegex =
    /ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}/giu;
  const nameRegex =
    /(?:bị can|họ tên|ông|bà)\s*[:-]?\s*([A-ZÀ-Ỹ][\p{L}\s]{3,80})/gu;
  const offenseRegex = /(?:tội danh|tội)\s*[:-]?\s*([^\n\r,.]{3,120})/giu;
  const agencyRegex =
    /(Viện kiểm sát nhân dân[^\n\r]{0,80}|Cơ quan [^\n\r]{0,80})/giu;
  const addressRegex =
    /(?:địa chỉ|nơi cư trú|thường trú)\s*[:-]?\s*([^\n\r]{5,140})/giu;

  for (const match of text.matchAll(caseCodeRegex)) {
    pushCandidate(bucket, {
      type: 'caseCode',
      label: 'Mã hồ sơ',
      value: match[0],
      confidence: 'cao',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(documentCodeRegex)) {
    pushCandidate(bucket, {
      type: 'documentCode',
      label: 'Số văn bản',
      value: match[1] ?? '',
      confidence: 'cao',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(dateSlashRegex)) {
    pushCandidate(bucket, {
      type: 'date',
      label: 'Ngày tháng',
      value: match[0],
      confidence: 'vừa',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(vietnameseDateRegex)) {
    pushCandidate(bucket, {
      type: 'date',
      label: 'Ngày tháng',
      value: match[0],
      confidence: 'vừa',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(nameRegex)) {
    pushCandidate(bucket, {
      type: 'personName',
      label: 'Tên người liên quan',
      value: (match[1] ?? '').replace(/\s+/g, ' ').trim(),
      confidence: 'vừa',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(offenseRegex)) {
    pushCandidate(bucket, {
      type: 'offense',
      label: 'Tội danh',
      value: (match[1] ?? '').replace(/\s+/g, ' ').trim(),
      confidence: 'vừa',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(agencyRegex)) {
    pushCandidate(bucket, {
      type: 'agency',
      label: 'Cơ quan',
      value: match[0],
      confidence: 'thấp',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(addressRegex)) {
    pushCandidate(bucket, {
      type: 'address',
      label: 'Địa chỉ',
      value: (match[1] ?? '').replace(/\s+/g, ' ').trim(),
      confidence: 'thấp',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  return Array.from(bucket.values()).slice(0, 20);
}

function buildWorkbookPreview(workbook: XLSX.WorkBook): {
  tables: ImportTablePreview[];
  totalRows: number;
} {
  const tables: ImportTablePreview[] = [];
  let totalRows = 0;

  for (const sheetName of workbook.SheetNames.slice(0, MAX_TABLES)) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      continue;
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });

    totalRows += rawRows.length;

    const headers = Array.from(
      rawRows.reduce((acc, row) => {
        Object.keys(row).forEach((key) => {
          if (key !== '__EMPTY') {
            acc.add(String(key));
          }
        });

        return acc;
      }, new Set<string>()),
    );

    const rows = rawRows.slice(0, MAX_TABLE_ROWS).map((row) => {
      const normalized: Record<string, string> = {};

      for (const header of headers) {
        normalized[header] = String(row[header] ?? '').trim();
      }

      return normalized;
    });

    tables.push({
      sheetName,
      headers,
      rows,
      totalRows: rawRows.length,
      candidateColumns: detectColumns(headers),
    });
  }

  return {
    tables,
    totalRows,
  };
}

@Injectable()
export class FileExtractionService {
  async extractFile(
    absolutePath: string,
    extension: string,
    mimeType: string | null,
  ): Promise<ImportExtractionResult> {
    try {
      switch (extension) {
        case '.pdf':
          return await this.extractPdf(absolutePath);
        case '.docx':
          return await this.extractDocx(absolutePath);
        case '.doc':
          return this.extractDoc();
        case '.xlsx':
        case '.xls':
          return await this.extractSpreadsheet(absolutePath);
        case '.csv':
          return await this.extractCsv(absolutePath);
        case '.txt':
          return await this.extractTxt(absolutePath);
        case '.json':
          return await this.extractJson(absolutePath);
        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.webp':
        case '.tif':
        case '.tiff':
          return this.extractImage();
        default:
          return {
            extractionStatus: 'REJECTED',
            rawText: null,
            parsedJson: null,
            warnings: [
              `Định dạng ${extension || mimeType || 'không xác định'} chưa được hỗ trợ.`,
            ],
            errorMessage: 'Định dạng tệp không được hỗ trợ.',
            candidates: [],
            previewText: null,
            totalRows: 0,
          };
      }
    } catch (error: any) {
      return {
        extractionStatus: 'FAILED',
        rawText: null,
        parsedJson: null,
        warnings: [],
        errorMessage:
          typeof error?.message === 'string'
            ? error.message
            : 'Không thể trích xuất dữ liệu từ tệp này.',
        candidates: [],
        previewText: null,
        totalRows: 0,
      };
    }
  }

  private async extractPdf(
    absolutePath: string,
  ): Promise<ImportExtractionResult> {
    const buffer = await fs.promises.readFile(absolutePath);
    const parser = new PDFParse({
      data: buffer,
    });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = cleanText(parsed.text ?? '');
    const warnings: string[] = [];

    if (!text) {
      warnings.push('PDF có thể là bản scan, chưa trích xuất được chữ.');
    }

    return {
      extractionStatus: warnings.length ? 'PARSED_WITH_WARNINGS' : 'PARSED',
      rawText: text ? truncateText(text, MAX_TEXT_LENGTH) : null,
      parsedJson: {
        kind: 'text',
      },
      warnings,
      errorMessage: null,
      candidates: detectCandidatesFromText(text),
      previewText: text ? truncateText(text, MAX_PREVIEW_TEXT_LENGTH) : null,
      totalRows: 0,
    };
  }

  private async extractDocx(
    absolutePath: string,
  ): Promise<ImportExtractionResult> {
    const parsed = await mammoth.extractRawText({
      path: absolutePath,
    });
    const text = cleanText(parsed.value ?? '');
    const warnings = (parsed.messages ?? [])
      .map((item) => item.message)
      .slice(0, 10);

    return {
      extractionStatus: warnings.length ? 'PARSED_WITH_WARNINGS' : 'PARSED',
      rawText: text ? truncateText(text, MAX_TEXT_LENGTH) : null,
      parsedJson: {
        kind: 'text',
      },
      warnings,
      errorMessage: null,
      candidates: detectCandidatesFromText(text),
      previewText: text ? truncateText(text, MAX_PREVIEW_TEXT_LENGTH) : null,
      totalRows: 0,
    };
  }

  private extractDoc(): ImportExtractionResult {
    return {
      extractionStatus: 'STORED_ONLY',
      rawText: null,
      parsedJson: {
        kind: 'binary',
      },
      warnings: [
        'File DOC đã được lưu, nhưng hệ thống chưa trích xuất ổn định nội dung từ định dạng này.',
      ],
      errorMessage: null,
      candidates: [],
      previewText: null,
      totalRows: 0,
    };
  }

  private async extractSpreadsheet(
    absolutePath: string,
  ): Promise<ImportExtractionResult> {
    const workbook = XLSX.readFile(absolutePath, {
      cellDates: false,
    });
    const preview = buildWorkbookPreview(workbook);
    const flattenedText = preview.tables
      .flatMap((table) => [
        table.sheetName,
        table.headers.join(' | '),
        ...table.rows.map((row) => Object.values(row).join(' | ')),
      ])
      .join('\n');

    return {
      extractionStatus: 'PARSED',
      rawText: truncateText(cleanText(flattenedText), MAX_TEXT_LENGTH) || null,
      parsedJson: {
        kind: 'table',
        sheetNames: workbook.SheetNames,
        tables: preview.tables,
      },
      warnings: [],
      errorMessage: null,
      candidates: detectCandidatesFromText(flattenedText),
      previewText:
        truncateText(cleanText(flattenedText), MAX_PREVIEW_TEXT_LENGTH) || null,
      totalRows: preview.totalRows,
    };
  }

  private async extractCsv(
    absolutePath: string,
  ): Promise<ImportExtractionResult> {
    const fileBuffer = await fs.promises.readFile(absolutePath);
    const content = this.decodeText(fileBuffer);
    const delimiter = detectDelimiterSample(content);
    const workbook = XLSX.read(content, {
      type: 'string',
      raw: false,
      FS: delimiter,
    });

    const preview = buildWorkbookPreview(workbook);
    const flattenedText = cleanText(content);

    return {
      extractionStatus: 'PARSED',
      rawText: truncateText(flattenedText, MAX_TEXT_LENGTH) || null,
      parsedJson: {
        kind: 'table',
        sheetNames: workbook.SheetNames,
        tables: preview.tables,
      },
      warnings: [],
      errorMessage: null,
      candidates: detectCandidatesFromText(flattenedText),
      previewText: truncateText(flattenedText, MAX_PREVIEW_TEXT_LENGTH) || null,
      totalRows: preview.totalRows,
    };
  }

  private async extractTxt(
    absolutePath: string,
  ): Promise<ImportExtractionResult> {
    const buffer = await fs.promises.readFile(absolutePath);
    const text = cleanText(this.decodeText(buffer));

    return {
      extractionStatus: 'PARSED',
      rawText: truncateText(text, MAX_TEXT_LENGTH) || null,
      parsedJson: {
        kind: 'text',
      },
      warnings: [],
      errorMessage: null,
      candidates: detectCandidatesFromText(text),
      previewText: truncateText(text, MAX_PREVIEW_TEXT_LENGTH) || null,
      totalRows: 0,
    };
  }

  private async extractJson(
    absolutePath: string,
  ): Promise<ImportExtractionResult> {
    const raw = await fs.promises.readFile(absolutePath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown> | unknown[];
    const pretty = JSON.stringify(parsed, null, 2);
    const topLevelKeys = Array.isArray(parsed)
      ? ['[array]']
      : Object.keys(parsed ?? {}).slice(0, 20);

    return {
      extractionStatus: 'PARSED',
      rawText: truncateText(pretty, MAX_TEXT_LENGTH),
      parsedJson: {
        kind: 'json',
        preview: truncateText(pretty, MAX_PREVIEW_TEXT_LENGTH),
        topLevelKeys,
      },
      warnings: [],
      errorMessage: null,
      candidates: detectCandidatesFromText(pretty),
      previewText: truncateText(pretty, MAX_PREVIEW_TEXT_LENGTH),
      totalRows: 0,
    };
  }

  private extractImage(): ImportExtractionResult {
    return {
      extractionStatus: 'STORED_ONLY',
      rawText: null,
      parsedJson: {
        kind: 'image',
      },
      warnings: ['Không trích xuất được nội dung, nhưng file gốc đã được lưu.'],
      errorMessage: null,
      candidates: [],
      previewText: null,
      totalRows: 0,
    };
  }

  private decodeText(buffer: Buffer): string {
    const attempts: BufferEncoding[] = ['utf8', 'utf16le', 'latin1'];

    for (const encoding of attempts) {
      const text = buffer.toString(encoding);

      if (!text.includes('\u0000')) {
        return text;
      }
    }

    return buffer.toString('utf8');
  }
}
