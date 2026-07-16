import { describe, it, expect } from 'vitest';
import { api, bearer, token, createFile, pdfBuffer, USERS } from './helpers.js';

// End-to-end coverage of the NOTE-CENTRIC engine over HTTP.
// Model: a file is a permanent OPEN binder; the note is the unit of workflow; each note has its
// own maker + ordered signer chain; a signer Signs & Forwards or Sends Back; the last signer
// finalizes and the file returns to that note's maker; notes are strictly sequential.

async function tokens() {
  const [rajesh, priya, amit, vikram] = await Promise.all([
    token(USERS.rajesh.email), token(USERS.priya.email), token(USERS.amit.email), token(USERS.vikram.email),
  ]);
  return { rajesh, priya, amit, vikram };
}

const getFile = (t: string, id: string) => api().get(`/api/v1/files/${id}`).set(bearer(t)).then((r) => r.body.file);
const addNote = (t: string, id: string, body: any) => api().post(`/api/v1/files/${id}/notes`).set(bearer(t)).send(body);
const submitNote = (t: string, id: string, noteId: string, body: any) => api().post(`/api/v1/files/${id}/notes/${noteId}/submit`).set(bearer(t)).send(body);
const sign = (t: string, id: string, body: any = {}) => api().post(`/api/v1/files/${id}/sign`).set(bearer(t)).send(body);
const sendBack = (t: string, id: string, body: any = {}) => api().post(`/api/v1/files/${id}/return`).set(bearer(t)).send(body);

describe('file is a permanent OPEN binder', () => {
  it('assigns a UN number at creation and holds it with the creator', async () => {
    const { rajesh } = await tokens();
    const id = await createFile(rajesh, { subject: 'Binder A' });
    const f = await getFile(rajesh, id);
    expect(f.status).toBe('OPEN');
    expect(f.displayNumber).toMatch(/^ADMIN\/\d{4}\/\d{3}$/);
    expect(f.currentAssignee).toBe(USERS.rajesh.id);
  });
});

