import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config.js';

/**
 * Abstraction over blob storage. Two drivers are provided and selected by
 * config.storageDriver ('disk' | 's3'):
 *   - disk: local filesystem (default; used for dev + the test suite).
 *   - s3:   any S3-compatible object store (AWS S3, or MinIO in our compose stack).
 * The interface is buffer-based so the same call sites work for both drivers.
 */
export interface StorageProvider {
  /** Persist bytes and return an opaque storageKey. */
  save(buffer: Buffer, ext?: string): Promise<string>;
  /** Read bytes back, or null if the key does not exist. */
  read(key: string): Promise<Buffer | null>;
}

class DiskStorageProvider implements StorageProvider {
  private root: string;
  constructor(root: string) {
    this.root = path.resolve(root);
    fs.mkdirSync(this.root, { recursive: true });
  }
  async save(buffer: Buffer, ext = 'pdf'): Promise<string> {
    const key = `${randomUUID()}.${ext}`;
    await fs.promises.writeFile(path.join(this.root, key), buffer);
    return key;
  }
  private resolve(key: string): string {
    // basename guards against path traversal via a crafted key.
    return path.join(this.root, path.basename(key));
  }
  async read(key: string): Promise<Buffer | null> {
    const p = this.resolve(key);
    if (!fs.existsSync(p)) return null;
    return fs.promises.readFile(p);
  }
}

class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  constructor() {
    const s = config.s3;
    this.bucket = s.bucket;
    this.client = new S3Client({
      region: s.region,
      endpoint: s.endpoint || undefined, // set for MinIO / non-AWS; omit for real AWS
      forcePathStyle: s.forcePathStyle,   // required by MinIO
      credentials: { accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey },
    });
  }
  async save(buffer: Buffer, ext = 'pdf'): Promise<string> {
    const key = `${randomUUID()}.${ext}`;
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer }));
    return key;
  }
  async read(key: string): Promise<Buffer | null> {
    try {
      // basename mirrors the disk driver's traversal guard and keeps keys flat.
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: path.basename(key) }));
      const body = res.Body as NodeJS.ReadableStream | undefined;
      if (!body) return null;
      const chunks: Buffer[] = [];
      for await (const chunk of body) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return Buffer.concat(chunks);
    } catch (err: any) {
      if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return null;
      throw err;
    }
  }
}

export const storage: StorageProvider =
  config.storageDriver === 's3' ? new S3StorageProvider() : new DiskStorageProvider(config.uploadDir);
