/**
 * Magic byte validation for media uploads.
 * Validates that file content matches declared MIME type.
 */

const MAGIC_SIGNATURES: Record<string, { bytes: number[]; offset: number }> = {
  'image/jpeg': { bytes: [0xFF, 0xD8, 0xFF], offset: 0 },
  'image/png': { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
  'image/webp': { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // WEBP at offset 8 after RIFF header
  'video/mp4': { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
  'video/quicktime': { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
};

/**
 * Validates that a buffer's magic bytes match the declared MIME type.
 * @param buffer - The file buffer to validate
 * @param mimeType - The declared MIME type
 * @returns true if magic bytes match, false otherwise
 */
export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length === 0) {
    return false;
  }

  const signature = MAGIC_SIGNATURES[mimeType];
  if (!signature) {
    return false;
  }

  const { bytes, offset } = signature;

  // For WebP, we need at least 12 bytes (RIFF + size + WEBP)
  if (mimeType === 'image/webp' && buffer.length < 12) {
    return false;
  }

  // Check if buffer is long enough for the signature at the offset
  if (buffer.length < offset + bytes.length) {
    return false;
  }

  // Compare magic bytes
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) {
      return false;
    }
  }

  return true;
}
