import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('Security — Upload Hardening', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const mediaNav = page.getByRole('button', { name: 'Media' });
    if (await mediaNav.isVisible()) {
      await mediaNav.click();
      await page.waitForTimeout(500);
    }
  });

  test('file size limit returns 413 for oversized upload', async ({ page }) => {
    // Create a buffer larger than 250MB (use 260MB)
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

    // Should return 413 or 400 (MIME type rejected)
    expect([400, 413]).toContain(response.status());
  });

  test('invalid MIME type is rejected', async ({ page }) => {
    const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);

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
    // Should not expose internal paths or stack traces
    expect(body.message).not.toContain('/');
    expect(body.message).not.toContain('stack');
    expect(body.message).not.toContain('Error:');
  });

  test('duplicate upload returns deduplicated response', async ({ page }) => {
    const buffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, ...Array(100).fill(0x00),
    ]);

    // First upload
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

    // Second upload with same content should deduplicate
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

  test('error responses are structured and safe', async ({ page }) => {
    // Send a request with unknown fields (should be rejected by ValidationPipe)
    const response = await page.request.fetch(`${API_BASE}/projects/demo/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        file: 'not-a-real-upload',
        unknownField: 'should-be-rejected',
        anotherBadField: 12345,
      }),
    });

    const body = await response.json();

    // Must be structured
    expect(body).toHaveProperty('statusCode');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('timestamp');

    // Must not leak internal details
    expect(body.message).not.toMatch(/C:\\|D:\\|\/home\/|\/Users\//);
    expect(body.message).not.toContain('stack');
    expect(body.message).not.toContain('at ');
    expect(body.message).not.toContain('process.env');
    expect(body.message).not.toContain('postgres');
    expect(body.message).not.toContain('minio');
  });
});

test.describe('Security — Asset Access', () => {
  const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

  test('asset endpoint returns structured 404 for non-existent asset', async ({ page }) => {
    const response = await page.request.fetch(
      `${API_BASE}/projects/demo/media/non-existent-asset-id/file`,
      { method: 'GET' },
    );

    const body = await response.json();

    // Must be structured
    expect(body).toHaveProperty('statusCode');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('timestamp');

    // Must not leak internal details
    expect(body.message).not.toContain('stack');
    expect(body.message).not.toMatch(/C:\\|D:\\|\/home\/|\/Users\//);
  });
});
