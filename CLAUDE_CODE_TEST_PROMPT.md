# Claude Code — Full-Stack Pre-Demo QA & Hardening Pass (eOffice N‑C File System)

> Paste this whole file as your instruction to Claude Code, run from the `demo/` directory of the repo.

## 0. Role & mission

You are a **senior full-stack QA + fix engineer**. There is a **client demo tomorrow** and the client can and will click **anything**. Test this application **end-to-end like an adversarial "mad tester."**

The bar is not "does the code do what the code does." The bar is **"does it do what it is *supposed* to do."** Judge every behaviour against the **intent captured in the spec/requirement docs in this repo** (listed in §3). When observed behaviour and documented intent disagree, that is a **bug** — even if the code runs without error. When a button "works" but produces the wrong domain outcome (wrong status, wrong holder, wrong visibility), that is a bug.

For every flow: **run the happy path first** (the exact thing the client wants to see), confirm it, **then go deep** — negative inputs, permission boundaries, state-machine violations, concurrency, limits, and weird input — until you've genuinely tried to break it.

You must produce three things (exact formats in §9):
1. **A severity-ranked bug report** with reproduction steps, expected-vs-actual (citing the spec), and screenshots.
2. **Solutions** — apply safe, targeted fixes on a branch; for risky changes, provide the diff/plan instead of applying.
3. **Client questions** — *only* where the intended behaviour is genuinely ambiguous in the specs (don't invent questions to pad the list).

---

## 1. What the app is (domain context)

eOffice is a digital **Noting–Correspondence (N‑C) file movement system** (government-style file workflow). A file has two sides shown in a two-pane view:
- **Noting side** — sequentially numbered notes/opinions written by officers.
- **Correspondence side** — attached documents (PDF/Word/image) and email references.

Files move **Maker → Checker → Approver** (with an optional **MD** and a separate **Admin**), with revert loops, cross-department transfers, printing, and in-app notifications. The whole point is that the **workflow, permissions, and audit trail are correct** — that's what the client is buying.

---

## 2. Stack, layout & how to run it

- **Frontend:** React 18 + Vite + React Router → `http://localhost:3000`. JWT stored in `localStorage` under key `eoffice_token`. API base is `/api/v1` (Vite proxies `/api` → backend).
- **Backend:** Express + Prisma (SQLite `dev.db`) + JWT + bcrypt + multer (uploads) + pdf-lib (print) + zod (validation) → `http://localhost:4000`.
- **App root for Claude Code:** the `demo/` directory (has `package.json`, `.git`, `src/`, `server/`).
- **Existing tests:** backend **Vitest + Supertest** in `demo/server/test/` (~65 tests: `auth`, `workflow`, `e2e`, `print`, `notifications`, `departments`, `users-admin`, `round2`, `bugfixes`). **There is NO frontend E2E** — you will build it.

### Setup (get a green baseline before testing)

```bash
# --- Backend ---
cd demo/server
npm install
cp .env.example .env               # DATABASE_URL=file:./dev.db, PORT=4000, JWT_SECRET=dev-only-change-me
npm run db:reset                   # applies migrations AND seeds (prisma migrate reset --force)
npm run dev                        # serves API on :4000  (leave running)

# --- Frontend (new terminal) ---
cd demo
npm install
npm run dev                        # serves UI on :3000  (leave running)

# --- Backend test suite (new terminal) ---
cd demo/server
npm test                           # vitest run — confirm the baseline is green first
```

### State hygiene (important — don't hand over a corrupted demo DB)

```bash
cd demo/server
cp prisma/dev.db prisma/dev.backup.db   # back up before destructive runs
npm run db:reset                        # restore a clean, seeded state between runs / when done
```

### Add Playwright MCP for the browser E2E

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

Use the Playwright MCP to drive Chromium against `http://localhost:3000`: log in as each role, click through flows, assert on the DOM, and **capture a screenshot for every bug**. Where a flow is stable and worth keeping, also **codify it as a Playwright spec** under `demo/e2e/` so it's repeatable after fixes.

---

## 3. Source-of-truth docs (this is "supposed to")

Read these before testing and treat them as the intent you're validating against. Cite the specific doc + line when you file a bug or a question.

- `demo/docs/01_project_overview.md`, `02_screen_inventory.md`, `03_screen_flow_map.md`
- `demo/docs/04_inferred_data_model.md`, `05_role_permission_matrix.md` ← **the authorization matrix; test every cell**
- `demo/docs/06_sow_traceability_and_gaps.md`, `08_requirements_decisions.md`, `10_round2_review_changes.md`
- `demo/docs/07_open_questions.md` ← append genuinely-new ambiguities here
- Root: `REQUIREMENTS_CHECKLIST.md`, `DEMO_FEATURES.md`, `CLIENT_WALKTHROUGH_GUIDE.md`, `QUICK_DEMO_CHEATSHEET.md`, `FINAL_IMPLEMENTATION_STATUS.md`

---

## 4. Seed accounts (all passwords: `password123`)

| Email | Name | Role | Department |
|---|---|---|---|
| `rajesh.kumar@example.com` | Rajesh Kumar (Section Officer) | **MAKER** | Administration |
| `priya.sharma@example.com` | Priya Sharma (Deputy Director) | **CHECKER** | Administration |
| `amit.patel@example.com` | Amit Patel (Director) | **APPROVER** | Administration |
| `sneha.reddy@example.com` | Sneha Reddy (Accountant) | **MAKER** | Accounts |
| `vikram.singh@example.com` | Vikram Singh (Legal Advisor) | **MAKER** | Legal |
| `anjali.mehta@example.com` | Anjali Mehta (Audit Officer) | **CHECKER** | Audit |
| `md@example.com` | M. D. Rao (Managing Director) | **MD** | Administration |
| `admin@example.com` | System Admin | **ADMIN** | Administration |

Use the **cross-department** users (Sneha/Vikram/Anjali) to probe isolation and transfer, and the Administration trio (Rajesh→Priya→Amit) for the golden workflow.

---

## 5. Domain rules & invariants you must enforce (bugs = violations of these)

**File lifecycle:** `DRAFT → SUBMITTED → UNDER_REVIEW → (REVERTED) → APPROVED → ROUTED → RETURNED → CLOSED`
- A file gets its **official number only on submit** — a failed/invalid submit must **not** burn a number (stays `DRAFT`).
- `ROUTE` requires `APPROVED`; `RETURN` requires `ROUTED`; a `CLOSED` file is **immutable** (reject *all* mutations).
- Only the current **holder** can act on a file; acting **out of turn** or as a **non-assignee/non-holder** must be **403**.

**Note statuses:** `DRAFT → SUBMITTED → CHECKED → APPROVED`
- The **opening note is SUBMITTED, not DRAFT**.
- A **DRAFT note is private to its author** — no other user (including the holder) may see it until submitted.
- Only the **holder** may add a note; only the **author** may edit a **DRAFT or REVERTED** note; **SUBMITTED notes are immutable** unless the file is reverted.

**Roles:** `MAKER | CHECKER | APPROVER | MD | ADMIN`
- **ADMIN is a system/user manager and is locked out of file *content*** — no notes/correspondence view, and **403** on add-note, correspondence download, and print. Admin also manages users & departments and `/auth/register` is admin-only.

**Numbering & confidential:**
- File number = `DEPTCODE/YEAR/SEQ`; on **cross-department transfer** the number is **kept**, the section changes, and note numbering **continues**.
- **Confidential** files are hidden from uninvolved users and from **non-admins in reports**.

---

## 6. Flow-by-flow test checklist (the heart of the job)

For **each** flow: do the happy path, then work down the edge list. Confirm outcomes in **both the UI and the API/DB** — the UI hiding a button is not enough; the endpoint must still reject the action.

**A. Auth & session**
- Happy: log in as each role; token persists across refresh; `GET /auth/me`; logout clears session.
- Edges: wrong password → 401; no token → 401 + redirect to login; tampered/expired JWT → 401; deep-link to a protected route while logged out; `/auth/register` blocked for non-admins.

**B. Dashboard**
- Stat cards ("Pending my action", "Files I created", "Awaiting approval", "Overdue") show **counts that match reality** for the logged-in user; cards navigate correctly; recent-activity feed is accurate and per-role.

**C. Create file**
- Happy: number/section/subject/period/type (Regular/Confidential) + optional opening note + correspondence; opening note is **SUBMITTED**.
- Edges: empty/whitespace subject → rejected; missing required fields; **duplicate file number**; end date before start; a **bad recipient must not burn the number** (stays DRAFT); very long subject; unicode/emoji; **XSS payload** in subject/note (`<script>`, `"><img onerror>`), must be escaped not executed; double-click submit → no duplicate/second number.

**D. File lists (My Files, Inbox, Pending Approvals, Sent, All Files, Drafts)**
- Each list shows the **correct subset** for the current role; **Drafts** shows only *my* drafts; search by number/subject; status & section/UN-number filters; sort (e.g. last-used date); confidential hidden from uninvolved; empty states render.

**E. Two-pane File Detail (core screen)**
- Noting: add note (holder only), references to correspondence/prior notes, paragraph marks, **continuous note numbering**, maximise/expand, edit a **draft/reverted** note, and **draft privacy** (another user must not see my unsubmitted draft note).
- Correspondence: upload **PDF / Word / image** (multi-format) + **email reference**; download; **continuous page numbering across correspondence PDFs**; inward number/date/type shown.
- Admin lockout: as `admin`, the file opens but notes/correspondence are **stripped**, and add-note/download/print → **403**.

**F. Workflow / movement (test this hardest — it's the confusing part)**
- Happy: Rajesh creates → forwards to Priya (Checker) → Priya checks → forwards to Amit (Approver) → Amit approves → file `APPROVED`.
- Assign a **specific Checker/Approver to a note or paragraph**; verify only that assignee can act.
- **Revert / reject / return** loops back to the **same maker**; on resubmit the **same checker** receives it again; the reverted note becomes **editable** again.
- **Sequential multi-reviewer chain:** out-of-turn action → 403; a lone checker with no approver hands the file back to the maker (still under review).
- **Add/remove reviewer:** you **cannot remove the active (first-pending) step**.
- **Post-approval lifecycle:** route (needs APPROVED) → return (needs ROUTED) → close; a **closed file rejects every mutation**.
- **Cross-department transfer:** number kept, section changed, note numbering continues, movement logged; **non-holder transfer → 403**.
- **MD offline/scanned approval:** approve the current step by **uploading a PDF**.
- Everywhere: **non-holder / non-assignee acting → 403** (verify via API even if the UI hides the control).

**G. Paragraph approval & checker comments**
- Approving records the **approved paragraphs** on the latest note; comments after approval are **append-only**; **no comments on a closed file**.

**H. Print (custom note ranges)**
- Print all notes by default; a **custom note range**; last-note-only; **continuous pagination**; **admin → 403**. Open the generated PDF and confirm it actually contains the **selected notes** with correct page numbers.

**I. Notifications (bell)**
- Recipient is notified on **forward** (not the actor); maker is notified on **approval** and on **revert**; assign/comment notifications fire; unread count is right; "mark all read" works.

**J. Admin — Users & Departments**
- Users: list (with email + active flag); create a user who can then **log in**; deactivate; reset password; **cannot deactivate or demote own account**; `/register` admin-only.
- Departments: any signed-in user can list; **only admin can add**; a new file in a new department gets **that dept's code** in its number; **duplicate department name → 409**.

**K. Reports**
- All-files report includes **Submitted By + Department**; **hides confidential from non-admins**; filters behave; any export works.

**L. Global search (header)**
- Live search across files by number/subject/content; respects confidential/permission scoping; empty query and no-results states; keyboard navigation.

**M. Cross-cutting / non-functional**
- Refresh + deep-link **every** route; browser back/forward; unknown route → sensible 404/redirect; **double-click** any submit; **two-tab stale state** (act on a file another tab already moved) → graceful error, no corruption; **backend down** → UI shows a real error, not a blank/white screen; check the **browser console for errors/warnings** on each screen; date/timezone formatting; layout holds at the resolution you'll demo on.

---

## 7. Prioritization (demo is tomorrow)

Test in this order so the highest-blast-radius, most demo-critical paths are validated first, and **report any Blocker the moment you find it** rather than at the end:

1. Auth → 2. Create file → 3. Golden workflow (Maker→Checker→Approver→Approved) → 4. Revert loop → 5. Two-pane notes/correspondence + draft privacy → 6. Print → 7. Notifications → 8. Admin (users/departments) + admin content lockout → 9. Reports + global search → 10. Non-functional/cross-cutting.

---

## 8. Rules of engagement

- Work on a **branch** (e.g. `qa/pre-demo-hardening`); keep `demo/` runnable at every commit; reference bug IDs in commit messages.
- **Back up `dev.db` before destructive runs and `db:reset` back to a clean seeded state** when done — the demo must start from known data.
- **Never weaken security or validation just to make a test pass.** If a fix is risky or broad, describe it as a proposal with a diff instead of applying it.
- Prefer **minimal, targeted** fixes. Re-run the affected flow (UI + the Vitest suite) after each fix to confirm no regression.
- If truly blocked by ambiguity, record it as a client question (§9) and keep testing other flows — don't stall.

---

## 9. Deliverables (produce these exact artifacts)

**1. `TEST_REPORT.md`** (in `demo/`) containing:
- **Demo-readiness verdict:** `GO` / `GO-WITH-CAUTION` / `NOT-READY`, with a one-paragraph rationale.
- **Safe demo script:** the exact happy-path click sequence (accounts + steps) that is verified to work flawlessly.
- **Landmines:** specific actions to **avoid clicking live** tomorrow, and why.
- **Bug table:** `ID | Severity (Blocker/High/Medium/Low) | Flow | Steps to reproduce | Expected (cite spec doc) | Actual | Screenshot | Proposed fix | Status (Fixed/Proposed)`.
- **Test coverage summary:** what you exercised (flows × roles), plus the Vitest result before vs after.

**2. Fixes:** safe ones **applied on the branch** (commits tagged with bug IDs); risky ones left as **proposals with diffs** in the report. Re-run `npm test` and report green/red after fixes.

**3. `QUESTIONS_FOR_CLIENT.md`** (in `demo/`): only genuinely ambiguous intent items, each with the competing interpretations and your recommended default. Cross-reference `docs/07_open_questions.md`.

**4. Playwright specs** under `demo/e2e/` for the stable flows you automated, so this pass is repeatable.

---

### Definition of done
Every flow in §6 has been driven through its happy path **and** its edge list; every failure is in the bug table with a repro + screenshot + expected-vs-actual (citing intent) + a fix or proposal; the Vitest suite is green (or every red is explained); the DB is reset to a clean seeded state; and `TEST_REPORT.md` opens with a clear go/no-go verdict and a safe demo script.
