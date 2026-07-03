import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

/**
 * Abstraction over blob storage. Phase 1 uses local disk; the interface lets us
 * swap to S3/Azure Blob for the Phase-2 DMS without touching call sites.
 */
export interface StorageProvider {
  save(buffer: Buffer, ext?: string): Promise<string>; // returns a storageKey
  resolve(key: string): string;                        // absolute path on disk
  exists(key: string): boolean;
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
  resolve(key: string): string {
    // basename guards against path traversal via a crafted key.
    return path.join(this.root, path.basename(key));
  }
  exists(key: string): boolean {
    return fs.existsSync(this.resolve(key));
  }
}

export const storage: StorageProvider = new DiskStorageProvider(config.uploadDir);
