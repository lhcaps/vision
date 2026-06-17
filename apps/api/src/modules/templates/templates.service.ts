import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type QvksTemplateFieldShape = {
  data_type?: string | null;
  source_path?: string | null;
  description?: string | null;
};

function qvksTemplateField(value: unknown): QvksTemplateFieldShape {
  if (value && typeof value === 'object') {
    return value;
  }

  return {};
}

type TemplateListQuery = {
  q?: string;
  groupCode?: string;
  renderScope?: string;
  stageCode?: string;
  activeOnly?: boolean;
  createdByOfficialId?: string;
};

function toPublicId(value: bigint | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getGroups() {
    const groups = await this.prisma.template_groups.findMany({
      where: {
        is_active: true,
      },
      orderBy: [
        {
          group_order: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return groups.map((group) => ({
      id: toPublicId(group.id),
      groupCode: group.group_code,
      groupName: group.group_name,
      groupOrder: group.group_order,
      description: group.description,
      isActive: group.is_active,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
    }));
  }

  async findAll(query: TemplateListQuery) {
    const where: Record<string, unknown> = {};

    if (query.activeOnly !== false) {
      where.is_active = true;
    }

    if (query.renderScope) {
      where.render_scope = query.renderScope;
    }

    if (query.stageCode) {
      where.stage_code = query.stageCode;
    }

    if (query.createdByOfficialId) {
      try {
        where.created_by_official_id = BigInt(query.createdByOfficialId);
      } catch {
        return [];
      }
    }

    if (query.groupCode) {
      const group = await this.prisma.template_groups.findUnique({
        where: {
          group_code: query.groupCode,
        },
      });

      if (!group) {
        return [];
      }

      where.group_id = group.id;
    }

    if (query.q?.trim()) {
      const keyword = query.q.trim();

      where.OR = [
        {
          template_code: {
            contains: keyword,
          },
        },
        {
          template_no: {
            contains: keyword,
          },
        },
        {
          template_name: {
            contains: keyword,
          },
        },
        {
          source_file_name: {
            contains: keyword,
          },
        },
      ];
    }

    const templates = await this.prisma.templates.findMany({
      where,
      orderBy: [
        {
          template_no: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    const groupIds = [
      ...new Set(
        templates
          .map((template) => template.group_id)
          .filter((id): id is bigint => id !== null),
      ),
    ];

    const groups = groupIds.length
      ? await this.prisma.template_groups.findMany({
          where: {
            id: {
              in: groupIds,
            },
          },
        })
      : [];

    const groupById = new Map(groups.map((group) => [String(group.id), group]));

    return templates.map((template) => {
      const group = template.group_id
        ? groupById.get(String(template.group_id))
        : null;

      return {
        id: toPublicId(template.id),
        templateCode: template.template_code,
        templateNo: template.template_no,
        templateName: template.template_name,
        sourceFileName: template.source_file_name,
        originalExt: template.original_ext,
        stageCode: template.stage_code,
        renderScope: template.render_scope,
        outputStrategy: template.output_strategy,
        defaultOutputFormats: template.default_output_formats,
        requiresReview: template.requires_review,
        description: template.description,
        isActive: template.is_active,
        createdByOfficialId: toPublicId(template.created_by_official_id),
        group: group
          ? {
              id: toPublicId(group.id),
              groupCode: group.group_code,
              groupName: group.group_name,
              groupOrder: group.group_order,
            }
          : null,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      };
    });
  }

  async findOne(id: string) {
    let templateId: bigint;

    try {
      templateId = BigInt(id);
    } catch {
      throw new NotFoundException('Không tìm thấy biểu mẫu.');
    }

    const template = await this.prisma.templates.findUnique({
      where: {
        id: templateId,
      },
    });

    if (!template) {
      throw new NotFoundException('Không tìm thấy biểu mẫu.');
    }

    const group = template.group_id
      ? await this.prisma.template_groups.findUnique({
          where: {
            id: template.group_id,
          },
        })
      : null;

    const versions = await this.prisma.template_versions.findMany({
      where: {
        template_id: template.id,
      },
      orderBy: [
        {
          is_default: 'desc',
        },
        {
          version_no: 'desc',
        },
      ],
    });

    const requiredFields = await this.prisma.template_required_fields.findMany({
      where: {
        template_id: template.id,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const dataFieldIds = requiredFields.map((item) => item.data_field_id);

    const dataFields = dataFieldIds.length
      ? await this.prisma.data_fields.findMany({
          where: {
            id: {
              in: dataFieldIds,
            },
          },
        })
      : [];

    const dataFieldById = new Map(
      dataFields.map((field) => [String(field.id), field]),
    );

    return {
      id: toPublicId(template.id),
      templateCode: template.template_code,
      templateNo: template.template_no,
      templateName: template.template_name,
      sourceFileName: template.source_file_name,
      originalExt: template.original_ext,
      stageCode: template.stage_code,
      renderScope: template.render_scope,
      outputStrategy: template.output_strategy,
      defaultOutputFormats: template.default_output_formats,
      requiresReview: template.requires_review,
      description: template.description,
      isActive: template.is_active,
      createdByOfficialId: toPublicId(template.created_by_official_id),
      group: group
        ? {
            id: toPublicId(group.id),
            groupCode: group.group_code,
            groupName: group.group_name,
            groupOrder: group.group_order,
          }
        : null,
      versions: versions.map((version) => ({
        id: toPublicId(version.id),
        versionNo: version.version_no,
        originalFilePath: normalizeText(version.original_file_path),
        normalizedDocxPath: normalizeText(version.normalized_docx_path),
        outputNamePattern: version.output_name_pattern,
        placeholderSummary: version.placeholder_summary,
        checksum: version.checksum,
        isDefault: version.is_default,
        isActive: version.is_active,
        createdByName: version.created_by_name,
        createdByOfficialId: toPublicId(version.created_by_official_id),
        createdAt: version.created_at,
        updatedAt: version.updated_at,
      })),
      requiredFields: requiredFields.map((item) => {
        const field = dataFieldById.get(String(item.data_field_id));

        return {
          id: toPublicId(item.id),
          placeholderName: item.placeholder_name,
          isRequired: item.is_required,
          appliesToScope: item.applies_to_scope,
          missingMessage: item.missing_message,
          dataField: field
            ? {
                id: toPublicId(field.id),
                fieldKey: field.field_key,
                fieldLabel: field.field_label,
                fieldGroup: field.field_group,
                dataType: qvksTemplateField(field).data_type,
                sourcePath: qvksTemplateField(field).source_path,
                description: qvksTemplateField(field).description,
              }
            : null,
        };
      }),
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };
  }
}
