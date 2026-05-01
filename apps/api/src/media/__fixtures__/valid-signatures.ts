// Valid magic byte signatures for test fixtures
export const VALID_JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
]);
export const VALID_PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export const VALID_WEBP_RIFF = Buffer.from([0x52, 0x49, 0x46, 0x46]); // RIFF at 0
export const VALID_WEBP_WEBP = Buffer.from([0x57, 0x45, 0x42, 0x50]); // WEBP at 8
export const VALID_MP4_FTYP = Buffer.from([0x66, 0x74, 0x79, 0x70]); // ftyp at 4

// Truncated buffers for edge case testing
export const TRUNCATED_JPEG = Buffer.from([0xff, 0xd8]); // too short
export const TRUNCATED_PNG = Buffer.from([0x89, 0x50]); // too short

// Wrong MIME type mismatch
export const JPEG_SIGNATURE_WITH_PNG_DECLARATION = {
  buffer: Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    ...Array(100).fill(0),
  ]),
  declaredMime: 'image/png',
};
