import { Global, Module } from '@nestjs/common';
import { APP_ENV, AppConfigService } from './config/app-config.service';
import { WorkspacePathsService } from './paths/workspace-paths.service';

@Global()
@Module({
  providers: [
    {
      provide: APP_ENV,
      useValue: process.env,
    },
    AppConfigService,
    WorkspacePathsService,
  ],
  exports: [AppConfigService, WorkspacePathsService],
})
export class InfrastructureModule {}
