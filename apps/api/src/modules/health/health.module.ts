import { Module } from '@nestjs/common';
import { FormsContractsModule } from '../forms-contracts/forms-contracts.module';
import { HealthController } from './health.controller';
import { ReadinessService } from './readiness.service';

@Module({
  imports: [FormsContractsModule],
  controllers: [HealthController],
  providers: [ReadinessService],
})
export class HealthModule {}
