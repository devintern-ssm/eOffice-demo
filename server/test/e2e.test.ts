import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, createFile, pdfBuffer, USERS } from './helpers.js';

let maker: string, priya: string, amit: string, md: string, vikram: string, admin: string;

beforeAll(async () => {
  maker = await token(USERS.rajesh.email);
  priya = await token(USERS.priya.email);
  amit = await token(USERS.amit.email);
  md = await token('md@example.com');
  vikram = await token(USERS.vikram.email);
  admin = await token(USERS.admin.email);
});

const detail = (id: string, t: string) => api().get(`/api/v1/files/${id}`).set(bearer(t));
const act = (id: string, t: string, body: any) => api().post(`/api/v1/files/${id}/action`).set(bearer(t)).send(body);
const forward = (id: string, t: string, recipients: any[]) => api().post(`/api/v1/files/${id}/forward`).set(bearer(t)).send({ recipients });
const addNote = (id: string, t: string, content: string, isDraft = false) => api().post(`/api/v1/files/${id}/notes`).set(bearer(t)).send({ content, isDraft });

// ── The happy path, asserted at every step ─────────────────────────────────
describe('E2E — happy path (Maker → Checker → Approver)', () => {
  it('walks create → forward → check → approve', async () => {
    const id = await createFile(maker, { subject: 'Laptop procurement', initialNote: 'Proposal to buy 10 laptops.' });
    let d = await detail(id, maker);
    expect(d.body.file.status).toBe('DRAFT');
    expect(d.body.file.displayNumber).toBeNull();
    expect(d.body.file.currentAssignee).toBe(USERS.rajesh.id);

    // Attach a document, then a note referencing it.
    const up = await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker))
      .field('type', 'Quotation').field('title', 'Vendor quote')
      .attach('file', await pdfBuffer(2), { filename: 'q.pdf', contentType: 'application/pdf' });
    expect(up.status).toBe(201);
    expect((await addNote(id, maker, 'Refer C/1 — recommended.')).status).toBe(201);

    // Forward to Checker + Approver.
    const fwd = await forward(id, maker, [
      { userId: USERS.priya.id, role: 'CHECKER' },
      { userId: USERS.amit.id, role: 'APPROVER' },
    ]);
    expect(fwd.status).toBe(200);
    expect(fwd.body.file.status).toBe('UNDER_REVIEW');
    expect(fwd.body.file.displayNumber).toMatch(/^ADMIN\/\d{4}\/\d{3}$/);
    expect(fwd.body.file.currentAssignee).toBe(USERS.priya.id);

    // Checker checks → advances to Approver.
    const chk = await act(id, priya, { action: 'check', remarks: 'Verified.' });
    expect(chk.body.file.currentAssignee).toBe(USERS.amit.id);

    // Approver approves → APPROVED, no holder.
    const apr = await act(id, amit, { action: 'approve', remarks: 'Approved.' });
    expect(apr.body.file.status).toBe('APPROVED');
    expect(apr.body.file.currentAssignee).toBeNull();

    // Approval Flow fully signed.
    const steps = apr.body.file.steps;
    expect(steps.every((s: any) => s.status !== 'PENDING')).toBe(true);
    expect(steps.map((s: any) => s.signatureName)).toEqual(['Priya Sharma', 'Amit Patel']);
  });
});

