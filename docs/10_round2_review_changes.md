# 10 — Round 2: Review Feedback Build + New Answers

Date: 2026-07-07. Inputs: `eOffice_Requirements_Questionnaire (002).docx` (a fuller answer set) + 8 review points from the client's hands-on test of the Phase-1 demo. This doc records what changed and what still needs the client.

## A. The 8 review points — all implemented & verified

| # | Review point | What was built | Verified |
|---|--------------|----------------|----------|
| 1 | While **creating a note**, provide options to assign **Maker and Checker** | `AddNoteModal` gained an "Assign roles" block (Maker dropdown + Checker multi-select). On **Submit**, the file is forwarded to the chosen checkers; a different Maker reassigns the responsible holder. New endpoint `POST /files/:id/assign-maker`. | Smoke ✓ (holder reassigned) + UI |
| 2 | For **existing notes**, assign **Maker, Checker, and Para-wise Approver** | New `AssignRolesModal` (opened by an **Assign Roles** action) with all three. Para-wise approver is a new endpoint `POST /files/:id/notes/:noteId/assign-approver` creating a **PENDING** paragraph assignment that resolves to APPROVED when that person approves. | Smoke ✓ (para pending→assigned) + UI |
| 3 | Clicking a reference (e.g. **C/1**) in Notes should **open** that document on the Correspondence side | Clicking a `C/n` link (or the card's **Open** button) now renders the attachment **inline in an iframe** at the top of the Correspondence pane (PDF/image inline; Office docs offer "open in new tab"), in addition to scroll+highlight. | UI ✓ (iframe blob) |
| 4 | **Admin** should NOT view the Notes and Correspondence modules | ADMIN is now a pure **oversight (super-admin)** role: reduced nav (Dashboard / All Files / Reports), file detail **strips** notes & correspondence (`contentRestricted`), and the notes/correspondence/print endpoints **403** for admins. | Smoke ✓ (403 ×3, stripped) + UI |
| 5 | **Super-admin report** should list **all files** with **Submitted By** + **Department** | Reports page gained an **All Files** register tab (File Number, Subject, **Department**, Status, **Submitted By**, Current Holder, Created). CSV export honours the active tab. | Smoke ✓ (fields + CSV header) + UI |
| 6 | Support **additional file formats** (not just PDF) | Correspondence upload now accepts **PDF, Word (doc/docx), Excel (xls/xlsx), images (jpg/png/tif)** via a server allowlist; original filename + mime are stored; unsupported types are rejected. Limit raised to 20 MB. | Smoke ✓ (docx accepted, exe rejected) |
| 7 | Multi-page PDF page numbers should **continue sequentially** across attachments | Each attachment stores its `pageCount` (real PDF page count via `pdf-lib`; 1 for non-PDF). File detail + print compute a **running page range** per `C/n` (C/1 = p.1–3, C/2 = p.4–…). | Smoke ✓ (C/1 1–3, C/2 @4) + UI |
| 8 | **Draft** notes should be shown (sidebar) | New **Drafts** nav page (my DRAFT files + files with my draft notes, `?draft=true`), a **Drafts** panel in the file's left pane, and a **DRAFT** badge on draft note cards. | Smoke ✓ (filter) + UI |

Plus **C8 (on-screen layout):** the Noting and Correspondence panes are now **side-by-side** with a **maximise/restore** toggle on each (was stacked top/bottom).

### How it was verified
- Backend: 16/16 assertions in a live smoke test (`scratchpad/smoke.mjs`) — multi-format, paging, admin lockout (detail strip + 3× 403), files register + CSV, drafts filter, assign-maker, assign-para-approver.
- Frontend: `npm run build` passes; browser preview confirmed side-by-side layout, inline PDF preview, Drafts nav, admin restricted view, Reports "All Files" tab, and the Assign Roles modal.

## B. New / changed client answers (from the 002 questionnaire) worth acting on

- **D03 — File Tracking reversal (important):** "The file tracking server is **obsolete and will be removed**. The functionality however will be needed for you to move the files." → File **movement/tracking now belongs in THIS app** (previously treated as an external physical process). Our route / return / transfer / movement-history features already cover this; **§F.2 of `08_requirements_decisions.md` is now superseded** on this point.
- **C8 — on-screen preview:** "Side by side with facility to maximise any side." (Built.) Print keeps Noting and Correspondence as **separate** sets.
- **C22 vs review #6 — attachments:** the doc still says "Phase 1 supports only PDF / Please discuss," but the **test feedback explicitly asked for multi-format**, so multi-format was moved into Phase 1. (Flag for confirmation.)
- **Suo-moto (Part 3):** "correspondence can be added without noting… There are **no arbitrary additions on noting side**." → notes are always workflow-bound; correspondence can stand alone (already supported). The current **"Suo-moto note" toggle may be conceptually wrong** and is a candidate for removal — see §C.
- **C19 — signatures:** PKI not needed in Phase 1, "however **some people are expected to make digital signatures**." Keep the door open (still deferred).
- **C21 — email approval:** valid when a head is on leave; since the product is on cloud, the head can approve from the cloud. (Our email-as-correspondence + MD offline-scan cover the interim.)
- **File closure (Part 3):** "not required for most digital files unless there is heavy volume." → closure is **low priority** for digital files (already built, just de-emphasised).
- **C15:** usually strict sequential, but "**in a few cases, all signatories are permitted to approve and add comments in random order**." → a future **parallel/any-order approval mode** may be needed (not built).

## C. Still needs the client (answers that said "discuss")

1. **Attachments (C22):** confirm multi-format is wanted in Phase 1 (we built it on the strength of review #6). Confirm the allowed format list.
2. **Suo-moto:** confirm notes are *never* free-standing (always tied to a workflow). If so, we should **remove the "Suo-moto note" toggle**.
3. **C13 forward vs transfer:** the client says these are different activities and "draft notes travel" needs re-discussion. Confirm whether draft notes should be **hidden from other holders** (today a draft note is stored on the file and visible to whoever holds it).
4. **C17 "check":** the client wants to align on what *Check* means vs *Approve*.
5. **C15 random-order approval:** confirm whether a parallel / any-order signatory mode is required (currently strictly sequential).
6. **D04/D06 handwritten notes** + **C5 sample PDF** (Rasika ma'am): awaiting the promised photo/sample to finalise print formatting.

## D. Schema / API deltas this round
- **Correspondence** gained `originalName`, `pageCount`. **ParagraphApproval** gained `status`, `assignedToId/Name` and made `approvedById/Name` nullable (assignment before approval). Migration `20260706192612_multiformat_and_para_assignment`.
- New endpoints: `POST /files/:id/assign-maker`, `POST /files/:id/notes/:noteId/assign-approver`; `GET /reports` now also returns a `files` register; `GET /reports/export?type=files`; `GET /files?draft=true`.
- New dependency: **`pdf-lib`** (server) for PDF page counting.

## E. Round-3 — client answers received (2026-07-07) + demo-bug fixes

**Answers applied (see `Questions_for_client_2026-07.txt`):**
- **A1 Suo-moto → REMOVED.** Notes are always workflow-bound; the "Suo-moto note" toggle is gone from the Add-Note screen.
- **A2 Draft privacy → BUILT.** A draft note is now visible only to its author (hidden from other holders) until submitted; a **Submit** action promotes it to a normal note. Draft label kept in the sidebar/card.
- **A5 Attachments → ALL formats in Phase 1.** The format allowlist was removed; any file uploads (PDFs still get automatic page counting; others count as one item). 25 MB cap.
- **B6 Admin scope → confirmed.** Admin manages user accounts only (create/update/activate/reset/roles), no Noting/Correspondence access — already built (admin user management + content lockout).
- **A6 Print page-range = BOTH note-number and physical-page** — *not yet built* (next).
- **A4 Approval order = any-order mode wanted** — *not yet built* (next; needs a per-file mode + quorum design).

**Demo bugs checked & fixed (client's teammate list):**
1. Draft note had no way to submit → **Submit** action added (card + Drafts sidebar); endpoint `POST /files/:id/notes/:noteId/submit`.
2. Only "Checker(s)" shown, no Approver/MD → Add-Note & Assign-Roles now let you pick **each reviewer's role** (Checker / Approver / MD) explicitly.
3. Para-wise approvers only post-creation → **added to the Add-Note screen** (assigned right after the note is created).
4. Image upload/display failed → backend already accepted images; **all formats now accepted (A5)** and images render inline via `<img>` (PDFs via iframe).
5. "Only the current file holder can add a note" surprise → the **Add Note button is now hidden for non-holders** with a clear hint (the 403 was correct; the UI shouldn't have offered it).
6. Initial note showed as a draft; dead "initial correspondence" widget → the **opening note is now SUBMITTED**, and the non-functional initial-correspondence upload was **removed** from Create File. (Per-note checker selection: the **para-wise approver** picker already targets a specific note; the reviewer chain remains file-level by design.)

Tests: full suite **34 passing** (added draft-privacy, submit-draft, initial-note, non-holder-add-note; multi-format test updated for all-formats).
