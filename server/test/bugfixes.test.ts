import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, createFile, USERS } from './helpers.js';

let maker: string, priya: string;

beforeAll(async () => {
  maker = await token(USERS.rajesh.email);
  priya = await token(USERS.priya.email);
});

const detail = (id: string, t: string) => api().get(`/api/v1/files/${id}`).set(bearer(t));

describe('bug #6: initial note is a submitted note, not a draft', () => {
  it('creates the opening note as SUBMITTED', async () => {
    const id = await createFile(maker, { initialNote: 'Opening note' });
    const d = await detail(id, maker);
    expect(d.body.file.notes[0].status).toBe('SUBMITTED');
  });
});

describe('A2: draft-note privacy + #1 submit draft', () => {
  it('hides a draft note from other users but shows it to its author', async () => {
    const id = await createFile(maker);
    await api().post(`/api/v1/files/${id}/notes`).set(bearer(maker)).send({ content: 'my private draft', isDraft: true });

    // Author sees the draft…
    const own = await detail(id, maker);
    expect(own.body.file.notes.some((n: any) => n.status === 'DRAFT')).toBe(true);

    // …forward to Priya; she must NOT see the maker's draft note.
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });
    const priyaView = await detail(id, priya);
    expect(priyaView.body.file.notes.some((n: any) => n.status === 'DRAFT')).toBe(false);
  });

  it('submits a draft note (author + holder), which then becomes visible', async () => {
    const id = await createFile(maker);
    const created = await api().post(`/api/v1/files/${id}/notes`).set(bearer(maker)).send({ content: 'draft to submit', isDraft: true });
    const noteId = created.body.note.id;

    const res = await api().post(`/api/v1/files/${id}/notes/${noteId}/submit`).set(bearer(maker));
    expect(res.status).toBe(200);
    expect(res.body.note.status).toBe('SUBMITTED');

    // Now a different user (after forward) can see it.
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });
    const priyaView = await detail(id, priya);
    expect(priyaView.body.file.notes.some((n: any) => n.id === noteId)).toBe(true);
  });

  it('403s a non-author trying to submit a draft', async () => {
    const id = await createFile(maker);
    const created = await api().post(`/api/v1/files/${id}/notes`).set(bearer(maker)).send({ content: 'x', isDraft: true });
    const noteId = created.body.note.id;
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });
    // Priya (now holder) is not the author → 403.
    const res = await api().post(`/api/v1/files/${id}/notes/${noteId}/submit`).set(bearer(priya));
    expect(res.status).toBe(403);
  });
});

describe('bug #5: only the holder can add a note', () => {
  it('403s the maker once the file is held by a reviewer', async () => {
    const id = await createFile(maker);
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });
    const res = await api().post(`/api/v1/files/${id}/notes`).set(bearer(maker)).send({ content: 'maker note after forward' });
    expect(res.status).toBe(403);
  });
});
