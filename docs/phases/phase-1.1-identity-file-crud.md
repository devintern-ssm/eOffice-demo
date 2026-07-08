# Phase 1.1 — Identity & File CRUD

**Goal:** wire every remaining screen to the live backend and make Create File actually persist, with the correct identity model (auto `DEPT/YEAR/SEQ` + optional custom number).

## What was built

**Backend**
- `GET /files` gained queue filters: `mine`, `holder` (inbox), `pending` (my approval queue = has a PENDING step assigned to me), `sent`; each file DTO now carries `inboxType` (**Inward** routed-to-you / **Outward** reverted, decision D7).
- `GET /files/stats` — dashboard KPIs (`inboxCount`, `filesCreated`, `pendingMyAction`, `awaitingApproval`) + recent activity feed.
- `GET /files/:id` — full detail: cover + notes + correspondence + movements + workflow steps.
- `POST /files` creates a **DRAFT** file (holder = originator), optional initial note; `POST /files/:id/submit` assigns the `DEPT/YEAR/SEQ` number and moves it to SUBMITTED.

**Frontend — every screen now reads the live API**
- Dashboard (KPIs + activity), My Files (last-used sort), Inbox (Inward/Outward badges), Pending Approvals (real per-approver queue), Sent Files, All Files, File Detail (cover + noting + correspondence + movement timeline + clickable `C/n`/`Note n` links).
- **Create File** persists via `POST /files`; the old free-text "File Number" is now the **optional custom label** (the real number auto-generates on submit).

## What you should test

Log in is automatic as **Rajesh Kumar (Maker)**. (To see the approver queues, test as **Priya** — see the README for switching users.)

1. **Dashboard** (`/`): four KPI cards show live counts; "Recent Activity" lists real movements; clicking a card navigates to that queue.
2. **My Files** (`/my-files`): shows only files you created; try the **search**, **status filter**, and **sort (Last Used / Created / Number)**.
3. **All Files** (`/all-files`): shows all files; try the **Section** and **UN Number** filters.
4. **Inbox** (`/inbox`): shows files currently in your hands; each card shows an **Inward/Outward** badge.
5. **Pending Approvals** (`/pending-approvals`): as **Rajesh** this is empty (he's a maker); as **Priya** it shows `ACC/2024/015` (her pending step). This proves it's a real per-approver queue, not "all under-review".
6. **File Detail**: open any file → File Cover, **Noting Side** (Note 1, Note 2…), **Correspondence Side** (C/1, C/2…), and the **Movement** timeline (expand it). Click a `C/1` or `Note 1` link inside a note → it scrolls to and highlights the target.
7. **Create File** (`/create-file` or the "Create New File" button):
   - Fill **Subject** + **Section**, leave File Number blank, click **Create File**.
   - It should navigate to the new file's detail page, showing your subject and status **DRAFT** (number shows "DRAFT" until submitted — that's correct; the `DEPT/YEAR/SEQ` number is assigned on submit).
   - The new file should now appear in **My Files**.
8. **No console errors** anywhere.

## Notes / limitations
- Inbox/Pending are computed from `currentHolderId` and `WorkflowStep`; they become fully dynamic once the workflow engine (1.3) drives those transitions.
- Create makes a DRAFT; the **submit → assign number → route** flow is completed in slice 1.3.
- Confidential files are still visible to everyone (real gating is slice 1.10).
- The dashboard "overdue" card was removed (it was meaningless against fixed dates); SLA/overdue is a later concern.
