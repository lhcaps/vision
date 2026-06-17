import { Module } from '@nestjs/common';
import { CaseAssignmentsController } from './case-assignments.controller';
import { CaseAssignmentsService } from './case-assignments.service';
import { CaseOffensesController } from './case-offenses.controller';
import { CaseOffensesService } from './case-offenses.service';
import { CasePeopleController } from './case-people.controller';
import { CasePeopleService } from './case-people.service';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';

@Module({
  controllers: [
    CasesController,
    CasePeopleController,
    CaseOffensesController,
    CaseAssignmentsController,
    EvidenceController,
  ],
  providers: [
    CasesService,
    CasePeopleService,
    CaseOffensesService,
    CaseAssignmentsService,
    EvidenceService,
  ],
})
export class CasesModule {}
