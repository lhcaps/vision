import sharp from 'sharp';

export async function validateImageIntegrity(buffer: Buffer, mimeType: string): Promise<void> {
  try {
    if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp') {
      await sharp(buffer).metadata();
    }
  } catch {
    throw new Error(`Image integrity check failed for ${mimeType}`);
  }
}

export async function validateVideoIntegrity(buffer: Buffer, mimeType: string): Promise<void> {
  if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') {
    const ftypMarker = Buffer.from('ftyp');
    const offset = 4;
    if (buffer.length < offset + ftypMarker.length) {
      throw new Error(`Video file too small for ${mimeType}`);
    }
    const hasFtyp = buffer.slice(offset, offset + ftypMarker.length).equals(ftypMarker);
    if (!hasFtyp) {
      throw new Error(`Invalid video structure for ${mimeType}`);
    }
  }
}

export async function validateMediaIntegrity(buffer: Buffer, mimeType: string): Promise<void> {
  if (mimeType.startsWith('image/')) {
    await validateImageIntegrity(buffer, mimeType);
  } else if (mimeType.startsWith('video/')) {
    await validateVideoIntegrity(buffer, mimeType);
  }
}
