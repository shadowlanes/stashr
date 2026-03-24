import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';

export class R2StorageService {
  constructor(
    private readonly s3: S3Client,
    private readonly bucketName: string,
  ) {}

  buildKey(userId: string, bookmarkId: string): string {
    return `articles/${userId}/${bookmarkId}.html`;
  }

  async upload(key: string, html: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: html,
        ContentType: 'text/html; charset=utf-8',
      }),
    );
  }

  async getStream(key: string): Promise<Readable> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error(`No body in R2 response for key: ${key}`);
    }

    return response.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }
}
