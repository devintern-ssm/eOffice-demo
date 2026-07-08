import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, createFile, USERS } from './helpers.js';

let maker: string, priya: string, amit: string, vikram: string;

beforeAll(async () => {
  maker = await token(USERS.rajesh.email);
  priya = await token(USERS.priya.email);
  amit = await token(USERS.amit.email);
  vikram = await token(USERS.vikram.email);
});

const detail = (id: string, t: string) => api().get(`/api/v1/files/${id}`).set(bearer(t));

describe('workflow: happy path create → forward → check → approve', () => {
  it('runs the full chain and ends APPROVED', async () => {
    const id = await createFile(maker, { subject: 'Lifecycle happy path' });

    // Forward to Priya (checker) then Amit (approver).
    let res = await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({
      recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }, { userId: USERS.amit.id, role: 'APPROVER' }],
    });
    expect(res.status).toBe(200);
    expect(res.body.file.status).toBe('UNDER_REVIEW');
    expect(res.body.file.displayNumber).toMatch(/ADMIN\/\d{4}\/\d{3}/);
    expect(res.body.file.currentAssignee).toBe(USERS.priya.id);

    // Priya checks → advances to Amit.
    res = await api().post(`/api/v1/files/${id}/action`).set(bearer(priya)).send({ action: 'check', remarks: 'Verified' });
    expect(res.status).toBe(200);
    expect(res.body.file.currentAssignee).toBe(USERS.amit.id);

    // Amit approves → APPROVED, no holder.
    res = await api().post(`/api/v1/files/${id}/action`).set(bearer(amit)).send({ action: 'approve', remarks: 'Approved' });
    expect(res.status).toBe(200);
    expect(res.body.file.status).toBe('APPROVED');
    expect(res.body.file.currentAssignee).toBeNull();
  });
});

describe('workflow: revert loops back to the originator', () => {
  it('reverts to the maker and resubmits', async () => {
    const id = await createFile(maker, { subject: 'Revert loop' });
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });

    let res = await api().post(`/api/v1/files/${id}/action`).set(bearer(priya)).send({ action: 'revert', remarks: 'Fix para 2' });
    expect(res.status).toBe(200);
    expect(res.body.file.status).toBe('REVERTED');
    expect(res.body.file.currentAssignee).toBe(USERS.rajesh.id);

    // Maker resubmits into the (reactivated) chain.
    res = await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [] });
    expect(res.status).toBe(200);
    expect(res.body.file.status).toBe('UNDER_REVIEW');
    expect(res.body.file.currentAssignee).toBe(USERS.priya.id);
  });
});

describe('workflow: authorization matrix', () => {
  it('403s when a non-assignee tries to act on the current step', async () => {
    const id = await createFile(maker, { subject: 'Auth matrix' });
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });

    // Amit is not the current assignee (Priya is) → 403.
    const res = await api().post(`/api/v1/files/${id}/action`).set(bearer(amit)).send({ action: 'check' });
    expect(res.status).toBe(403);
  });

  it('403s when an outsider tries to forward someone else’s file', async () => {
    const id = await createFile(maker, { subject: 'Outsider forward' });
    const res = await api().post(`/api/v1/files/${id}/forward`).set(bearer(vikram)).send({ recipients: [{ userId: USERS.priya.id }] });
    expect(res.status).toBe(403);
  });

  it('protects the active (first-pending) reviewer step from removal', async () => {
    const id = await createFile(maker, { subject: 'Remove active step' });
    await api().post(`/api/v1/files/${id}/forward`).set(bearer(maker)).send({ recipients: [{ userId: USERS.priya.id, role: 'CHECKER' }] });
    const d = await detail(id, maker);
    const activeStep = d.body.file.steps.find((s: any) => s.status === 'PENDING');
    const res = await api().delete(`/api/v1/files/${id}/steps/${activeStep.id}`).set(bearer(maker));
    expect(res.status).toBe(400); // cannot remove the step currently in progress
  });
});

describe('confidential access gate', () => {
  it('hides a confidential file from an uninvolved user and 403s its detail', async () => {
    const id = await createFile(maker, { subject: 'Secret', confidential: true });

    // Not in the outsider's list…
    const list = await api().get('/api/v1/files').set(bearer(vikram));
    expect(list.body.files.some((f: any) => f.id === id)).toBe(false);

    // …and direct access is forbidden.
    const res = await detail(id, vikram);
    expect(res.status).toBe(403);

    // The creator can still see it.
    const own = await detail(id, maker);
    expect(own.status).toBe(200);
  });
});
