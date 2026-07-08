# Phases 1.5 – 1.10 — Approvals extras, Print, Routing, Lifecycle, Reports, Login/RBAC

Built and verified in one push. Each phase below has **what was built** and **what you should test**. Everything is backed by the real API and DB; test as different users via the new **login screen** (or the quick-login buttons).

---

## 1.5 — Approvals extras

**Built**
- **MD offline scanned approval** (S11): upload a scanned **PDF** that approves the current step offline; the scan is stored as a correspondence entry. (`POST /files/:id/md-approval`)
- **Paragraph-level approval** (SD §4.2): when checking/approving, tick specific paragraphs (A, B, C…) of the note under review. (folded into `POST /files/:id/action`, field `paragraphs`)
- **Comment-after-approval** (S6b/C7): append a comment to any note, even after it's approved. (`POST /files/:id/notes/:noteId/comments`)

**Test**
1. On a file **under review**, open **Review & Approve** → choose **Approve** or **Check** → tick a paragraph checkbox → submit. Open the file: the note shows **"Paragraph approvals: A …"**.
2. On a file under review, click **MD Offline Approval** → upload a PDF → it approves the current step and adds a **"MD Approval (scanned)"** correspondence entry (viewable/downloadable).
3. On any note, click **＋ Comment** → type a comment → it appears under the note as **💬 Name: …**.

---

## 1.6 — Print (two sides + approval summary)

**Built**
- Server-generated, self-contained **print views** (`GET /files/:id/print?side=noting|correspondence`): a styled page with a **running header** (file no · section · subject · printed date), a **footer** (file no · period), a **CONFIDENTIAL watermark** on confidential files, the side's content, and an **Approval Summary table** (step, role, name, dept/location, date-time, action, signature) — D5/D6/S14/S16/H16.
- Two buttons open the **Noting** and **Correspondence** print views; each has a **Print / Save-as-PDF** button.

**Test**
1. Open any file → **Print Noting** → a new tab opens with the noting side + approval summary; click **Print / Save as PDF**.
2. **Print Correspondence** → the correspondence list + summary.
3. Open a **confidential** file's print view → a faint **CONFIDENTIAL** watermark appears. *(Allow pop-ups.)*

---

## 1.7 — Post-approval routing → return to Maker

**Built**
- After **final approval**, **Route to Department** sends the approved file to an actionable user (status **ROUTED**). (`POST /files/:id/route`)
- The actionable holder clicks **Return to Maker** (status **RETURNED**). (`POST /files/:id/return`)

**Test**
1. Take a file to **APPROVED** (forward → approve). The maker clicks **Route to Department** → pick a user + instructions → status becomes **ROUTED**, held by that user.
2. As that user (log in as them), open the file → **Return to Maker** → status **RETURNED**, back with the originator. Both steps show in the **Movement** timeline.

---

## 1.8 — Lifecycle: closure, transfer, suo-moto, confidential

**Built**
- **Close File** (SD §9/H17): records **close date + reason**; file becomes **read-only** (CLOSED). (`POST /files/:id/close`)
- **Cross-department transfer** (D11): moves the file to another section; **the file number does not change**; logged as a movement. (`POST /files/:id/transfer`)
- **Suo-moto note** (SD §8): an "internal note, no correspondence" checkbox in Add Note.
- **Confidential access** (S7/SD §7): confidential files are **hidden from users not involved** (creator/holder/reviewer/admin) — both in lists and on the detail page (403).

**Test**
1. **Close:** open a file → **Close File** → reason → status **CLOSED** (action buttons disappear; it's read-only).
2. **Transfer:** open a file → **Transfer Dept** → pick a section → the **Section changes but the file number stays the same** (check the cover).
3. **Suo-moto:** Add Note → tick **"Suo-moto note"** → the note shows a **· Suo-moto** tag.
4. **Confidential:** log in as **Sneha** (Accounts) — the confidential **LEGAL/2024/001** does **not** appear in All Files and opening its URL is blocked; log in as **Vikram** (its creator) or **Admin** — it's visible.

---

## 1.9 — Reports & export

**Built**
- **Reports & Logs** page wired to the live audit log (`GET /reports`): summary cards (Total / Approved / Under-Review / Closed), a searchable/filterable log table (section, date range, search), and **Export CSV** (`GET /reports/export`).

**Test**
1. Open **Reports & Logs** → summary cards + a table of every movement (create/forward/check/approve/revert/route/return/transfer/close…).
2. Filter by **Section** and **date range**; search a file number.
3. Click **Export CSV** → a `.csv` downloads with the filtered rows.
4. Click a file number in a row → jumps to that file.

---

## 1.10 — Login & RBAC hardening

**Built**
- A real **login screen** (email + password) with **quick-login** buttons for the demo users; the **dev-login shim is retired**.
- **Auth context**: the header shows the **real logged-in user** (name · role); a **Log out** button; a 401 auto-returns you to login.
- Notes/reviews are attributed to the **actual** logged-in user everywhere.
- **Confidential RBAC** enforced (see 1.8); the two old prototype crashes (`FiUpload`, `files` undefined) are gone.

**Test**
1. Load the app → the **login screen** appears. Use a **quick-login** button (or email + `password123`).
2. The header shows your **name and role**; **Log out** returns you to login.
3. Log in as different roles to exercise the workflow end-to-end: **Sneha** (maker) opens & forwards → **Priya** (checker) checks → **Amit** (approver) approves → route/return/close.
4. Everything you do is stamped with **your** account (check signatures and the Reports log).

---

## Post-build security review (hardening pass)

An adversarial code-review sweep over the new backend surfaced and **fixed 20 confirmed issues** before sign-off:
- **Authorization gaps** — `route`, `return`, `transfer`, `close`, and `md-approval` now require the holder / originator / (for return) the actionable holder / admin; the workflow **action** now checks the file-lock (`currentHolderId`) as the source of truth, not just the step assignee.
- **Confidential-access bypass** — the access gate (`assertCanAccessFile`) is now applied to **every** file-scoped route (print, PDF download, notes, forward/action/route/close, etc.), not just `GET /:id`. Non-involved users can no longer read or mutate a confidential file through any endpoint.
- **Workflow integrity** — the active (first-pending) step can no longer be removed; adding a reviewer re-establishes the single-holder invariant; recipients are validated before a file number is allocated (no burned numbers).
- **Reports** — CSV **formula-injection** is neutralized (leading `= + - @` prefixed), CR handling fixed, and invalid date filters are ignored.
- **CLOSED files** are now fully read-only (comments blocked too).

All fixes are regression-tested (happy path 200, unauthorized 403, confidential 403).

## Known limitations (carried forward)
- **Print** produces browser-printable HTML (Print → Save as PDF) rather than a server-rendered binary PDF; page-range is via the browser's print dialog. A server-side binary-PDF renderer (e.g. Puppeteer/pdfkit) is a straightforward follow-up if a one-click PDF is required.
- **Section-level edit rights** are enforced as: notes are holder/author-gated; confidential files are access-gated. Finer per-field section rules can be tightened later.
- **DMS/old-file retrieval, multi-format attachments (beyond PDF), PKI signatures, page-level C-linking, live email sync, notifications, mobile** remain **out of Phase 1** (per the decisions log).
