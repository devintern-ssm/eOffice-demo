import { test, expect, APIRequestContext } from '@playwright/test';
import { quickLogin, ACCOUNTS } from './helpers';

const API = 'http://localhost:4000/api/v1';

async function token(request: APIRequestContext, email: string) {
  const r = await request.post(`${API}/auth/login`, { data: { email, password: 'password123' } });
  return (await r.json()).token as string;
}
async function uid(request: APIRequestContext, t: string) {
  const r = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
  return (await r.json()).user.id as string;
}

/**
 * Golden path. The multi-role workflow transitions are driven through the API (each role
 * has its own JWT), then the final APPROVED state is asserted in the browser UI — a
 * standard E2E shape for flows that span several authenticated actors.
 */
test('golden workflow: Maker -> Checker -> Approver -> APPROVED (verified in UI)', async ({ page, request }) => {
  const rajesh = await token(request, 'rajesh.kumar@example.com');
  const priya = await token(request, 'priya.sharma@example.com');
  const amit = await token(request, 'amit.patel@example.com');
  const priyaId = await uid(request, priya);
  const amitId = await uid(request, amit);
  const H = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  // Maker creates + submits
  const created = await request.post(`${API}/files`, {
    headers: H(rajesh),
    data: { subject: 'E2E golden workflow', section: 'Administration', initialNote: 'Opening note.' },
  });
  const fileId = (await created.json()).file.id as string;
  await request.post(`${API}/files/${fileId}/submit`, { headers: H(rajesh) });

  // Forward to Priya (Checker) then Amit (Approver)
  await request.post(`${API}/files/${fileId}/forward`, {
    headers: H(rajesh),
    data: { recipients: [{ userId: priyaId, role: 'CHECKER' }, { userId: amitId, role: 'APPROVER' }] },
  });
  // Priya checks
  await request.post(`${API}/files/${fileId}/action`, { headers: H(priya), data: { action: 'check', remarks: 'Checked' } });
  // Amit approves
  const approved = await request.post(`${API}/files/${fileId}/action`, { headers: H(amit), data: { action: 'approve', remarks: 'Approved' } });
  expect((await approved.json()).file.status).toBe('APPROVED');

  // Verify in the UI as the maker
  await quickLogin(page, ACCOUNTS.rajesh);
  await page.goto(`/file/${fileId}`);
  await expect(page.getByText('APPROVED').first()).toBeVisible();
  await expect(page.getByText('E2E golden workflow')).toBeVisible();
});

test('out-of-turn action is rejected by the API (403)', async ({ request }) => {
  const rajesh = await token(request, 'rajesh.kumar@example.com');
  const priya = await token(request, 'priya.sharma@example.com');
  const amit = await token(request, 'amit.patel@example.com');
  const priyaId = await uid(request, priya);
  const amitId = await uid(request, amit);
  const H = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  const created = await request.post(`${API}/files`, {
    headers: H(rajesh), data: { subject: 'E2E out-of-turn', section: 'Administration', initialNote: 'x' },
  });
  const fileId = (await created.json()).file.id as string;
  await request.post(`${API}/files/${fileId}/submit`, { headers: H(rajesh) });
  await request.post(`${API}/files/${fileId}/forward`, {
    headers: H(rajesh), data: { recipients: [{ userId: priyaId, role: 'CHECKER' }, { userId: amitId, role: 'APPROVER' }] },
  });
  // Amit (step 2) tries to approve before Priya (step 1) has checked
  const res = await request.post(`${API}/files/${fileId}/action`, { headers: H(amit), data: { action: 'approve' } });
  expect(res.status()).toBe(403);
});

test('stored <script> subject renders as escaped text, not executed', async ({ page, request }) => {
  const rajesh = await token(request, 'rajesh.kumar@example.com');
  await request.post(`${API}/files`, {
    headers: { Authorization: `Bearer ${rajesh}`, 'Content-Type': 'application/json' },
    data: { subject: '<script>window.__xss=1</script>', section: 'Administration' },
  });

  let dialogFired = false;
  page.on('dialog', async (d) => { dialogFired = true; await d.dismiss(); });

  await quickLogin(page, ACCOUNTS.rajesh);
  await page.goto('/all-files');
  // The literal payload appears as text…
  await expect(page.getByText('<script>window.__xss=1</script>').first()).toBeVisible();
  // …and the script never executed.
  const xss = await page.evaluate(() => (window as any).__xss);
  expect(xss).toBeUndefined();
  expect(dialogFired).toBe(false);
});
