# eOffice N-C File System — Pre-Demo QA Test Report

**Date:** 2026-07-09 · **Branch:** `qa/pre-demo-hardening` · **Tester:** senior full-stack QA + fix engineer (adversarial pass)
**Build under test:** backend Express+Prisma(SQLite)+JWT on `:4000`, frontend React+Vite on `:3000`.
**Authoritative intent:** `docs/08_requirements_decisions.md` + `docs/10_round2_review_changes.md`.
> ⚠️ The root docs `REQUIREMENTS_CHECKLIST.md`, `DEMO_FEATURES.md`, `FINAL_IMPLEMENTATION_STATUS.md` describe the **old
> frontend-only prototype** and contradict the built system — they were **not** used as the intent baseline.

---

## 1. Demo-readiness verdict: ✅ **GO**

The product the client is buying — **the workflow, permissions, and audit trail** — is correct and robust. I ran
**130 adversarial API assertions across all 8 roles** plus the **65-test Vitest suite** and drove the UI happy path in a
browser. Every core invariant held: the file lifecycle state machine, holder-only / out-of-turn 403s, the revert loop,
cross-department transfer (number kept, note numbering continues), draft-note privacy, admin content lockout,
confidential gating, custom print ranges, and CLOSED-file immutability all behave as specified. I found **2 real defects**
(a whitespace-subject validation gap and a transfer-authorization gap) — **both are now fixed, committed, and
regression-verified**, with the Vitest suite still 65/65 green. The remaining open items are **design/scope questions**
(see `QUESTIONS_FOR_CLIENT.md`), not defects. The one caution: some File-Detail **action buttons are shown regardless of
file state**, so an out-of-state click produces a harmless error — follow the safe script below and avoid the landmines.

---

## 2. Safe demo script (verified click sequence)

> Start from a clean DB: `cd server && npm run db:reset`. All passwords `password123`. Use the **quick-login** buttons on the sign-in screen.

**Golden workflow (Administration trio) — this is the money shot, verified end-to-end:**
1. **Log in as Rajesh** (Maker) → Dashboard shows his stat cards.
2. **Create New File** → Subject e.g. *"Annual budget approval note"*, Section *Administration*, add an **opening note**. Save.
   → File opens in **DRAFT**; opening note shows as **SUBMITTED** (Note 1).
3. On the file, click **Forward File** → add **Priya (Checker)** then **Amit (Approver)** → Forward.
   → Status becomes **UNDER_REVIEW**; the official number **ADMIN/2026/NNN** is now assigned; holder = Priya.
4. **Log out → log in as Priya** → open the file from **Inbox** → **Review & Approve** → **Check** (add a remark).
   → Holder moves to Amit.
5. **Log out → log in as Amit** → open from **Inbox** → **Review & Approve** → **Approve** (optionally tick paragraph "A").
   → Status becomes **APPROVED**.
6. **Log in as Rajesh** → open the file → **Print…** → choose **Noting**, range **All** → the print view opens with the
   notes, header (number/dept/subject/date), footer page numbers, and an approval-summary table.

**Revert loop (shows the rework path):**
7. Create another file as Rajesh, forward to Priya; as **Priya → Review & Approve → Revert** with a remark.
   → File returns to Rajesh as **REVERTED** (Outward inbox); Rajesh can **edit the reverted note**, then **Forward** again → back to Priya.

**Cross-department transfer:**
8. As the current holder, **Transfer Dept** → pick *Legal* + **Vikram** → the **file number is unchanged**, section flips to
   Legal, note numbering continues, and the movement timeline logs the dept→dept hop.

**Admin oversight (content lockout):**
9. **Log in as Admin** → reduced nav (Dashboard / All Files / Reports). Open any file → **cover + movement history only**;
   the Noting/Correspondence panes are intentionally stripped. **Reports** shows the All-Files register with *Submitted By* + *Department*.

**Notifications & search:**
10. The **bell** (top-right) shows a live unread count; recipients are notified on forward/approve/revert. The **header search**
    finds files live by number or subject.

---

## 3. Landmines — do NOT click these live

