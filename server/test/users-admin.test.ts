import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, USERS } from './helpers.js';

let admin: string, maker: string;

beforeAll(async () => {
  admin = await token(USERS.admin.email);
  maker = await token(USERS.rajesh.email);
});

describe('admin user management', () => {
  it('403s non-admins on the management endpoints', async () => {
    expect((await api().get('/api/v1/users/all').set(bearer(maker))).status).toBe(403);
    expect((await api().post('/api/v1/users').set(bearer(maker)).send({
      name: 'X', designation: 'Y', section: 'Accounts', role: 'MAKER', email: 'nope@example.com', password: 'secret1',
    })).status).toBe(403);
  });

  it('lets an admin list all users (incl. email + active)', async () => {
    const res = await api().get('/api/v1/users/all').set(bearer(admin));
    expect(res.status).toBe(200);
    const rajesh = res.body.users.find((u: any) => u.id === USERS.rajesh.id);
    expect(rajesh.email).toBe(USERS.rajesh.email);
    expect(rajesh.active).toBe(true);
  });

  it('creates a user that can then log in, and can be deactivated', async () => {
    const email = 'newbie@example.com';
    const created = await api().post('/api/v1/users').set(bearer(admin)).send({
      name: 'New Bie', designation: 'Clerk', section: 'Accounts', role: 'MAKER', email, password: 'secret1',
    });
    expect(created.status).toBe(201);
    const id = created.body.user.id;

    // The new user can log in.
    const ok = await api().post('/api/v1/auth/login').send({ email, password: 'secret1' });
    expect(ok.status).toBe(200);

    // Change role, then deactivate.
    const patched = await api().patch(`/api/v1/users/${id}`).set(bearer(admin)).send({ role: 'CHECKER' });
    expect(patched.body.user.role).toBe('CHECKER');

    const deact = await api().patch(`/api/v1/users/${id}`).set(bearer(admin)).send({ active: false });
    expect(deact.body.user.active).toBe(false);

    // A deactivated user can no longer log in.
    const denied = await api().post('/api/v1/auth/login').send({ email, password: 'secret1' });
    expect(denied.status).toBe(401);
  });

  it('resets a password', async () => {
    const email = 'resetme@example.com';
    const created = await api().post('/api/v1/users').set(bearer(admin)).send({
      name: 'Reset Me', designation: 'Clerk', section: 'Accounts', role: 'MAKER', email, password: 'oldpass1',
    });
    const id = created.body.user.id;
    const res = await api().post(`/api/v1/users/${id}/reset-password`).set(bearer(admin)).send({ password: 'newpass1' });
    expect(res.status).toBe(200);
    expect((await api().post('/api/v1/auth/login').send({ email, password: 'newpass1' })).status).toBe(200);
    expect((await api().post('/api/v1/auth/login').send({ email, password: 'oldpass1' })).status).toBe(401);
  });

  it('stops an admin from deactivating or demoting their own account', async () => {
    expect((await api().patch(`/api/v1/users/${USERS.admin.id}`).set(bearer(admin)).send({ active: false })).status).toBe(400);
    expect((await api().patch(`/api/v1/users/${USERS.admin.id}`).set(bearer(admin)).send({ role: 'MAKER' })).status).toBe(400);
  });

  it('locks /auth/register behind ADMIN', async () => {
    expect((await api().post('/api/v1/auth/register').send({
      name: 'Sneaky', designation: 'X', section: 'Accounts', role: 'ADMIN', email: 'sneaky@example.com', password: 'secret1',
    })).status).toBe(401); // no token

    expect((await api().post('/api/v1/auth/register').set(bearer(maker)).send({
      name: 'Sneaky', designation: 'X', section: 'Accounts', role: 'ADMIN', email: 'sneaky@example.com', password: 'secret1',
    })).status).toBe(403); // non-admin

    expect((await api().post('/api/v1/auth/register').set(bearer(admin)).send({
      name: 'Legit', designation: 'X', section: 'Accounts', role: 'MAKER', email: 'legit@example.com', password: 'secret1',
    })).status).toBe(201); // admin
  });
});
