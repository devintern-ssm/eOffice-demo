# e-Office (Noting–Correspondence) — Demo Guide

*Everything you need to run and narrate the demo. Read §1–§3 for the story, then follow §6 (the click-by-click script) live.*

---

## 1. What this system is (the goal — say this first)

Government and PSU offices run on **physical files** that move desk to desk. Each file has two sides:
- a **Noting** side, where officers write dated, signed remarks and decisions, and
- a **Correspondence** side, where the actual documents (letters, bills, orders) are pinned.

A file is opened, notes are added, it is **forwarded** up a chain of officers who **check** and **approve** it (each signing), and it is finally acted upon, then closed. Today this is paper — slow, hard to track, easy to lose.

**This project digitises that exact process.** Same mental model (Noting side + Correspondence side, sequential sign-off), but now it is online: auto-numbered files, a real approval workflow, digital sign-off, a full movement history, search, reports, and notifications — with confidential-file access control.

> One-liner for the demo: *"It's the paper Noting–Correspondence file, made digital — with the whole approval chain, history and access control built in."*

---

## 2. Core concepts (the mental model)

| Concept | What it means in the app |
|---|---|
| **N-C File** | The unit of work. Has a **Noting side** (Note 1, 2, 3…) and a **Correspondence side** (C/1, C/2…), shown side-by-side. |
| **File number** | Auto-generated as **DEPT/YEAR/SEQ** (e.g. `ADMIN/2026/001`) when the file is submitted. Per department, resets each year. A permanent internal ID sits behind it. |
| **Note** | A signed remark on the noting side. Sequential and permanent once submitted. Can reference a document ("Refer C/1") or a previous note. |
| **Correspondence** | A document on the right side (`C/1`, `C/2`…). Any file type (PDF, Word, Excel, image) or an email reference. |
| **Single holder** | At any moment **exactly one person "holds" the file** — only they can act on it. This is the digital version of "who has the physical file on their desk." |
| **Workflow chain** | The file moves **Maker → Checker(s) → Approver / MD**, strictly in order. Each acts, signs, and it advances. |
| **Movement history** | Every action (create, forward, check, approve, revert, transfer, close…) is logged with who/when — a permanent audit trail. |

---

## 3. The roles (and the demo logins)

**All passwords are `Admin@123`** (the demo accounts from the client mail). The login screen has one-click **quick-login buttons** for each — you don't need to type anything. *(Seed this data with `cd server && npm run seed:demo`.)*

| Role | Demo user | Login button | What they do |
|---|---|---|---|
| **Maker** | Rutuja Sawant (Section Officer) — `rutuja@demo.com` | **Rutuja · Maker** | Opens files, writes notes, attaches correspondence, forwards for review. |
| **Checker** | Rasika R Sawant (Manager) — `rasika@demo.com` | **Rasika · Checker** | Reviews and **checks** a note, or **reverts** it back for correction. |
| **Approver** | Ravindra Pawar (Deputy MD) — `ravi@demo.com` | **Ravi · Approver** | Gives **approval**. |
| **MD** | Managing Director — `md@demo.com` | **MD** | Senior / final approver (can also approve via an uploaded scanned sign-off). |
| **Admin (Super Admin)** | System Administrator — `admin@demo.com` | **Admin** | **Manages users and departments, sees the reports** — but **cannot open the Noting/Correspondence content** of files (oversight only). |

Also seeded: **Suhas Sonawane** (Accounts, `suhas@demo.com`) — receives the approved file for the purchase order.

---

## 4. The file lifecycle (states)

```
DRAFT ──(add note + forward)──▶ UNDER_REVIEW ──check×n──▶ ──approve──▶ APPROVED
  ▲                                   │                                   │
  │                                   └──revert──▶ REVERTED ──resubmit────┘
  │                                                   │
  └──────────────────── (comes back to the Maker) ────┘
APPROVED ──route──▶ ROUTED ──return──▶ RETURNED ──close──▶ CLOSED
```

- **DRAFT** – just created, only the Maker sees it, no number yet.
- **SUBMITTED / UNDER_REVIEW** – number assigned; sitting with a reviewer.
- **REVERTED** – sent back to the Maker to fix (Maker can **edit** and resubmit).
- **APPROVED** – final sign-off done.
- **ROUTED / RETURNED** – handed to an action department, then returned.
- **CLOSED** – read-only; optionally links to a successor file.

---

## 5. Before you start — running the system

Two servers must be running:

```bash
# Terminal 1 — backend API (port 4000)
cd server
npm run dev

# Terminal 2 — frontend (port 3000)
npm run dev
```

