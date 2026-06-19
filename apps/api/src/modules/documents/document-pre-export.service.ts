import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import PizZip from 'pizzip';
import * as xpath from 'xpath';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import { PrismaService } from '../../prisma/prisma.service';

type PageOrientation = 'portrait' | 'landscape';
type PageGutterPosition = 'left' | 'top';
type TextAlignment = 'left' | 'center' | 'right' | 'justify' | null;

export type GeneratedDocumentPreExportPageSetup = {
  enabled: boolean;
  topCm: number;
  bottomCm: number;
  leftCm: number;
  rightCm: number;
  gutterCm: number;
  gutterPosition: PageGutterPosition;
  orientation: PageOrientation;
  paperSize: 'A4';
};

export type GeneratedDocumentPreExportStyle = {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  alignment: TextAlignment;
};

export type GeneratedDocumentPreExportStyleRule = {
  id: string;
  enabled: boolean;
  targetText: string;
  applyToAll: boolean;
  style: GeneratedDocumentPreExportStyle;
};

export type GeneratedDocumentPreExportManualBlankField = {
  id: string;
  enabled: boolean;
  label: string;
  value: string;
  contextBefore: string;
  contextAfter: string;
  occurrenceKey: string;
};

export type GeneratedDocumentPreExportConfig = {
  version: 1;
  pageSetup: GeneratedDocumentPreExportPageSetup;
  styleRules: GeneratedDocumentPreExportStyleRule[];
  manualBlankFields: GeneratedDocumentPreExportManualBlankField[];
};

export type GeneratedDocumentPreExportBlankCandidate = {
  id: string;
  label: string;
  contextBefore: string;
  contextAfter: string;
  occurrenceKey: string;
  isDateLike: boolean;
  defaultEnabled: boolean;
};

export type LoadGeneratedDocumentPreExportConfigResult = {
  documentId: string;
  hasSavedConfig: boolean;
  config: GeneratedDocumentPreExportConfig;
  warnings: string[];
};

export type ApplyGeneratedDocumentPreExportConfigResult = {
  buffer: Buffer;
  applied: boolean;
  warnings: string[];
  matchedStyleCount: number;
  replacedBlankCount: number;
};

type InternalBlankOccurrence = GeneratedDocumentPreExportBlankCandidate & {
  xmlFileName: string;
  paragraphIndex: number;
  start: number;
  end: number;
  matchedText: string;
};

type ParagraphRunSegment = {
  runElement: any;
  text: string;
  start: number;
  end: number;
};

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const selectWord = xpath.useNamespaces({
  w: WORD_NS,
});

const DEFAULT_PAGE_SETUP: GeneratedDocumentPreExportPageSetup = {
  enabled: false,
  topCm: 2,
  bottomCm: 2,
  leftCm: 3,
  rightCm: 2,
  gutterCm: 0,
  gutterPosition: 'left',
  orientation: 'portrait',
  paperSize: 'A4',
};

const DEFAULT_STYLE_TEMPLATE: GeneratedDocumentPreExportStyle = {
  fontFamily: 'Times New Roman',
  fontSize: 13,
  bold: false,
  italic: false,
  underline: false,
  alignment: null,
};

const BLANK_PATTERN = /((?:\.|…|_|-){3,})/gu;
const MAX_STYLE_RULES = 20;
const MAX_MANUAL_BLANK_FIELDS = 200;
const MAX_TARGET_TEXT_LENGTH = 200;
const MAX_FONT_FAMILY_LENGTH = 100;
const MAX_MANUAL_VALUE_LENGTH = 500;
const MAX_LABEL_LENGTH = 120;
const MAX_CONTEXT_LENGTH = 80;

