import { Injectable } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class SignedUrlService {
  private readonly client = new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'visionflow',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'visionflow-secret',
  });

  private readonly bucket = process.env.MINIO_BUCKET ?? 'visionflow-artifacts';

  async generateSignedUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
    try {
      return await this.client.presignedGetObject(this.bucket, storageKey, expiresInSeconds);
    } catch (error) {
      throw new Error(
        `Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async streamFile(storageKey: string): Promise<{ buffer: Buffer; meta: Record<string, string> }> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const meta: Record<string, string> = {};

      const stream = this.client.getObject(
        this.bucket,
        storageKey
      ) as unknown as NodeJS.ReadableStream;

      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve({ buffer: Buffer.concat(chunks), meta }));
      stream.on('error', (err: Error) =>
        reject(new Error(`Failed to stream file: ${err.message}`))
      );

      // Get metadata from stat
      this.client
        .statObject(this.bucket, storageKey)
        .then((stat) => {
          if (stat.metaData) {
            Object.assign(meta, stat.metaData);
          }
        })
        .catch(() => {
          // Metadata fetch failed, continue without it
        });
    });
  }
}
