import { describe, expect, it } from 'vitest';
import {
  validateImageIntegrity,
  validateVideoIntegrity,
  validateMediaIntegrity,
} from './media-integrity';

describe('validateImageIntegrity', () => {
  it('accepts a valid JPEG buffer', async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
    await expect(validateImageIntegrity(jpegBuffer, 'image/jpeg')).resolves.toBeUndefined();
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
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
    await expect(validateMediaIntegrity(jpegBuffer, 'image/jpeg')).resolves.toBeUndefined();
  });

  it('routes video types to validateVideoIntegrity', async () => {
    const mp4Buffer = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
    await expect(validateMediaIntegrity(mp4Buffer, 'video/mp4')).resolves.toBeUndefined();
  });
});
