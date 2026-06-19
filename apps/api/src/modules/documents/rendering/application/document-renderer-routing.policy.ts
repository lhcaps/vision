import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../infrastructure/config/app-config.service';

export type DocumentRendererRoute = 'legacy' | 'shadow' | 'active';

@Injectable()
export class DocumentRendererRoutingPolicy {
  constructor(private readonly config: AppConfigService) {}

  get isDisabled(): boolean {
    return this.config.documentRendererMode === 'off';
  }

  route(templateCode: string): DocumentRendererRoute {
    const mode = this.config.documentRendererMode;
    if (mode === 'off') return 'legacy';

    const normalizedCode = templateCode.trim().toUpperCase();
    const enabled =
      this.config.documentRendererContractTemplates.includes(normalizedCode);

    return enabled ? mode : 'legacy';
  }
}
