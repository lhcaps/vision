import { describe, expect, it } from 'vitest';
import { sanitizeFilename } from './sanitize-filename';

describe('sanitizeFilename', () => {
  it('passes through normal filenames unchanged', () => {
    expect(sanitizeFilename('photo.jpg')).toBe('photo.jpg');
    expect(sanitizeFilename('my-image_2024.png')).toBe('my-image_2024.png');
    expect(sanitizeFilename('video.mp4')).toBe('video.mp4');
  });

  it('removes path traversal sequences', () => {
    // Path separator replacement happens before .. replacement
    expect(sanitizeFilename('../etc/passwd')).toBe('__etc_passwd');
    expect(sanitizeFilename('/etc/passwd')).toBe('_etc_passwd');
  });

  it('removes Windows path separators', () => {
    expect(sanitizeFilename('C:\\Users\\file.txt')).toBe('C__Users_file.txt');
    expect(sanitizeFilename('dir\\subdir\\file.png')).toBe('dir_subdir_file.png');
  });

  it('removes null bytes', () => {
    expect(sanitizeFilename('file\x00.jpg')).toBe('file.jpg');
    expect(sanitizeFilename('null\x00byte\x00file')).toBe('nullbytefile');
  });

  it('removes Windows-invalid characters', () => {
    expect(sanitizeFilename('file<name>.txt')).toBe('file_name_.txt');
    expect(sanitizeFilename('file:name.txt')).toBe('file_name.txt');
    expect(sanitizeFilename('file|pipe.txt')).toBe('file_pipe.txt');
    expect(sanitizeFilename('file*star.txt')).toBe('file_star.txt');
    expect(sanitizeFilename('file?mark.txt')).toBe('file_mark.txt');
    expect(sanitizeFilename('file"quote.txt')).toBe('file_quote.txt');
  });

  it('limits filename length to maxLength', () => {
    const longName = 'a'.repeat(300) + '.jpg';
    const result = sanitizeFilename(longName, 255);
    expect(result.length).toBeLessThanOrEqual(255);
    expect(result.endsWith('.jpg')).toBe(true);
  });

  it('returns unnamed for empty sanitized result', () => {
    expect(sanitizeFilename('')).toBe('unnamed');
    expect(sanitizeFilename('   ')).toBe('unnamed');
  });

  it('preserves extension when truncating', () => {
    const longName = 'a'.repeat(300) + '.jpeg';
    const result = sanitizeFilename(longName, 255);
    expect(result.endsWith('.jpeg')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('handles UTF-8 filenames', () => {
    expect(sanitizeFilename('café_upload.jpg')).toBe('café_upload.jpg');
    expect(sanitizeFilename('上传文件.png')).toBe('上传文件.png');
    expect(sanitizeFilename('日本語ファイル.txt')).toBe('日本語ファイル.txt');
  });

  it('trims leading/trailing whitespace', () => {
    expect(sanitizeFilename('  photo.jpg  ')).toBe('photo.jpg');
    expect(sanitizeFilename('\tvideo.mp4\t')).toBe('video.mp4');
  });

  it('handles filenames with no extension', () => {
    expect(sanitizeFilename('noextensionfile')).toBe('noextensionfile');
    expect(sanitizeFilename('a'.repeat(300))).toHaveLength(255);
  });

  it('handles multiple dots in filename', () => {
    expect(sanitizeFilename('my.file.name.jpg')).toBe('my.file.name.jpg');
    expect(sanitizeFilename('..jpg')).toBe('_jpg');
  });

  it('sanitizes complex attack patterns', () => {
    // Windows path separators become _ first, then .. becomes _ too
    // C:\..\..\etc\passwd -> C__..__..__etc__passwd -> C____etc_passwd
    expect(sanitizeFilename('C:\\..\\..\\etc\\passwd')).toBe('C______etc_passwd');
    // ../a/b/../../c -> __a_b__c -> __a_b_____c
    expect(sanitizeFilename('../a/b/../../c')).toBe('__a_b_____c');
  });
});
