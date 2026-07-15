import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

@Injectable()
export class StorageService {
  private readonly s3?: S3Client;
  private readonly useLocal: boolean;
  private readonly localRoot = join(process.cwd(), '.storage');
  private readonly quarantineBucket: string;
  private readonly publicBucket: string;

  constructor(private readonly config: ConfigService) {
    this.quarantineBucket = config.get('S3_BUCKET_QUARANTINE', 'pazaryeri-quarantine');
    this.publicBucket = config.get('S3_BUCKET_PUBLIC', 'pazaryeri-public');
    const endpoint = config.get<string>('S3_ENDPOINT');
    const accessKey = config.get<string>('S3_ACCESS_KEY');

    if (endpoint && accessKey) {
      this.s3 = new S3Client({
        endpoint,
        region: config.get('S3_REGION', 'auto'),
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
        },
        forcePathStyle: true,
      });
      this.useLocal = false;
    } else {
      this.useLocal = true;
    }
  }

  async uploadQuarantine(key: string, buffer: Buffer, contentType: string): Promise<void> {
    if (this.useLocal) {
      const path = join(this.localRoot, this.quarantineBucket, key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, buffer);
      return;
    }

    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.quarantineBucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  async uploadPublic(key: string, buffer: Buffer, contentType: string): Promise<void> {
    if (this.useLocal) {
      const path = join(this.localRoot, this.publicBucket, key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, buffer);
      return;
    }

    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.publicBucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  async downloadQuarantine(key: string): Promise<Buffer> {
    if (this.useLocal) {
      return readFile(join(this.localRoot, this.quarantineBucket, key));
    }

    const res = await this.s3!.send(
      new GetObjectCommand({ Bucket: this.quarantineBucket, Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error('Empty object');
    return Buffer.from(bytes);
  }

  async downloadPublic(key: string): Promise<Buffer> {
    if (this.useLocal) {
      return readFile(join(this.localRoot, this.publicBucket, key));
    }

    const res = await this.s3!.send(
      new GetObjectCommand({ Bucket: this.publicBucket, Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error('Empty object');
    return Buffer.from(bytes);
  }
}
