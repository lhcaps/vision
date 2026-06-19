import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import type { ContractRenderPlan } from '../domain/contract-render-plan';
import { auditDocxFormat } from './docx-format-auditor';
import { compareDocxSemantic } from './docx-semantic-comparator';

export type ShadowArtifactPath = Readonly<{
  docxPath: string;
  semanticDiffJsonPath: string;
  semanticDiffMdPath: string;
  formatAuditJsonPath: string;
  formatAuditMdPath: string;
  manifestPath: string;
}>;

export type ShadowRenderResult = Readonly<{
  shadowPath: string;
  artifacts: ShadowArtifactPath;
  semanticComparison: ReturnType<typeof compareDocxSemantic>;
  formatAudit: ReturnType<typeof auditDocxFormat>;
}>;

interface ShadowManifest {
  documentId: string;
  templateCode: string;
  timestamp: string;
  renderPlan: {
    sourceId: string;
    contractStatus: string;
    fieldCount: number;
    bindingCount: number;
    missingRequiredCount: number;
    warnings: string[];
  };
  artifacts: {
    docx: string;
    semanticDiffJson: string;
    semanticDiffMd: string;
    formatAuditJson: string;
    formatAuditMd: string;
  };
  semanticComparison: {
    status: string;
    legacyTextLength: number;
    contractTextLength: number;
    missingExpectedText: string[];
    unexpectedUnresolvedPlaceholders: string[];
    notes: string[];
  };
  formatAudit: {
    status: string;
    checks: Array<{
      id: string;
      requirement: string;
      status: string;
      evidence?: string;
    }>;
  };
}

@Injectable()
export class DocxtemplaterContractRenderEngine {
  private readonly logger = new Logger(DocxtemplaterContractRenderEngine.name);

  async renderShadow(
    plan: ContractRenderPlan,
    formData: Record<string, unknown>,
    outputDir: string,
  ): Promise<ShadowRenderResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const shadowDir = join(outputDir, plan.templateCode, timestamp);
    mkdirSync(shadowDir, { recursive: true });

    const contractDocx = await this.loadTemplate(plan.templateCode);

    const bindingMap = new Map(plan.bindings.map((b) => [b.slotId, b.value]));

    const renderedDocx = await this.fillTemplate(contractDocx, bindingMap);

    const docxPath = join(shadowDir, 'contract.docx');
    writeFileSync(docxPath, renderedDocx);

    const legacyDocx = await this.loadTemplate(plan.templateCode);
    const semanticComparison = compareDocxSemantic(
      legacyDocx.toString('utf-8'),
      renderedDocx.toString('utf-8'),
      this.extractExpectedValues(plan, formData),
    );

    const semanticDiffJsonPath = join(shadowDir, 'semantic-diff.json');
    writeFileSync(
      semanticDiffJsonPath,
      JSON.stringify(semanticComparison, null, 2),
    );

    const semanticDiffMdPath = join(shadowDir, 'semantic-diff.md');
    writeFileSync(
      semanticDiffMdPath,
      this.formatSemanticDiffMd(semanticComparison),
    );

    const formatAudit = await this.auditRenderedDocx(renderedDocx);

    const formatAuditJsonPath = join(shadowDir, 'format-audit.json');
    writeFileSync(formatAuditJsonPath, JSON.stringify(formatAudit, null, 2));

    const formatAuditMdPath = join(shadowDir, 'format-audit.md');
    writeFileSync(formatAuditMdPath, this.formatAuditMd(formatAudit));

    const manifest: ShadowManifest = {
      documentId: plan.sourceId,
      templateCode: plan.templateCode,
      timestamp,
      renderPlan: {
        sourceId: plan.sourceId,
        contractStatus: plan.contractStatus,
        fieldCount: plan.fields.length,
        bindingCount: plan.bindings.length,
        missingRequiredCount: plan.missingRequired.length,
        warnings: [...plan.warnings],
      },
      artifacts: {
        docx: docxPath,
        semanticDiffJson: semanticDiffJsonPath,
        semanticDiffMd: semanticDiffMdPath,
        formatAuditJson: formatAuditJsonPath,
        formatAuditMd: formatAuditMdPath,
      },
      semanticComparison: {
        status: semanticComparison.status,
        legacyTextLength: semanticComparison.legacyTextLength,
        contractTextLength: semanticComparison.contractTextLength,
        missingExpectedText: [...semanticComparison.missingExpectedText],
        unexpectedUnresolvedPlaceholders: [
          ...semanticComparison.unexpectedUnresolvedPlaceholders,
        ],
        notes: [...semanticComparison.notes],
      },
      formatAudit: {
        status: formatAudit.status,
        checks: formatAudit.checks.map((c) => ({
          id: c.id,
          requirement: c.requirement,
          status: c.status,
          evidence: c.evidence,
        })),
      },
    };

