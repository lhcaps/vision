import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { DocumentRenderCommand } from '../application/document-renderer.ports';
import { LegacyDocumentRendererAdapter } from './legacy-document-renderer.adapter';
import { PrismaGeneratedDocumentDescriptorRepository } from './prisma-generated-document-descriptor.repository';
import { UnavailableContractDocumentRendererAdapter } from './unavailable-contract-document-renderer.adapter';

const command: DocumentRenderCommand = {
  documentId: '12',
  options: {
    force: true,
    renderedByName: 'KSV A',
  },
  actor: null,
};

describe('renderer infrastructure adapters', () => {
  it('forwards the legacy command without changing arguments or result', async () => {
    const result = {
      skipped: false,
      file: {
        id: '99',
      },
    };
    const renderer = {
      renderDocx: jest.fn().mockResolvedValue(result),
    };
    const adapter = new LegacyDocumentRendererAdapter(renderer as never);

    await expect(adapter.render(command)).resolves.toBe(result);
    expect(renderer.renderDocx).toHaveBeenCalledWith(
      command.documentId,
      command.options,
      command.actor,
    );
  });

  it('fails explicitly while the contract renderer is not installed', async () => {
    const adapter = new UnavailableContractDocumentRendererAdapter();

    await expect(adapter.renderActive(command)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(adapter.renderShadow(command)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('resolves a generated document template code through Prisma', async () => {
    const prisma = {
      generated_documents: {
        findUnique: jest.fn().mockResolvedValue({
          id: 12n,
          templates: {
            id: 1n,
            template_code: 'BM-001',
          },
        }),
      },
    };
    const repository = new PrismaGeneratedDocumentDescriptorRepository(
      prisma as never,
    );

    await expect(repository.findByDocumentId('12')).resolves.toMatchObject({
      documentId: '12',
      templateCode: 'BM-001',
      templateId: '1',
      sourceId: 'BM-001',
    });
    expect(prisma.generated_documents.findUnique).toHaveBeenCalledWith({
      where: {
        id: 12n,
      },
      select: {
        id: true,
        templates: {
          select: {
            id: true,
            template_code: true,
          },
        },
      },
    });
  });

  it('rejects invalid and missing generated-document identifiers', async () => {
    const prisma = {
      generated_documents: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const repository = new PrismaGeneratedDocumentDescriptorRepository(
      prisma as never,
    );

    await expect(repository.findByDocumentId('invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(repository.findByDocumentId('12')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
