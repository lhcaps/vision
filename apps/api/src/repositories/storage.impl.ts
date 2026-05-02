import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { StorageRepository } from './storage.repository';

const BUCKET = () => process.env.MINIO_BUCKET ?? 'visionflow-artifacts';

@Injectable()
export class MinioStorageRepository implements StorageRepository {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: Number(process.env.MINIO_PORT ?? '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY ?? '',
      secretKey: process.env.MINIO_SECRET_KEY ?? '',
    });
  }

  async putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    await this.client.putObject(BUCKET(), key, buffer, buffer.length, { 'Content-Type': mimeType });
  }

  async putOriginalStream(
    key: string,
    stream: NodeJS.ReadableStream,
    size: number,
    mimeType: string,
  ): Promise<void> {
    await this.client.putObject(BUCKET(), key, stream, size, { 'Content-Type': mimeType });
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.client.presignedGetObject(BUCKET(), key, 3600);
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(BUCKET(), key);
  }

  async listBuckets(): Promise<void> {
    await this.client.listBuckets();
  }

  async bucketExists(name: string): Promise<boolean> {
    return this.client.bucketExists(name);
  }
}
