import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { Client } from "minio";

@Injectable()
export class MediaStorageService {
  private readonly bucket = process.env.MINIO_BUCKET ?? "visionflow-artifacts";
  private readonly client = new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "visionflow",
    secretKey: process.env.MINIO_SECRET_KEY ?? "visionflow-secret",
  });

  async putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    try {
      await this.ensureBucket();
      await this.client.putObject(this.bucket, key, buffer, buffer.length, {
        "Content-Type": mimeType,
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        message: "Object storage is not reachable. Start MinIO before uploading media.",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);

    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }
}
