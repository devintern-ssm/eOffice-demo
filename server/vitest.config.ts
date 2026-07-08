import { defineConfig } from 'vitest/config';

// Tests run against an isolated SQLite file (prisma/test.db), migrated + seeded once in
// global-setup. DATABASE_URL is injected here BEFORE any app import so the Prisma client
// (and dotenv, which won't override an already-set var) points at the test DB.
export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./test/global-setup.ts'],
    include: ['test/**/*.test.ts'],
    env: {
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test-secret',
      UPLOAD_DIR: './uploads-test',
      NODE_ENV: 'test',
    },
    hookTimeout: 120_000,
    testTimeout: 30_000,
    // One shared SQLite DB → run files serially to avoid write contention.
    fileParallelism: false,
    pool: 'forks',
  },
});
