import { Module } from '@nestjs/common';
import { TemplateNormalizerController } from './template-normalizer.controller';
import { TemplateNormalizerService } from './template-normalizer.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  controllers: [TemplatesController, TemplateNormalizerController],
  providers: [TemplatesService, TemplateNormalizerService],
})
export class TemplatesModule {}
