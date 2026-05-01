import { Injectable } from '@nestjs/common';
import { StorageRepository } from './storage.repository';

@Injectable()
export class LocalStorageRepository implements StorageRepository {
  private readonly storage = new Map<string, { buffer: Buffer; mimeType: string }>();

  async putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void> {
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
}