describe('note lifecycle: open → sign chain → finalize → back to maker', () => {
  it('routes a note through its chain and finalizes on the last signer', async () => {
    const { rajesh, priya, amit, vikram } = await tokens();
    const id = await createFile(rajesh, { subject: 'Procurement note' });

    // Open + submit a note with a two-signer chain in one call.
    const created = await addNote(rajesh, id, {
      content: 'Proposal. Refer C1.',
      signers: [{ userId: USERS.priya.id, roleLabel: 'Checker' }, { userId: USERS.amit.id, roleLabel: 'Approver' }],
    });
    expect(created.status).toBe(201);
    let f = created.body.file;
    expect(f.activeNoteNumber).toBe(1);
    expect(f.activeNoteStatus).toBe('IN_REVIEW');
    expect(f.currentAssignee).toBe(USERS.priya.id); // moved to the first signer

    // Sequential rule: while a note is travelling the chain, no new note may be opened — 400.
    const second = await addNote(rajesh, id, { content: 'Another note', isDraft: true });
    expect(second.status).toBe(400);

    // A non-holder cannot sign.
    expect((await sign(vikram, id)).status).toBe(403);
    // The maker (not the active signer) cannot sign either.
    expect((await sign(rajesh, id)).status).toBe(403);

    // First signer signs → advances to the second signer.
    const afterCheck = await sign(priya, id, { remarks: 'Checked. Recommended.' });
    expect(afterCheck.status).toBe(200);
    f = afterCheck.body.file;
    expect(f.currentAssignee).toBe(USERS.amit.id);
    expect(f.steps[0].status).toBe('SIGNED');
    expect(f.steps[0].signatureName).toBeTruthy();

    // Last signer signs → note FINALIZED, file returns to the maker.
    const afterApprove = await sign(amit, id, { remarks: 'Approved.' });
    f = afterApprove.body.file;
    expect(f.activeNoteNumber).toBeNull();
    expect(f.currentAssignee).toBe(USERS.rajesh.id);
    const note1 = f.notes.find((n: any) => n.noteNumber === 1);
    expect(note1.status).toBe('FINALIZED');
    expect(note1.steps).toHaveLength(2);
    expect(note1.steps.every((s: any) => s.status === 'SIGNED')).toBe(true);

    // With the note finalized, the maker can open the next note.
    const third = await addNote(rajesh, id, { content: 'Second note', isDraft: true });
    expect(third.status).toBe(201);
  });

  it('sends a note back to its maker, who edits and resubmits', async () => {
    const { rajesh, priya } = await tokens();
    const id = await createFile(rajesh, { subject: 'Send-back note' });
    let f = (await addNote(rajesh, id, { content: 'Draft v1', signers: [{ userId: USERS.priya.id }] })).body.file;
    const noteId = f.notes.find((n: any) => n.noteNumber === 1).id;

    // Priya sends it back.
    f = (await sendBack(priya, id, { remarks: 'Please add the budget line.' })).body.file;
    expect(f.activeNoteStatus).toBe('RETURNED');
    expect(f.currentAssignee).toBe(USERS.rajesh.id);

    // Maker edits the returned note and resubmits.
    const edited = await api().patch(`/api/v1/files/${id}/notes/${noteId}`).set(bearer(rajesh)).send({ content: 'Draft v2 with budget line' });
    expect(edited.status).toBe(200);
    f = (await submitNote(rajesh, id, noteId, { signers: [{ userId: USERS.priya.id }] })).body.file;
    expect(f.activeNoteStatus).toBe('IN_REVIEW');
    expect(f.currentAssignee).toBe(USERS.priya.id);

    // Priya signs (sole signer) → finalized back to maker.
    f = (await sign(priya, id, { remarks: 'Now in order.' })).body.file;
    expect(f.activeNoteNumber).toBeNull();
    expect(f.notes.find((n: any) => n.noteNumber === 1).content).toContain('budget line');
  });

  it('lets any officer raise a note on an idle binder (pulls the file to them)', async () => {
    const { rajesh, vikram } = await tokens();
    const id = await createFile(rajesh, { subject: 'Open collaboration' }); // held by rajesh, idle
    // vikram (a different maker, another dept) raises + records a note on the idle binder.
    const r = await addNote(vikram, id, { content: 'Adding my note.', signers: [] });
    expect(r.status).toBe(201);
    const f = r.body.file;
    expect(f.notes[0].author.name).toBeTruthy();
    expect(f.currentAssignee).toBe(USERS.vikram.id); // the note maker now holds the binder
  });

  it('records a self-note with no signers (immediately finalized)', async () => {
    const { rajesh } = await tokens();
    const id = await createFile(rajesh, { subject: 'Self note' });
    const f = (await addNote(rajesh, id, { content: 'For record only.', signers: [] })).body.file;
    expect(f.activeNoteNumber).toBeNull();
    expect(f.notes[0].status).toBe('FINALIZED');
    expect(f.currentAssignee).toBe(USERS.rajesh.id);
  });

  it('lets a signer be appended to the chain mid-flight', async () => {
    const { rajesh, priya, amit } = await tokens();
    const id = await createFile(rajesh, { subject: 'Add signer' });
    let f = (await addNote(rajesh, id, { content: 'Note', signers: [{ userId: USERS.priya.id }] })).body.file;
    // Priya (holder) appends Amit to the chain.
    const added = await api().post(`/api/v1/files/${id}/signers`).set(bearer(priya)).send({ userId: USERS.amit.id, roleLabel: 'Approver' });
    expect(added.status).toBe(201);
    f = added.body.file;
    expect(f.steps).toHaveLength(2);
    // Priya signs → advances to the newly-added Amit (not finalized yet).
    f = (await sign(priya, id)).body.file;
    expect(f.currentAssignee).toBe(USERS.amit.id);
    expect(f.activeNoteNumber).toBe(1);
  });
});

