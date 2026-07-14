# 02 — Architecture

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | **React 18 + Vite**, react-router-dom v6, react-icons | The original prototype, now wired to the API. Dev server proxies `/api` → `:4000`. |
| Backend | **Node + Express + TypeScript** (ESM, run via `tsx`) | `.js` extensions on relative imports (ESM/TS convention). |
| ORM / DB | **Prisma** + **SQLite** (dev) | Postgres-ready: switch `DATABASE_URL`. **SQLite has no Prisma enums** → status/role fields are `String`, validated with **zod** in the app layer. |
| Auth | **JWT (jsonwebtoken) + bcryptjs** | Token in `localStorage`, sent as `Authorization: Bearer`. RBAC middleware. |
| Validation | **zod** | Request bodies + domain value sets. |
| File storage | **local disk** behind a `StorageProvider` interface | PDF uploads under `server/uploads/` (gitignored). Swap to S3/Azure for the Phase-2 DMS without touching call sites. |
| PDF/print | **server-rendered HTML** print views | `GET /files/:id/print` returns a styled, self-contained HTML page (Print→Save-as-PDF). Not a binary PDF yet. |

## Repo layout

```
D:\Sahasrara\eOffice\demo\
├─ src/                      # React app (Vite) — the frontend
│  ├─ api/                   # typed fetch client per resource (client, auth, files, notes,
│  │                         #   correspondence, workflow, lifecycle, approvals, reports, print, users)
│  ├─ auth/AuthContext.jsx   # login state; wraps the app, gates on auth
│  ├─ components/            # Layout, modals (AddNote, AddCorrespondence, Forward, Review, ActionModal)
│  ├─ pages/                 # Dashboard, MyFiles, Inbox, PendingApprovals, SentFiles, AllFiles,
│  │                         #   FileDetail, CreateFile, Reports, Login
│  ├─ utils/status.js        # status labels + colors (the workflow enum)
│  └─ data/dummyData.js      # LEGACY — only a static `sections` list is still imported
├─ server/                   # backend API
│  ├─ prisma/
│  │  ├─ schema.prisma       # the data model (10 models)
│  │  ├─ migrations/         # committed
│  │  └─ seed.ts             # 8 users + 4 files (fixed user IDs!)
│  ├─ src/
│  │  ├─ app.ts, server.ts   # express app + listen
│  │  ├─ config.ts, prisma.ts
│  │  ├─ middleware/         # auth.ts (authenticate/requireRole), error.ts
│  │  ├─ services/           # numbering.ts (DEPT/YEAR/SEQ), storage.ts (StorageProvider)
│  │  ├─ utils/              # http.ts (ApiError, asyncHandler), domain.ts (enums/sections/codes)
│  │  └─ modules/            # feature modules: auth, users, files, notes, correspondence,
│  │                         #   workflow, lifecycle, approvals, reports, print
│  ├─ .env / .env.example    # DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN, UPLOAD_DIR
│  └─ uploads/               # stored PDFs (gitignored)
├─ docs/                     # discovery (01-07), decisions (08), plan (09), phases/, handoff/
└─ .claude/launch.json       # preview launcher config
```

Each backend **module** is `X.routes.ts` (Express router + zod validation) + `X.service.ts` (business logic + Prisma). Routers for file-scoped resources use `Router({ mergeParams: true })` and are mounted under `/files/:id/...`.

## Data model (Prisma — 10 models)

- **User** — id, name, designation, section, role (`MAKER|CHECKER|APPROVER|MD|ADMIN`), email, passwordHash.
- **File** — id (uuid PK), `displayNumber` (`DEPT/YEAR/SEQ`, assigned on submit), `customFileNumber?`, subject, section, status, priority, confidential, start/end period, createdById, **currentHolderId** (the single-holder lock), closeDate/closeReason/**successorFileId** (closure), lastUsedAt.
- **Note** — fileId, noteNumber (per-file seq), content, authorId/authorName/authorRole, status (`DRAFT|SUBMITTED|CHECKED|APPROVED`), isSuoMoto. Children: **NoteReference** (C/n or Note n), **ParagraphApproval** (mark A/B…), **CheckerComment** (post-approval comments).
- **Correspondence** — fileId, number (C/n), type, title, inwardDate?/inwardNumber? (optional), storageKey (disk), mime, uploadedBy.
- **WorkflowStep** — fileId, **stepOrder** (sequential), assigneeId/assigneeName, roleAtStep (`CHECKER|APPROVER|MD`), status (`PENDING|CHECKED|APPROVED|REVERTED|SKIPPED`), remarks, dept, signatureName, actedAt. **This is the modifiable recipient chain.**
- **Movement** — append-only audit log: fileId, type (`CREATE|SUBMIT|FORWARD|CHECK|APPROVE|REVERT|RETURN|ROUTE|TRANSFER|CLOSE|UPLOAD|NOTE_ADDED|SIGN`), actorId/actorName, from/to (denormalized names), dept, remarks, createdAt.
- **NumberSequence** — per (deptCode, year) counter for `DEPT/YEAR/SEQ` allocation.

Full field-level shape: `docs/04_inferred_data_model.md` (inferred model) + `server/prisma/schema.prisma` (authoritative).

## Workflow state machine (the heart of the app)

```
DRAFT ──forward──▶ UNDER_REVIEW ──check (×n)──▶ … ──approve(last)──▶ APPROVED
  ▲                    │                                                │
  │                    └──revert/reject/clarify──▶ REVERTED ──forward──▶┘ (resubmit)
  │                                                    │
  └────────────────────────────────────────────────── (back to originator)
APPROVED ──route──▶ ROUTED ──return──▶ RETURNED ──close──▶ CLOSED
(TRANSFER is a movement, not a state — the file keeps its number, section changes)
```

**Invariants** (enforced after the security review):
- Exactly **one holder** at a time (`File.currentHolderId`). It is the source of truth for "who can act."
- To act on a step, the user must be **both** the current step's assignee **and** the current holder (or ADMIN).
- The **active** (lowest-order PENDING) step cannot be removed.
- Numbers are allocated **before** the transaction that writes them (SQLite can't nest interactive transactions), and recipients are validated first so a bad request doesn't burn a number.

## Request flow (example: a checker approves)

1. Browser: `POST /api/v1/files/:id/action { action:'approve', remarks, ... }` with the JWT.
2. Vite proxy → `:4000`. `authenticate` middleware sets `req.user` from the token.
3. `requireFileAccess` middleware runs `assertCanAccessFile` (confidential gate).
4. `workflow.routes.ts` validates the body (zod) → `workflow.service.actOnFile`.
5. Service checks holder+assignee, updates the step, writes a note for the remark, advances the chain (or sets APPROVED), writes a `Movement`, all in one `prisma.$transaction`.
6. Returns the full updated file detail → the UI refreshes in place.
