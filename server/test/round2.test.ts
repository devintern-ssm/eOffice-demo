import { describe, it, expect, beforeAll } from 'vitest';
import { api, token, bearer, createFile, pdfBuffer, USERS } from './helpers.js';

let maker: string, admin: string, vikram: string;

beforeAll(async () => {
  maker = await token(USERS.rajesh.email);
  admin = await token(USERS.admin.email);
  vikram = await token(USERS.vikram.email);
});

const detail = (id: string, t: string) => api().get(`/api/v1/files/${id}`).set(bearer(t));

describe('#6 multi-format attachments', () => {
  it('accepts a PDF and a .docx, rejects an unsupported type', async () => {
    const id = await createFile(maker);
    const pdf = await pdfBuffer(2);

    const okPdf = await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker))
      .field('type', 'Letter').field('title', 'PDF')
      .attach('file', pdf, { filename: 'a.pdf', contentType: 'application/pdf' });
    expect(okPdf.status).toBe(201);

    const okDocx = await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker))
      .field('type', 'Report').field('title', 'Word')
      .attach('file', Buffer.from('doc'), { filename: 'a.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    expect(okDocx.status).toBe(201);

    const bad = await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker))
      .field('type', 'Other').field('title', 'exe')
      .attach('file', Buffer.from('MZ'), { filename: 'x.exe', contentType: 'application/x-msdownload' });
    expect(bad.status).toBe(400);
  });
});

describe('#7 continuous page numbering across correspondence PDFs', () => {
  it('numbers C/1 then continues C/2 from the next page', async () => {
    const id = await createFile(maker);
    await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker))
      .field('type', 'Letter').field('title', '3pg')
      .attach('file', await pdfBuffer(3), { filename: 'three.pdf', contentType: 'application/pdf' });
    await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker))
      .field('type', 'Letter').field('title', '2pg')
      .attach('file', await pdfBuffer(2), { filename: 'two.pdf', contentType: 'application/pdf' });

    const d = await detail(id, maker);
    const c1 = d.body.file.correspondence.find((c: any) => c.number === 'C/1');
    const c2 = d.body.file.correspondence.find((c: any) => c.number === 'C/2');
    expect([c1.startPage, c1.endPage]).toEqual([1, 3]);
    expect([c2.startPage, c2.endPage]).toEqual([4, 5]);
  });
});

describe('#4 admin has no Notes/Correspondence access', () => {
  let id: string;
  let corrId: string;
  beforeAll(async () => {
    id = await createFile(maker, { initialNote: 'note' });
    const up = await api().post(`/api/v1/files/${id}/correspondence`).set(bearer(maker))
      .field('type', 'Letter').field('title', 'doc')
      .attach('file', await pdfBuffer(1), { filename: 'd.pdf', contentType: 'application/pdf' });
    corrId = up.body.correspondence.id;
  });

  it('strips notes + correspondence from the admin file view', async () => {
    const d = await detail(id, admin);
    expect(d.status).toBe(200);
    expect(d.body.file.contentRestricted).toBe(true);
    expect(d.body.file.notes).toHaveLength(0);
    expect(d.body.file.correspondence).toHaveLength(0);
  });

  it('403s admin on add-note, correspondence download, and print', async () => {
    const note = await api().post(`/api/v1/files/${id}/notes`).set(bearer(admin)).send({ content: 'x' });
    expect(note.status).toBe(403);
    const dl = await api().get(`/api/v1/files/${id}/correspondence/${corrId}/file`).set(bearer(admin));
    expect(dl.status).toBe(403);
    const print = await api().get(`/api/v1/files/${id}/print?side=noting`).set(bearer(admin));
    expect(print.status).toBe(403);
  });
});

describe('#5 all-files report with Submitted By + Department', () => {
  it('includes the fields and hides confidential files from non-admins', async () => {
    const normal = await createFile(maker, { subject: 'Register normal' });
    const secret = await createFile(maker, { subject: 'Register secret', confidential: true });

    const adminRep = await api().get('/api/v1/reports').set(bearer(admin));
    const row = adminRep.body.files.find((f: any) => f.id === normal);
    expect(row.submittedBy).toBe('Rajesh Kumar');
    expect(row.department).toBe('Administration');
    // Admin sees confidential in the register…
    expect(adminRep.body.files.some((f: any) => f.id === secret)).toBe(true);

    // …a non-involved user does not.
    const vikRep = await api().get('/api/v1/reports').set(bearer(vikram));
    expect(vikRep.body.files.some((f: any) => f.id === secret)).toBe(false);

    // CSV export of the files register carries the columns.
    const csv = await api().get('/api/v1/reports/export?type=files').set(bearer(admin));
    expect(csv.text.split('\n')[0]).toContain('Submitted By');
    expect(csv.text.split('\n')[0]).toContain('Department');
  });
});

describe('#8 drafts filter', () => {
  it('returns my draft files', async () => {
    const id = await createFile(maker, { subject: 'A draft' });
    const res = await api().get('/api/v1/files?draft=true').set(bearer(maker));
    expect(res.body.files.some((f: any) => f.id === id)).toBe(true);
  });
});

describe('#1/#2 role assignment', () => {
  it('assigns the Maker (holder) on a draft file', async () => {
    const id = await createFile(maker, { subject: 'Assign maker' });
    const res = await api().post(`/api/v1/files/${id}/assign-maker`).set(bearer(maker)).send({ makerId: USERS.priya.id });
    expect(res.status).toBe(200);
    expect(res.body.file.currentAssignee).toBe(USERS.priya.id);
  });

  it('assigns a pending paragraph approver to a note', async () => {
    const id = await createFile(maker, { initialNote: 'para note' });
    const d = await detail(id, maker);
    const noteId = d.body.file.notes[0].id;
    const res = await api().post(`/api/v1/files/${id}/notes/${noteId}/assign-approver`).set(bearer(maker))
      .send({ paragraphMark: 'A', approverId: USERS.amit.id });
    expect(res.status).toBe(201);
    const para = res.body.file.notes[0].approvals.find((a: any) => a.paragraph === 'A');
    expect(para.status).toBe('PENDING');
    expect(para.assignedTo).toBe('Amit Patel');
  });

  it('403s an outsider trying to assign a paragraph approver', async () => {
    const id = await createFile(maker, { initialNote: 'para note 2' });
    const d = await detail(id, maker);
    const noteId = d.body.file.notes[0].id;
    const res = await api().post(`/api/v1/files/${id}/notes/${noteId}/assign-approver`).set(bearer(vikram))
      .send({ paragraphMark: 'A', approverId: USERS.amit.id });
    expect(res.status).toBe(403);
  });
});
