# 12 — Note-Centric Redesign (design + migration plan)

> Written 2026-07-14 after the "eye-opening demo" clarification. This is a **fundamental
> re-architecture**, not a patch: the unit of workflow moves from the *file* to the *note*.
> The current build (docs 01–11, all shipped code) is **file-centric** and must migrate.

---

## 1. Decisions locked with the client-side owner (this session)

| # | Decision | Locked answer |
|---|---|---|
| 1 | Unit of workflow | **The note.** Each note has its own maker + its own signature chain. The file is a permanent container. |
| 2 | Where a file rests when a note finalizes | **Back to that note's maker.** They start the next note or (rarely) close the file. |
| 3 | Correspondence numbering | **Page-level C-numbers.** 20-page attachment = C1…C20; next attachment = C21. Attachment shown as an expandable group; notes can cite one page (C3). |
| 4 | Reviewer actions | **Two actions only: Sign & forward / Send back.** One person can be checker+approver. Role labels become display-only. |

---

## 2. Target model (the mental model)

- **File = a permanent binder identified by a UN number.** It normally never closes.
  Two archetypes:
  - *Standing / register file* (e.g. Accounts bills `ACC/2026/003`): open forever; many
    people add notes and correspondence over years.
  - *Case file* (e.g. "buy 20 PCs"): one purpose; **may** be closed at the end, back at the
    maker — but closing is the exception.
- **A note is a mini approval process.** Its maker opens it; the whole file then physically
  travels signer-to-signer collecting signatures **for that note**; the last signer's sign
  finalizes ("ends") the note; the file returns to the note's maker.
- **Notes are strictly sequential** — one note in flight at a time. Note N must be finalized
  (or returned + re-finalized) before Note N+1 is opened.
- **Every signer does one of two things:** *Sign & forward* (pass to the next signer, or —
  if last — finalize) or *Send back* (return to the note's maker for correction).
- **Correspondence is numbered per page.** An attachment is stored as one unit but occupies a
  contiguous run of C-numbers (C1…C20); the next attachment continues (C21…). A note can
  reference a single page ("refer C3").
- **The noting side is paginated too.** A multi-page note occupies a contiguous run of
  noting-side page numbers; the next note continues.
- **Print is per note:** each note prints with every person who signed *that* note.

---

## 3. Assumptions I'm defaulting to (correct any — none are blocking)

| A | Assumption | Why |
|---|---|---|
| A1 | **Single holder, always.** The file always has exactly one current holder. At rest that's the last note's maker (or, before any note, the creator). | Keeps the "who can act" rule unambiguous; matches decision #2. |
| A2 | **Idle-file handover.** To let someone *else* raise the next note (shared bills file), the current holder hands the idle file over (a lightweight transfer). | Decision #2 sends the file to the maker; a shared file still needs a way to pass it on. |
| A3 | **Correspondence can be added by the current holder at any time** — whether a note is in flight or the file is at rest. Adding correspondence does **not** start a note. | Matches physical reality: whoever holds the file can attach paper. |
| A4 | **Noting page numbers are computed at render/print time**, not stored as fake "pages." Finalized notes are immutable, so their page spans are stable; new notes append. | Digital notes are text, not scanned pages; pagination is a layout concern. |
| A5 | **Keep a rare `Close`** available to the file creator / last note's maker when no note is in flight. File status collapses to **OPEN \| CLOSED**. | Case files still need an end state; standing files just never use it. |
| A6 | **UN number is assigned when the file is created** (the binder is real immediately). The first note may still be a DRAFT inside it. | A binder without a number is odd; but see Open Question O1 — this changes the current "number on submit" demo beat. |
| A7 | **A note's signer chain may cross departments** (maker's head → Accounts reviewer → payment). Signers are just people; `section` on the file tracks current physical location. | The procurement example routes through Accounts and back. |
| A8 | **Paragraph-level approvals fold into the note chain.** The note chain *is* the per-note approver list. Paragraph marks survive only as optional labels. | Removes a redundant concept; the earlier "per-note approver" ask is now the default. |

---

## 4. Data-model changes (Prisma)

### File
- `status`: reduce to `OPEN | CLOSED` (drop `SUBMITTED|UNDER_REVIEW|REVERTED|APPROVED|ROUTED|RETURNED`).
- `displayNumber` (UN): assign at **create** (per A6).
- `currentHolderId`: stays — the always-present single holder.
- Keep `closeDate/closeReason/successorFileId`, `confidential`, `section` (current location).

