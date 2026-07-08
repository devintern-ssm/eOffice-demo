# Phase 0 — Foundation

**Goal:** stand up a real backend + database + auth and get the app booting against it (no more `dummyData.js` driving the UI).

## What was built

**Backend (`server/`)** — Node + Express + TypeScript
- Project scaffold: `package.json`, `tsconfig.json`, `.env` (config), error/CORS/JSON middleware, `/api/v1/health`.
- **Prisma schema** (`server/prisma/schema.prisma`) — the full N-C data model: `User`, `File`, `Note`, `NoteReference`, `ParagraphApproval`, `CheckerComment`, `Correspondence`, `WorkflowStep`, `Movement`, `NumberSequence`. (SQLite for dev; statuses/roles are strings, validated in the app layer, and become native enums on the Postgres switch.)
- **Auth** — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`. JWT (bcrypt-hashed passwords), `authenticate` + `requireRole` middleware.
- **Numbering service** — transactional `DEPT/YEAR/SEQ` allocator, per department + year, resets yearly (decision D1/D2).
- **Files API** — `GET /files` (list), `GET /files/:id`, `POST /files` (create), `POST /files/:id/submit`.
- **Seed** (`server/prisma/seed.ts`) — 8 users (all roles incl. MD/Admin) + the 4 demo files, ported from the old mock data with mapped statuses.

**Frontend**
- `src/api/client.js` — fetch wrapper + JWT handling (+ temporary dev-login bootstrap).
- `src/api/files.js` — typed API calls.
- `src/utils/status.js` — status labels + colors for the new workflow statuses.
- `vite.config.js` — proxy `/api` → `:4000`.
- **All Files** screen wired to the live API.

## What you should test

1. **Backend is up:** `curl http://localhost:4000/api/v1/health` → `{"status":"ok",...}`.
2. **Auth works:**
   ```bash
   curl -s -X POST http://localhost:4000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"rajesh.kumar@example.com","password":"password123"}'
   ```
   → returns a `token` and `user`.
3. **Auth is enforced:** `curl -i http://localhost:4000/api/v1/files` (no token) → **401**.
4. **App lists real data:** open **http://localhost:3000/all-files** → shows 4 files with numbers **ADMIN/2024/001, ACC/2024/015, ADMIN/2024/002, LEGAL/2024/001** and statuses from the database (not the old mock).
5. **No console errors** on that page (DevTools → Console).

## Notes / limitations
- No login UI yet (dev-login bootstrap stands in until slice 1.10).
- Statuses are strings on SQLite; they become Postgres enums later.