| # | Action to avoid | Why it bites |
|---|---|---|
| L1 | **"Review & Approve" on a file that hasn't been forwarded yet** (still DRAFT/SUBMITTED) | The backend correctly rejects it (not `UNDER_REVIEW`), but the button is visible so it shows an error. Only review after forwarding, and only as the current holder. |
| L2 | **Acting out of turn** (e.g. logging in as Amit and approving before Priya has checked) | Correctly 403s (out-of-turn), but surfaces an error mid-demo. Follow the step order. |
| L3 | **"Close File" on a DRAFT/SUBMITTED file** | Closing is allowed from any non-closed status by design (abandon-a-file), so it will actually close it — don't accidentally close your demo file. |
| L4 | **"Transfer Dept" / "Add Note" as a user who isn't the current holder** | Correctly 403s (holder-only), but shows an error. Always act as the holder shown on the cover. |
| L5 | **Double-clicking Forward/Submit rapidly** | Safe (second call 400s — no duplicate number is burned), but avoid it on stage so no error toast appears. |
| L6 | **Admin trying to open notes/print** | Correctly 403 (oversight role). Don't demo file *content* from the Admin account. |

None of these corrupt data — they are guardrails firing. They are listed only so nothing surprising appears on screen.

---

## 4. Bug table

| ID | Severity | Flow | Steps to reproduce | Expected (intent) | Actual | Evidence | Proposed fix | Status |
|---|---|---|---|---|---|---|---|---|
| **BUG-1** | Medium | C. Create file | `POST /files` with `subject:"    "` (spaces only) | Empty/whitespace subject rejected (spec §6.C: "empty/whitespace subject → rejected") | `201 Created` — file created with a blank subject | API harness `C4` (was FAIL→now PASS); live re-check → 400 | `z.string().trim().min(1)` on create subject/section and add-note content (`files.routes.ts`, `notes.routes.ts`) | **Fixed** `1d379fa` |
| **BUG-2** | Medium | F. Workflow / transfer | Rajesh creates+submits, transfers to Vikram (now holder); Rajesh (no longer holder) calls `POST /files/:id/transfer` again | Only the current holder may act (spec §5: "acting as a non-holder must be 403") | `200 OK` — the stale originator moved a file he no longer held, to any dept, at any status | API harness `F30` (was FAIL→now PASS); `verify_bug2.mjs`: originator-as-holder 200 / non-holder 403 / holder 200 / admin 200 | Gate `transfer` to current holder or admin (originator still holds a DRAFT, so pre-review transfers unaffected) (`lifecycle.service.ts`) | **Fixed** `a26235d` |
| OBS-1 | Low | E. Correspondence | Code inspection | Attachments = all formats (spec A5, `10:54`) | Behaviour correct, but `isAllowedAttachment`/`ATTACHMENT_TYPES` (`utils/domain.ts`) is **dead code** — a leftover PDF-era allowlist that is never called | `grep` shows only `extForAttachment` is used | Remove `isAllowedAttachment` + the allowlist, or wire it to a documented policy | **Proposed** (cleanup) |
| OBS-2 | Low | F. Workflow | Rajesh forwards a file to **himself** as CHECKER, then Checks it | No documented rule; separation-of-duties unclear | Allowed — a user can check/approve their own file | API harness `SF1/SF2` | Client decision (see Q2); optionally block self-as-reviewer | **Proposed / client Q** |
| OBS-3 | Low | C. Create file | Create two files with the same `customFileNumber` | Ambiguous — custom number is an optional label | Duplicates allowed (no uniqueness check) | API harness `C8` | Client decision (see Q3) | **Proposed / client Q** |
| OBS-4 | Low | F. Lifecycle | `POST /files/:id/close` on a DRAFT/SUBMITTED file | Not specified | Allowed (only already-CLOSED is blocked) — likely intended "abandon file" | `closeFile` inspection | Confirm intended; else guard to APPROVED/ROUTED/RETURNED | **Observation** |
| OBS-5 | Low (UX) | E. File detail | Open any file as holder | Buttons should reflect available actions for the current state/role | All action buttons render regardless of state; out-of-state clicks 400/403 (backend safe) | UI snapshot of File Detail | Conditionally disable/hide buttons by status+holder (backend already enforces) | **Proposed** (UX polish) |
| OBS-6 | Info | B. Dashboard | Open Dashboard | — | Card set is *In My Inbox / Files I Created / Pending My Approval / Awaiting Approval* — coherent, but differs from the stale root-doc names and has no "Overdue" card | UI snapshot | None (root docs stale); confirm card set if the client expects "Overdue" | **Info** |

**No Blockers and no High-severity defects were found.**

---

## 5. Test coverage summary

### Automated backend suite (Vitest + Supertest)
- **Before fixes:** 9 files, **65/65 passing**.
- **After both fixes:** 9 files, **65/65 passing** (no regressions).

