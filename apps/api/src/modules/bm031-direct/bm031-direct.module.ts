import { Global, Module } from '@nestjs/common';
import { Bm031DirectController } from './bm031-direct.controller';
import { Bm031DirectService } from './bm031-direct.service';

@Global()
@Module({
  controllers: [Bm031DirectController],
  providers: [Bm031DirectService],
  exports: [Bm031DirectService],
})
export class Bm031DirectModule {}
