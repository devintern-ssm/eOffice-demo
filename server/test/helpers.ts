import request from 'supertest';
import type { Express } from 'express';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../src/app.js';

export const app: Express = createApp();
export const api = () => request(app);

// Seeded users (fixed IDs / emails from prisma/seed.ts).
export const USERS = {
  rajesh: { id: 'u-rajesh', email: 'rajesh.kumar@example.com' }, // MAKER (Administration)
  priya: { id: 'u-priya', email: 'priya.sharma@example.com' },   // CHECKER (Administration)
  amit: { id: 'u-amit', email: 'amit.patel@example.com' },       // APPROVER (Administration)
  vikram: { id: 'u-vikram', email: 'vikram.singh@example.com' }, // MAKER (Legal) — an outsider
  md: { id: 'u-md', email: 'md@example.com' },                   // MD (final approver)
  admin: { id: 'u-admin', email: 'admin@example.com' },          // ADMIN
};

const PASSWORD = 'password123';

export async function token(email: string): Promise<string> {
  const res = await api().post('/api/v1/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${res.text}`);
  return res.body.token as string;
}

export const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

/** Build a small valid multi-page PDF buffer for upload tests. */
export async function pdfBuffer(pages = 1): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]).drawText(`p${i + 1}`);
  return Buffer.from(await doc.save());
}

/** Create a DRAFT file as the given bearer token; returns the file id. */
export async function createFile(t: string, overrides: Record<string, unknown> = {}): Promise<string> {
  const res = await api()
    .post('/api/v1/files')
    .set(bearer(t))
    .send({ subject: 'Test file', section: 'Administration', ...overrides });
  if (res.status !== 201) throw new Error(`createFile failed: ${res.status} ${res.text}`);
  return res.body.file.id as string;
}