Then open **http://localhost:3000**. If you want a clean data set first: `cd server && npm run seed:demo` (resets to the SICOM demo users + the pre-built files).

> Tip: keep the browser at a wide window — the file screen shows the two panes side-by-side and needs the width.

---

## 6. THE HAPPY PATH — the main demo script (≈5 minutes)

This is the core story: **Maker opens a file → Checker checks → Approver approves.** Follow it click-by-click.

### Step 1 — Maker opens a file
1. On the login screen, click **Rutuja · Maker**.
2. You land on the **Dashboard** (KPI cards: Inbox, Files Created, Pending My Action, Awaiting Approval + a recent-activity feed).
3. Go to **My Files → Create New File** (or the Create button).
4. Fill in: **Subject** (e.g. *"Purchase of 10 office laptops"*), **Department** = Administration, leave File Type = Regular, add an **Initial Note** (e.g. *"Proposal to procure 10 laptops for the new hires. Quotation attached."*). Click **Create File**.
5. The file opens. Point out the layout: **left info pane** (File Cover, Movement, Approval Flow, action buttons), **Noting side** (your opening note is Note 1) and **Correspondence side** (empty).

### Step 2 — attach a document (Correspondence)
1. Click **Add Correspondence**.
2. Choose a **Document Type** (e.g. *Bill/Quotation*), a title, and **upload any file** (PDF/Word/Excel/image) — or add an "Email reference". Upload.
3. It appears on the right as **C/1**. Click **Open** on it — the document previews **inline** on the correspondence side. *(For a multi-page PDF it shows the page range, e.g. "p. 1–3".)*

