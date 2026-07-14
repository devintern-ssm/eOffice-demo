# 05 — Next Steps & Phases

Ordered roughly by value/urgency. Nothing here is started; Phase 1 is the baseline.

## A. Suggested first tasks for the *next* session (small, high-value)

1. **Push & PR** (user does this): `git push -u origin feat/eoffice-phase1-nc-workflow`, then open the compare link. Get Phase 1 into review.
2. **Add automated tests** — there are **none** yet. Start with backend API tests (Vitest + Supertest) over the workflow state machine and the authorization matrix (the security review showed how easy auth gaps are). Then a couple of Playwright E2E on create→forward→approve and the revert loop. This is the highest-leverage next investment.
3. **Wire remaining prototype dead spots** — the global search bar in the header (`Layout.jsx`) is still non-functional; decide its scope (cross-file search) or hide it.
4. **Section/role edit-rights polish** — confirm the exact granularity with the client (currently holder/author + confidential gating); tighten if needed.

## B. Productionization (before real users)

| Item | Why | Notes |
|------|-----|-------|
| **Switch to PostgreSQL** | SQLite is dev-only | Change `DATABASE_URL`; convert `String` status/role fields to **native Prisma enums**; re-generate migrations. Prisma makes this mostly mechanical. |
| **Real auth hardening** | Dev JWT secret + open `/register` | Move `JWT_SECRET` to a secret manager; lock `/auth/register` to ADMIN; add refresh-token rotation + logout invalidation; rate-limit login. |
| **SSO / Active Directory** | Gov/PSU environments often require it | The client chose local JWT for Phase 1 but asked to keep the door open. Auth is behind a thin layer — add an AD/LDAP/OIDC adapter. |
| **Server-rendered binary PDF** | Print is browser HTML today | Add Puppeteer or pdfkit to render the two print views to real PDFs (with true page-range), if a one-click PDF is required (Rasika asked for page-range + summary). |
| **File storage → cloud** | Local disk won't scale | The `StorageProvider` interface already isolates this — implement an S3/Azure provider. |
| **CI/CD + linting** | None exists | Add ESLint/Prettier, `tsc --noEmit` + `npm run build` + tests in CI, and a deploy pipeline. |
| **Observability** | No logging/metrics | Structured request logging, error tracking, and an audit-log retention policy. |
| **Confidential storage** | Restricted files on plain disk | Encrypt at rest and tighten the access model per the client's final rule. |

## C. Phase 2 backlog (deferred by client decision — see `docs/08` §E)

| # | Feature | Notes |
|---|---------|-------|
| 1 | **Multi-format attachments** (Word/Excel/JPG…) + in-app preview/download | Phase 1 is PDF-only. Extend `correspondence` upload validation + a viewer; virus-scan on upload. |
| 2 | **Inbuilt DMS + old-file retrieval / versioning** | A document store over the `StorageProvider`; retrieval of closed/archived files. |
| 3 | **Confidential temp-file split & merge** | For a file needed in two activities at once (SOW §7) — create temp files, merge back preserving page continuity. |
| 4 | **PKI / DSC certificate signatures** | Legally-binding digital signatures (pending the client's legal-weight confirmation). Replaces typed-name attestation where required. |
| 5 | **Page-level linking inside documents** ("C/36 on page 5") | Deep-link a `C/n` reference to a page in the attached PDF viewer; needs a page anchor on references. |
| 6 | **Live email-mailbox integration** | Phase 1 already attaches an email *as* correspondence (manual). Phase 2 = live mailbox sync / ingestion. |
| 7 | **Notifications** | In-app / email / (maybe) SMS on assignment, revert, approval, overdue. Not in the SOW but expected. |

## D. Out of scope (do NOT build unless the client reverses)

- **Mobile app** — dropped entirely by the client.
- **Org-wide / cross-org file tracking + reports** — owned by the separate (physical/manual) File Tracking process; this app only owns the N-C file/noting/approval workflow. Our `Reports` page is per-file/audit-log scoped, which is correct.

## E. Known limitations to revisit (from the phase docs & review)

- **Print** is printable HTML, not a binary PDF (see B).
- **Section-level edit rights** are coarse (holder/author + confidential); confirm finer rules if the client wants per-field control.
- **`/register` is open** in dev — lock it down.
- **Overdue/SLA** concept was removed (was meaningless against fixed dates); define real SLAs if a "pending too long" view is wanted.
- **File-number gaps** are possible if a submit transaction fails after allocation (mitigated by validating recipients first; acceptable per domain, but note it).

## F. How to verify any change you make

- Backend: `cd server && npx tsc --noEmit` (types) + re-run the relevant curl smoke tests (patterns are throughout the git history / phase docs). Reset data with `npm run seed`.
- Frontend: `npm run build` (catches import/syntax errors) + click through the affected screen (log in via a quick-login button).
- For workflow/auth changes, **test the unauthorized path** (expect 403), not just the happy path — that's where bugs hid last time.
- Consider an adversarial review pass (a Workflow of parallel reviewers + verify) for any large or security-sensitive change; it found 20 real bugs last time.
