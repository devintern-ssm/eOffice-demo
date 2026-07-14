import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, USERS } from './helpers.js';

let admin: string, maker: string;

beforeAll(async () => {
  admin = await token(USERS.admin.email);
  maker = await token(USERS.rajesh.email);
});

describe('departments (observation #1)', () => {
  it('lists the seeded departments to any signed-in user', async () => {
    const res = await api().get('/api/v1/departments').set(bearer(maker));
    expect(res.status).toBe(200);
    const names = res.body.departments.map((d: any) => d.name);
    expect(names).toContain('Administration');
    expect(names).toContain('Accounts');
  });

  it('403s a non-admin on management endpoints', async () => {
    expect((await api().get('/api/v1/departments/all').set(bearer(maker))).status).toBe(403);
    expect((await api().post('/api/v1/departments').set(bearer(maker)).send({ name: 'X', code: 'X' })).status).toBe(403);
  });

  it('lets an admin add a department, and a new file in it gets its code in the number', async () => {
    const created = await api().post('/api/v1/departments').set(bearer(admin)).send({ name: 'Human Resources', code: 'hr' });
    expect(created.status).toBe(201);
    expect(created.body.department.code).toBe('HR'); // upper-cased

    // A maker opens a binder in the new department → its UN number uses the code.
    const file = await api().post('/api/v1/files').set(bearer(maker)).send({ subject: 'HR file', section: 'Human Resources' });
    expect(file.body.file.displayNumber).toMatch(/^HR\/\d{4}\/\d{3}$/);
  });

  it('rejects a duplicate department name (409)', async () => {
    const res = await api().post('/api/v1/departments').set(bearer(admin)).send({ name: 'Administration', code: 'ADM2' });
    expect(res.status).toBe(409);
  });
});