// ── The exact revert scenario the user hit ─────────────────────────────────
describe('E2E — revert, correct, resubmit (the confusing flow)', () => {
  it('reverts to maker; on resubmit the SAME checker gets it again', async () => {
    const id = await createFile(maker, { initialNote: 'v1 of the note' });
    await forward(id, maker, [{ userId: USERS.priya.id, role: 'CHECKER' }]);

    // Checker reverts with a remark (which is recorded as a note).
    const rev = await act(id, priya, { action: 'revert', remarks: 'Please add the cost breakdown.' });
    expect(rev.body.file.status).toBe('REVERTED');
    expect(rev.body.file.currentAssignee).toBe(USERS.rajesh.id); // back to maker
    const priyaStep = rev.body.file.steps.find((s: any) => s.assigneeName === 'Priya Sharma');
    expect(priyaStep.status).toBe('REVERTED');

    // Maker corrects: adds a new note (allowed — maker holds it again).
    expect((await addNote(id, maker, 'v2 with cost breakdown added.')).status).toBe(201);

    // Maker resubmits with NO new recipients → the reverted step reactivates.
    const re = await forward(id, maker, []);
    expect(re.body.file.status).toBe('UNDER_REVIEW');
    expect(re.body.file.currentAssignee).toBe(USERS.priya.id); // same checker again
    expect(re.body.file.steps.find((s: any) => s.assigneeName === 'Priya Sharma').status).toBe('PENDING');
  });

  it('reject and clarify behave like revert (back to maker)', async () => {
    for (const action of ['reject', 'clarify']) {
      const id = await createFile(maker);
      await forward(id, maker, [{ userId: USERS.priya.id, role: 'CHECKER' }]);
      const r = await act(id, priya, { action, remarks: `${action} reason` });
      expect(r.body.file.status).toBe('REVERTED');
      expect(r.body.file.currentAssignee).toBe(USERS.rajesh.id);
    }
  });
});

// ── Multi-reviewer sequence + strict ordering ──────────────────────────────
describe('E2E — sequential multi-reviewer chain', () => {
  it('enforces order: out-of-turn action is 403', async () => {
    const id = await createFile(maker);
    await forward(id, maker, [
      { userId: USERS.priya.id, role: 'CHECKER' },
      { userId: USERS.amit.id, role: 'APPROVER' },
      { userId: USERS.md.id, role: 'MD' },
    ]);
    // MD tries to act before its turn.
    expect((await act(id, md, { action: 'approve' })).status).toBe(403);
    // Correct order.
    expect((await act(id, priya, { action: 'check' })).body.file.currentAssignee).toBe(USERS.amit.id);
    expect((await act(id, amit, { action: 'approve' })).body.file.currentAssignee).toBe(USERS.md.id);
    const done = await act(id, md, { action: 'approve' });
    expect(done.body.file.status).toBe('APPROVED');
  });

  it('a lone checker with no approver hands the file back to the maker (still under review)', async () => {
    const id = await createFile(maker);
    await forward(id, maker, [{ userId: USERS.priya.id, role: 'CHECKER' }]);
    const chk = await act(id, priya, { action: 'check', remarks: 'ok' });
    expect(chk.body.file.status).toBe('UNDER_REVIEW');
    expect(chk.body.file.currentAssignee).toBe(USERS.rajesh.id);
    // Maker adds an approver and it continues.
    const add = await api().post(`/api/v1/files/${id}/steps`).set(bearer(maker)).send({ userId: USERS.amit.id, role: 'APPROVER' });
    expect(add.status).toBe(201);
    expect(add.body.file.currentAssignee).toBe(USERS.amit.id);
    expect((await act(id, amit, { action: 'approve' })).body.file.status).toBe('APPROVED');
  });
});

// ── Add / remove reviewer ──────────────────────────────────────────────────
describe('E2E — add & remove reviewer', () => {
  it('removes a pending non-active reviewer but protects the active one', async () => {
    const id = await createFile(maker);
    await forward(id, maker, [
      { userId: USERS.priya.id, role: 'CHECKER' },
      { userId: USERS.amit.id, role: 'APPROVER' },
    ]);
    const d = await detail(id, maker);
    const active = d.body.file.steps.find((s: any) => s.status === 'PENDING' && s.assigneeName === 'Priya Sharma');
    const later = d.body.file.steps.find((s: any) => s.assigneeName === 'Amit Patel');
    // Cannot remove the active (first pending) step.
    expect((await api().delete(`/api/v1/files/${id}/steps/${active.id}`).set(bearer(maker))).status).toBe(400);
    // Can remove the later pending step.
    expect((await api().delete(`/api/v1/files/${id}/steps/${later.id}`).set(bearer(maker))).status).toBe(200);
  });
});

