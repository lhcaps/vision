import { PartialType } from '@nestjs/swagger';
import { AddEvidenceDto } from './add-evidence.dto';

export class UpdateEvidenceDto extends PartialType(AddEvidenceDto) {}
