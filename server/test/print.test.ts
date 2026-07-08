import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, createFile, USERS } from './helpers.js';

let maker: string, admin: string, id: string;

beforeAll(async () => {
  maker = await token(USERS.rajesh.email);
  admin = await token(USERS.admin.email);
  id = await createFile(maker, { subject: 'Print ranges' });
  for (let i = 1; i <= 4; i++) {
    await api().post(`/api/v1/files/${id}/notes`).set(bearer(maker)).send({ content: `MARK${i}zzz` });
  }
});

const printText = async (query: string) => (await api().get(`/api/v1/files/${id}/print?side=noting${query}`).set(bearer(maker))).text;

describe('custom print — note ranges (A6, observation #4)', () => {
  it('prints all notes by default', async () => {
    const t = await printText('');
    expect(t).toContain('MARK1zzz');
    expect(t).toContain('MARK4zzz');
  });

  it('prints only a custom note range', async () => {
    const t = await printText('&fromNote=2&toNote=3');
    expect(t).toContain('MARK2zzz');
    expect(t).toContain('MARK3zzz');
    expect(t).not.toContain('MARK1zzz');
    expect(t).not.toContain('MARK4zzz');
  });

  it('prints only the last note', async () => {
    const t = await printText('&last=true');
    expect(t).toContain('MARK4zzz');
    expect(t).not.toContain('MARK1zzz');
  });

  it('403s the admin (content lockout)', async () => {
    const res = await api().get(`/api/v1/files/${id}/print?side=noting`).set(bearer(admin));
    expect(res.status).toBe(403);
  });
});
