import { describe, expect, it } from 'vitest';
import {
  classifyMediaType,
  createDerivativeObjectKey,
  createMediaObjectKey,
  validateMediaMime,
} from '../media';

describe('media contracts', () => {
  it('validates supported image and video mime types', () => {
    expect(validateMediaMime('image/png')).toBe('image/png');
    expect(validateMediaMime('video/mp4')).toBe('video/mp4');
    expect(() => validateMediaMime('application/pdf')).toThrow();
  });

  it('creates deterministic object keys from checksum', () => {
    const checksum = '7f49a20dd537b85797c02ba4efc19c90b531fe939d92c356322866386f8d5d91';

    expect(createMediaObjectKey('proj_1', checksum, 'image/jpeg')).toBe(
      `projects/proj_1/originals/${checksum}.jpg`
    );
  });

  it('classifies media and derivative targets', () => {
    expect(classifyMediaType('image/webp')).toBe('IMAGE');
    expect(classifyMediaType('video/quicktime')).toBe('VIDEO');
    expect(createDerivativeObjectKey('proj_1', 'asset_1', 'THUMBNAIL')).toBe(
      'projects/proj_1/derivatives/asset_1/thumb.webp'
    );
  });
});