### Adversarial API harness (custom, all 8 roles) — `scratchpad/adv.mjs` + `adv2.mjs`
**130 assertions, 130 effective PASS** (the 6 initial "fails" resolved to: 1 real bug BUG-1 → fixed; 1 real bug BUG-2 → fixed; 4 were test-harness artifacts, re-verified correct). Flows exercised:

| Flow (spec §6) | Coverage | Result |
|---|---|---|
| A. Auth & session | login all 8 roles, `/auth/me`, wrong pw→401, no/tampered token→401, register admin-only→403/401 | ✅ |
| C. Create file | happy, opening-note SUBMITTED, empty→400, whitespace→**BUG-1**, missing section→400, XSS stored+escaped, unicode/long, custom-number, submit assigns DEPT/YEAR/SEQ, non-owner submit→403, double-submit→400 | ✅ (BUG-1 fixed) |
| F. Workflow / movement | golden path, out-of-turn→403, non-holder→403, revert loop + editable reverted note + non-author edit→403, resubmit→same checker, lone-checker→hands back to maker, add/remove reviewer (can't remove active step), route/return/close ordering guards, CLOSED immutable (7 mutations blocked), transfer keeps number + note numbering continues, non-holder transfer→**BUG-2**, MD scanned-PDF approval | ✅ (BUG-2 fixed) |
| E. Notes / draft privacy | holder-only add-note→403, opening note SUBMITTED, draft private to author (creator + other reviewer both blind), author submit, non-author submit→403, SUBMITTED immutable | ✅ |
| E. Admin lockout | contentRestricted=true, notes/corr stripped, add-note/print/corr-download→403 | ✅ |
| G. Paragraph approval & comments | approve records paragraphs, comment append-only, no comment on CLOSED | ✅ |
| H. Print | all notes, custom range (2–2), last-only — correct note selection each time | ✅ |
| I. Notifications | recipient (not actor) notified on forward, maker notified on approve/revert, mark-all-read→0 | ✅ |
| J. Admin users/depts | create user→can log in, deactivate→login blocked, reset pw, can't deactivate/demote self→400, non-admin blocked→403, dept list (any user), admin-add dept, dup name→409, new-dept file gets its code | ✅ |
| K. Reports | confidential hidden from uninvolved (list + direct GET→403 + report), admin sees all, CSV export | ✅ |
| L. Global search | by subject → results, no-match → empty | ✅ |
| B/D/M edges | bad recipient doesn't burn a number (stays DRAFT), empty-recipient forward→400, two-tab stale re-check→403 (state intact), involved reviewer accesses confidential, dangling note refs tolerated | ✅ |

### UI verification (browser, Preview MCP)
- Login (quick-login) → Dashboard: renders, stat counts self-consistent with API, **zero console errors** (only harmless React-Router v7 future-flag warnings).
- **All Files**: renders real `DEPT/YEAR/SEQ` numbers; stored `<script>` subject renders as **escaped literal text** — **no XSS execution** (confirmed no injected script node, no dialog).
- **File Detail**: full two-pane view (Cover + Movement + Noting + Correspondence + action bar) renders correctly.
- **Auth guard**: deep-link to `/all-files` with no token → redirected to the Sign-in screen.
- *Screenshots:* the Preview screenshot tool timed out repeatedly in this environment; DOM accessibility snapshots + console logs were used as evidence instead (a stronger check for text/structure than a JPEG).

### Repeatable specs
- Playwright specs authored under `e2e/` (`auth.spec.ts`, `workflow.spec.ts`, `helpers.ts`, `playwright.config.ts`, `README.md`) covering login/session/logout/deep-link, the golden workflow, out-of-turn 403, and XSS-escaping. See `e2e/README.md` to install & run.

---

## 6. Fixes applied (on `qa/pre-demo-hardening`)
- `1d379fa` — **BUG-1**: reject whitespace-only subject/section/note content.
- `a26235d` — **BUG-2**: restrict cross-dept transfer to the current holder (not a stale originator).

Both verified live and against the Vitest suite (65/65 green after each). No security or validation was weakened; BUG-2's
fix strengthens authorization. Lower-severity items (OBS-1/2/3/5) are left as **proposals** pending client answers rather
than applied, per the rules of engagement.

## 7. State hygiene
`server/prisma/dev.db` was backed up to `dev.backup.db` before testing, and the database is **reset to a clean seeded state**
(`npm run db:reset` — 8 users, 4 files) at the end of this pass so the demo starts from known data.

## 8. Open questions for the client
See **`QUESTIONS_FOR_CLIENT.md`** (10 genuinely-ambiguous intent items) and the appended section in
`docs/07_open_questions.md`. None block the demo.
