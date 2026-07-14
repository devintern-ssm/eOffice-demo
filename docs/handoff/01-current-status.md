# 01 — Current Status

## The journey so far (4 stages, all complete)

1. **Discovery & gap analysis** — read the frontend-only prototype + the client's scope document (SOW) + handwritten annotations. Produced `docs/01`–`docs/07`: project overview, screen inventory, screen-flow map, inferred data model, role/permission matrix, **SOW traceability & gap analysis**, and open questions. Verdict: the prototype was a convincing UI shell where *every* mutation was a `Demo mode` alert (no backend, no auth, no persistence).

2. **Requirements decisions** — the client answered a questionnaire; answers were reconciled into **`docs/08_requirements_decisions.md`** (the authoritative "what we build" doc). Key rulings: auto `DEPT/YEAR/SEQ` file numbers + internal UUID; PDF-only attachments in Phase 1; sequential recipient chain; "Inward = routed-to-you / Outward = reverted"; typed-name signature (PKI deferred); **mobile dropped entirely**; the separate "File Tracking system" is physical/manual (no integration).

3. **Implementation plan** — **`docs/09_implementation_plan.md`**: stack, repo shape, data model, workflow state machine, and Phase 0 + Phase 1 (10 sequenced slices) + Phase 2 (deferred).

4. **Build (Phase 1)** — built the whole thing bottom-up (Phase 0 foundation → 1.1 identity/CRUD → 1.2 noting/correspondence → 1.3 workflow engine → 1.5 approvals extras → 1.6 print → 1.7 routing → 1.8 lifecycle → 1.9 reports → 1.10 login/RBAC). Each slice was verified (API smoke tests + browser checks) and documented in **`docs/phases/`**. A final **adversarial code-review** found **20 confirmed bugs** (auth gaps, confidential bypass, workflow state integrity, CSV injection) — **all fixed and regression-tested.**

## What is DONE and trustworthy

- **Backend** (`server/`): Node + Express + TypeScript + Prisma (SQLite dev). Auth, files, notes, correspondence, workflow engine, lifecycle, approvals, reports, print, confidential access control. `npx tsc --noEmit` = **0 errors**.
- **Frontend** (`src/`): every screen wired to the live API; real login + auth context; new modals. `npm run build` = **passes** (76 modules).
- **Verified behaviors:** create→forward→check→approve, revert→resubmit loop, add/remove reviewer, MD offline-scan approval, paragraph approval, comment-after-approval, route→return→close, cross-dept transfer (number unchanged), confidential 403 for non-involved users, reports + CSV export, print views. Wrong-user actions correctly 403.
- **Docs:** discovery (01–07), decisions (08), plan (09), phase logs (`phases/`), and this handoff.

## What is NOT done / explicitly out of scope for Phase 1

- **Phase 2 backlog** (deferred by decision): multi-format attachments beyond PDF, inbuilt DMS + old-file retrieval, confidential temp-file split/merge, **PKI/DSC** certificate signatures, page-level linking inside documents ("C/36 on page 5"), live email-mailbox sync, notifications.
- **Out entirely:** mobile app; org-wide cross-org file tracking (owned by the separate physical File Tracking process).
- **Productionization not started:** still on SQLite (Postgres-ready via Prisma), no automated tests, no CI, no deployment, print is browser-printable HTML (not a server-rendered binary PDF). See [`05-next-steps.md`](05-next-steps.md).

## Git / delivery state

- Branch **`feat/eoffice-phase1-nc-workflow`**, 2 commits ahead of `main`:
  - `16787cc` — feat: Phase 1 full-stack implementation (87 files: `server/`, wired `src/`, `docs/`)
  - `b1c2763` — chore: leftover root-level discovery drafts (so the tree is clean)
- **Not pushed.** This environment can't push non-interactively (no `gh` CLI, no token, Git Credential Manager needs an interactive dialog). The **user pushes and opens the PR themselves**. Do not spend time retrying the push (see [[eoffice-git-push-constraint]] in memory).
- Working tree is **clean**. `.env`, `dev.db`, `node_modules`, `uploads/` are gitignored (no secrets committed). `.claude/settings.local.json` is gitignored; `.claude/launch.json` (preview config) is committed.

## What to be careful about (pointers into the detail docs)
- The demo's **`src/data/dummyData.js` still exists** and is imported only for the static `sections` list in a couple of places — the app data comes from the API, not this file. Don't reintroduce it as a data source.
- **SQLite specifics** and a **nested-transaction deadlock** trap are documented in [`04-decisions-and-gotchas.md`](04-decisions-and-gotchas.md) — read it before touching the workflow/numbering code.
