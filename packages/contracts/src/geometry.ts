import { z } from 'zod';

export const BBoxGeometrySchema = z.object({
  x: z.number().finite().nonnegative(),
  y: z.number().finite().nonnegative(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

export const ViewportSchema = z.object({
  scale: z.number().finite().positive(),
  offsetX: z.number().finite(),
  offsetY: z.number().finite(),
});

export type BBoxGeometry = z.infer<typeof BBoxGeometrySchema>;
export type Viewport = z.infer<typeof ViewportSchema>;

export function imageToScreen(box: BBoxGeometry, viewport: Viewport): BBoxGeometry {
  return {
    x: box.x * viewport.scale + viewport.offsetX,
    y: box.y * viewport.scale + viewport.offsetY,
    width: box.width * viewport.scale,
    height: box.height * viewport.scale,
  };
}

export function screenToImage(box: BBoxGeometry, viewport: Viewport): BBoxGeometry {
  return {
    x: (box.x - viewport.offsetX) / viewport.scale,
    y: (box.y - viewport.offsetY) / viewport.scale,
    width: box.width / viewport.scale,
    height: box.height / viewport.scale,
  };
}

export function clampBBox(
  box: BBoxGeometry,
  imageWidth: number,
  imageHeight: number
): BBoxGeometry {
  const x = Math.max(0, Math.min(box.x, imageWidth));
  const y = Math.max(0, Math.min(box.y, imageHeight));
  const right = Math.max(x, Math.min(box.x + box.width, imageWidth));
  const bottom = Math.max(y, Math.min(box.y + box.height, imageHeight));

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

export function bboxArea(box: BBoxGeometry): number {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

export function intersectionOverUnion(a: BBoxGeometry, b: BBoxGeometry): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = bboxArea(a) + bboxArea(b) - intersection;

  return union === 0 ? 0 : intersection / union;
}