describe('draft notes are private to their maker', () => {
  it('hides a draft note from other users', async () => {
    const { rajesh, priya } = await tokens();
    const id = await createFile(rajesh, { subject: 'Draft privacy' });
    await addNote(rajesh, id, { content: 'Secret draft', isDraft: true });
    const asMaker = await getFile(rajesh, id);
    const asOther = await getFile(priya, id);
    expect(asMaker.notes).toHaveLength(1);
    expect(asOther.notes).toHaveLength(0);
  });
});

describe('page-level correspondence C-numbers', () => {
  it('numbers every page and derives a contiguous C-range per attachment', async () => {
    const { rajesh } = await tokens();
    const id = await createFile(rajesh, { subject: 'Correspondence paging' });
    const up = async (title: string, pages: number) => api()
      .post(`/api/v1/files/${id}/correspondence`).set(bearer(rajesh))
      .field('type', 'Document').field('title', title)
      .attach('file', await pdfBuffer(pages), `${title}.pdf`);
    expect((await up('First', 3)).status).toBe(201);
    expect((await up('Second', 2)).status).toBe(201);
    const f = await getFile(rajesh, id);
    const [a, b] = f.correspondence;
    expect([a.firstC, a.lastC]).toEqual([1, 3]);
    expect(a.cLabel).toBe('C1–C3');
    expect([b.firstC, b.lastC]).toEqual([4, 5]); // continues across attachments
    expect(b.cPages).toEqual([4, 5]);
  });
});

describe('at-rest lifecycle: handover, transfer, close', () => {
  it('hands an idle binder to another person', async () => {
    const { rajesh, priya } = await tokens();
    const id = await createFile(rajesh, { subject: 'Handover' });
    const r = await api().post(`/api/v1/files/${id}/handover`).set(bearer(rajesh)).send({ toUserId: USERS.priya.id });
    expect(r.status).toBe(200);
    expect(r.body.file.currentAssignee).toBe(USERS.priya.id);
  });

  it('blocks handover while a note is in flight', async () => {
    const { rajesh, priya } = await tokens();
    const id = await createFile(rajesh, { subject: 'Handover blocked' });
    await addNote(rajesh, id, { content: 'Note', signers: [{ userId: USERS.priya.id }] });
    // priya is the current holder (active signer); the in-flight note pins the file → 400.
    const r = await api().post(`/api/v1/files/${id}/handover`).set(bearer(priya)).send({ toUserId: USERS.amit.id });
    expect(r.status).toBe(400);
  });

  it('closes a binder (holder only) and makes it read-only', async () => {
    const { rajesh } = await tokens();
    const id = await createFile(rajesh, { subject: 'To close' });
    const r = await api().post(`/api/v1/files/${id}/close`).set(bearer(rajesh)).send({ reason: 'Case complete' });
    expect(r.status).toBe(200);
    expect(r.body.file.status).toBe('CLOSED');
    // No new notes on a closed file.
    expect((await addNote(rajesh, id, { content: 'x', isDraft: true })).status).toBe(400);
  });
});

describe('confidential access control', () => {
  it('hides a confidential binder from an uninvolved user', async () => {
    const { rajesh, vikram } = await tokens();
    const id = await createFile(rajesh, { subject: 'Secret', confidential: true });
    expect((await api().get(`/api/v1/files/${id}`).set(bearer(vikram))).status).toBe(403);
    expect((await api().get(`/api/v1/files/${id}`).set(bearer(rajesh))).status).toBe(200);
  });
});

describe('admin is oversight-only', () => {
  it('strips noting/correspondence content for the admin role', async () => {
    const { rajesh } = await tokens();
    const adminT = await token(USERS.admin.email);
    const id = await createFile(rajesh, { subject: 'Admin view' });
    await addNote(rajesh, id, { content: 'A note', isDraft: true });
    const f = await getFile(adminT, id);
    expect(f.contentRestricted).toBe(true);
    expect(f.notes).toHaveLength(0);
    expect(f.correspondence).toHaveLength(0);
    // Admin cannot post a note.
    expect((await addNote(adminT, id, { content: 'x', isDraft: true })).status).toBe(403);
  });

  it('blocks the admin from recording an offline signature', async () => {
    const { rajesh, priya } = await tokens();
    const adminT = await token(USERS.admin.email);
    const id = await createFile(rajesh, { subject: 'Admin md-approval' });
    await addNote(rajesh, id, { content: 'Note', signers: [{ userId: USERS.priya.id }] });
    const r = await api().post(`/api/v1/files/${id}/md-approval`).set(bearer(adminT)).attach('file', await pdfBuffer(1), 'x.pdf');
    expect(r.status).toBe(403);
  });
});

