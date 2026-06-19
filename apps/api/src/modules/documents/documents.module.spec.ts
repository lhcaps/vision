import { Test } from '@nestjs/testing';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { DocumentsModule } from './documents.module';
import {
  CONTRACT_DOCUMENT_RENDERER,
  GENERATED_DOCUMENT_DESCRIPTOR,
  LEGACY_DOCUMENT_RENDERER,
} from './rendering/application/document-renderer.ports';
import { RenderGeneratedDocumentUseCase } from './rendering/application/render-generated-document.use-case';

describe('DocumentsModule renderer seam', () => {
  it('resolves the use case and every renderer port through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [InfrastructureModule, PrismaModule, DocumentsModule],
    }).compile();

    expect(moduleRef.get(RenderGeneratedDocumentUseCase)).toBeDefined();
    expect(moduleRef.get(LEGACY_DOCUMENT_RENDERER)).toBeDefined();
    expect(moduleRef.get(CONTRACT_DOCUMENT_RENDERER)).toBeDefined();
    expect(moduleRef.get(GENERATED_DOCUMENT_DESCRIPTOR)).toBeDefined();

    await moduleRef.close();
  });
});
