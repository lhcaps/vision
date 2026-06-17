import { PartialType } from '@nestjs/swagger';
import { AddCaseOffenseDto } from './add-case-offense.dto';

export class UpdateCaseOffenseDto extends PartialType(AddCaseOffenseDto) {}
