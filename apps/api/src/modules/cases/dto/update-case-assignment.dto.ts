import { PartialType } from '@nestjs/swagger';
import { AddCaseAssignmentDto } from './add-case-assignment.dto';

export class UpdateCaseAssignmentDto extends PartialType(
  AddCaseAssignmentDto,
) {}
