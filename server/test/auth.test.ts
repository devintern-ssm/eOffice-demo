import { describe, it, expect } from 'vitest';
import { api, token, bearer, USERS } from './helpers.js';

describe('auth', () => {
  it('logs in a seeded user and returns a token + user', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: USERS.rajesh.email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.id).toBe(USERS.rajesh.id);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: USERS.rajesh.email, password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('returns the current user from GET /auth/me', async () => {
    const t = await token(USERS.priya.email);
    const res = await api().get('/api/v1/auth/me').set(bearer(t));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(USERS.priya.id);
  });

  it('rejects a protected route without a token (401)', async () => {
    const res = await api().get('/api/v1/files');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token (401)', async () => {
    const res = await api().get('/api/v1/files').set(bearer('garbage.token.value'));
    expect(res.status).toBe(401);
  });
});