// ── Full lifecycle: route → return → close → immutable ─────────────────────
describe('E2E — post-approval lifecycle & closed-file immutability', () => {
  it('routes, returns, closes, then rejects all mutations', async () => {
    const id = await createFile(maker, { initialNote: 'note' });
    await forward(id, maker, [{ userId: USERS.amit.id, role: 'APPROVER' }]);
    await act(id, amit, { action: 'approve' });

    // Route to an action officer.
    const routed = await api().post(`/api/v1/files/${id}/route`).set(bearer(maker)).send({ toUserId: USERS.vikram.id, remarks: 'implement' });
    expect(routed.body.file.status).toBe('ROUTED');
    expect(routed.body.file.currentAssignee).toBe(USERS.vikram.id);

    // The action officer returns it.
    const returned = await api().post(`/api/v1/files/${id}/return`).set(bearer(vikram)).send({ remarks: 'done' });
    expect(returned.body.file.status).toBe('RETURNED');
    expect(returned.body.file.currentAssignee).toBe(USERS.rajesh.id);

    // Close it.
    const closed = await api().post(`/api/v1/files/${id}/close`).set(bearer(maker)).send({ reason: 'Completed' });
    expect(closed.body.file.status).toBe('CLOSED');

    // Everything is now read-only.
    expect((await addNote(id, maker, 'late note')).status).toBe(400);
    expect((await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker)).field('type', 'x').field('title', 'y').attach('file', await pdfBuffer(1), { filename: 'a.pdf', contentType: 'application/pdf' })).status).toBe(400);
    expect((await act(id, maker, { action: 'approve' })).status).toBe(400);
  });

  it('route requires APPROVED; return requires ROUTED', async () => {
    const id = await createFile(maker);
    expect((await api().post(`/api/v1/files/${id}/route`).set(bearer(maker)).send({ toUserId: USERS.vikram.id })).status).toBe(400);
    expect((await api().post(`/api/v1/files/${id}/return`).set(bearer(maker)).send({})).status).toBe(400);
  });
});

// ── Cross-department transfer ───────────────────────────────────────────────
describe('E2E — cross-department transfer', () => {
  it('keeps the number, changes the section, continues note numbering, logs it', async () => {
    const id = await createFile(maker, { subject: 'Transfers' });
    for (let i = 0; i < 3; i++) await addNote(id, maker, `note ${i + 1}`);
    await api().post(`/api/v1/files/${id}/submit`).set(bearer(maker)); // assign a number
    const before = await detail(id, maker);
    const num = before.body.file.displayNumber;

    const tr = await api().post(`/api/v1/files/${id}/transfer`).set(bearer(maker)).send({ toSection: 'Legal', reason: 'activity moved' });
    expect(tr.body.file.section).toBe('Legal');
    expect(tr.body.file.displayNumber).toBe(num); // number unchanged

    // Note numbering continues (4th note = Note 4).
    const n = await addNote(id, maker, 'note after transfer');
    expect(n.body.note.noteNumber).toBe(4);
    // Transfer is in the movement log.
    const d = await detail(id, maker);
    expect(d.body.file.movements.some((m: any) => m.action === 'TRANSFER')).toBe(true);
  });

  it('403s a non-holder trying to transfer', async () => {
    const id = await createFile(maker);
    expect((await api().post(`/api/v1/files/${id}/transfer`).set(bearer(vikram)).send({ toSection: 'Legal' })).status).toBe(403);
  });
});

