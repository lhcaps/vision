import { Controller, Get, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthResponseDto, LivenessResponseDto } from './dto/health-response.dto';
import { RuntimeStatusResponseDto } from './dto/runtime-status-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({ description: 'Service health status' })
  getHealth() {
    return {
      ok: true,
      service: 'visionflow-api',
      time: new Date().toISOString(),
    };
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOkResponse({
    description: 'Liveness probe — always returns 200 if the process is running',
    type: LivenessResponseDto,
  })
  async live(): Promise<LivenessResponseDto> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Get('deep')
  @ApiOkResponse({
    description: 'Readiness probe — returns 200 when all dependencies are healthy',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'One or more dependencies are unhealthy',
  })
  async deep(): Promise<HealthResponseDto> {
    return this.healthService.deepCheck();
  }

  @Get('runtime/status')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Runtime status — real state of API, database, queue, and CV worker',
    type: RuntimeStatusResponseDto,
  })
  async getRuntimeStatus(): Promise<RuntimeStatusResponseDto> {
    return this.healthService.getRuntimeStatus();
  }
}
