# e-Office — Session Handoff (read me first)

> **Purpose:** orient a new session/engineer in ~10 minutes. This folder is a snapshot of **where the project stands, what's built, and what's next.** It is intentionally kept out of the "must-commit" set — it's a working handoff, not product docs.

**Last updated:** 2026-07-03 · **Status:** **Phase 1 complete, verified, committed locally (not pushed).**

---

## 30-second summary

- **What this is:** an **e-Office** app that digitizes a physical **Noting–Correspondence (N-C) file** system for a government/PSU-style office. Files move maker → checker → approver, with a noting side (sequential signed notes) and a correspondence side (numbered documents C/1, C/2…).
- **Where it started:** a client-approved but **frontend-only React prototype** (mock data, every action a `Demo mode` alert).
- **What happened this project:** (1) full **discovery + gap analysis**, (2) mined client answers into a **decisions log**, (3) wrote an **implementation plan**, then (4) **built Phase 1 end-to-end** — a real **Node/Express/TypeScript + Prisma** backend with the React UI wired to it, (5) ran an **adversarial security review** and fixed 20 issues.
- **Where it is now:** Phase 1 is **functionally complete and hardened**, committed to a local branch `feat/eoffice-phase1-nc-workflow` (2 commits). **Not pushed** — the user pushes/creates the PR themselves (this env has no `gh`/token and GCM needs an interactive dialog).
- **What's next:** **Phase 2** (multi-format attachments, DMS, PKI signatures, page-level linking, email, notifications) + productionization (Postgres, SSO, real binary PDF, tests, CI). See [`05-next-steps.md`](05-next-steps.md).

---

## Get it running (2 terminals, from repo root `D:\Sahasrara\eOffice\demo`)

```bash
# Terminal 1 — backend API (http://localhost:4000)
cd server
npm install                 # first time
npx prisma migrate dev      # first time (creates SQLite dev.db)
npm run seed                # seed 8 users + 4 files (reset anytime)
npx tsx watch src/server.ts

# Terminal 2 — frontend (http://localhost:3000)  — repo root
npm install                 # first time
npm run dev
```

Open **http://localhost:3000** → **login screen** → click a **quick-login** button. All demo users share password **`password123`**. Vite proxies `/api` → `:4000`.

**Demo users / roles:** Rajesh (MAKER), Priya (CHECKER), Amit (APPROVER), Sneha (Accounts MAKER), Vikram (Legal MAKER), Anjali (Audit CHECKER), M.D. Rao (MD), Admin (ADMIN).

**Best end-to-end test:** log in as **Sneha** → create & forward a file to **Priya** then **Amit** → log in as **Priya** (check) → **Amit** (approve) → route/return/close. Full checklists in [`../phases/`](../phases/README.md).

---

## The handoff docs (in this folder)

| Doc | What it covers |
|-----|----------------|
| [`01-current-status.md`](01-current-status.md) | The full journey, what's done vs. not, the git state, what to trust |
| [`02-architecture.md`](02-architecture.md) | Stack, repo layout, data model, the workflow state machine, how requests flow |
| [`03-implemented-features.md`](03-implemented-features.md) | **Complete API reference** + frontend screen inventory + feature→endpoint map |
| [`04-decisions-and-gotchas.md`](04-decisions-and-gotchas.md) | Key client decisions + **critical gotchas** a new agent must know before editing |
| [`05-next-steps.md`](05-next-steps.md) | Phase 2 backlog, Phase-1 follow-ups, productionization, suggested first tasks |

## The reference docs (elsewhere, produced earlier)

| Doc | What it is |
|-----|-----------|
| [`../01_project_overview.md`](../01_project_overview.md) → `../07_open_questions.md` | Original **discovery & gap analysis** of the prototype (screens, data model, roles, SOW traceability, open questions) |
| [`../08_requirements_decisions.md`](../08_requirements_decisions.md) | **Client decisions log** — the authoritative "what we're building" answers |
| [`../09_implementation_plan.md`](../09_implementation_plan.md) | The **build plan** (architecture, phases, sequences) that Phase 1 followed |
| [`../phases/`](../phases/README.md) | **Per-phase build + test checklists** (what was built + how to verify, phase by phase) |
