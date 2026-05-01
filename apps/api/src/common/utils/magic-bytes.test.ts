import { describe, expect, it } from 'vitest';
import { validateMagicBytes } from './magic-bytes';
import {
  VALID_JPEG_BYTES,
  VALID_PNG_BYTES,
  VALID_WEBP_RIFF,
  VALID_WEBP_WEBP,
  VALID_MP4_FTYP,
  TRUNCATED_JPEG,
  TRUNCATED_PNG,
} from '../media/__fixtures__/valid-signatures';

describe('validateMagicBytes', () => {
  describe('valid signatures', () => {
    it('accepts valid JPEG magic bytes for image/jpeg', () => {
      expect(validateMagicBytes(VALID_JPEG_BYTES, 'image/jpeg')).toBe(true);
    });

    it('accepts valid PNG magic bytes for image/png', () => {
      expect(validateMagicBytes(VALID_PNG_BYTES, 'image/png')).toBe(true);
    });

    it('accepts valid WebP RIFF + WEBP for image/webp', () => {
      // WebP needs 12 bytes: RIFF header at 0, size at 4-7, WEBP at 8
      const webpBuffer = Buffer.concat([
        VALID_WEBP_RIFF,
        Buffer.from([0x00, 0x00, 0x00, 0x00]), // size placeholder
        VALID_WEBP_WEBP,
      ]);
      expect(validateMagicBytes(webpBuffer, 'image/webp')).toBe(true);
    });

    it('accepts valid MP4 ftyp box for video/mp4', () => {
      // MP4 needs at least 8 bytes: any 4 bytes at 0-3, ftyp at 4
      const mp4Buffer = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x08]), // size
        VALID_MP4_FTYP,
        Buffer.from([0x00, 0x00, 0x00]), // extra
      ]);
      expect(validateMagicBytes(mp4Buffer, 'video/mp4')).toBe(true);
    });

    it('accepts valid MOV ftyp box for video/quicktime', () => {
      // Same as MP4 - ftyp at offset 4
      const movBuffer = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x14]), // size
        VALID_MP4_FTYP,
        Buffer.from([0x69, 0x73, 0x6F, 0x6D]), // isom brand
      ]);
      expect(validateMagicBytes(movBuffer, 'video/quicktime')).toBe(true);
    });
  });

  describe('signature mismatch', () => {
    it('rejects JPEG signature when declared as image/png', () => {
      const mismatch = Buffer.concat([
        VALID_JPEG_BYTES,
        Buffer.alloc(100),
      ]);
      expect(validateMagicBytes(mismatch, 'image/png')).toBe(false);
    });

    it('rejects PNG signature when declared as image/jpeg', () => {
      const mismatch = Buffer.concat([
        VALID_PNG_BYTES,
        Buffer.alloc(100),
      ]);
      expect(validateMagicBytes(mismatch, 'image/jpeg')).toBe(false);
    });

    it('rejects unknown MIME type', () => {
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF]);
      expect(validateMagicBytes(buffer, 'application/pdf')).toBe(false);
    });

    it('rejects WebP buffer when declared as video/mp4', () => {
      const webpBuffer = Buffer.concat([
        VALID_WEBP_RIFF,
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        VALID_WEBP_WEBP,
      ]);
      expect(validateMagicBytes(webpBuffer, 'video/mp4')).toBe(false);
    });
  });

  describe('truncated buffers', () => {
    it('returns false for JPEG buffer too short', () => {
      expect(validateMagicBytes(TRUNCATED_JPEG, 'image/jpeg')).toBe(false);
    });

    it('returns false for PNG buffer too short', () => {
      expect(validateMagicBytes(TRUNCATED_PNG, 'image/png')).toBe(false);
    });

    it('returns false for WebP buffer too short (missing WEBP marker)', () => {
      const partial = Buffer.concat([
        VALID_WEBP_RIFF,
        Buffer.from([0x00, 0x00, 0x00]), // only 3 bytes after RIFF
      ]);
      expect(validateMagicBytes(partial, 'image/webp')).toBe(false);
    });

    it('returns false for MP4 buffer too short (no ftyp)', () => {
      const partial = Buffer.from([0x00, 0x00, 0x00, 0x08]); // only size, no ftyp
      expect(validateMagicBytes(partial, 'video/mp4')).toBe(false);
    });
  });

  describe('empty and minimal buffers', () => {
    it('returns false for empty buffer', () => {
      expect(validateMagicBytes(Buffer.alloc(0), 'image/jpeg')).toBe(false);
    });

    it('returns false for null/undefined buffer', () => {
      // @ts-expect-error - testing edge case with invalid input
      expect(validateMagicBytes(null, 'image/jpeg')).toBe(false);
      // @ts-expect-error - testing edge case with invalid input
      expect(validateMagicBytes(undefined, 'image/jpeg')).toBe(false);
    });

    it('returns false for single byte buffer', () => {
      expect(validateMagicBytes(Buffer.from([0xFF]), 'image/jpeg')).toBe(false);
    });

    it('returns false for buffer with only RIFF (WebP needs WEBP marker)', () => {
      expect(validateMagicBytes(VALID_WEBP_RIFF, 'image/webp')).toBe(false);
    });
  });
});
