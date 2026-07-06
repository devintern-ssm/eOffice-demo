import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, createFile, USERS } from './helpers.js';

let maker: string, priya: string;

beforeAll(async () => {
  maker = await token(USERS.rajesh.email);
  priya = await token(USERS.priya.email);
});

const notifs = (t: string) => api().get('/api/v1/notifications').set(bearer(t));

describe('notifications', () => {
  it('notifies the recipient on forward, not the actor', async () => {
    const before = (await notifs(priya)).body.unreadCount;
    const makerBefore = (await notifs(maker)).body.unreadCount;

    const id = await createFile(maker, { subject: 'Notify me' });
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });

    const priyaAfter = (await notifs(priya)).body;
    expect(priyaAfter.unreadCount).toBe(before + 1);
    const top = priyaAfter.notifications[0];
    expect(top.type).toBe('FORWARD');
    expect(top.message).toContain('Notify me');
    expect(top.fileId).toBe(id);

    // The actor (maker) did not get a notification for their own action.
    expect((await notifs(maker)).body.unreadCount).toBe(makerBefore);
  });

  it('notifies the maker on approval and on revert', async () => {
    // approve path
    let id = await createFile(maker, { subject: 'Approve notify' });
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.amit.id, role: 'APPROVER' }] });
    const amit = await token(USERS.amit.email);
    await api().post(`/api/v1/files/${id}/action`).set(bearer(amit)).send({ action: 'approve' });
    let top = (await notifs(maker)).body.notifications[0];
    expect(top.type).toBe('APPROVE');
    expect(top.fileId).toBe(id);

    // revert path
    id = await createFile(maker, { subject: 'Revert notify' });
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });
    await api().post(`/api/v1/files/${id}/action`).set(bearer(priya)).send({ action: 'revert', remarks: 'redo' });
    top = (await notifs(maker)).body.notifications[0];
    expect(top.type).toBe('REVERT');
    expect(top.fileId).toBe(id);
  });

  it('marks all notifications read', async () => {
    await api().post('/api/v1/notifications/read').set(bearer(priya));
    expect((await notifs(priya)).body.unreadCount).toBe(0);
  });
});
