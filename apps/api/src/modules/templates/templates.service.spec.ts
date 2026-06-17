import { TemplatesService } from './templates.service';

function createPrismaMock() {
  return {
    template_groups: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    templates: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    template_versions: {
      findMany: jest.fn(),
    },
    template_required_fields: {
      findMany: jest.fn(),
    },
    data_fields: {
      findMany: jest.fn(),
    },
  };
}

describe('TemplatesService ownership filters', () => {
  it('filters templates by current official when createdByOfficialId is provided', async () => {
    const prisma = createPrismaMock();
    prisma.templates.findMany.mockResolvedValue([
      {
        id: BigInt(9),
        template_code: 'BM-001',
        template_no: '001',
        template_name: 'Bien ban tiep nhan',
        source_file_name: 'BM-001.doc',
        original_ext: 'doc',
        stage_code: 'TIEP_NHAN',
        render_scope: 'CASE_LEVEL',
        output_strategy: 'ONE_FILE_PER_CASE',
        default_output_formats: ['docx', 'pdf'],
        requires_review: true,
        description: null,
        is_active: true,
        group_id: null,
        created_by_official_id: BigInt(7),
        created_at: new Date('2026-06-16T00:00:00.000Z'),
        updated_at: new Date('2026-06-16T00:00:00.000Z'),
      },
    ]);
    prisma.template_groups.findMany.mockResolvedValue([]);

    const service = new TemplatesService(prisma as never);
    const result = await service.findAll({
      activeOnly: true,
      createdByOfficialId: '7',
    });

    expect(prisma.templates.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          is_active: true,
          created_by_official_id: BigInt(7),
        }),
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: '9',
        templateCode: 'BM-001',
        createdByOfficialId: '7',
      }),
    ]);
  });
});
