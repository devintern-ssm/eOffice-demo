# e-Office (Noting–Correspondence) — Demo Guide

*Everything you need to run and narrate the demo. Read §1–§3 for the story, then follow §6 (the click-by-click script) live.*

---

## 1. What this system is (the goal — say this first)

Government and PSU offices run on **physical files** that move desk to desk. Each file has two sides:
- a **Noting** side, where officers write dated, signed remarks and decisions, and
- a **Correspondence** side, where the actual documents (letters, bills, orders) are pinned.

A file is a **permanent binder** that normally stays open for years. The real unit of work is the **note**: an officer **raises a note**, the file travels desk-to-desk so each officer in the note's chain **signs** it (or **sends it back**), and when the last officer signs, that note is **final** and the file returns to whoever raised it — ready for the next note. Today this is paper — slow, hard to track, easy to lose.

**This project digitises that exact process.** Same mental model (Noting side + Correspondence side, per-note sign-off), but now it is online: auto-numbered binders, a per-note signature chain, digital sign-off, page-level correspondence numbering, a full movement history, search, reports, and notifications — with confidential-file access control.

> One-liner for the demo: *"It's the paper Noting–Correspondence file, made digital — with the whole approval chain, history and access control built in."*

---

## 2. Core concepts (the mental model)

| Concept | What it means in the app |
|---|---|
| **N-C File (binder)** | A **permanent binder** identified by a **UN number**. Has a **Noting side** (Note 1, 2, 3…) and a **Correspondence side** (page-level C-numbers), shown side-by-side. It stays **OPEN**; closing is the rare exception. |
| **UN number** | Auto-generated as **DEPT/YEAR/SEQ** (e.g. `ADMIN/2026/001`) **when the binder is created**. Per department, resets each year. |
| **Note** | The **unit of workflow**. Each note has its **own maker** and its **own signature chain**. Notes are **sequential** — one note is finished before the next is started. A note can reference a correspondence page ("Refer C4") or a previous note. |
| **Signature chain** | An ordered list of signers on a note. Each either **Signs & Forwards** or **Sends Back**. The **last signer finalizes** the note, and the file returns to the note's maker. One person can be both checker and approver — it's just a chain. |
| **Correspondence** | Documents on the right side, numbered **per page** (C1, C2, C3…). A 20-page attachment occupies C1–C20; the next attachment continues at C21. Any file type (PDF, Word, Excel, image) or an email reference. |
| **Single holder** | At any moment **exactly one person "holds" the file** — only they can act. During a note's review the holder is its current signer; at rest it's the last note's maker. |
| **Movement history** | Every action (create, open-note, submit, sign, send-back, finalize, handover, transfer, close…) is logged with who/when — a permanent audit trail. |

---

## 3. The roles (and the demo logins)

**All passwords are `Admin@123`** (the demo accounts from the client mail). The login screen has one-click **quick-login buttons** for each — you don't need to type anything. *(Seed this data with `cd server && npm run seed:demo`.)*

| Role | Demo user | Login button | What they do |
|---|---|---|---|
| **Maker** | Rutuja Sawant (Section Officer) — `rutuja@demo.com` | **Rutuja · Maker** | Opens binders, raises notes with a signer chain, attaches correspondence. |
| **Checker** | Rasika R Sawant (Manager) — `rasika@demo.com` | **Rasika · Checker** | A signer on a note — **Signs & Forwards** or **Sends Back** for correction. |
| **Approver** | Ravindra Pawar (Deputy MD) — `ravi@demo.com` | **Ravi · Approver** | A signer, typically last in the chain — his signature **finalizes** the note. |
| **MD** | Managing Director — `md@demo.com` | **MD** | Senior signer (can also sign **offline** via an uploaded scanned sign-off, filed as correspondence). |
| **Admin (Super Admin)** | System Administrator — `admin@demo.com` | **Admin** | **Manages users and departments, sees the reports** — but **cannot open the Noting/Correspondence content** (oversight only). |

Also seeded: **Suhas Sonawane** (Accounts, `suhas@demo.com`) — the file is **handed over** to him to raise the purchase-order note.

> The roles are just labels on a chain — any signer can be both checker and approver. The two actions are always **Sign & Forward** or **Send Back**.

---

## 4. The lifecycle

**The file** has just two states: **OPEN** (the normal, permanent state) and **CLOSED** (rare — a case file at its end; read-only, may link to a successor).

**Each note** runs its own little lifecycle as it travels its signature chain:

```
DRAFT ──(maker submits with a signer chain)──▶ IN_REVIEW ──sign──▶ sign──▶ FINALIZED
  ▲                                                 │                          │
  │                                                 └──send back──▶ RETURNED ──┘
  └──────────────── (edit & resubmit, back to the note's maker) ───────────────┘
```

- **DRAFT** – the maker is still writing it; private to the maker.
- **IN_REVIEW** – travelling the signer chain; the file is held by the current signer.
- **RETURNED** – a signer sent it back; the maker can **edit** and resubmit.
- **FINALIZED** – the last signer signed; the file returns to the note's maker. The binder stays **OPEN** for the next note.

Notes are **sequential** — the in-flight note must be finalized before the next note is opened. When a binder is idle, its holder can **hand it over** to someone else (even in another department) to raise the next note, or **transfer** it to another department, or **close** it.

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

> **For the exact, follow-blindly click script use [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md).** This is the narrated summary.

The core story: **Maker raises a note → Checker signs & forwards → Approver signs & finalizes → the note is done and the binder comes back to the maker.**

1. **Maker (Rutuja)** logs in, **Create New File** (Subject + Department). The binder opens **OPEN** with its **UN number already assigned** and Rutuja as holder.
2. **Add Correspondence** — upload a PDF; it appears as a page-level group (e.g. **C1–C3**). Page numbers run continuously across attachments.
3. **Add Note** — write the proposal (reference a page with "Refer C1"), then in the **Signature chain** tick **Rasika (Checker)** and **Ravindra (Approver)** in order, and click **Submit for Signature**. The note goes **IN_REVIEW** and the file moves to Rasika. The binder stays **OPEN**.
4. **Checker (Rasika)** → **Pending Approvals** → **Review File** → **Sign / Send Back** → **Sign & Forward** with a remark. The file advances to Ravi; her signature shows on the note.
5. **Approver (Ravi)** → the button reads **Sign & Finalize** (last signer). He signs → the note is **FINALIZED** and the file returns to Rutuja. The binder is still OPEN, ready for the next note.
6. **Print** — **Print… → Noting** → each note prints with **its own signatory block** (every person who signed that note). Noting and Correspondence print as two separate PDFs.

Along the way, point out: the **MD can sign offline** (upload a scanned signed copy, filed as a numbered correspondence page), a signer can **Send Back** (the note returns as **RETURNED** for the maker to edit and resubmit), and an idle binder can be **handed over** to another officer/department to raise the next note.

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
