import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { StorageRepository } from './storage.repository';

@Injectable()
export class LocalStorageRepository implements StorageRepository {
  private readonly storage = new Map<string, { buffer: Buffer; mimeType: string }>();

  async putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    this.storage.set(key, { buffer, mimeType });
  }

  async putOriginalStream(key: string, stream: NodeJS.ReadableStream, _size: number, mimeType: string): Promise<void> {
    const readable = stream as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of readable) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    this.storage.set(key, { buffer, mimeType });
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/storage/local/${key}`;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async listBuckets(): Promise<void> {
    // No-op for local storage
  }

  async bucketExists(_name: string): Promise<boolean> {
    return true;
  }
}
