type MagicByteSignature = {
  mimeType: string;
  signatures: Array<{ offset: number; bytes: Buffer }>;
};

const SIGNATURES: MagicByteSignature[] = [
  {
    mimeType: 'image/jpeg',
    signatures: [{ offset: 0, bytes: Buffer.from([0xFF, 0xD8, 0xFF]) }],
  },
  {
    mimeType: 'image/png',
    signatures: [{ offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4E, 0x47]) }],
  },
  {
    mimeType: 'image/webp',
    signatures: [
      { offset: 0, bytes: Buffer.from([0x52, 0x49, 0x46, 0x46]) }, // RIFF header
      { offset: 8, bytes: Buffer.from([0x57, 0x45, 0x42, 0x50]) }, // WEBP at offset 8
    ],
  },
  {
    mimeType: 'video/mp4',
    signatures: [
      { offset: 4, bytes: Buffer.from([0x66, 0x74, 0x79, 0x70]) }, // ftyp at offset 4
    ],
  },
  {
    mimeType: 'video/quicktime',
    signatures: [
      { offset: 4, bytes: Buffer.from([0x66, 0x74, 0x79, 0x70, 0x71, 0x74]) }, // ftypqt at offset 4
    ],
  },
];

export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signature = SIGNATURES.find((s) => s.mimeType === mimeType);
  if (!signature) return false;

  return signature.signatures.every(({ offset, bytes }) => {
    if (buffer.length < offset + bytes.length) return false;
    return buffer.slice(offset, offset + bytes.length).equals(bytes);
  });
}
