import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, createFile, USERS } from './helpers.js';

let maker: string, priya: string, amit: string;

beforeAll(async () => {
  maker = await token(USERS.rajesh.email);
  priya = await token(USERS.priya.email);
  amit = await token(USERS.amit.email);
});

const notifs = (t: string) => api().get('/api/v1/notifications').set(bearer(t));
const addNote = (t: string, id: string, body: any) => api().post(`/api/v1/files/${id}/notes`).set(bearer(t)).send(body);
const sign = (t: string, id: string, body: any = {}) => api().post(`/api/v1/files/${id}/sign`).set(bearer(t)).send(body);
const sendBack = (t: string, id: string, body: any = {}) => api().post(`/api/v1/files/${id}/return`).set(bearer(t)).send(body);

describe('notifications (note-centric)', () => {
  it('notifies the first signer when a note is put up, not the maker', async () => {
    const before = (await notifs(priya)).body.unreadCount;
    const makerBefore = (await notifs(maker)).body.unreadCount;

    const id = await createFile(maker, { subject: 'Notify me' });
    await addNote(maker, id, { content: 'Please sign', signers: [{ userId: USERS.priya.id, roleLabel: 'Checker' }] });

    const priyaAfter = (await notifs(priya)).body;
    expect(priyaAfter.unreadCount).toBe(before + 1);
    const top = priyaAfter.notifications[0];
    expect(top.type).toBe('SIGN');
    expect(top.message).toContain('Notify me');
    expect(top.fileId).toBe(id);

    // The maker (actor) is not notified for their own action.
    expect((await notifs(maker)).body.unreadCount).toBe(makerBefore);
  });

  it('notifies the maker when a note is finalized and when it is sent back', async () => {
    // finalize path
    let id = await createFile(maker, { subject: 'Finalize notify' });
    await addNote(maker, id, { content: 'Approve me', signers: [{ userId: USERS.amit.id, roleLabel: 'Approver' }] });
    await sign(amit, id, { remarks: 'Approved' });
    let top = (await notifs(maker)).body.notifications[0];
    expect(top.type).toBe('FINALIZE');
    expect(top.fileId).toBe(id);

    // send-back path
    id = await createFile(maker, { subject: 'Sendback notify' });
    await addNote(maker, id, { content: 'Check me', signers: [{ userId: USERS.priya.id, roleLabel: 'Checker' }] });
    await sendBack(priya, id, { remarks: 'redo' });
    top = (await notifs(maker)).body.notifications[0];
    expect(top.type).toBe('RETURN');
    expect(top.fileId).toBe(id);
  });

  it('marks all notifications read', async () => {
    await api().post('/api/v1/notifications/read').set(bearer(priya));
    expect((await notifs(priya)).body.unreadCount).toBe(0);
  });
});
