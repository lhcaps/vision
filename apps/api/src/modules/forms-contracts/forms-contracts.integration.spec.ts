import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import { FileFormContractRepository } from './infrastructure/file-form-contract.repository';

describe('real DOCX contract repository', () => {
  it('loads the repository corpus with the expected runtime eligibility', async () => {
    const paths = new WorkspacePathsService(new AppConfigService({}));
    const repository = new FileFormContractRepository(paths);

    const [contracts, status, bm001] = await Promise.all([
      repository.list(),
      repository.inspect(),
      repository.findByIdentifier('BM-001'),
    ]);

    expect(contracts).toHaveLength(213);
    expect(status).toMatchObject({
      ready: true,
      lockedCount: 3,
      draftCount: 210,
      invalidFiles: [],
    });
    expect(bm001).toMatchObject({
      templateCode: 'BM-001',
      status: 'locked',
      runtimeEligible: true,
    });
  });
});
