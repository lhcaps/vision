import { Logger } from '@nestjs/common';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InfrastructureError } from '../../../common/application-error';
import { AppConfigService } from '../../../infrastructure/config/app-config.service';
import { WorkspacePathsService } from '../../../infrastructure/paths/workspace-paths.service';
import { FileFormContractRepository } from './file-form-contract.repository';

type FixtureOptions = {
  sourceId: string;
  templateCode: string;
  status: 'locked' | 'draft';
  documentKind?: 'form' | 'reference';
  title?: string;
};

describe('FileFormContractRepository', () => {
  const temporaryRoots: string[] = [];

  afterEach(() => {
    for (const root of temporaryRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function createRepository(options: { withContracts?: boolean } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'qlv-contract-repository-'));
    temporaryRoots.push(root);
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');

    const config = new AppConfigService({ REPO_ROOT: root });
    const paths = new WorkspacePathsService(config);
    if (options.withContracts !== false) {
      mkdirSync(join(paths.contractsRoot, 'locked'), { recursive: true });
    }

    return {
      paths,
      repository: new FileFormContractRepository(paths),
    };
  }

  function writeContract(
    paths: WorkspacePathsService,
    options: FixtureOptions,
  ): string {
    const directory =
      options.status === 'locked'
        ? join(paths.contractsRoot, 'locked')
        : paths.contractsRoot;
    const filePath = join(
      directory,
      `${options.sourceId}.contract.${options.status}.json`,
    );
    writeFileSync(
      filePath,
      JSON.stringify({
        schemaVersion: '1.0',
        sourceId: options.sourceId,
        templateCode: options.templateCode,
        templateTitle: options.title ?? options.templateCode,
        documentKind: options.documentKind ?? 'form',
        status: options.status,
        docxSlots: [],
        canonicalFields: [],
        renderBindings: [],
      }),
      'utf8',
    );
    return filePath;
  }

  it('prefers a locked contract over the matching draft', async () => {
    const { paths, repository } = createRepository();
    writeContract(paths, {
      sourceId: 'BM-001__draft',
      templateCode: 'BM-001',
      status: 'draft',
    });
    writeContract(paths, {
      sourceId: 'BM-001__locked',
      templateCode: 'BM-001',
      status: 'locked',
    });

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({
        sourceId: 'BM-001__locked',
        templateCode: 'BM-001',
        status: 'locked',
        runtimeEligible: true,
      }),
    ]);
  });

  it('finds contracts by source id and template code', async () => {
    const { paths, repository } = createRepository();
    writeContract(paths, {
      sourceId: 'BM-002__locked',
      templateCode: 'BM-002',
      status: 'locked',
    });

    await expect(
      repository.findByIdentifier('BM-002__locked'),
    ).resolves.toMatchObject({ templateCode: 'BM-002' });
    await expect(repository.findByIdentifier('BM-002')).resolves.toMatchObject({
      sourceId: 'BM-002__locked',
    });
  });

  it('excludes reference documents', async () => {
    const { paths, repository } = createRepository();
    writeContract(paths, {
      sourceId: 'REF__circular',
      templateCode: 'BM-999',
      status: 'draft',
      documentKind: 'reference',
    });

    await expect(repository.list()).resolves.toEqual([]);
  });

  it('reports invalid JSON with the exact path', async () => {
    const { paths, repository } = createRepository();
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const invalidPath = join(
      paths.contractsRoot,
      'BM-004__invalid.contract.draft.json',
    );
    writeFileSync(invalidPath, '{invalid-json', 'utf8');

    await expect(repository.list()).resolves.toEqual([]);
    await expect(repository.inspect()).resolves.toMatchObject({
      ready: true,
      invalidFiles: [
        expect.objectContaining({
          path: invalidPath,
          message: expect.stringContaining('valid JSON'),
        }),
      ],
    });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('reports not ready and throws a typed error when root is absent', async () => {
    const { repository } = createRepository({ withContracts: false });

    await expect(repository.inspect()).resolves.toMatchObject({
      ready: false,
      lockedCount: 0,
      draftCount: 0,
    });
    await expect(repository.list()).rejects.toBeInstanceOf(InfrastructureError);
  });

  it('re-reads a contract after its file metadata changes', async () => {
    const { paths, repository } = createRepository();
    const filePath = writeContract(paths, {
      sourceId: 'BM-003__locked',
      templateCode: 'BM-003',
      status: 'locked',
      title: 'Before',
    });

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({ title: 'Before' }),
    ]);

    writeFileSync(
      filePath,
      JSON.stringify({
        schemaVersion: '1.0',
        sourceId: 'BM-003__locked',
        templateCode: 'BM-003',
        templateTitle: 'After metadata change',
        documentKind: 'form',
        status: 'locked',
        docxSlots: [],
        canonicalFields: [],
        renderBindings: [],
      }),
      'utf8',
    );

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({ title: 'After metadata change' }),
    ]);
  });
});
