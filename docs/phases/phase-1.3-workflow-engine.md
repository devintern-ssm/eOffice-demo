# Phase 1.3 — Workflow Engine (the linchpin)

**Goal:** make the Maker–Checker–Approver flow real — a sequential, modifiable recipient chain with Check / Approve / Revert, holder-lock, the revert→resubmit loop, and a full audit trail.

## What was built

**Backend**
- `GET /users` — list users for recipient/reviewer selection.
- **Workflow module** (`server/src/modules/workflow/`):
  - `POST /files/:id/forward` — the originator routes a DRAFT/SUBMITTED/REVERTED file into the chain: assigns the `DEPT/YEAR/SEQ` number if needed, creates the ordered `WorkflowStep` list, sets the file **UNDER_REVIEW** and the holder to the first reviewer. Also used to **resubmit** after a revert (reactivates the reverted step).
  - `POST /files/:id/action` — act on the current step: **check** (→ next reviewer), **approve** (→ next, or **APPROVED** if last), **revert / reject / clarify** (→ back to the originator, status **REVERTED**). Records **date/time + department + typed signature** (H5/A2), writes the remark as a note on the noting side, and enforces that only the **current step's assignee** can act.
  - `POST /files/:id/steps` — **Add Reviewer** mid-flow (H13/C5); `DELETE /files/:id/steps/:stepId` — remove a pending reviewer.
- State machine: `DRAFT → (forward) → UNDER_REVIEW → (check ×n) → (approve) → APPROVED`, with `UNDER_REVIEW → (revert) → REVERTED → (resubmit) → UNDER_REVIEW`. One holder at a time; every transition writes an append-only `Movement`.

**Frontend**
- **Forward File modal** rewritten — pulls real users, section filter, ordered multi-select; adapts to **"Add Reviewer"** when the file is already under review.
- **Review & Approve modal** rewritten — **Check / Approve / Revert / Reject / Request Clarification**, remark, department, typed signature → real API. *(This also removes the old `FiUpload` crash.)*
- **File Detail** gained an **Approval Flow** panel showing the step chain with status, who acted, when, signature, remark, the **current** step marker, and a remove-✕ for pending reviewers.

## What you should test

This flow needs **multiple users**. Easiest path: act as the maker, then switch to the checker/approver (see the README for switching users; or open each user's **Pending Approvals**).

1. **Forward for review (as maker):** open a **DRAFT** or **SUBMITTED** file you hold → **Forward File** → pick a checker then an approver (order matters) → **Forward File**. The status becomes **UNDER REVIEW** and the **Approval Flow** panel shows the chain, first reviewer marked "● current".
2. **Check (as the checker):** as that checker (their **Pending Approvals** lists the file) → **Review & Approve** → **Check** + a remark → **Submit Review**. The step shows **CHECKED** with your name/date/signature, a note appears on the noting side, and the file advances to the next reviewer.
3. **Approve (as the approver):** **Review & Approve** → **Approve**. If it's the last step, the file becomes **APPROVED** (holder cleared).
4. **Wrong user is blocked:** try to Review a file where it isn't your step → you get "This step is not assigned to you" (403).
5. **Revert loop:** as a reviewer, **Revert** with a remark → the file goes **REVERTED** back to the originator; as the originator, **Forward File** again (no new recipients needed) → it re-enters review at the reverted step.
6. **Add Reviewer mid-flow:** on a file under review, **Forward File** now says **Add Reviewer** → add someone → they're appended to the chain.
7. **Remove a pending reviewer:** click the **✕** next to a pending (non-current) step in the Approval Flow panel.
8. **Signature attribution:** leave the signature field blank → it's stamped with your **account name** (not a hardcoded one).

## Notes / limitations
- **Still to come in 1.5:** MD offline scanned-approval upload, paragraph-level approval, and explicit comment-after-approval. (Basic remarks-as-notes already work.)
- No login screen yet, so the **"Author" label** in the Add Note modal shows the dev user; the **actual** author/actor is always taken from your auth token (correct in the data). Full user-switching + correct labels land in **1.10**.
- Leave **Department/Signature blank** in the review modal to have them auto-filled from your account; typing overrides them.
