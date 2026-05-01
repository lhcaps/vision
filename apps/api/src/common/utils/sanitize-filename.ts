export function sanitizeFilename(originalName: string, maxLength = 255): string {
  // Remove path separators, null bytes, and other dangerous characters
  let sanitized = originalName
    .replace(/\0/g, '') // null bytes
    .replace(/[\/\\]/g, '_') // path separators
    .replace(/\.\./g, '_') // path traversal
    .replace(/[<>:"|?*]/g, '_') // Windows-invalid characters
    .trim();

  // Limit length
  if (sanitized.length > maxLength) {
    const ext = sanitized.split('.').pop() ?? '';
    const nameWithoutExt = sanitized.slice(0, sanitized.length - ext.length - 1);
    const available = maxLength - ext.length - 1; // -1 for dot
    sanitized =
      available > 0
        ? `${nameWithoutExt.slice(0, available)}.${ext}`
        : sanitized.slice(0, maxLength);
  }

  // Ensure not empty
  return sanitized || 'unnamed';
}
