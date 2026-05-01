import { describe, expect, it } from 'vitest';
import {
  validateImageIntegrity,
  validateVideoIntegrity,
  validateMediaIntegrity,
} from './media-integrity';

// Valid minimal PNG (1x1 transparent pixel) - generated from sharp
const validPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x09, 0x70, 0x48, 0x59, 0x73, 0x00, 0x00, 0x03, 0xe8, 0x00, 0x00, 0x03,
  0xe8, 0x01, 0xb5, 0x7b, 0x52, 0x6b, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c,
  0x63, 0x60, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0xa5, 0xf6, 0x45, 0x40, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe('validateImageIntegrity', () => {
  it('accepts a valid PNG buffer', async () => {
    await expect(validateImageIntegrity(validPng, 'image/png')).resolves.toBeUndefined();
  });

  it('throws for an invalid/corrupted JPEG buffer', async () => {
    const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    await expect(validateImageIntegrity(invalidBuffer, 'image/jpeg')).rejects.toThrow();
  });

  it('throws for an invalid PNG buffer', async () => {
    const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    await expect(validateImageIntegrity(invalidBuffer, 'image/png')).rejects.toThrow();
  });
});

describe('validateVideoIntegrity', () => {
  it('accepts a valid MP4 buffer structure', async () => {
    const mp4Buffer = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
    await expect(validateVideoIntegrity(mp4Buffer, 'video/mp4')).resolves.toBeUndefined();
  });

  it('throws for a buffer missing ftyp marker', async () => {
    const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    await expect(validateVideoIntegrity(invalidBuffer, 'video/mp4')).rejects.toThrow();
  });

  it('throws for a video buffer that is too small', async () => {
    const smallBuffer = Buffer.from([0x00, 0x00]);
    await expect(validateVideoIntegrity(smallBuffer, 'video/mp4')).rejects.toThrow();
  });
});

describe('validateMediaIntegrity', () => {
  it('routes image types to validateImageIntegrity', async () => {
    await expect(validateMediaIntegrity(validPng, 'image/png')).resolves.toBeUndefined();
  });

  it('routes video types to validateVideoIntegrity', async () => {
    const mp4Buffer = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
    await expect(validateMediaIntegrity(mp4Buffer, 'video/mp4')).resolves.toBeUndefined();
  });
});