### Step 3 — write a note that references the document, and assign reviewers
1. Click **Add Note**.
2. Type a note that mentions the document, e.g. *"The quotation at C/1 is reasonable. Recommended for approval."*
3. In **Assign reviewers**, tick **Rasika R Sawant** (role **CHECKER**) and **Ravindra Pawar** (role **APPROVER**). *(This is where you choose who checks and who approves — and each person's role.)*
4. Click **Submit Note.**
5. Watch what happens: the file gets its number (e.g. **ADMIN/2026/002**), moves to **UNDER_REVIEW**, and is now **held by Rasika**. In the note, the reference **C/1** is a clickable link — click it to jump to and open the document.

### Step 4 — Checker reviews
1. Log out (top-right) → login as **Rasika · Checker**.
2. Go to **Inbox** (or **Pending Approvals**) — the file is waiting for her. Open it.
3. Click **Review & Approve** → choose action **Check** → add a remark (*"Verified, figures correct."*) → optionally her signature/dept are auto-stamped → submit.
4. The file advances to **Ravi** (the next in the chain). The **Approval Flow** panel (left) now shows Rasika ✓ checked, Ravi ● current.

### Step 5 — Approver approves
1. Log out → login as **Ravi · Approver**.
2. Open the file from **Pending Approvals** → **Review & Approve** → action **Approve** → remark (*"Approved."*) → submit.
3. The file is now **APPROVED**. There is no current holder. The Approval Flow shows the full signed chain with names, dates and signatures.

### Step 6 — print the file
1. Click **Print…** → choose **Noting** → range **All notes** (or *Last note*, or a *custom range*) → **Open Print View**.
2. A clean, printable page opens with a header (file no., dept, subject, date), the notes, and an **Approval Summary** table (every actor, role, date/time, signature). Ctrl/Cmd+P → Save as PDF.

**That's the core loop.** Everything below is "and it also does…".

---

## 7. Features to show off (pick what fits your audience)

- **Reference linking** – clicking `C/1` (or `Note 2`) in a note jumps to and opens that item. *(Step 3.)*
- **Revert & fix loop** – as the Checker, choose **Revert** instead of Check. The file goes back to the Maker as **REVERTED**; the Maker can now **Edit** the note (inline ✎ Edit button) and **resubmit** (Forward). Great for showing correction handling.
- **Drafts** – in Add Note, click **Save Draft** instead of Submit. The draft is **private to you** (nobody else sees it), shows a **Draft** badge and a **Submit** button, and appears in the **Drafts** page in the sidebar.
- **Assign a reviewer to a specific note** – in **Assign Roles** (or while adding a note) you can nominate a **Checker/Approver for a particular note** (e.g. "Note 3 approved by Ravi"), optionally down to a paragraph.
- **Notifications** – the **bell** (top-right) is live: whenever a file is forwarded/reverted/approved to you, you get a notification; click it to jump to the file.
- **Global search** – the header **search box** finds any file by number or subject; click a result to open it.
- **Confidential files** – tick **Confidential** on create. Only the people involved (creator, holder, named reviewers) and the Super Admin can see it; it carries a red CONFIDENTIAL mark and a print watermark. (Show a non-involved user *not* seeing it.)
- **Cross-department transfer** – on a file, **Transfer Dept** moves it to another department permanently; the **file number stays the same** and the move is recorded in the timeline (from-dept → to-dept).
- **Route & Return** – after approval, **Route to Department** hands it to an action officer, who later **Returns** it to the Maker; then **Close File**.
- **Maximise a side** – the ⤢ button on Noting or Correspondence expands that side to full width.
- **Multi-format + continuous paging** – attach Word/Excel/images too; multiple PDFs are page-numbered continuously (C/1 pages 1–3, C/2 starts at 4).

---

## 8. The Admin (Super Admin) — a separate short demo

1. Log out → login as **Admin**.
2. Note the **reduced menu**: Dashboard, All Files, **Users**, Reports & Logs. The admin is **oversight only** — if they open a file, the Noting/Correspondence content is **hidden** ("not available to the admin role"). Emphasise this is deliberate (separation of duties).
3. **Users** page:
   - Full user list — change a user's **role** or **department** inline, **activate/deactivate**, **reset password**, or **Add User**.
   - **Departments** panel — add a new department (e.g. *Human Resources / HR*) or deactivate one. New files can then be opened in it.
4. **Reports & Logs**:
   - **All Files** tab — every file with **Submitted By** and **Department** (the super-admin register); **Export CSV**.
   - **Activity Log** tab — the full movement audit trail, filterable by department/date/search.

---

## 9. Real-world use cases (to frame the demo)

- **Procurement approval** – Maker proposes a purchase, attaches the quotation (C/1), forwards to Checker → Approver → MD. *(This is the happy path above.)*
- **Vendor letter with no note** – a letter arrives (e.g. "vendor changed address"); it's added on the **Correspondence side only**, no noting needed.
- **Correction cycle** – Approver reverts a proposal; Maker edits and resubmits.
- **Confidential matter** – a disciplinary/legal file marked Confidential, visible only to those involved.
- **Cross-department case** – a file that starts in Administration but must move to Legal — transferred, keeping its number and history.
- **Oversight** – management/audit uses the Admin login to see **all files, who submitted them, and the full log**, without being able to read the content.

---

## 10. Likely questions (and the honest answers)

- **"Is it a real digital signature (PKI)?"** – Phase 1 uses a **typed name + automatic system attestation** (who, when, which section), shown on print. Certificate-based (PKI/DSC) signing is a Phase-2 item.
- **"Can two people sign at once / in any order?"** – Today it's **strictly sequential** (Checker then Approver…). An optional **any-order** mode is planned (client requested it).
- **"Physical page-range printing?"** – The Print dialog lets you pick a **note range**; for exact printed pages use the browser's Print "Pages" box.
- **"Where does the file get its number?"** – Auto **DEPT/YEAR/SEQ** on submission, per department, resetting yearly.
- **"Mobile app?"** – Not in scope; it's a responsive web app.
- **"Does it replace the File Tracking system?"** – Yes — file movement/tracking now lives inside this app.

---

## 11. What's built vs. later (so you can answer scope questions)

**Built and working now:** file create/number, Noting + Correspondence (any file type), the Maker→Checker→Approver/MD workflow with check/approve/revert, per-note reviewer assignment, drafts (private) + submit + edit-on-revert, reference linking + inline document preview, route/return/transfer/close, confidential access control, print (with note ranges + approval summary), reports (all-files register + audit log + CSV), notifications, global search, admin user + department management, login/RBAC. **46 automated backend tests pass.**

**Planned / Phase 2:** PKI digital signatures, any-order approval mode, an inbuilt document store with old-file retrieval, live email inbox integration, page-level linking inside a PDF.

---

### Quick reference card (keep this visible during the demo)

| Need | Where |
|---|---|
| Log in as anyone | Quick-login buttons on the login screen (password `Admin@123`) |
| Create a file | My Files → Create New File |
| Add a note / assign reviewers | Open file → **Add Note** |
| Attach a document | Open file → **Add Correspondence** |
| Send for review | Submit the note with reviewers ticked (or **Forward File**) |
| Check / Approve / Revert | Open file → **Review & Approve** |
| See who holds it / the chain | **Approval Flow** panel (left) |
| Print | **Print…** button |
| Notifications | **Bell** (top-right) |
| Find a file | **Search box** (top) |
| Admin: users & departments | Login as **Admin** → **Users** |
| Admin: all-files report | Login as **Admin** → **Reports & Logs → All Files** |
