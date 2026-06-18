import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { createGlobalValidationPipe } from './validation-pipe.factory';

class StrictDto {
  @IsString()
  name!: string;
}

describe('createGlobalValidationPipe', () => {
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: StrictDto,
    data: '',
  };

  it('rejects unknown fields instead of stripping them silently', async () => {
    const pipe = createGlobalValidationPipe();

    await expect(
      pipe.transform({ name: 'valid', unexpected: 'blocked' }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
