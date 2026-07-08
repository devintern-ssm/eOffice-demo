# Phase Log & Testing Guide

This folder tracks the build phase-by-phase. Each file records **what was built** and **a manual test checklist** so you can verify everything in one pass. Phases follow the plan in [`../09_implementation_plan.md`](../09_implementation_plan.md).

| Phase | Doc | Status |
|-------|-----|--------|
| 0 — Foundation | [phase-0-foundation.md](phase-0-foundation.md) | ✅ Done |
| 1.1 — Identity & File CRUD | [phase-1.1-identity-file-crud.md](phase-1.1-identity-file-crud.md) | ✅ Done |
| 1.2 — Noting & Correspondence | [phase-1.2-noting-correspondence.md](phase-1.2-noting-correspondence.md) | ✅ Done |
| 1.3 — Workflow engine | [phase-1.3-workflow-engine.md](phase-1.3-workflow-engine.md) | ✅ Done |
| 1.4 — Inbox & queues | _(delivered within 1.1 + 1.3)_ | ✅ Done |
| 1.5–1.10 — approvals extras, print, routing, lifecycle, reports, login/RBAC | [phase-1.5-to-1.10.md](phase-1.5-to-1.10.md) | ✅ Done |

**🎉 Phase 1 is complete.** Log in (any quick-login button, password `password123`) and walk the checklists above.

---

## How to run everything

Two processes. Open two terminals at the repo root (`D:\Sahasrara\eOffice\demo`).

```bash
# 1) Backend API  (http://localhost:4000)
cd server
npm install                 # first time only
npx prisma migrate dev      # first time only (creates SQLite dev.db)
npm run seed                # first time / to reset demo data
npx tsx watch src/server.ts

# 2) Frontend  (http://localhost:3000)  — from the repo root
npm run dev
```

Open **http://localhost:3000**. The Vite dev server proxies `/api` → `:4000`.

## Login / users

The app opens on a **login screen** (as of 1.10). Use the **quick-login** buttons or sign in with an email below — all seeded users share the password **`password123`**:

| Name | Role | Email |
|------|------|-------|
| Rajesh Kumar | MAKER | rajesh.kumar@example.com |
| Priya Sharma | CHECKER | priya.sharma@example.com |
| Amit Patel | APPROVER | amit.patel@example.com |
| Sneha Reddy | MAKER | sneha.reddy@example.com |
| Vikram Singh | MAKER | vikram.singh@example.com |
| Anjali Mehta | CHECKER | anjali.mehta@example.com |
| M. D. Rao | MD | md@example.com |
| System Admin | ADMIN | admin@example.com |

> To test as a **different user**, click **Log out** (top-right) and pick another quick-login button. The whole maker→checker→approver flow is best tested by switching between **Sneha** (maker), **Priya** (checker), and **Amit** (approver).

## Reset the data anytime

```bash
cd server && npm run seed      # wipes and recreates the 8 users + 4 demo files
```

## Quick health check

```bash
curl http://localhost:4000/api/v1/health
```