// ── MD offline (scanned) approval ──────────────────────────────────────────
describe('E2E — MD offline scanned approval', () => {
  it('approves the current step via an uploaded PDF', async () => {
    const id = await createFile(maker, { initialNote: 'for MD' });
    await forward(id, maker, [{ userId: USERS.md.id, role: 'MD' }]);
    const res = await api().post(`/api/v1/files/${id}/md-approval`).set(bearer(maker))
      .field('remarks', 'Signed offline').attach('file', await pdfBuffer(1), { filename: 'sign.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(201);
    expect(res.body.file.status).toBe('APPROVED');
    // The scan is stored as correspondence.
    expect(res.body.file.correspondence.some((c: any) => /MD Approval/i.test(c.type))).toBe(true);
  });
});

// ── Paragraph approval during a review action ──────────────────────────────
describe('E2E — paragraph approval on approve', () => {
  it('records approved paragraphs on the latest note', async () => {
    const id = await createFile(maker, { initialNote: 'para note' });
    await forward(id, maker, [{ userId: USERS.amit.id, role: 'APPROVER' }]);
    const res = await act(id, amit, { action: 'approve', remarks: 'ok', paragraphs: ['A', 'B'] });
    expect(res.body.file.status).toBe('APPROVED');
    const approvals = res.body.file.notes.flatMap((n: any) => n.approvals || []);
    expect(approvals.filter((a: any) => a.status === 'APPROVED').map((a: any) => a.paragraph).sort()).toEqual(['A', 'B']);
  });
});

// ── Comment after approval (append-only) ───────────────────────────────────
describe('E2E — comment after approval', () => {
  it('appends a comment but not on a closed file', async () => {
    const id = await createFile(maker, { initialNote: 'commentable' });
    const d = await detail(id, maker);
    const noteId = d.body.file.notes[0].id;
    const c = await api().post(`/api/v1/files/${id}/notes/${noteId}/comments`).set(bearer(maker)).send({ comment: 'FYI' });
    expect(c.status).toBe(201);
    expect(c.body.file.notes[0].checkerComments.some((x: any) => x.comment === 'FYI')).toBe(true);

    await api().post(`/api/v1/files/${id}/close`).set(bearer(maker)).send({ reason: 'done' });
    expect((await api().post(`/api/v1/files/${id}/notes/${noteId}/comments`).set(bearer(maker)).send({ comment: 'late' })).status).toBe(400);
  });
});

// ── Validation & robustness ────────────────────────────────────────────────
describe('E2E — validation & robustness', () => {
  it('rejects an empty subject', async () => {
    expect((await api().post('/api/v1/files').set(bearer(maker)).send({ subject: '', section: 'Administration' })).status).toBe(400);
  });
  it('rejects a forward with no recipients (from a fresh draft)', async () => {
    const id = await createFile(maker);
    expect((await forward(id, maker, [])).status).toBe(400);
  });
  it('does not burn the file on a bad recipient (stays DRAFT, no number)', async () => {
    const id = await createFile(maker);
    const bad = await forward(id, maker, [{ userId: 'does-not-exist', role: 'CHECKER' }]);
    expect(bad.status).toBe(400);
    const d = await detail(id, maker);
    expect(d.body.file.status).toBe('DRAFT');
    expect(d.body.file.displayNumber).toBeNull();
    // A subsequent valid forward still works and assigns a number.
    const ok = await forward(id, maker, [{ userId: USERS.priya.id, role: 'CHECKER' }]);
    expect(ok.body.file.displayNumber).toMatch(/^ADMIN\/\d{4}\/\d{3}$/);
  });
  it('rejects acting when there is no pending step', async () => {
    const id = await createFile(maker); // DRAFT, not under review
    expect((await act(id, maker, { action: 'check' })).status).toBe(400);
  });
  it('rejects submitting an already-numbered file twice', async () => {
    const id = await createFile(maker);
    expect((await api().post(`/api/v1/files/${id}/submit`).set(bearer(maker))).status).toBe(200);
    expect((await api().post(`/api/v1/files/${id}/submit`).set(bearer(maker))).status).toBe(400);
  });
  it('accepts an email-reference correspondence (no file)', async () => {
    const id = await createFile(maker);
    const res = await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker))
      .field('type', 'Email').field('title', 'Approval email').field('emailReference', 'RE: approval');
    expect(res.status).toBe(201);
  });
});
