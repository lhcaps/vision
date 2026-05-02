import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

test.describe('Security — Upload Hardening', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Input Validation', () => {
    test('unknown fields are rejected by ValidationPipe', async ({ page }) => {
      const response = await page.request.fetch(`${API_BASE}/projects/demo/media/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          file: 'not-a-real-upload',
          unknownField: 'should-be-rejected',
          anotherBadField: 12345,
        }),
      });

      const body = await response.json();
      expect(body).toHaveProperty('statusCode');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('timestamp');
      expect(body.message).not.toMatch(/C:\\|D:\\|\/home\/|\/Users\//);
      expect(body.message).not.toContain('stack');
      expect(body.message).not.toContain('at ');
      expect(body.message).not.toContain('process.env');
    });

    test('error responses do not leak internal paths or credentials', async ({ page }) => {
      const response = await page.request.fetch(`${API_BASE}/projects/demo/media/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({}),
      });

      const body = await response.json();
      expect(body).toHaveProperty('statusCode');
      expect(body).toHaveProperty('timestamp');
      expect(body.message).not.toContain('postgres');
      expect(body.message).not.toContain('minio');
      expect(body.message).not.toContain('process.env');
      expect(body.message).not.toContain('stack');
      expect(body.message).not.toContain('/app/');
      expect(body.message).not.toContain('/Users/');
    });
  });

  test.describe('File Upload Restrictions', () => {
    test('oversized file returns 413 or 400', async ({ page }) => {
      const oversizedBuffer = Buffer.alloc(260 * 1024 * 1024);

      const response = await page.request.fetch(`${API_BASE}/projects/demo/media/upload`, {
        method: 'POST',
        multipart: {
          file: {
            name: 'large.bin',
            mimeType: 'application/octet-stream',
            buffer: oversizedBuffer,
          },
        },
      });

      expect([400, 413]).toContain(response.status());
    });

    test('invalid MIME type returns 400', async ({ page }) => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

      const response = await page.request.fetch(`${API_BASE}/projects/demo/media/upload`, {
        method: 'POST',
        multipart: {
          file: {
            name: 'test.pdf',
            mimeType: 'application/pdf',
            buffer,
          },
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('statusCode');
      expect(body).toHaveProperty('message');
      expect(body.message).not.toContain('/');
      expect(body.message).not.toContain('stack');
      expect(body.message).not.toContain('Error:');
    });

    test('duplicate upload returns deduplicated response', async ({ page }) => {
      const buffer = Buffer.from([
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
        ...Array(100).fill(0x00),
      ]);

      const first = await page.request.fetch(`${API_BASE}/projects/demo/media/upload`, {
        method: 'POST',
        multipart: {
          file: {
            name: 'test.jpg',
            mimeType: 'image/jpeg',
            buffer,
          },
        },
      });

      if (first.status() === 200) {
        const second = await page.request.fetch(`${API_BASE}/projects/demo/media/upload`, {
          method: 'POST',
          multipart: {
            file: {
              name: 'test2.jpg',
              mimeType: 'image/jpeg',
              buffer,
            },
          },
        });

        if (second.status() === 200) {
          const body = await second.json();
          expect(body).toHaveProperty('deduplicated');
          expect(body.deduplicated).toBe(true);
        }
      }
    });
  });
});

test.describe('Security — Asset Access', () => {
  test('asset endpoint returns structured 404 for non-existent asset', async ({ page }) => {
    const response = await page.request.fetch(
      `${API_BASE}/projects/demo/media/non-existent-asset-id/file`,
      { method: 'GET' }
    );

    const body = await response.json();
    expect(body).toHaveProperty('statusCode');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('timestamp');
    expect(body.message).not.toContain('stack');
    expect(body.message).not.toMatch(/C:\\|D:\\|\/home\/|\/Users\//);
  });

  test('structured error responses have consistent shape', async ({ page }) => {
    const response = await page.request.fetch(
      `${API_BASE}/projects/demo/media/also-does-not-exist/file`,
      { method: 'GET' }
    );

    const body = await response.json();
    expect(body).toHaveProperty('statusCode');
    expect(typeof body.statusCode).toBe('number');
    expect(body).toHaveProperty('message');
    expect(typeof body.message).toBe('string');
    expect(body).toHaveProperty('timestamp');
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
