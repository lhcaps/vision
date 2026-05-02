import { Global, Module } from '@nestjs/common';
import { SignedUrlService } from './utils/signed-url';

@Global()
@Module({
  providers: [SignedUrlService],
  exports: [SignedUrlService],
})
export class CommonModule {}