    const manifestPath = join(shadowDir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    return Object.freeze({
      shadowPath: shadowDir,
      artifacts: Object.freeze({
        docxPath,
        semanticDiffJsonPath,
        semanticDiffMdPath,
        formatAuditJsonPath,
        formatAuditMdPath,
        manifestPath,
      }),
      semanticComparison,
      formatAudit,
    });
  }

  private async loadTemplate(templateCode: string): Promise<Buffer> {
    const PizZip = require('pizzip') as typeof import('pizzip');

    const Docxtemplater =
      require('docxtemplater') as typeof import('docxtemplater');

    const normalizedTemplateRoot = join(
      process.cwd(),
      'storage',
      'templates',
      'normalized-docx',
      templateCode,
    );

    const templatePath = join(
      normalizedTemplateRoot,
      `${templateCode}_normalized.docx`,
    );

    if (!existsSync(templatePath)) {
      throw new Error(
        `Normalized template for "${templateCode}" not found at "${templatePath}". ` +
          'Ensure the normalized DOCX exists in storage/templates/normalized-docx/.',
      );
    }

    const content = readFileSync(templatePath);
    const zip = new PizZip(content);
    new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const xml = zip.file('word/document.xml')?.asText() ?? '';
    return Buffer.from(xml, 'utf-8');
  }

  private async fillTemplate(
    templateXml: Buffer,
    bindings: Map<string, unknown>,
  ): Promise<Buffer> {
    const PizZip = require('pizzip') as typeof import('pizzip');

    const Docxtemplater =
      require('docxtemplater') as typeof import('docxtemplater');

    const templateXmlStr = templateXml.toString('utf-8');

    const tempZip = new PizZip();
    tempZip.file('word/document.xml', templateXmlStr);
    tempZip.file(
      '[Content_Types].xml',
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    );
    tempZip.file(
      '_rels/.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    );
    tempZip.file(
      'word/_rels/document.xml.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
    );

    const doc = new Docxtemplater(tempZip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const data: Record<string, unknown> = {};
    for (const [key, value] of bindings) {
      data[key] = value ?? '';
    }

    doc.render(data);

    const renderedBuffer = doc.getZip().generate({ type: 'nodebuffer' });

    const renderedZip = new PizZip(renderedBuffer);
    const docXml = renderedZip.file('word/document.xml');

    if (!docXml) {
      throw new Error(
        'word/document.xml not found after docxtemplater render.',
      );
    }

    return Buffer.from(docXml.asText(), 'utf-8');
  }

  private async auditRenderedDocx(xmlBuffer: Buffer) {
    try {
      const parts = {
        documentXml: xmlBuffer.toString('utf-8'),
      };
      return auditDocxFormat(parts);
    } catch (error) {
      this.logger.error(
        `Format audit failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        status: 'warning' as const,
        checks: [],
      };
    }
  }

  private extractExpectedValues(
    plan: ContractRenderPlan,
    formData: Record<string, unknown>,
  ): string[] {
    const values: string[] = [];

    for (const field of plan.fields) {
      if (!field.required) continue;
      const value = formData[field.path] ?? field.value;
      if (typeof value === 'string' && value.trim()) {
        values.push(value.trim());
      }
    }

    return values;
  }

  private formatSemanticDiffMd(
    comparison: ReturnType<typeof compareDocxSemantic>,
  ): string {
    const lines: string[] = [
      '# DOCX Semantic Diff',
      '',
      `**Status**: \`${comparison.status}\``,
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Legacy text length | ${comparison.legacyTextLength} |`,
      `| Contract text length | ${comparison.contractTextLength} |`,
      '',
    ];

    if (comparison.missingExpectedText.length > 0) {
      lines.push('## Missing Expected Text');
      for (const text of comparison.missingExpectedText) {
        lines.push(`- "${text}"`);
      }
      lines.push('');
    }

    if (comparison.unexpectedUnresolvedPlaceholders.length > 0) {
      lines.push('## Unexpected Unresolved Placeholders');
      for (const p of comparison.unexpectedUnresolvedPlaceholders) {
        lines.push(`- \`${p}\``);
      }
      lines.push('');
    }

    if (comparison.notes.length > 0) {
      lines.push('## Notes');
      for (const note of comparison.notes) {
        lines.push(`- ${note}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatAuditMd(audit: ReturnType<typeof auditDocxFormat>): string {
    const lines: string[] = [
      '# DOCX Format Audit',
      '',
      `**Overall Status**: \`${audit.status}\``,
      '',
      '| Check ID | Requirement | Status | Evidence |',
      '|----------|-------------|--------|---------|',
    ];

    for (const check of audit.checks) {
      const evidence = check.evidence ?? '-';
      lines.push(
        `| ${check.id} | ${check.requirement} | \`${check.status}\` | ${evidence} |`,
      );
    }

    return lines.join('\n');
  }
}
