import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  bm031CleanApplySavedBody,
  bm031IsFinal,
  bm031ParseSnapshot,
  bm031ReadPath,
  bm031SerializeDate,
  parsePositiveIntId,
  JsonValue,
} from './bm031-clean.helpers';

/**
 * Service xử lý các BM-031 direct routes (legacy inline trong main.ts).
 *
 * Tại sao tách riêng: gốc code chạy BM-031 qua raw Express handlers + PrismaClient riêng
 * (trong main.ts). Tách thành NestJS service + controller để:
 *  - Tận dụng DI + lifecycle của NestJS (PrismaService đã share connection pool)
 *  - Dễ test (mock PrismaService)
 *  - main.ts chỉ còn bootstrap, không có business logic
 */
@Injectable()
export class Bm031DirectService {
  private readonly logger = new Logger(Bm031DirectService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy full document detail (cho BM-031), kèm files + snapshot đã clean.
   * Trả về null nếu documentId không tồn tại hoặc không phải BM-031.
   */
  async getDocumentDetail(documentId: number): Promise<unknown> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: bigint;
        template_id: bigint;
        render_payload_snapshot: unknown;
        template_code: string | null;
      }>
    >`
      SELECT
        gd.id,
        gd.template_id,
        gd.render_payload_snapshot,
        t.template_code
      FROM generated_documents gd
      LEFT JOIN templates t ON t.id = gd.template_id
      WHERE gd.id = ${documentId}
      LIMIT 1
    `;

    const row = rows?.[0];
    if (!row) return null;

    let snapshot = bm031ParseSnapshot(row.render_payload_snapshot);
    snapshot = bm031CleanApplySavedBody(snapshot);

    const snapshotTemplateCode = bm031ReadPath(snapshot, 'templateCode');

    const documentBlock = snapshot.document as
      | Record<string, JsonValue>
      | undefined;
    const documentCodeLine = documentBlock?.documentCodeLine;

    const looksBm031 =
      row.template_code === 'BM-031' ||
      snapshotTemplateCode === 'BM-031' ||
      (typeof documentCodeLine === 'string' &&
        documentCodeLine.startsWith('31/')) ||
      String(bm031ReadPath(snapshot, 'document.documentCode') ?? '').startsWith(
        '31/',
      ) ||
      String(bm031ReadPath(snapshot, 'legalBasis.requestApprovalLine') ?? '')
        .toString()
        .includes('Lệnh bắt người bị giữ trong trường hợp khẩn cấp') ||
      String(bm031ReadPath(snapshot, 'measure.article1Line') ?? '')
        .toString()
        .includes('Lệnh bắt người bị giữ trong trường hợp khẩn cấp');

    if (!looksBm031) return null;

    const fileRows = await this.prisma.$queryRaw<
      Array<{
        id: bigint;
        stored_file_id: bigint | null;
        file_format: string;
        file_name: string;
        file_path: string | null;
        file_size_bytes: string | number;
        checksum: string | null;
        is_final: unknown;
        created_at: unknown;
      }>
    >`
      SELECT
        id,
        stored_file_id,
        file_format,
        file_name,
        file_path,
        file_size_bytes,
        checksum,
        is_final,
        created_at
      FROM generated_document_files
      WHERE generated_document_id = ${documentId}
      ORDER BY id DESC
    `;

    const files = (fileRows ?? []).map((file) => ({
      id: String(file.id),
      storedFileId:
        file.stored_file_id === null || file.stored_file_id === undefined
          ? null
          : String(file.stored_file_id),
      fileFormat: String(file.file_format ?? ''),
      fileName: String(file.file_name ?? ''),
      filePath: file.file_path ?? null,
      fileSizeBytes: String(file.file_size_bytes ?? 0),
      checksum: file.checksum ?? null,
      isFinal: bm031IsFinal(file.is_final),
      createdAt: bm031SerializeDate(file.created_at),
    }));

    return {
      ...snapshot,
      id: String(row.id),
      templateId: String(row.template_id),
      templateCode: row.template_code,
      files,
    };
  }

  /**
   * Lấy render payload cho BM-031 (override standard).
   */
  async getRenderPayloadOverride(documentId: number): Promise<unknown> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        render_payload_snapshot: unknown;
        template_code: string | null;
      }>
    >`
      SELECT
        gd.render_payload_snapshot,
        t.template_code
      FROM generated_documents gd
      JOIN templates t ON t.id = gd.template_id
      WHERE gd.id = ${documentId}
      LIMIT 1
    `;

    const row = rows?.[0];
    if (!row) return null;
    if (row.template_code !== 'BM-031') return null;

    let snapshot = bm031ParseSnapshot(row.render_payload_snapshot);
    snapshot = bm031CleanApplySavedBody(snapshot);

    return snapshot;
  }

  /**
   * Lấy render payload chi tiết cho BM-031 (kèm form inputs normalized).
   */
  async getDirectRenderPayload(documentId: number): Promise<unknown> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        render_payload_snapshot: unknown;
        template_code: string | null;
      }>
    >`
      SELECT
        gd.render_payload_snapshot,
        t.template_code
      FROM generated_documents gd
      JOIN templates t ON t.id = gd.template_id
      WHERE gd.id = ${documentId}
      LIMIT 1
    `;

    const row = rows?.[0];
    if (!row) return null;
    if (row.template_code !== 'BM-031') return null;

    let snapshot = bm031ParseSnapshot(row.render_payload_snapshot);
    snapshot = bm031CleanApplySavedBody(snapshot);
    return snapshot;
  }

  /**
   * Lưu form inputs cho BM-031 (legacy direct save).
   */
  async saveFormInputs(
    documentId: number,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: bigint;
        render_payload_snapshot: unknown;
        template_code: string | null;
      }>
    >`
      SELECT
        gd.id,
        gd.render_payload_snapshot,
        t.template_code
      FROM generated_documents gd
      LEFT JOIN templates t ON t.id = gd.template_id
      WHERE gd.id = ${documentId}
      LIMIT 1
    `;

    const existing = rows?.[0];
    if (!existing) {
      throw new NotFoundException(`Document not found: id=${documentId}`);
    }

    if (existing.template_code !== 'BM-031') {
      throw new BadRequestException(
        `Document ${documentId} is not a BM-031 document.`,
      );
    }

    const previous = bm031ParseSnapshot(existing.render_payload_snapshot);

    const previousFormInputs = (previous.formInputs ?? {}) as Record<
      string,
      JsonValue
    >;
    const previousPayloadOverrides = (previous.payloadOverrides ??
      {}) as Record<string, JsonValue>;

    const merged: Record<string, JsonValue> = {
      ...previous,
      formInputs: {
        ...previousFormInputs,
        ...(body as Record<string, JsonValue>),
      },
      payloadOverrides: {
        ...previousPayloadOverrides,
        ...(body as Record<string, JsonValue>),
      },
      updatedAt: new Date().toISOString(),
    };

    const cleaned = bm031CleanApplySavedBody(merged);

    await this.prisma.$executeRaw`
      UPDATE generated_documents
      SET render_payload_snapshot = ${JSON.stringify(cleaned)}
      WHERE id = ${documentId}
    `;

    return { ok: true, snapshot: cleaned };
  }

  async resolveDocumentId(value: unknown): Promise<number> {
    return parsePositiveIntId(value, 'Document ID');
  }
}
