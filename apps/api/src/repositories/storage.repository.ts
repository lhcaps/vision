export interface StorageRepository {
  putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  putOriginalStream(key: string, stream: NodeJS.ReadableStream, size: number, mimeType: string): Promise<void>;
  getSignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
  listBuckets(): Promise<void>;
  bucketExists(name: string): Promise<boolean>;
}
