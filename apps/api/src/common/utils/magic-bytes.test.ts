import { describe, expect, it } from 'vitest';
import { validateMagicBytes } from './magic-bytes';

describe('validateMagicBytes', () => {
  it('validates a correct JPEG signature', () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    expect(validateMagicBytes(jpegBuffer, 'image/jpeg')).toBe(true);
  });

  it('validates a correct PNG signature', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateMagicBytes(pngBuffer, 'image/png')).toBe(true);
  });

  it('rejects JPEG magic bytes with wrong mimeType', () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(validateMagicBytes(jpegBuffer, 'image/png')).toBe(false);
  });

  it('returns false for truncated buffer', () => {
    const shortBuffer = Buffer.from([0xff, 0xd8]);
    expect(validateMagicBytes(shortBuffer, 'image/jpeg')).toBe(false);
  });

  it('validates a correct WebP signature', () => {
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x1c, 0x00, 0x00, 0x00, // file size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(validateMagicBytes(webpBuffer, 'image/webp')).toBe(true);
  });

  it('validates a correct MP4 signature', () => {
    const mp4Buffer = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
    expect(validateMagicBytes(mp4Buffer, 'video/mp4')).toBe(true);
  });
});