function parseBigIntId(value: string | bigint, entityName = 'ID'): bigint {
  try {
    const parsed = typeof value === 'bigint' ? value : BigInt(String(value));

    if (parsed <= 0n) {
      throw new Error('Invalid positive id');
    }

    return parsed;
  } catch {
    throw new BadRequestException(`${entityName} không hợp lệ.`);
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return clamp(parsed, min, max);
}

function normalizeTrimmedString(
  value: unknown,
  fallback = '',
  maxLength = 255,
): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim().slice(0, maxLength);
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function escapeForDisplay(value: string): string {
  return collapseWhitespace(value).slice(0, MAX_CONTEXT_LENGTH);
}

function buildStableHash(parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class DocumentPreExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paths: WorkspacePathsService,
  ) {}

  async getConfig(
    documentIdRaw: string,
  ): Promise<LoadGeneratedDocumentPreExportConfigResult> {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');
    await this.ensureGeneratedDocumentExists(documentId);
    return this.readConfigForDocument(documentId);
  }

  async saveConfig(
    documentIdRaw: string,
    rawConfig: unknown,
  ): Promise<LoadGeneratedDocumentPreExportConfigResult> {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');
    await this.ensureGeneratedDocumentExists(documentId);

    const normalized = this.normalizeConfig(rawConfig, {
      useDefaultPresets: true,
    });
    const filePath = this.getConfigFilePath(documentId);

    fs.mkdirSync(path.dirname(filePath), {
      recursive: true,
    });
    fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf8');

    return {
      documentId: String(documentId),
      hasSavedConfig: true,
      config: normalized,
      warnings: [],
    };
  }

  loadNormalizedConfigForDocumentId(
    documentIdRaw: string | bigint,
  ): LoadGeneratedDocumentPreExportConfigResult {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');
    return this.readConfigForDocument(documentId);
  }

  createDefaultConfig(): GeneratedDocumentPreExportConfig {
    return {
      version: 1,
      pageSetup: {
        ...DEFAULT_PAGE_SETUP,
      },
      styleRules: [
        {
          id: 'preset_agency_area_7',
          enabled: false,
          targetText: 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
          applyToAll: true,
          style: {
            ...DEFAULT_STYLE_TEMPLATE,
            bold: true,
            alignment: 'center',
          },
        },
        {
          id: 'preset_header_agency',
          enabled: false,
          targetText: 'VIỆN KIỂM SÁT NHÂN DÂN',
          applyToAll: true,
          style: {
            ...DEFAULT_STYLE_TEMPLATE,
            alignment: 'center',
          },
        },
        {
          id: 'preset_header_so',
          enabled: false,
          targetText: 'Số:',
          applyToAll: true,
          style: {
            ...DEFAULT_STYLE_TEMPLATE,
          },
        },
      ],
      manualBlankFields: [],
    };
  }

  hasEnabledCustomizations(config: GeneratedDocumentPreExportConfig): boolean {
    if (config.pageSetup.enabled) {
      return true;
    }

    if (
      config.styleRules.some(
        (rule) => rule.enabled && rule.targetText.trim().length > 0,
      )
    ) {
      return true;
    }

    return config.manualBlankFields.some(
      (field) => field.enabled && field.value.trim().length > 0,
    );
  }

  scanBlankCandidatesFromDocxBuffer(
    buffer: Buffer,
    options?: {
      includeDateLike?: boolean;
    },
  ): GeneratedDocumentPreExportBlankCandidate[] {
    return this.scanBlankOccurrencesFromDocxBuffer(buffer, options).map(
      (item) => ({
        id: item.id,
        label: item.label,
        contextBefore: item.contextBefore,
        contextAfter: item.contextAfter,
        occurrenceKey: item.occurrenceKey,
        isDateLike: item.isDateLike,
        defaultEnabled: item.defaultEnabled,
      }),
    );
  }

  applyConfigToDocxBuffer(
    buffer: Buffer,
    config: GeneratedDocumentPreExportConfig,
  ): ApplyGeneratedDocumentPreExportConfigResult {
    if (!this.hasEnabledCustomizations(config)) {
      return {
        buffer,
        applied: false,
        warnings: [],
        matchedStyleCount: 0,
        replacedBlankCount: 0,
      };
    }

    const zip = new PizZip(buffer);
    const warnings: string[] = [];
    let applied = false;
    let matchedStyleCount = 0;
    let replacedBlankCount = 0;

    try {
      const pageSetupApplied = this.applyPageSetup(zip, config.pageSetup);
      applied = applied || pageSetupApplied;
    } catch (error: any) {
      warnings.push(`Không áp dụng được chỉnh lề: ${getErrorMessage(error)}`);
    }

    try {
      const replacementResult = this.applyManualBlankFields(zip, config);
      if (replacementResult.applied) {
        applied = true;
      }
      replacedBlankCount += replacementResult.replacedBlankCount;
      warnings.push(...replacementResult.warnings);
    } catch (error: any) {
      warnings.push(
        `Không áp dụng được chỗ trống cần điền: ${getErrorMessage(error)}`,
      );
    }

    try {
      const styleResult = this.applyStyleRules(zip, config.styleRules);
      if (styleResult.applied) {
        applied = true;
      }
      matchedStyleCount += styleResult.matchedStyleCount;
      warnings.push(...styleResult.warnings);
    } catch (error: any) {
      warnings.push(`Không áp dụng được chỉnh chữ: ${getErrorMessage(error)}`);
    }

    return {
      buffer: zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      }),
      applied,
      warnings,
      matchedStyleCount,
      replacedBlankCount,
    };
  }

  private scanBlankOccurrencesFromDocxBuffer(
    buffer: Buffer,
    options?: {
      includeDateLike?: boolean;
    },
  ): InternalBlankOccurrence[] {
    const zip = new PizZip(buffer);
    const includeDateLike = normalizeBoolean(options?.includeDateLike, false);
    const occurrences: InternalBlankOccurrence[] = [];
    let candidateIndex = 0;

    for (const fileName of this.getTextXmlFileNames(zip)) {
      const file = zip.file(fileName);

      if (!file) {
        continue;
      }

      const doc = this.parseXml(file.asText());
      const paragraphs = this.getParagraphElements(doc);

      paragraphs.forEach((paragraph, paragraphIndex) => {
        const paragraphText = this.getParagraphText(paragraph);

        if (collapseWhitespace(paragraphText).length === 0) {
          return;
        }

        let match: RegExpExecArray | null;
        let blankIndex = 0;

        BLANK_PATTERN.lastIndex = 0;

        while ((match = BLANK_PATTERN.exec(paragraphText)) !== null) {
          blankIndex += 1;

          const matchedText = String(match[1] ?? '');
          const start = match.index;
          const end = start + matchedText.length;
          const contextBefore = escapeForDisplay(
            paragraphText.slice(Math.max(0, start - MAX_CONTEXT_LENGTH), start),
          );
          const contextAfter = escapeForDisplay(
            paragraphText.slice(end, end + MAX_CONTEXT_LENGTH),
          );
          const nearbyText = `${contextBefore} ${contextAfter}`.toLowerCase();
          const isDateLike = /(?:^|\s)(ngày|tháng|năm)(?:\s|$)/iu.test(
            nearbyText,
          );

          if (isDateLike && !includeDateLike) {
            continue;
          }

          candidateIndex += 1;

          occurrences.push({
            id: `blank_${String(candidateIndex).padStart(3, '0')}`,
            label: this.buildCandidateLabel(
              contextBefore,
              contextAfter,
              candidateIndex,
            ),
            contextBefore,
            contextAfter,
            occurrenceKey: buildStableHash([
              fileName,
              String(paragraphIndex),
              String(blankIndex),
              matchedText,
              contextBefore,
              contextAfter,
            ]),
            isDateLike,
            defaultEnabled: !isDateLike,
            xmlFileName: fileName,
            paragraphIndex,
            start,
            end,
            matchedText,
          });
        }
      });
    }

    return occurrences;
  }

  private getTextXmlFileNames(zip: PizZip): string[] {
    const files = Object.keys((zip as any).files ?? {});

    return files
      .filter((fileName) => {
        return (
          fileName === 'word/document.xml' ||
          /^word\/header\d+\.xml$/u.test(fileName) ||
          /^word\/footer\d+\.xml$/u.test(fileName)
        );
      })
      .sort();
  }

  private buildCandidateLabel(
    contextBefore: string,
    contextAfter: string,
    candidateIndex: number,
  ): string {
    const quotedBefore = this.pickDisplayAnchor(contextBefore);

    if (quotedBefore) {
      return `Nội dung sau cụm "${quotedBefore}"`;
    }

    const quotedAfter = this.pickDisplayAnchor(contextAfter);

    if (quotedAfter) {
      return `Nội dung trước cụm "${quotedAfter}"`;
    }

    return `Chỗ trống ${candidateIndex}`;
  }

  private pickDisplayAnchor(value: string): string {
    const words = collapseWhitespace(value).split(' ').filter(Boolean);

    if (words.length === 0) {
      return '';
    }

    return words.slice(-4).join(' ').slice(0, 40);
  }

  private applyPageSetup(
    zip: PizZip,
    pageSetup: GeneratedDocumentPreExportPageSetup,
  ): boolean {
    if (!pageSetup.enabled) {
      return false;
    }

    const documentFile = zip.file('word/document.xml');

    if (!documentFile) {
      return false;
    }

    const originalDocumentXml = documentFile.asText();
    const documentDoc = this.parseXml(originalDocumentXml);
    const sectionNodes = this.selectElements('//w:sectPr', documentDoc);

    if (sectionNodes.length === 0) {
      return false;
    }

    const topTwips = this.cmToTwips(pageSetup.topCm);
    const bottomTwips = this.cmToTwips(pageSetup.bottomCm);
    const leftTwips = this.cmToTwips(pageSetup.leftCm);
    const rightTwips = this.cmToTwips(pageSetup.rightCm);
    const gutterTwips = this.cmToTwips(pageSetup.gutterCm);
    const pageSize = this.getPageSizeTwips(
      pageSetup.paperSize,
      pageSetup.orientation,
    );

    sectionNodes.forEach((sectionNode) => {
      const pageMargins = this.ensureChildElement(sectionNode, 'pgMar');
      const pageSizeNode = this.ensureChildElement(sectionNode, 'pgSz');

      pageMargins.setAttribute('w:top', String(topTwips));
      pageMargins.setAttribute('w:bottom', String(bottomTwips));
      pageMargins.setAttribute('w:left', String(leftTwips));
      pageMargins.setAttribute('w:right', String(rightTwips));
      pageMargins.setAttribute('w:gutter', String(gutterTwips));

      pageSizeNode.setAttribute('w:w', String(pageSize.width));
      pageSizeNode.setAttribute('w:h', String(pageSize.height));
      pageSizeNode.setAttribute('w:orient', pageSetup.orientation);
    });

    const nextDocumentXml = this.serializeXml(documentDoc, originalDocumentXml);

    if (nextDocumentXml !== originalDocumentXml) {
      zip.file('word/document.xml', nextDocumentXml);
    }

    const settingsFile = zip.file('word/settings.xml');

    if (settingsFile) {
      const originalSettingsXml = settingsFile.asText();
      const settingsDoc = this.parseXml(originalSettingsXml);
      const settingsRoot = this.selectElements('/w:settings', settingsDoc)[0];

      if (settingsRoot) {
        const existing = this.selectElements(
          './w:gutterAtTop',
          settingsRoot,
        )[0];

        if (pageSetup.gutterPosition === 'top') {
          if (!existing) {
            settingsRoot.appendChild(
              settingsDoc.createElementNS(WORD_NS, 'w:gutterAtTop'),
            );
          }
        } else if (existing?.parentNode) {
          existing.parentNode.removeChild(existing);
        }

        const nextSettingsXml = this.serializeXml(
          settingsDoc,
          originalSettingsXml,
        );

        if (nextSettingsXml !== originalSettingsXml) {
          zip.file('word/settings.xml', nextSettingsXml);
        }
      }
    }

    return true;
  }

  private applyManualBlankFields(
    zip: PizZip,
    config: GeneratedDocumentPreExportConfig,
  ): {
    applied: boolean;
    replacedBlankCount: number;
    warnings: string[];
  } {
    const activeFields = config.manualBlankFields.filter(
      (field) => field.enabled && field.value.trim().length > 0,
    );

    if (activeFields.length === 0) {
      return {
        applied: false,
        replacedBlankCount: 0,
        warnings: [],
      };
    }

    const warnings: string[] = [];
    const fieldByOccurrenceKey = new Map(
      activeFields.map((field) => [field.occurrenceKey, field]),
    );
    const matchedKeys = new Set<string>();
    let replacedBlankCount = 0;
    let applied = false;

    for (const fileName of this.getTextXmlFileNames(zip)) {
      const file = zip.file(fileName);

      if (!file) {
        continue;
      }

      const originalXml = file.asText();
      const doc = this.parseXml(originalXml);
      const paragraphs = this.getParagraphElements(doc);
      let fileChanged = false;

      paragraphs.forEach((paragraph, paragraphIndex) => {
        const paragraphText = this.getParagraphText(paragraph);

        if (collapseWhitespace(paragraphText).length === 0) {
          return;
        }

        const replacements: Array<{
          occurrenceKey: string;
          start: number;
          end: number;
          value: string;
        }> = [];

        let match: RegExpExecArray | null;
        let blankIndex = 0;
        BLANK_PATTERN.lastIndex = 0;

        while ((match = BLANK_PATTERN.exec(paragraphText)) !== null) {
          blankIndex += 1;

          const matchedText = String(match[1] ?? '');
          const start = match.index;
          const end = start + matchedText.length;
          const contextBefore = escapeForDisplay(
            paragraphText.slice(Math.max(0, start - MAX_CONTEXT_LENGTH), start),
          );
          const contextAfter = escapeForDisplay(
            paragraphText.slice(end, end + MAX_CONTEXT_LENGTH),
          );
          const occurrenceKey = buildStableHash([
            fileName,
            String(paragraphIndex),
            String(blankIndex),
            matchedText,
            contextBefore,
            contextAfter,
          ]);
          const field = fieldByOccurrenceKey.get(occurrenceKey);

          if (!field) {
            continue;
          }

          matchedKeys.add(occurrenceKey);
          replacements.push({
            occurrenceKey,
            start,
            end,
            value: field.value,
          });
        }

        replacements
          .sort((a, b) => b.start - a.start)
          .forEach((replacement) => {
            const changed = this.replaceTextRangeInParagraph(
              paragraph,
              replacement.start,
              replacement.end,
              replacement.value,
            );

            if (changed) {
              fileChanged = true;
              applied = true;
              replacedBlankCount += 1;
            }
          });
      });

      if (fileChanged) {
        zip.file(fileName, this.serializeXml(doc, originalXml));
      }
    }

    for (const field of activeFields) {
      if (!matchedKeys.has(field.occurrenceKey)) {
        warnings.push(
          `Không tìm thấy chỗ trống đã lưu "${field.label}" trong bản Word hiện tại.`,
        );
      }
    }

    return {
      applied,
      replacedBlankCount,
      warnings,
    };
  }

  private applyStyleRules(
    zip: PizZip,
    styleRules: GeneratedDocumentPreExportStyleRule[],
  ): {
    applied: boolean;
    matchedStyleCount: number;
    warnings: string[];
  } {
    const activeRules = styleRules.filter(
      (rule) => rule.enabled && rule.targetText.trim().length > 0,
    );

    if (activeRules.length === 0) {
      return {
        applied: false,
        matchedStyleCount: 0,
        warnings: [],
      };
    }

    const warnings: string[] = [];
    const matchCountByRule = new Map<string, number>();
    let matchedStyleCount = 0;
    let applied = false;

    for (const fileName of this.getTextXmlFileNames(zip)) {
      const file = zip.file(fileName);

      if (!file) {
        continue;
      }

      const originalXml = file.asText();
      const doc = this.parseXml(originalXml);
      const paragraphs = this.getParagraphElements(doc);
      let fileChanged = false;

      for (const rule of activeRules) {
        if (!rule.applyToAll && (matchCountByRule.get(rule.id) ?? 0) > 0) {
          continue;
        }

        for (const paragraph of paragraphs) {
          if (!rule.applyToAll && (matchCountByRule.get(rule.id) ?? 0) > 0) {
            break;
          }

          const paragraphText = this.getParagraphText(paragraph);

          if (
            collapseWhitespace(paragraphText).length === 0 ||
            !paragraphText.includes(rule.targetText)
          ) {
            continue;
          }

          const matches = this.findAllMatches(paragraphText, rule.targetText);

          if (matches.length === 0) {
            continue;
          }

          const targets = rule.applyToAll ? matches : matches.slice(0, 1);

          targets
            .sort((a, b) => b.start - a.start)
            .forEach((match) => {
              const changed = this.styleTextRangeInParagraph(
                paragraph,
                match.start,
                match.end,
                rule.style,
              );

              if (changed) {
                fileChanged = true;
                applied = true;
                matchedStyleCount += 1;
                matchCountByRule.set(
                  rule.id,
                  (matchCountByRule.get(rule.id) ?? 0) + 1,
                );
              }
            });

          if (rule.style.alignment !== null) {
            this.applyParagraphAlignment(paragraph, rule.style.alignment);
            fileChanged = true;
            applied = true;
          }
        }
      }

      if (fileChanged) {
        zip.file(fileName, this.serializeXml(doc, originalXml));
      }
    }

    for (const rule of activeRules) {
      if ((matchCountByRule.get(rule.id) ?? 0) === 0) {
        warnings.push(
          `Không tìm thấy đoạn chữ "${rule.targetText}" để áp dụng chỉnh chữ.`,
        );
      }
    }

    return {
      applied,
      matchedStyleCount,
      warnings,
    };
  }

  private parseXml(xml: string): any {
    return new DOMParser().parseFromString(xml, 'application/xml');
  }

  private serializeXml(doc: any, originalXml: string): string {
    const serialized = new XMLSerializer().serializeToString(doc);
    const declarationMatch = originalXml.match(/^<\?xml[\s\S]*?\?>/u);

    if (declarationMatch && !serialized.startsWith('<?xml')) {
      return `${declarationMatch[0]}${serialized}`;
    }

    return serialized;
  }

  private selectElements(expression: string, node: any): any[] {
    return (selectWord(expression, node) as any[]).filter(Boolean);
  }

  private getParagraphElements(doc: any): any[] {
    return this.selectElements('//w:p', doc);
  }

  private getParagraphText(paragraph: any): string {
    return this.getParagraphRunSegments(paragraph)
      .map((segment) => segment.text)
      .join('');
  }

  private getParagraphRunSegments(paragraph: any): ParagraphRunSegment[] {
    const runs = this.selectElements('.//w:r', paragraph);
    const segments: ParagraphRunSegment[] = [];
    let cursor = 0;

    for (const run of runs) {
      const text = this.getRunText(run);

      if (text.length === 0) {
        continue;
      }

      segments.push({
        runElement: run,
        text,
        start: cursor,
        end: cursor + text.length,
      });
      cursor += text.length;
    }

    return segments;
  }

  private getRunText(runElement: any): string {
    const pieces: string[] = [];
    const descendants = this.walkDescendants(runElement);

    for (const node of descendants) {
      const localName = this.getNodeLocalName(node);

      if (localName === 't' || localName === 'instrText') {
        pieces.push(String(node.textContent ?? ''));
        continue;
      }

      if (localName === 'tab') {
        pieces.push('\t');
        continue;
      }

      if (localName === 'br' || localName === 'cr') {
        pieces.push('\n');
      }
    }

    return pieces.join('');
  }

  private walkDescendants(node: any): any[] {
    const nodes: any[] = [];
    const queue = Array.from(node?.childNodes ?? []);

    while (queue.length > 0) {
      const current: any = queue.shift();

      if (!current) {
        continue;
      }

      nodes.push(current);
      queue.unshift(...Array.from(current.childNodes ?? []));
    }

    return nodes;
  }

  private replaceTextRangeInParagraph(
    paragraph: any,
    start: number,
    end: number,
    newText: string,
  ): boolean {
    const segments = this.getParagraphRunSegments(paragraph);
    const affectedSegments = segments.filter(
      (segment) => segment.end > start && segment.start < end,
    );

    if (affectedSegments.length === 0) {
      return false;
    }

    const firstSegment = affectedSegments[0];
    const lastSegment = affectedSegments[affectedSegments.length - 1];
    const firstRun = firstSegment.runElement;
    const beforeText = firstSegment.text.slice(0, start - firstSegment.start);
    const afterText = lastSegment.text.slice(end - lastSegment.start);
    const replacementRuns: any[] = [];

    if (beforeText.length > 0) {
      replacementRuns.push(this.cloneRunWithText(firstRun, beforeText));
    }

    if (newText.length > 0) {
      replacementRuns.push(this.cloneRunWithText(firstRun, newText));
    }

    if (afterText.length > 0) {
      replacementRuns.push(
        this.cloneRunWithText(lastSegment.runElement, afterText),
      );
    }

    const parentNode = firstRun.parentNode;
    const nextSibling = lastSegment.runElement.nextSibling;

    affectedSegments
      .slice()
      .reverse()
      .forEach((segment) => {
        if (segment.runElement.parentNode) {
          segment.runElement.parentNode.removeChild(segment.runElement);
        }
      });

    replacementRuns.forEach((run) => {
      parentNode.insertBefore(run, nextSibling);
    });

    return true;
  }

  private styleTextRangeInParagraph(
    paragraph: any,
    start: number,
    end: number,
    style: GeneratedDocumentPreExportStyle,
  ): boolean {
    const segments = this.getParagraphRunSegments(paragraph);
    const affectedSegments = segments.filter(
      (segment) => segment.end > start && segment.start < end,
    );

    if (affectedSegments.length === 0) {
      return false;
    }

    for (const segment of affectedSegments.slice().reverse()) {
      const localStart = Math.max(0, start - segment.start);
      const localEnd = Math.min(segment.text.length, end - segment.start);
      const beforeText = segment.text.slice(0, localStart);
      const matchedText = segment.text.slice(localStart, localEnd);
      const afterText = segment.text.slice(localEnd);
      const replacements: any[] = [];

      if (beforeText.length > 0) {
        replacements.push(
          this.cloneRunWithText(segment.runElement, beforeText),
        );
      }

      if (matchedText.length > 0) {
        const styledRun = this.cloneRunWithText(
          segment.runElement,
          matchedText,
        );
        this.applyRunStyle(styledRun, style);
        replacements.push(styledRun);
      }

      if (afterText.length > 0) {
        replacements.push(this.cloneRunWithText(segment.runElement, afterText));
      }

      this.replaceNodeWithNodes(segment.runElement, replacements);
    }

    return true;
  }

  private replaceNodeWithNodes(node: any, replacements: any[]): void {
    const parentNode = node?.parentNode;

    if (!parentNode) {
      return;
    }

    const nextSibling = node.nextSibling;

    replacements.forEach((replacement) => {
      parentNode.insertBefore(replacement, nextSibling);
    });

    parentNode.removeChild(node);
  }

  private cloneRunWithText(runElement: any, text: string): any {
    const clone = runElement.cloneNode(true);
    this.clearRunContent(clone);
    clone.appendChild(this.createTextNode(clone.ownerDocument, text));
    return clone;
  }

  private clearRunContent(runElement: any): void {
    Array.from(runElement.childNodes ?? []).forEach((childNode: any) => {
      if (this.getNodeLocalName(childNode) !== 'rPr') {
        runElement.removeChild(childNode);
      }
    });
  }

  private createTextNode(doc: any, text: string): any {
    const textElement = doc.createElementNS(WORD_NS, 'w:t');

    if (/^\s|\s$/u.test(text) || text.includes('  ')) {
      textElement.setAttributeNS(XML_NS, 'xml:space', 'preserve');
    }

    textElement.appendChild(doc.createTextNode(text));
    return textElement;
  }

  private applyRunStyle(
    runElement: any,
    style: GeneratedDocumentPreExportStyle,
  ): void {
    const runProperties = this.ensureRunProperties(runElement);

    if (style.fontFamily.trim().length > 0) {
      const fontsNode = this.ensureChildElement(runProperties, 'rFonts');
      fontsNode.setAttribute('w:ascii', style.fontFamily);
      fontsNode.setAttribute('w:hAnsi', style.fontFamily);
      fontsNode.setAttribute('w:cs', style.fontFamily);
      fontsNode.setAttribute('w:eastAsia', style.fontFamily);
    }

    const halfPoints = String(Math.round(style.fontSize * 2));
    const sizeNode = this.ensureChildElement(runProperties, 'sz');
    sizeNode.setAttribute('w:val', halfPoints);
    const sizeCsNode = this.ensureChildElement(runProperties, 'szCs');
    sizeCsNode.setAttribute('w:val', halfPoints);

    if (style.bold) {
      this.ensureChildElement(runProperties, 'b');
    }

    if (style.italic) {
      this.ensureChildElement(runProperties, 'i');
    }

    if (style.underline) {
      const underlineNode = this.ensureChildElement(runProperties, 'u');
      underlineNode.setAttribute('w:val', 'single');
    }
  }

  private applyParagraphAlignment(
    paragraph: any,
    alignment: TextAlignment,
  ): void {
    if (!alignment) {
      return;
    }

    const paragraphProperties = this.ensureParagraphProperties(paragraph);
    const alignmentNode = this.ensureChildElement(paragraphProperties, 'jc');

    alignmentNode.setAttribute('w:val', alignment);
  }

  private ensureParagraphProperties(paragraph: any): any {
    const existing = this.selectElements('./w:pPr', paragraph)[0];

    if (existing) {
      return existing;
    }

    const paragraphProperties = paragraph.ownerDocument.createElementNS(
      WORD_NS,
      'w:pPr',
    );
    paragraph.insertBefore(paragraphProperties, paragraph.firstChild ?? null);
    return paragraphProperties;
  }

  private ensureRunProperties(runElement: any): any {
    const existing = this.selectElements('./w:rPr', runElement)[0];

    if (existing) {
      return existing;
    }

    const runProperties = runElement.ownerDocument.createElementNS(
      WORD_NS,
      'w:rPr',
    );
    runElement.insertBefore(runProperties, runElement.firstChild ?? null);
    return runProperties;
  }

  private ensureChildElement(parent: any, localName: string): any {
    const existing = this.selectElements(`./w:${localName}`, parent)[0];

    if (existing) {
      return existing;
    }

    const child = parent.ownerDocument.createElementNS(
      WORD_NS,
      `w:${localName}`,
    );
    parent.appendChild(child);
    return child;
  }

  private getNodeLocalName(node: any): string {
    if (!node) {
      return '';
    }

    if (typeof node.localName === 'string' && node.localName.length > 0) {
      return node.localName;
    }

    const nodeName = String(node.nodeName ?? '');
    const parts = nodeName.split(':');

    return parts[parts.length - 1] ?? '';
  }

  private cmToTwips(value: number): number {
    return Math.round((value / 2.54) * 1440);
  }

  private getPageSizeTwips(
    paperSize: 'A4',
    orientation: PageOrientation,
  ): {
    width: number;
    height: number;
  } {
    const size =
      paperSize === 'A4'
        ? {
            width: 11906,
            height: 16838,
          }
        : {
            width: 11906,
            height: 16838,
          };

    if (orientation === 'landscape') {
      return {
        width: size.height,
        height: size.width,
      };
    }

    return size;
  }

  private findAllMatches(
    sourceText: string,
    targetText: string,
  ): Array<{
    start: number;
    end: number;
  }> {
    const matches: Array<{
      start: number;
      end: number;
    }> = [];
    let cursor = 0;

    while (cursor < sourceText.length) {
      const index = sourceText.indexOf(targetText, cursor);

      if (index < 0) {
        break;
      }

      matches.push({
        start: index,
        end: index + targetText.length,
      });
      cursor = index + targetText.length;
    }

    return matches;
  }

  private async ensureGeneratedDocumentExists(
    documentId: bigint,
  ): Promise<void> {
    const document = await this.prisma.generated_documents.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Không tìm thấy biểu mẫu đã tạo.');
    }
  }

  private readConfigForDocument(
    documentId: bigint,
  ): LoadGeneratedDocumentPreExportConfigResult {
    const filePath = this.getConfigFilePath(documentId);

    if (!fs.existsSync(filePath)) {
      return {
        documentId: String(documentId),
        hasSavedConfig: false,
        config: this.createDefaultConfig(),
        warnings: [],
      };
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = content.trim().length > 0 ? JSON.parse(content) : {};
      const normalized = this.normalizeConfig(parsed, {
        useDefaultPresets: false,
      });

      return {
        documentId: String(documentId),
        hasSavedConfig: true,
        config: normalized,
        warnings: [],
      };
    } catch (error: any) {
      return {
        documentId: String(documentId),
        hasSavedConfig: false,
        config: this.createDefaultConfig(),
        warnings: [
          `Không đọc được file tùy chỉnh đã lưu. Hệ thống đang dùng mặc định an toàn. ${getErrorMessage(
            error,
          )}`.trim(),
        ],
      };
    }
  }

  private normalizeConfig(
    rawConfig: unknown,
    options: {
      useDefaultPresets: boolean;
    },
  ): GeneratedDocumentPreExportConfig {
    const root = asObject(rawConfig);
    const defaultConfig = this.createDefaultConfig();

    return {
      version: 1,
      pageSetup: this.normalizePageSetup(root.pageSetup),
      styleRules: this.normalizeStyleRules(
        root.styleRules,
        options.useDefaultPresets ? defaultConfig.styleRules : [],
      ),
      manualBlankFields: this.normalizeManualBlankFields(
        root.manualBlankFields,
      ),
    };
  }

  private normalizePageSetup(
    rawValue: unknown,
  ): GeneratedDocumentPreExportPageSetup {
    const pageSetup = asObject(rawValue);

    return {
      enabled: normalizeBoolean(pageSetup.enabled, DEFAULT_PAGE_SETUP.enabled),
      topCm: normalizeNumber(pageSetup.topCm, DEFAULT_PAGE_SETUP.topCm, 0, 10),
      bottomCm: normalizeNumber(
        pageSetup.bottomCm,
        DEFAULT_PAGE_SETUP.bottomCm,
        0,
        10,
      ),
      leftCm: normalizeNumber(
        pageSetup.leftCm,
        DEFAULT_PAGE_SETUP.leftCm,
        0,
        10,
      ),
      rightCm: normalizeNumber(
        pageSetup.rightCm,
        DEFAULT_PAGE_SETUP.rightCm,
        0,
        10,
      ),
      gutterCm: normalizeNumber(
        pageSetup.gutterCm,
        DEFAULT_PAGE_SETUP.gutterCm,
        0,
        10,
      ),
      gutterPosition:
        normalizeTrimmedString(
          pageSetup.gutterPosition,
          '',
          16,
        ).toLowerCase() === 'top'
          ? 'top'
          : 'left',
      orientation:
        normalizeTrimmedString(pageSetup.orientation, '', 16).toLowerCase() ===
        'landscape'
          ? 'landscape'
          : 'portrait',
      paperSize: 'A4',
    };
  }

  private normalizeStyleRules(
    rawValue: unknown,
    fallbackRules: GeneratedDocumentPreExportStyleRule[],
  ): GeneratedDocumentPreExportStyleRule[] {
    const source = asArray(rawValue);

    if (source.length === 0) {
      return fallbackRules.map((rule) => ({
        ...rule,
        style: {
          ...rule.style,
        },
      }));
    }

    const results: GeneratedDocumentPreExportStyleRule[] = [];

    for (const [index, entry] of source.entries()) {
      if (results.length >= MAX_STYLE_RULES) {
        break;
      }

      const item = asObject(entry);
      const style = asObject(item.style);
      const targetText = normalizeTrimmedString(
        item.targetText,
        '',
        MAX_TARGET_TEXT_LENGTH,
      );

      if (targetText.length === 0) {
        continue;
      }

      const alignmentValue = normalizeTrimmedString(
        style.alignment,
        '',
      ).toLowerCase();

      const alignment: TextAlignment =
        alignmentValue === 'left' ||
        alignmentValue === 'center' ||
        alignmentValue === 'right' ||
        alignmentValue === 'justify'
          ? alignmentValue
          : null;

      results.push({
        id: normalizeTrimmedString(item.id, '', 60) || `rule_${index + 1}`,
        enabled: normalizeBoolean(item.enabled, true),
        targetText,
        applyToAll: normalizeBoolean(item.applyToAll, true),
        style: {
          fontFamily:
            normalizeTrimmedString(
              style.fontFamily,
              DEFAULT_STYLE_TEMPLATE.fontFamily,
              MAX_FONT_FAMILY_LENGTH,
            ) || DEFAULT_STYLE_TEMPLATE.fontFamily,
          fontSize: normalizeNumber(
            style.fontSize,
            DEFAULT_STYLE_TEMPLATE.fontSize,
            6,
            72,
          ),
          bold: normalizeBoolean(style.bold, false),
          italic: normalizeBoolean(style.italic, false),
          underline: normalizeBoolean(style.underline, false),
          alignment,
        },
      });
    }

    return results;
  }

  private normalizeManualBlankFields(
    rawValue: unknown,
  ): GeneratedDocumentPreExportManualBlankField[] {
    const source = asArray(rawValue);
    const results: GeneratedDocumentPreExportManualBlankField[] = [];

    for (const [index, entry] of source.entries()) {
      if (results.length >= MAX_MANUAL_BLANK_FIELDS) {
        break;
      }

      const item = asObject(entry);
      const occurrenceKey = normalizeTrimmedString(item.occurrenceKey, '', 120);

      if (occurrenceKey.length === 0) {
        continue;
      }

      const contextBefore = escapeForDisplay(
        normalizeTrimmedString(item.contextBefore, '', 200),
      );
      const contextAfter = escapeForDisplay(
        normalizeTrimmedString(item.contextAfter, '', 200),
      );

      results.push({
        id: normalizeTrimmedString(item.id, '', 60) || `blank_${index + 1}`,
        enabled: normalizeBoolean(item.enabled, true),
        label:
          normalizeTrimmedString(item.label, '', MAX_LABEL_LENGTH) ||
          this.buildCandidateLabel(contextBefore, contextAfter, index + 1),
        value: normalizeTrimmedString(item.value, '', MAX_MANUAL_VALUE_LENGTH),
        contextBefore,
        contextAfter,
        occurrenceKey,
      });
    }

    return results;
  }

  private getConfigFilePath(documentId: bigint): string {
    return path.join(
      this.getProjectRoot(),
      'storage',
      'pre-export-config',
      'generated-documents',
      `${documentId}.json`,
    );
  }

  private getProjectRoot(): string {
    return this.paths.repoRoot;
  }
}
