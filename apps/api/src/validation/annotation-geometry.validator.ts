import { BadRequestException } from '@nestjs/common';
import { BBoxGeometrySchema } from '@visionflow/contracts';
import { AnnotationGeometryError } from '../domain/errors';

export function validateAnnotationGeometry(geometry: unknown): void {
  const result = BBoxGeometrySchema.safeParse(geometry);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    throw new BadRequestException({
      message: 'Invalid annotation geometry',
      issues,
    });
  }

  const { x, y, width, height } = result.data;
  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    throw new AnnotationGeometryError(
      'BBox must have non-negative x,y and positive width,height.',
      { x, y, width, height }
    );
  }
}
