import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { ReadinessService } from './readiness.service';

@ApiTags('System')
@Public()
@Controller()
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get('ready')
  @ApiOperation({ summary: 'Contract runtime readiness check' })
  async getReadiness(@Res({ passthrough: true }) response: Response) {
    const readiness = await this.readiness.getReadiness();
    response.status(
      readiness.ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );
    return readiness;
  }
}
