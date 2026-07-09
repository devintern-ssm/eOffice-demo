# 11 — Client Demo Mail: Points Status

Source: SICOM (Rasika R Sawant) mail, "RE: Meeting link for Demo at 2.30 pm today" (24 Jun 2026),
following the earlier vendor's (Serviz4u) demo of a *different* codebase. The 10 discussion points
below are checked against **this** codebase (the one being shipped). Demo logins from the same mail
are seeded by `npm run seed:demo` (all password `Admin@123`).

Legend: ✅ done & verified · 🟡 partial / pending client input · ⏳ deferred (client said "discuss separately").

| # | Mail point | Status | Where it is in this build |
|---|-----------|--------|---------------------------|
| 1 | Two dashboards — **Super Admin** + **User** (Ravi, Rasika, Rutuja) | ✅ | Regular users get the KPI dashboard (inbox / created / pending / awaiting). **Admin now gets a system-wide "Super Admin Dashboard"** (Total Files / Under Review / Approved / Closed) + activity across all files, reduced nav (Dashboard / All Files / Users / Reports). `Dashboard.jsx`, `getFileStats`. |
| 2 | Super-Admin report of **all files** + **Submitted By** + **Department** | ✅ | Reports → **All Files** tab with `File Number, Subject, Department, Status, Submitted By, Current Holder, Created` + CSV export. Confidential files hidden from non-admins. `reports.service.ts`, test `round2 #5`. |
| 3 | Noting/Correspondence — **support more file formats** (not only PDF) | ✅ | All formats accepted (PDF/Word/Excel/images/…), 25 MB. Original name + mime stored. `correspondence.routes.ts`, tests `round2 #6`. |
| 4 | Correspondence — **page numbering continues** across attached PDFs | ✅ | Each attachment stores its page count; the file detail + print show a running page range (C/1 p.1–3, C/2 p.4–9 …). Verified on the seeded file (26 continuous pages). `files.service` paging, tests `round2 #7`. |
| 5 | **Draft** notes should be shown | ✅ | Save-as-draft (private to the author until submitted), **Draft** badge, a **Drafts** page, and a per-note Submit. `AddNoteModal`, `Drafts.jsx`, tests `bugfixes`, `A2`. |
| 6 | Two sides stored as **two separate PDFs** (e.g. "…-Noting" / "…-Correspondence") | ✅ | Print produces two independent, self-contained PDFs — **Print… → Noting** and **Print… → Correspondence** — each with header/footer + approval summary + confidential watermark. `print.service.ts`. *(Filename can be customised to the "<subject>-Noting" pattern if you want an exact match.)* |
| 7 | Noting print **format**; and MD's **manually-signed printout scanned + uploaded + numbered** | ✅ / 🟡 | **MD scanned sign-off is done** — "MD Offline Approval" uploads the signed PDF, approves the step, stores it as a `C/n` correspondence, **and now page-numbers it** in the sequence (seeded file: C/7 = p.23). The **print already carries** file no./dept/subject/date + the paragraph notes + a full **Approval Summary** (each actor, role, name, dept, date/time, signature). 🟡 The *exact* template on page 2 of the mail ("Put up for approval please", the stacked Creator → Approver → DMD → MD signature block) — the mail says this format "will be shared separately"; our layout approximates it and can be matched precisely once the template arrives. |
| 8 | **Email integration (Login)** — to be shown | ⏳ | Not built. Phase-1 auth is email + password (JWT/RBAC). Live email-mailbox integration / email-based SSO is a deferred (Phase-2) item; we already support attaching an email *as* correspondence. Needs the client's exact intent (SSO vs mailbox ingest). |
| 9 | **Location of the file** — discuss separately with Ravi Sir | ⏳ | The digital equivalent exists: every file has a **current holder** and a complete **movement history** (who has it, dept→dept transfers, full timeline). Whether a separate "physical location" field is wanted is the open discussion. |
| 10 | **Discussion module / functionality** — discuss separately with Ravi Sir | ⏳ | Not built as a standalone module. Closest today: per-note **comment-after-approval** (append-only) and the notes trail itself. A dedicated discussion/chat thread would be new scope, pending the discussion with Ravi Sir. |

## Summary
- **Points 2–7 (the concrete demo asks) are done and verified** — including the two-sided print and the MD scanned-signature-with-page-number.
- **Point 1** is done (Super Admin vs User dashboards).
- **Points 8, 9, 10** are the ones the mail itself flagged for **separate discussion / later** — they need the client's exact intent before building.
- The one thing worth getting from the client is **the exact noting-print template** (mail point 7) so the printed page matches their format byte-for-byte.

## Demo logins (from the mail) — seeded by `npm run seed:demo`
All password **`Admin@123`**:

| Email | Person | Role in the app |
|---|---|---|
| `admin@demo.com` | System Administrator | Super Admin (users, departments, reports) |
| `rutuja@demo.com` | Rutuja Sawant | Maker (creates files) |
| `rasika@demo.com` | Rasika R Sawant | Checker (Manager) |
| `ravi@demo.com` | Ravindra Pawar | Approver (Deputy MD) |
| `md@demo.com` | Managing Director | MD (final approver) |
| `suhas@demo.com` | Suhas Sonawane | Accounts (post-approval routing) |

Seeded files: **ADMIN/2026/001** (large procurement file, fully worked through — 9 notes, 8 docs, 26 pages), **ADMIN/2026/002** (AMC — live *under review* with Rasika), **ADMIN/2026/003** (confidential), and a working **draft**.
