import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { CreateInferenceJobRequestSchema } from '@visionflow/contracts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateInferenceJobRequest(
  body: unknown
): z.infer<typeof CreateInferenceJobRequestSchema> {
  const result = CreateInferenceJobRequestSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    throw new BadRequestException({
      message: 'Invalid inference job request',
      issues,
    });
  }

  if (result.data.modelId && !UUID_REGEX.test(result.data.modelId)) {
    throw new BadRequestException({
      message: 'Invalid inference job request',
      issues: [
        {
          path: 'modelId',
          message: 'modelId must be a valid UUID if provided',
          code: 'invalid_string',
        },
      ],
    });
  }

  return result.data;
}
