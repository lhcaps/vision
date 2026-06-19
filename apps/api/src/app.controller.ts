import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { HealthInfo, SimpleHealthInfo } from './app.service';
import { Public } from './modules/auth/public.decorator';

@ApiTags('System')
@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  getHello(): HealthInfo {
    return this.appService.getHealth();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Simple health check for load balancers / dev scripts',
  })
  getHealth(): SimpleHealthInfo {
    return this.appService.getSimpleHealth();
  }
}
