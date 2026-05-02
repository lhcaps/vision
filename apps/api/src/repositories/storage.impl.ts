import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { StorageRepository } from './storage.repository';

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
    const bucket = process.env.MINIO_BUCKET ?? 'vision-media';
    await this.client.putObject(bucket, key, buffer, buffer.length, { 'Content-Type': mimeType });
  }

  async getSignedUrl(key: string): Promise<string> {
    const bucket = process.env.MINIO_BUCKET ?? 'vision-media';
    return this.client.presignedGetObject(bucket, key, 3600);
  }

  async delete(key: string): Promise<void> {
    const bucket = process.env.MINIO_BUCKET ?? 'vision-media';
    await this.client.removeObject(bucket, key);
  }

  async listBuckets(): Promise<void> {
    await this.client.listBuckets();
  }

  async bucketExists(name: string): Promise<boolean> {
    return this.client.bucketExists(name);
  }
}
