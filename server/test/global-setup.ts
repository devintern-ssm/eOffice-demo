import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '..');

/** Reset the test SQLite DB, apply migrations, and seed the 8 fixed users + files. */
export default async function setup() {
  const dbFile = path.join(serverDir, 'prisma', 'test.db');
  for (const f of [dbFile, `${dbFile}-journal`, `${dbFile}-wal`, `${dbFile}-shm`]) {
    if (fs.existsSync(f)) fs.rmSync(f);
  }

  const env = { ...process.env, DATABASE_URL: 'file:./test.db' };
  execSync('npx prisma migrate deploy', { cwd: serverDir, env, stdio: 'inherit' });
  execSync('npx tsx prisma/seed.ts', { cwd: serverDir, env, stdio: 'inherit' });
}
