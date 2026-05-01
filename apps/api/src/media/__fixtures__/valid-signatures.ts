// Valid magic byte signatures for test fixtures
export const VALID_JPEG_BYTES = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
export const VALID_PNG_BYTES = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
export const VALID_WEBP_RIFF = Buffer.from([0x52, 0x49, 0x46, 0x46]); // RIFF at 0
export const VALID_WEBP_WEBP = Buffer.from([0x57, 0x45, 0x42, 0x50]); // WEBP at 8
export const VALID_MP4_FTYP = Buffer.from([0x66, 0x74, 0x79, 0x70]); // ftyp at 4

// Truncated buffers for edge case testing
export const TRUNCATED_JPEG = Buffer.from([0xFF, 0xD8]); // too short
export const TRUNCATED_PNG = Buffer.from([0x89, 0x50]); // too short

// Wrong MIME type mismatch
export const JPEG_SIGNATURE_WITH_PNG_DECLARATION = {
  buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, ...Array(100).fill(0)]),
  declaredMime: 'image/png',
};
