# 04 — Decisions & Gotchas

## Locked client decisions (from `docs/08_requirements_decisions.md`)

- **File identity is three-tier:** internal **UUID** (permanent PK) + auto **`DEPT/YEAR/SEQ`** display number (per dept + year, resets yearly, assigned on submit) + optional user **custom label**.
- **Attachments are PDF-only in Phase 1** (multi-format is Phase 2).
- **Inbox semantics (D7):** *Inward = routed to you (you're the next step)*, *Outward = reverted to you for rework*. This **differs** from the SOW's "Inward = final approved" — the client's definition wins.
- **Signature = typed name + auto attestation** (user, timestamp, section) shown on print. **PKI/DSC is deferred** — don't build certificate signing unless asked.
- **Print = two sides** (Noting + Correspondence) with an approval-summary table, header/footer, confidential watermark.
- **Routing = a modifiable, sequential recipient list** ("Add Reviewer"), not a rigid 4-role chain; strictly sequential (no parallel review).
- **Section-level edit rights** realized as: notes are holder/author-gated; confidential files are access-gated.
- **Mobile is DROPPED** (not Phase 1 or 2). **Org-wide file tracking is OUT** — the separate "File Tracking system" is a **physical/manual** process (the client corrected the SOW; there's no software to integrate).
- **No newer codebase exists** — the client confirmed the "already implemented" phrasing in their answers meant *intended design*; everything was built from scratch here.

## Critical gotchas (read before editing backend)

1. **Never call `allocateFileNumber` inside a `prisma.$transaction`.** It runs its **own** interactive transaction, and **SQLite cannot nest interactive transactions** — it deadlocks (5s timeout, error P2028). Allocate the number *before* opening the outer transaction. (This bug was hit and fixed in `workflow.service.forwardFile`.)

2. **`currentHolderId` is the single-holder lock and the source of truth for authorization.** To act on a workflow step, a user must be **both** the step's assignee **and** the current holder (or ADMIN). If you add a workflow transition, keep the invariant "holder === active (lowest-order PENDING) step's assignee" true, and re-establish it after any edge case (see `addReviewer`).

3. **SQLite has no Prisma enums.** Statuses/roles are `String`. Allowed values live in `server/src/utils/domain.ts` and are validated with **zod** at the route layer. When switching to Postgres, these can become native enums — update both the schema and the validators.

4. **Confidential access is gated by middleware, not per-handler.** `requireFileAccess` (in `files.routes.ts`) wraps **every** `/files/:id/...` route. If you add a new file-scoped router, mount it the same way, or confidential files will leak. Also: **collection routes (`/`, `/stats`, `POST /`) are registered BEFORE the `/:id` mounts** so `/stats` isn't captured as an id — keep that order.

5. **Every mutation must check authorization + write a `Movement`.** The audit log is a core requirement. Lifecycle/approval actions are gated to holder/maker/step-assignee/admin. The last security review found the whole class of "new endpoint, forgot the auth check" — don't repeat it. When adding a write endpoint, ask: who's allowed? is the file CLOSED? is it confidential? did I log a Movement?

6. **CLOSED files are read-only.** `addNote`, `addCorrespondence`, `addNoteComment`, and actions all reject CLOSED. New mutations must too.

7. **Seed users have FIXED IDs** (`u-rajesh`, `u-priya`, …) so re-seeding (`npm run seed`) doesn't invalidate a logged-in JWT. Don't switch them back to random UUIDs. File IDs *are* random and change on re-seed (that's fine).

8. **ESM/TS imports use `.js` extensions** on relative paths (e.g. `import { x } from './config.js'`) — required for `tsx` + a Node ESM build. Keep it consistent.

## Frontend gotchas

- **Auth is real now.** `src/api/client.js` attaches the JWT and, on a 401, clears it and fires an `eoffice-unauth` event that returns you to the login screen. There is **no dev-login shim anymore** — the old auto-login was removed in 1.10.
- **`src/data/dummyData.js` is legacy.** It's only imported for the static `sections` list in a couple of spots. Do **not** use it as a data source; all data comes from the API.
- **Status values changed.** Use `src/utils/status.js` (`FILE_STATUSES`, `prettyStatus`, `statusColor`) — the enum is `DRAFT|SUBMITTED|UNDER_REVIEW|REVERTED|APPROVED|ROUTED|RETURNED|CLOSED`, not the old prototype strings.
- **Blank dept/signature in the Review modal is intentional** — left blank, the backend stamps the real authenticated user. Don't prefill them from a hardcoded user.

## Environment / delivery gotchas

- **Can't push or open PRs from this environment** — no `gh` CLI, no token env var, and Git Credential Manager needs an interactive GUI. Commit locally; the **user pushes and opens the PR**. (Saved in memory as [[eoffice-git-push-constraint]].)
- **Two processes to run:** backend (`server/`, tsx watch on :4000) + frontend (root, Vite on :3000). The Vite proxy forwards `/api`.
- **`server/.env`** holds `JWT_SECRET` (dev value) and is gitignored. For prod, set a real secret and switch `DATABASE_URL` to Postgres.
- Windows dev box; the Bash tool is Git Bash (POSIX), PowerShell also available.

## Multi-agent workflow lesson (if you orchestrate)
When using the Workflow tool, **revise/writer agents sometimes return a changelog or write to the wrong path instead of the doc content** — always verify outputs on disk (file size vs siblings, first line is the H1). This bit us during the discovery-doc generation. (Saved in memory as [[eoffice-discovery-workflow-lesson]].)