### Note  *(gains its own lifecycle — this is the linchpin)*
- `authorId/authorName` = the **note's maker** (already exists; semantics sharpen).
- `status`: `DRAFT → IN_REVIEW → (RETURNED ↔ IN_REVIEW) → FINALIZED`
  (rename of today's DRAFT/SUBMITTED/CHECKED/APPROVED).
- `finalizedAt DateTime?`.
- Noting page span **computed** (A4); optionally frozen at finalize later if needed.

### NoteStep  *(was `WorkflowStep`, repointed from file → note)*
- `noteId` (replaces `fileId`), `stepOrder`.
- `signerId/signerName`, `roleLabel` (display-only), `dept?`, `signatureName?`.
- `status`: `PENDING | SIGNED | RETURNED`.
- `remarks?`, `actedAt?`.
- One "active" step per note = first `PENDING`; that signer holds the file.

### Correspondence  *(mostly DTO/derivation, minimal DB change)*
- Keep the attachment row + `pageCount`. Keep an internal attachment index for ordering.
- **Derive** each attachment's C-range at read time: `firstC = 1 + Σ(prior pageCounts)`,
  `lastC = firstC + pageCount − 1`. Display the attachment as **C{firstC}–C{lastC}**.
- The old per-attachment `"C/1"` label is superseded by the page range.

### NoteReference
- `targetRef` may now be a page-level C-number (`"C3"`), resolved to
  `(attachment where firstC ≤ 3 ≤ lastC, pageWithinAttachment = 3 − firstC + 1)`.

### Removed / demoted
- File-level `WorkflowStep` (becomes `NoteStep`).
- Lifecycle `routeToDept / returnToMaker` (post-approval routing) — collapses into the note
  chain + "return to maker on finalize." `transferFile` survives as the A2 handover.

---

## 5. Workflow engine (new — replaces `workflow.service.ts` file-level engine)

```
openNote(fileId, maker)        # holder-only, no note in flight → creates DRAFT note, maker = actor
submitNote(noteId, signers[])  # DRAFT → IN_REVIEW; builds NoteStep chain; holder = first signer
signNote(noteId, remarks)      # active signer signs → next signer, or FINALIZE if last
returnNote(noteId, remarks)    # active signer sends back → note RETURNED, holder = note maker
finalize (implicit on last sign): note FINALIZED, holder = note maker, file rests OPEN
addSigner(noteId, user)        # mid-flight chain edit (like today's addReviewer)
handover(fileId, toUser)       # A2: pass an idle file to someone else to raise the next note
closeFile(fileId, reason)      # A5: rare, only when no note in flight
```

**Invariants**
- At most one note with `status ∈ {IN_REVIEW, RETURNED}` per file (sequential rule).
- `openNote`/`addCorrespondence`/`handover` require `currentHolderId == actor`.
- `signNote`/`returnNote` require actor == the active `NoteStep.signerId` (== holder).

---

## 6. Correspondence — page-level C-numbers

- Upload flow unchanged (attachment + counted pages).
- File-detail DTO returns, per attachment: `firstC`, `lastC`, `pageCount`, and a `pages[]`
  list so the UI can render an **expandable group** — collapsed shows "C1–C20 · Quotation",
  expanded lists C1…C20, each opening the PDF (ideally to that page).
- Reference resolution maps `"C3"` → attachment + inner page for the inline viewer.

---

## 7. Noting pagination + print

- **On-screen:** each note shows its running page span, e.g. *"Note 5 · pp. 12–14"*,
  computed cumulatively over prior (finalized) notes (A4).
- **Print (per note):** the noting PDF lists, under each note, **every signer of that note**
  (name, role label, dept, date, remark) — the note's own signature block — instead of one
  file-wide approval-summary table. Noting and correspondence still print as two PDFs.

---

## 8. Frontend changes

- **FileDetail:** header shows **OPEN/CLOSED + current holder**; a banner when a note is in
  flight ("Note 6 is under signature with …"). `Add Note` is enabled only for the holder when
  no note is in flight.
- **AddNoteModal → "Open Note":** you become the note's maker; pick an ordered **signer
  chain**; on submit the file moves to the first signer. Drops the check/approve role pickers
  (roles become optional display labels).
- **Review action → Sign / Send back:** two buttons for the active signer.
- **Correspondence side:** expandable attachment groups with C-page numbers; clicking a page
  opens the PDF. Note references render as clickable page links.
- **Handover control** for idle files (A2). **Close** demoted to a rare action (A5).

---

## 9. Migration & phasing

Each phase is a shippable checkpoint; the app keeps building between phases.

- **Phase 0 — Schema & derivations.** New Prisma models (Note lifecycle, NoteStep,
  correspondence C-range derivation, File OPEN/CLOSED). Migration + regenerate.
- **Phase 1 — Note-centric engine.** `openNote/submitNote/signNote/returnNote/finalize/
  addSigner/handover`; single-in-flight + holder invariants. Rewrite `workflow.service.ts`,
  fold in `lifecycle.service.ts`.
- **Phase 2 — Page-level correspondence.** DTO C-ranges, expandable groups, page-level
  references + inline viewer paging.
- **Phase 3 — Noting pagination + per-note print.**
- **Phase 4 — Frontend** (FileDetail, Open-Note modal, Sign/Send-back, correspondence groups,
  handover/close).
- **Phase 5 — Seed + tests + runbook** rewritten to the note-centric model (`seed.demo.ts`,
  the Vitest suite, `DEMO_RUNBOOK.md`, `DEMO_GUIDE.md`).

---

## 10. Open questions (non-blocking — I'll default per §3 unless you say otherwise)

- **O1 — UN number timing:** assign at file *create* (A6, cleaner) or keep the current
  "number on first submit" demo beat? Affects the runbook.
- **O2 — Handover reach:** can a holder hand an idle file to *anyone*, or only within the
  file's current department?
- **O3 — Correspondence during a note:** allowed for the active signer too, or only when the
  file is at rest with its holder? (A3 says any holder, incl. active signer.)
- **O4 — Can a returned note's chain be re-picked** by the maker on resubmit, or does it
  resume the same chain from the start?
- **O5 — Does closing a case file require all notes finalized** (no dangling drafts)? (Assumed yes.)
```
