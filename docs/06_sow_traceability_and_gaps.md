# 06 — SOW Traceability & Gap Analysis

**Project:** e-Office N-C File System (prototype)
**Scope of this document:** Map every SOW line item (S1–S21, incl. sub-items) and every handwritten annotation (H1–H20) to its status in the current prototype, with evidence, phasing, attribution, and conflicts. This is **discovery only** — no schema, no tech-stack, no implementation. Implementation urges are deferred to `07_open_questions.md`.

**Legend for source labels (used in Notes):**
`[OBSERVED]` = seen in prototype code (cited file:line) · `[SPECIFIED]` = SOW/DOCX · `[CLARIFIED]` = handwritten annotation (H#) · `[INFERRED]` = my reasonable assumption.

**Status definitions:**
- **Present** = the SOW intent is genuinely realized at runtime (even if only client-side / over mock data).
- **Partial** = some UI or data shape exists, but the feature is non-functional, label-only, stubbed (`alert('… Demo mode')`), or materially incomplete vs. the requirement.
- **Absent** = no code found.

---

## 1. Master Traceability Table

| ID | SOW / Annotation text (brief) | Status | Evidence | Phase | Requested by | Notes / Conflicts |
|----|-------------------------------|--------|----------|-------|--------------|-------------------|
| **S1** | UN-number-wise AND department-wise file display | **Partial** | `src/pages/AllFiles.jsx:13,14,22,23` (section filter hardcoded list; UN-number filter derived via Set, exact-match) | P1 | — | `[OBSERVED]` Dept (section) + UN filters both work on AllFiles only. No UN/dept *grouping*, just filtering. **Conflict:** see H1 — UN number is captured as a manual free-text-adjacent field, not auto-generated. |
| **S2** | Sort My Files by last-used date | **Present** | `src/pages/MyFiles.jsx:10` (default `'lastUsed'`), sort logic `:24-33` using `lastUsedDate`→`lastModified`→`createdDate`→`fileNumber` | P1 | — | `[OBSERVED]` Genuinely works client-side; `lastUsedDate` exists on all sample files (`dummyData.js:41`). Trivial to observe given near-identical seed dates. |
| **S3** | Saving of draft notes until submission | **Partial** | `src/components/AddNoteModal.jsx:25-29` (`handleSaveDraft` → `setIsDraft(true)` + `alert('Draft saved! … (Demo mode)')`) | P1 | — | `[OBSERVED]` Pure stub; nothing persists. `Note.isDraft` exists in data (`dummyData.js:52,79`) but always `false` in samples. Refined by **H2**. |
| **S4** | Search & reference EXISTING APPROVED files when creating notes/drafts | **Partial** (effectively broken) | `src/components/AddNoteModal.jsx:31-45` (`handleSearchApprovedFiles`) | P1 | — | **CONFIRMED CRASH** `[OBSERVED]`: `:36` references `files`, but only `currentUser` is imported (`:3`). Typing >2 chars throws `ReferenceError: files is not defined`. `handleCopyReference` (`:47-53`) would work but is unreachable. Refined by **H3** (separate search-string). |
| **S5** | Attach all printable formats (PDF/Word/Excel/JPG…) | **Partial** | `src/components/AddCorrespondenceModal.jsx:30-33` (formats list), `:42-46,151-163` (file pick + drag-drop, `accept` filter); `src/pages/CreateFile.jsx:155-159` (initial-corr input has **no** onChange) | **P2** | — | `[CLARIFIED]` **H4 → Phase 2.** `[OBSERVED]` File selection/drag-drop capture a File into state but submit is `alert()` stub (`:35-40`); nothing uploads. CreateFile's file input is dead decoration. |
| **S6** | Maker-Checker-Approver workflow | **Partial** | `src/components/ReviewModal.jsx` (whole), `src/pages/FileDetail.jsx:329` | P1 | — | `[OBSERVED]` Buttons render; `handleSubmit:17-26` is `alert('File ${action}! (Demo mode)')`. No state machine, no role enforcement, no persistence. Roles are descriptive strings only (`Note.author.role`, `dummyData.js:75,103`) — UI never branches. |
| **S6a** | Multiple checker support | **Partial** | `dummyData.js:47-49` (`checkers[]` array, 0–1 entries in samples); `ReviewModal.jsx` has single reviewer (`currentUser` `:213`) | P1 | — | `[OBSERVED]` Data shape supports many checkers but UI handles only one self-reviewer; no add-checker mechanism at review time (see **H13**). |
| **S6b** | Commenting AFTER checker approval | **Partial** | `dummyData.js:85,115-123` (`checkerComments[]` w/ one seed entry on note2) | P1 | — | `[OBSERVED]` Data models it; no UI produces a checkerComment at runtime. `ReviewModal` remarks textarea (`:140`) is discarded on submit. |
| **S6c** | Action buttons: Check, Approve, Revert | **Present** (over-built) | `src/components/ReviewModal.jsx:72-113` (6 buttons: Check, Approve, Revert, Approve-with-Conditions, Reject, Request Clarification) | P1 | — | **CONFLICT:** prototype exposes **6** actions; SOW + handwriting name only the canonical **3** (Check/Approve/Revert). Scope creep. Refined by **H5** (must stamp date-time + dept — not implemented). |
| **S6d** | Clear role tracking (Maker \| Checker \| Approver) | **Partial** | `dummyData.js:46-50` (`maker`, `checkers[]`, `approver` embedded); `FileDetail.jsx` renders note author footer | P1 | — | `[OBSERVED]` Fields exist and display; no enforcement, no live assignment. Refined by **H6** (file-lock indicator — absent). |
| **S7** | Inbox classification INWARD (final approved) / OUTWARD (revision) | **Partial** | `src/pages/Inbox.jsx:20` (filter on `inboxType`), badge `:107-111` | P1 | — | `[OBSERVED]` Label/filter only — **no behavioral difference** between Inward and Outward (identical cards, same "View File" link). Domain distinction is cosmetic. |
| **S8** | Visibility of files created by individual user | **Present** | `src/pages/MyFiles.jsx:12` (`files.filter(createdBy===currentUser.id)`) | P1 | — | `[OBSERVED]` Works, but "individual" = hardcoded `user1` (`dummyData.js:3`); no way to view another user. Duplicates unused helper `getFilesByCreator` (`dummyData.js:402`). |
| **S9** | Two-page preview: Noting Side + Correspondence Side | **Present** | `src/pages/FileDetail.jsx` — NOTING side (notes cards), CORRESPONDENCE side (corr cards); Note-1 author right margin `:379`, later notes left `:368` | P1 | — | `[OBSERVED]` Best-realized feature. Author-margin convention matches SOW physical-file rule. **Layout note:** the two sides are stacked **vertically** in code (NOTING = top half `:349-350`, CORRESPONDENCE = bottom half `:406-407`), not left/right; H7's L/R framing is conceptual, not a literal pane orientation. Refined by **H7**. |
| **S10** | Report section with complete file logs | **Partial** | `src/pages/Reports.jsx:14-61` (logs from creates/movements/notes), summary cards `:126,130,135` | P1 | — | `[OBSERVED]` Log aggregation + search + section filter real; **Date filter is dead** (`:8,110-118` state never read in `:63-70`); row links use raw `<a href>` (`:159`) breaking SPA nav. Export is a stub (see **H8**). |
| **S11** | MD approval incl. UPLOAD of scanned offline approval | **Partial** (crashes) | `src/components/ReviewModal.jsx:153-159` (toggle), `:174` (`<FiUpload/>`) | P1 | — | **CONFIRMED CRASH** `[OBSERVED]`: `FiUpload` not imported (imports `:2` = `FiX,FiCheck,FiXCircle,FiArrowLeft,FiSend`). Clicking "Upload Offline MD Approval" → `ReferenceError: FiUpload is not defined`. Grouped with S12/S13/S14 per **H9**. |
| **S12** | Final approval print option | **Partial** | `src/pages/FileDetail.jsx:333-341` (Print button only when `status==='Approved'`; `onClick` → `alert('Print functionality… (Demo mode)')`) | P1 | — | `[OBSERVED]` Stub alert only; no print template / page-range / summary page (see S16/H11). Grouped per **H9**. |
| **S13** | Digital signature (if required / approved by) | **Partial** | `src/components/ReviewModal.jsx:189-193` (free-text input) | P1 | — | `[OBSERVED]` Plain text field; no cert/biometric/signing. Value discarded on submit. Grouped per **H9**. |
| **S14** | Approval details on print: Sign, Date/Time, Approved By, Location + Maker/Checker/Approver | **Absent** | no code found (only the `alert()` string at `FileDetail.jsx:338` *describes* this intent) | P1 | — | `[OBSERVED]` No print template renders these fields; `Location` is not a data field anywhere. The alert text is aspirational copy, not implementation. |
| **S15** | Inbuilt DMS with old-file retrieval | **Absent** | no code found (`Correspondence.fileUrl` always `'#'`, `dummyData.js:136`) | **P2** | — | `[CLARIFIED]` **H10 → Phase 2.** No storage, versioning, preview, or retrieval. View/Download buttons dead (`FileDetail.jsx:429-434`). |
| **S16** | Print with page-range selection AND summary page | **Absent** | no code found (Print is a stub alert, `FileDetail.jsx:338`) | P1 | **Rasika Mam** | `[CLARIFIED]` **H11.** A `pageRange` field exists in AddCorrespondenceModal (`:184-193`) but that's correspondence metadata, not print page-range. No summary-page logic. |
| **S17** | Section-level edit rights for Maker/Checker/Approver | **Absent** | no code found | P1 | **Rasika Mam** | `[CLARIFIED]` **H12** (ditto under Rasika Mam). No auth/role model exists anywhere; nothing to gate edits. |
| **S18** | Pre-defined recipient workflow w/ flexibility to modify | **Partial** | `src/components/ForwardFileModal.jsx` (section filter, multi-select, reorder `:40-48`, priority, remarks) | P1 | — | `[OBSERVED]` Richest interactive modal, but `handleSubmit:17-26` is `alert()` stub — no movement recorded, `currentAssignee` unchanged. **Conflict:** SOW says originator plans flow *at creation*; CreateFile has **no** routing UI. Refined by **H13** (add checker/recipient mid-flow). |
| **S19** | Post-approval routing to actionable dept → return to Maker | **Absent** | no code found | P1 | — | `[OBSERVED]` No post-approval routing logic, no "return to maker" flow, no implementation-comments loop. Refined by **H14** (print → attach → send). Circled emphasis per **H20**. |
| **S20** | Correspondence module enhancements | **Partial** | `src/components/AddCorrespondenceModal.jsx` (email-ref + page-range UI) | P1 | — | `[OBSERVED]` UI fields exist; all discarded on stub submit. See sub-items. |
| **S20a** | Email references integration | **Partial** | `AddCorrespondenceModal.jsx:138-207` (Email Reference sub-form `:196-206`, `isEmailAttachment` toggle) | P1 | — | `[OBSERVED]` Text field only; no actual email ingestion/linking. Refined by **H15** (email attachment). |
| **S20b** | Hyperlink / drag-drop attachments w/ PAGE-LEVEL linking (e.g. C36) | **Partial** | `AddCorrespondenceModal.jsx:151-163` (drag-drop), `:184-193` (page-range text, helper cites "C/36 … page 5") | P1 | — | `[OBSERVED]` Drag-drop captures file but no page-level link logic exists; the C36 example is cosmetic placeholder text. |
| **S21** | Mobile application development | **Absent · ⛔ DROPPED** | no code found | — | — | ⛔ **DROPPED from scope entirely (client, 2026-07-03)** — no longer Phase 1 or Phase 2. Was `[CLARIFIED]` H19 "in scope"; superseded. See `08_requirements_decisions.md` §E. |
| **H1** → S1 | "Auto-generated Sr. no. upon submission" (UN/Sr.no system-generated) | **Absent** | `src/pages/CreateFile.jsx:49-58` (File Number = free-text, required, placeholder `ADMIN/2024/001`; no UN field) | P1 | — | **CONFLICT (verified):** handwriting wants auto-gen on submit; prototype uses manual free-text and has **no UN-number field at all** in the create form. |
| **H2** → S3 | Note re "file name"; a "Request" to send for edit/add (rights request) | **Absent** | no code found | P1 | — | `[CLARIFIED]` No request-for-edit/add-rights mechanism. Wording partly unclear in source — flag for clarification. |
| **H3** → S4 | "Search string — separate" (dedicated search-string for approved files) | **Absent** (intended), underlying S4 crashes | `AddNoteModal.jsx:31-45` (only existing approved-file search, crashes) | P1 | — | `[CLARIFIED]` No separate/dedicated search-string capability; the one search that exists is broken (see S4). |
| **H4** → S5 | Marked "2nd phase" | n/a (phase tag) | **P2** | — | `[CLARIFIED]` Confirms S5 → Phase 2. Trailing "9/w…" illegible — flag. |
| **H5** → S6c | "(date & time stamp), dept." on each action | **Absent** | `ReviewModal.jsx:17-26` (submit records nothing) | P1 | — | `[CLARIFIED]` Actions must stamp date-time + department; not captured. `Movement` has `date` (`dummyData.js:157`) but no live write. |
| **H6** → S6d | "file locked — Creator / Checker" (file-LOCK concept; who holds it) | **Absent** | no code found | P1 | — | `[CLARIFIED]` No lock concept, no "currently held by" indicator. New scope beyond plain role-tracking. |
| **H7** → S9 | "L" = Noting (left), "R" = Correspondence (right) | **Present** | `src/pages/FileDetail.jsx` (two-side layout, stacked top/bottom in code) | P1 | — | `[CLARIFIED]` Confirms S9's realized orientation. Soft inconsistency: H7 frames L/R but code stacks vertically (`:349-350`,`:406-407`) — domain convention still satisfied. |
| **H8** → S10 | "export" (logs/reports must be exportable) | **Partial** (stub) | `src/pages/Reports.jsx:72-74,80-82` (`handleExport` → `alert('Exporting file logs… (Demo mode)')`) | P1 | — | `[CLARIFIED]` `[OBSERVED]` Export button exists but produces no CSV/PDF — demo alert only. |
| **H9** → S11/S12/S13 | Group MD-approval + final-print + digital-sig with print-approval details (S14) | **Partial** | see S11/S12/S13/S14 rows | P1 | — | `[CLARIFIED]` Organizational note: treat the approval-on-print bundle together. All four are stub/absent/crashing. |
| **H10** → S15 | Marked "Phase 2" | n/a (phase tag) | **P2** | — | `[CLARIFIED]` Confirms S15 (DMS/old-file retrieval) → Phase 2. |
| **H11** → S16 | Attributed to Rasika Mam | n/a (attribution) | P1 | **Rasika Mam** | `[CLARIFIED]` Print page-range + summary page requested by Rasika Mam. |
| **H12** → S17 | Ditto (— " —) under Rasika Mam | n/a (attribution) | P1 | **Rasika Mam** | `[CLARIFIED]` Section-level edit rights also attributed to Rasika Mam. |
| **H13** → S18 | "Add checker / recipient" (mid-flow) | **Partial** | `ForwardFileModal.jsx:28-48` (multi-select + reorder, but at forward-time only, stubbed) | P1 | — | `[CLARIFIED]` Can pick recipients in ForwardFileModal, but cannot add a *checker* to an in-flight approval; nothing persists. |
| **H14** → S19 | "Print, attached & send" (post-approval action) | **Absent** | no code found | P1 | — | `[CLARIFIED]` The concrete post-approval action (print approved file → attach → send to actionable dept) has no implementation. Circled emphasis per **H20**. |
| **H15** → S20 | "email attachment" + email refs + hyperlink/drag-drop page-level (C36) | **Partial** | `AddCorrespondenceModal.jsx:138-207` | P1 | — | `[CLARIFIED]` Email-ref text field + drag-drop exist; email *attachment* ingestion and page-level linking do not. |
| **H16** (standalone) | Header/footer must show: file name / Period / UN-No. | **Absent** | no code found | P1 | — | `[CLARIFIED]` **New scope.** No header/footer print artifact rendering file name + period + UN number. (Period exists as `startPeriod`/`endPeriod`, `dummyData.js:44-45`, latter always null.) |
| **H17** (standalone) | "File close date" (capture/display closure date) | **Absent** | no code found (status `Closed` never used; `endPeriod` always null) | P1 | — | `[CLARIFIED]` **New scope**, tied to closure flow. No closure date field or UI. |
| **H18** (standalone) | "any number → upto submit; print → page-no.-wise" (provisional numbering until submit; pages numbered on print) | **Absent** | no code found | P1 | — | `[CLARIFIED]` **New scope.** Note/page numbering provisional until submit, then page-number-wise on print. Interpretation uncertain — **flag for clarification.** |
| **H19** → S21 | "Mobile application development IN SCOPE" | n/a · ⛔ DROPPED | — | — | ⛔ Superseded — mobile **dropped entirely** (client, 2026-07-03). |
| **H20** (standalone) | Circled bullets at S16, S17, S19 = likely priority/emphasis | n/a (low-confidence emphasis) | P1 | — | `[CLARIFIED]` `[INFERRED]` Low confidence — read as review-meeting emphasis on print-range, section-edit-rights, and post-approval routing. |

---

## 2. Conflicts (prototype vs. SOW vs. handwriting)

1. **Auto-generated UN/Sr.no. vs. manual free-text File Number (+ missing UN field).**
   - `[CLARIFIED]` H1 (on S1): "Auto-generated Sr. no. upon submission."
   - `[OBSERVED]` `src/pages/CreateFile.jsx:49-58` — File Number is a **required free-text input** (placeholder `ADMIN/2024/001`, helper "Enter unique file number"). There is **no UN-number field anywhere** in the create form, even though `unNumber` exists on the File entity (`dummyData.js:33`).
   - **Disagreement:** prototype contradicts both H1 and the spirit of S1. Decide: auto-generate file number + UN on submit, or keep manual with validation.

2. **ReviewModal exposes MORE actions than the canonical three.**
   - `[SPECIFIED]`/`[CLARIFIED]` S6c + handwriting name exactly **Check / Approve / Revert**.
   - `[OBSERVED]` `src/components/ReviewModal.jsx:72-113` renders **six**: Check, Approve, Revert, Approve-with-Conditions, Reject, Request Clarification.
   - **Disagreement:** scope creep. Confirm whether the extra three (which align with DOCX §4.3 remark types) are wanted, or should be trimmed to the canonical set.

3. **Confidential file shown with no access control.**
   - `[SPECIFIED]` DOCX §7: confidential files = restricted access, movement only with signature.
   - `[OBSERVED]` `dummyData.js:43,250` (file3 `confidential:true`) is listed in `AllFiles` (badge only, `:108-110`), openable by anyone, and its notes/movements leak into `Reports.jsx` log rows. Confidentiality is decorative.

4. **Originator plans initial flow at creation — vs. routing only at forward-time.**
   - `[SPECIFIED]` SOW Actor 3.1 / S18: originator adds the initial recipient list **on the note at creation**.
   - `[OBSERVED]` CreateFile has no recipient/routing UI; the only recipient workflow is `ForwardFileModal` (`:7-48`), reachable only after the file exists. Refined by H13.

5. **Inward vs. Outward is label-only.**
   - `[SPECIFIED]` S7: distinct handling for final-approved (Inward) vs. revision (Outward).
   - `[OBSERVED]` `src/pages/Inbox.jsx:107-111` — identical cards/actions; only a colored badge differs.

6. **Numbering claims vs. reality.**
   - `[CLARIFIED]` H18 (provisional-until-submit, page-no.-wise on print) and prototype-doc claims of enforced sequential numbering.
   - `[OBSERVED]` All numbering is hand-authored static seed (`noteNumber`, `C/n`); `AddCorrespondenceModal.jsx:15` computes `C/(length+1)` positionally but never persists. No enforcement, no gap/audit logic.

7. **Digital signature: cert/biometric claim vs. free-text field.**
   - Prototype-doc claims certificate/biometric signing; `[OBSERVED]` `ReviewModal.jsx:189-193` is a plain text input, value discarded.

8. **Date-time + dept stamping on actions (H5) not captured.**
   - `[CLARIFIED]` H5 requires every Check/Approve/Revert to record date-time + department; `[OBSERVED]` `ReviewModal.jsx:17-26` persists nothing.

9. **Two-side layout: left/right framing vs. top/bottom code (soft).**
   - `[CLARIFIED]` H7 maps L = Noting, R = Correspondence.
   - `[OBSERVED]` `FileDetail.jsx` stacks the sides vertically (NOTING = top half `:349-350`, CORRESPONDENCE = bottom half `:406-407`), not as left/right panes. The SOW author-margin convention is still satisfied; only the spatial framing differs. Low impact — surfaced for completeness.

---

## 3. Biggest gaps for Phase 1

The prototype is a **read-only UI shell over 4 mock files**; every mutation is an `alert('… Demo mode')`. The heavy absent/non-functional items that must anchor Phase-1 backend planning:

1. **Real workflow engine + state machine.** No status transitions, no approve/revert loop, no assignment changes. `ReviewModal`/`ForwardFileModal`/`AddNoteModal` submits are all stubs. (S6, S6a–d, S18, S19; H5, H13.)
2. **Authentication + role model.** None exists; `currentUser` is a hardcoded singleton (`dummyData.js:3-9`); UI never branches on role. Blocks S6d, S17, confidential access, "Pending Approvals" scoping.
3. **Persistence layer.** No backend/DB/API; nothing survives a refresh. Prerequisite for *every* mutating feature.
4. **File closure / successor-file flow.** Absent; status `Closed` never used, `endPeriod` always null. (DOCX §9; H17 close-date.)
5. **Post-approval routing → return to maker.** Absent. (S19; H14 print→attach→send.)
6. **Digital signature mechanism.** Free-text only; no signing/cert. (S13.)
7. **Section-level edit rights.** Absent — no auth to gate on. (S17, Rasika Mam.)
8. **Print template with approval details + page-range + summary page.** Absent; print is a single alert. (S12, S14, S16; H9, H11, H16 header/footer.)
9. **File-lock / "currently held by" concept.** Absent. (H6.)
10. **Two confirmed runtime crashes to fix before any demo expansion:**
    - `AddNoteModal.jsx:36` — undefined `files` (Search Approved Files). (S4/H3.)
    - `ReviewModal.jsx:174` — undefined `FiUpload` (MD offline upload). (S11.)
11. **Email integration & page-level (C36) linking.** UI placeholders only. (S20a/S20b; H15.)

**Phase 2 (per handwriting):** S5 attachments-all-formats (H4), S15 DMS/old-file retrieval (H10), and DOCX §7 confidential temp-file/merge handling.

---

## 4. Quick count

**Counting rule (explicit, so totals reconcile):** every SOW item / sub-item that carries a concrete prototype status is counted once. Each H-annotation is counted **only when it introduces standalone scope with its own status** (H1, H2, H3, H5, H6, H8, H13, H14, H15, H16, H17, H18). H-annotations that are pure **phase tags** (H4, H10), pure **attributions** (H11, H12), pure **scope-confirmations / emphasis** (H19, H20), or that merely **re-confirm an already-counted SOW item** (H7 confirms S9, H9 organizes S11–S14) are **excluded** from the status tally — they appear in the master table but carry no independent status to bucket.

| Status | Count | IDs |
|--------|-------|-----|
| **Present** | **4** | S2, S6c, S8, S9 |
| **Partial** | **20** | S1, S3, S4, S5, S6, S6a, S6b, S6d, S7, S10, S11, S12, S13, S18, S20, S20a, S20b, H8, H13, H15 |
| **Absent** | **14** | S14, S15, S16, S17, S19, H1, H2, H3, H5, H6, H14, H16, H17, H18 *(S21 removed — ⛔ dropped from scope)* |

**Totals: Present 4 / Partial 20 / Absent 14 = 38 bucketed IDs.** *(Was 39; S21 Mobile removed after the client dropped it from scope on 2026-07-03.)* Annotations that carry no independent status are excluded from the tally (they still appear in the master table): **H7** confirms S9 and **H9** organizes S11–S14; **H4/H10** are phase tags; **H11/H12** are attributions; **H19/H20** are scope-confirmation/emphasis.

**Headline (Present 4 / Partial 20 / Absent 14 = 38 bucketed IDs):** roughly **1 in 10 is genuinely Present** (~11%), **half are Partial** (~53% — UI exists but stubbed/broken/label-only), and **~3 in 8 are wholly Absent** (~37%). The Present items are all *read/display* features (sort, two-pane view, action-button rendering, created-files list); **every Partial item collapses to a stub at the persistence boundary**, and the Absent set contains the entire approval-execution, closure, routing, print, signature, and access-control backbone. Phase-1 backend work is effectively greenfield. **For the current, client-answered requirement decisions, see `08_requirements_decisions.md`.**