describe('review-confirmed fixes (regression)', () => {
  it('clears downstream steps when a note is sent back (no phantom pending inbox)', async () => {
    const { rajesh, priya } = await tokens();
    const amit = await token(USERS.amit.email);
    const id = await createFile(rajesh, { subject: 'Return clears downstream' });
    await addNote(rajesh, id, { content: 'Note', signers: [{ userId: USERS.priya.id }, { userId: USERS.amit.id }] });
    await sendBack(priya, id, { remarks: 'redo' });
    const f = await getFile(rajesh, id);
    const note = f.notes.find((n: any) => n.noteNumber === 1);
    expect(note.steps.every((s: any) => s.status === 'RETURNED')).toBe(true); // downstream Amit no longer PENDING
    const amitPending = await api().get('/api/v1/files?pending=true').set(bearer(amit)).then((r) => r.body.files);
    expect(amitPending.some((x: any) => x.id === id)).toBe(false);
  });

  it('offline signature is holder-only — the originator cannot forge a signer', async () => {
    const { rajesh, priya } = await tokens();
    const id = await createFile(rajesh, { subject: 'No forgery' });
    await addNote(rajesh, id, { content: 'Note', signers: [{ userId: USERS.priya.id }] }); // holder = priya
    // rajesh is the originator but NOT the active signer/holder — must be rejected.
    const r = await api().post(`/api/v1/files/${id}/md-approval`).set(bearer(rajesh)).attach('file', await pdfBuffer(1), 'x.pdf');
    expect(r.status).toBe(403);
  });

  it('renumbers a stale draft submitted after newer notes so order stays chronological', async () => {
    const { rajesh, vikram } = await tokens();
    const id = await createFile(rajesh, { subject: 'Stale draft' });
    const draftId = (await addNote(rajesh, id, { content: 'My draft', isDraft: true })).body.file.notes.find((n: any) => n.status === 'DRAFT').id;
    // vikram raises + records a note on the idle binder → becomes note 2, FINALIZED
    await addNote(vikram, id, { content: 'Vikram note', signers: [] });
    // rajesh now submits the stale draft → it must renumber ABOVE note 2, not insert before it
    const f = (await submitNote(rajesh, id, draftId, { signers: [] })).body.file;
    const draftNote = f.notes.find((n: any) => n.id === draftId);
    expect(draftNote.status).toBe('FINALIZED');
    expect(draftNote.noteNumber).toBeGreaterThan(2);
  });
});

describe('correspondence access history', () => {
  it('logs explicit downloads/opens but not silent inline previews', async () => {
    const { rajesh } = await tokens();
    const id = await createFile(rajesh, { subject: 'Download history' });
    const up = await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(rajesh))
      .field('type', 'Bill').field('title', 'Electricity bill').attach('file', await pdfBuffer(1), 'bill.pdf');
    const corrId = up.body.correspondence.id;
    // silent inline preview (no action) — not logged
    await api().get(`/api/v1/files/${id}/correspondence/${corrId}/file`).set(bearer(rajesh));
    // explicit download + open — logged
    await api().get(`/api/v1/files/${id}/correspondence/${corrId}/file?action=download`).set(bearer(rajesh));
    await api().get(`/api/v1/files/${id}/correspondence/${corrId}/file?action=view`).set(bearer(rajesh));
    const hist = await api().get(`/api/v1/files/${id}/correspondence/${corrId}/history`).set(bearer(rajesh)).then((r) => r.body.history);
    expect(hist).toHaveLength(2);
    expect(hist.map((h: any) => h.action).sort()).toEqual(['DOWNLOAD', 'VIEW']);
    expect(hist[0].userName).toBeTruthy();
  });
});
