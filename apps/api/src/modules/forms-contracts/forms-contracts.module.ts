/**
 * Phase D — Forms contracts module.
 */
import { Module } from '@nestjs/common';
import { FormContractRepository } from './application/form-contract.repository';
import { FormsCatalogService } from './application/forms-catalog.service';
import { FormsCatalogController } from './forms-catalog.controller';
import { FileFormContractRepository } from './infrastructure/file-form-contract.repository';

@Module({
  controllers: [FormsCatalogController],
  providers: [
    FormsCatalogService,
    {
      provide: FormContractRepository,
      useClass: FileFormContractRepository,
    },
  ],
  exports: [FormsCatalogService, FormContractRepository],
})
export class FormsContractsModule {}
