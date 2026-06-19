import { Test } from '@nestjs/testing';
import { AppConfigService } from './config/app-config.service';
import { InfrastructureModule } from './infrastructure.module';
import { WorkspacePathsService } from './paths/workspace-paths.service';

describe('InfrastructureModule', () => {
  it('resolves configuration and workspace paths through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [InfrastructureModule],
    }).compile();

    expect(moduleRef.get(AppConfigService)).toBeInstanceOf(AppConfigService);
    expect(moduleRef.get(WorkspacePathsService)).toBeInstanceOf(
      WorkspacePathsService,
    );
  });
});
