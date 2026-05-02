export interface StorageRepository {
  putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  getSignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
  listBuckets(): Promise<void>;
}
