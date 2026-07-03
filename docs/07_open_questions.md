# 07 — Open Questions: Decisions to Resolve Before Backend / Architecture Design

> **⚠️ SUPERSEDED (2026-07-03):** The client returned answers via the questionnaire *"eOffice_Requirements_Questionnaire_v2 edited answer.docx"*. **The authoritative, resolved decisions now live in [`08_requirements_decisions.md`](08_requirements_decisions.md).** This file is retained as the analysis trail (the reasoning behind each question). Two scope notes already folded in here: **Mobile (Theme 12 / S21 / H19) is DROPPED entirely**, and a short "still needs you" list is in `08` §A.

This document collects every ambiguity, conflict, and decision that should be settled **before** backend and data-architecture design begins. It is **discovery only** — no schema, no tech-stack, no implementation. Where the prototype contradicts the SOW or the handwritten annotations, the conflict is surfaced explicitly rather than silently resolved.

**Source labels used throughout:**

- **[OBSERVED]** — seen directly in prototype code (cited file:line).
- **[SPECIFIED]** — stated in the SOW / DOCX background.
- **[CLARIFIED]** — from the handwritten annotations (cited by H-number).
- **[INFERRED]** — our reasonable assumption, clearly marked.

Each question carries a *recommended default to confirm*. The default is a starting position for the client conversation, **not** a design decision. Nothing here should be treated as settled until the client signs off.

---

## Update — Answers mined from the Source Document (2026-06-28)

> **Source Document (SD)** = *"Present physical file system in the organisation"* (the typed narrative the SOW is built on; identical in content to the DOCX background already cited as **[SPECIFIED] / SOW §**). Section references below (SD §2.1, §5, §9, "Additional Points", "SOW", etc.) point into that document.

The SD is the authoritative description of the **physical** process, so wherever it speaks, it *answers* a question outright rather than leaving it to the client. Re-reading the SD against the open questions, each question is now tagged with a **resolution status**:

- ✅ **RESOLVED** — the SD settles it; the recommended default is now "proceed as the SD describes unless the client objects."
- 🟡 **PARTIAL** — the SD informs it but a residual decision remains.
- 🔴 **OPEN** — the SD is silent; this is genuinely a client/handwriting/prototype decision (often because the item originates in the SOW *feature list* or the handwriting, not the physical process).

**Important framing:** the questions that remain 🔴 OPEN are mostly the *new digital features* (auto-numbering, file-lock, export, page-level linking, mobile, inbox derivation, print mechanics) and the *unclear handwriting*. The questions the SD resolves are the *core domain mechanics* (who opens files, how routing/closure/transfer/suo-moto/audit/confidentiality work). That is exactly what we'd expect — the SD describes the existing process; the open items are the enhancements layered on top.

### Resolution scoreboard

| Q | Topic | Status | What the SD establishes (if anything) |
|---|-------|--------|----------------------------------------|
| Q1.1 | File number: auto vs typed | 🔴 OPEN | SD §2.1 names only a single "file unique number"; it does **not** say how it's generated (auto-gen is from H1). |
| Q1.2 | UN no. vs fileNumber vs Sr.no | 🟡 PARTIAL | SD §2.1 describes **one** unique number on the cover — the prototype's split into `fileNumber` + `unNumber` has no SD basis. |
| Q1.3 | Uniqueness scope | 🔴 OPEN | SD silent. |
| Q1.4 | Note/C numbering + print pagination | 🟡 PARTIAL | SD §2.2A/B fully specify **logical** numbering (sequential, permanent); print pagination (H18) remains unclear. |
| Q2.1 | What a "lock" permits | 🟡 PARTIAL | SD §2.2A: file moves single-holder-at-a-time ("reverts to the originator"); the *lock* term is H6. |
| Q2.2 | Who holds; drafts on transfer | 🟡 PARTIAL | SD: one party holds/moves the file; drafts not addressed. |
| Q2.3 | Override when holder absent | ✅ RESOLVED | SD §5: a colleague/reporting officer takes approval on mail (attached + annotated "on leave…"); if urgent, "any concerned" may change the flow. |
| Q3.1 | Fixed role-chain vs free list | 🟡 PARTIAL | SD §3/§5: originator plans the flow and adds an **initial recipient list on the note**; reviewers add members → a *modifiable recipient list*, not a rigid 4-role chain. |
| Q3.2 | When/where the flow is defined | ✅ RESOLVED | SD §3.1 + §5: the originator plans the initial flow **at note creation**, on the note; later reviewers add members. |
| Q3.3 | Sequential vs parallel checkers | 🟡 PARTIAL | SD implies **sequential** (note-by-note, "reverts to originator"); parallel review is never described. |
| Q3.4 | Commenting after approval | 🟡 PARTIAL | SD: notes are permanent/append-only; sections "add comments to the notes"; exact post-approval-comment rule not detailed. |
| Q3.5 | 6 review actions vs canonical 3 | 🟡 PARTIAL | SD §4.3 lists the remark taxonomy (Approval, Correction, Rejection, Clarification, Additional-docs, Return) → supports the richer set; the 3-button canon is SOW/H5. |
| Q3.6 | Paragraph-level approval | ✅ RESOLVED | SD §4.2: approval/remarks may be recorded against a **specific paragraph** marked 'A' (or any marking). Mechanism is specified domain behavior. |
| Q4.1 | Who can open a file | ✅ RESOLVED | SD §3.1: **"new file can be opened by anyone."** |
| Q4.2 | MD vs Approver | 🟡 PARTIAL | SD has only **Originator + Reviewer/Approver** (§3); "MD" appears only in the SOW → MD = a senior/terminal approver, not a separate SD role. |
| Q4.3 | Section-level edit-rights granularity | 🔴 OPEN | SD §5 says sections add correspondence/comments/approvals as the file circulates, but never defines *edit-right* granularity (S17 is a SOW/Rasika item). |
| Q4.4 | Confidential — Phase 1 vs 2 | ✅ RESOLVED | SD §7: P1 = restricted access, secure storage, CONFIDENTIAL mark, **movement only with signature**; P2 = temp-file split/merge. |
| Q5.1 | Editable vs permanently locked | ✅ RESOLVED (notes) | SD §2.2A: **old notes remain permanently** for audit; drafts editable until submit (SOW). File-cover edit policy still a detail. |
| Q5.2 | Movement-log completeness | ✅ RESOLVED (principle) | SD §5 "**all movements are recorded**"; §4.3 every remark "signed and dated"; §9 "complete movement history" is permanent. |
| Q5.3 | Export formats/scope | 🔴 OPEN | Export is H8; SD silent on formats. |
| Q6.1 | Signature mechanism | 🟡 PARTIAL | SD §2.2A: signature is "**physical or digital**" + name, designation, date; §7 "movement only with signature." PKI-vs-typed legal weight still open. |
| Q6.2 | Signature metadata / "Location" | 🟡 PARTIAL | SD signature block = name + designation + date; "Location" is SOW S14 (= dept per H5). |
| Q7.1 | Page-level linking ("C36") | 🔴 OPEN | SOW S20b / H15 feature; SD silent. |
| Q7.2 | Email references | 🟡 PARTIAL | SD §5: an approval **mail is attached to the correspondence side** as a C-document → emails enter as correspondence. |
| Q7.3 | Drag-and-drop | 🔴 OPEN | UX detail; SD silent. |
| Q7.4 | Formats Phase 2 + inward stamping | 🟡 PARTIAL | SD §6: inward **date & number are NOT mandatory**; "all printable formats" is SOW, Phase 2 from H4. |
| Q8.1–8.4 | Print mechanics | 🔴 OPEN / context | SD §2.1 cover fields inform header/footer (H16); page-range/summary/approval-print are SOW + handwriting. |
| Q9.1 | Closure + successor file | ✅ RESOLVED | SD §9: closing **date + reason + the new (successor) file's unique number** recorded on the cover; a new file is opened in place; files stay open until closed; documents addable after long gaps; full history permanent. |
| Q9.2 | Cross-department permanent transfer | ✅ RESOLVED (behavior) | SD "Additional Points": a file can be **permanently transferred across departments** (Recovery→Legal example); on activity transfer, related files move. (Whether the *number* changes: open.) |
| Q9.3 | Suo-moto notes | ✅ RESOLVED | SD §8: internal notes **without correspondence** (policy / admin decisions / internal reviews). |
| Q10.1/10.2 | Inbox Inward vs Outward | 🔴 OPEN | SD uses "inward" only for incoming letters (§2.2B/§6); the Inward(final-approved)/Outward(revision) **inbox** rule is SOW S7 and its derivation isn't specified. |
| Q11.1 | DMS scope | 🔴 OPEN (P2 via H10) | SD silent on DMS. |
| Q11.2 | Relationship to the separate File Tracking system | ✅ RESOLVED (boundary) | SD: a **separate File Tracking system already exists** (working app) that tracks org-wide flow and provides reports → our app should not duplicate org-wide tracking; define the feed/boundary. |
| Q12.1 | Mobile | ⛔ DROPPED | Removed from scope entirely by client (2026-07-03). |
| Q13.1–13.4 | Unclear handwriting | 🔴 OPEN | The SD is the clean printed *base* that was annotated; it cannot resolve the handwritten marks themselves. |
| Q14.1 | Post-approval routing + return | 🟡 PARTIAL | SD §5 (circulation) + §10 (return-for-correction) support routing; the specific approve→actionable-dept→return-to-Maker loop is SOW S19/H14. |

### Bonus data-model facts the SD pins down (feed `04_inferred_data_model.md`)

- **Start/End period are NOT mandatory** on the file cover — SD §2.1. (Prototype already allows blank; `endPeriod` is always null.)
- **Inward date & inward number are NOT mandatory** on correspondence — SD §6. (Both are optional metadata, not required keys.)
- **A file is opened *for a purpose*** (AMC, Purchase, Customer, Project, activity) that groups related communications/approvals — SD §4.1. The "subject" is really a *purpose/grouping* concept.
- **The first reference document is C/1** on the correspondence side — SD §4.1; C-numbering starts at the first attached document and expands toward the centre (§2.2B).
- **Author-margin convention:** originator's name at the **right** margin of the note; subsequent members at the **left** margin — SD §2.2A (already [OBSERVED] in `FileDetail.jsx`).

---

## Theme 1 — Identity & Numbering (fileNumber vs UN number vs auto Sr.no)

This is the single most contradicted area across code, SOW, and handwriting. It must be resolved first because nearly every other entity references a file by its identifier. **The SD does not resolve the auto-generation/identity tension** — that originates in the handwriting (H1) and the prototype, not the physical process — so Theme 1 stays largely open.

### Q1.1 — Is the File Number auto-generated or user-entered? — 🔴 OPEN
**Question:** When a file is created, is the file number typed by the originator or generated by the system?

**Why it matters:** Determines whether the create flow needs a generator/sequence service, collision handling, and whether the number is editable after creation. Drives uniqueness enforcement at the data layer.

**What we know:**
- [OBSERVED] CreateFile File Number is a **free-text required input** with placeholder `e.g., ADMIN/2024/001` and helper "Enter unique file number" (`src/pages/CreateFile.jsx:49-58`). `formData.fileNumber` starts as `''` (`src/pages/CreateFile.jsx:9-10`).
- [CLARIFIED] H1 on S1 says "**Auto-generated Sr. no. upon submission**" — the number is system-generated on submit, not typed.
- [SPECIFIED] SD §2.1: the file cover carries a "file unique number"; SD §3.1: "new file can be opened by anyone."

**Source-document check:** The SD only states that a unique number *exists* on the cover; it is **silent** on whether it is auto-generated or typed. So the SD does not break the tie.

**CONFLICT (unresolved):** Prototype (free-text) directly contradicts H1 (auto-generated). **Surface and resolve with client.**

**Recommended default to confirm:** Auto-generate a system Sr.no on submission (per H1) while *also* allowing/recording a human-readable section file number (e.g. `ADMIN/2024/001`). Confirm whether the section file number is typed, templated, or fully derived.

### Q1.2 — What exactly is the "UN number" and how does it relate to fileNumber and the auto Sr.no? — 🟡 PARTIAL
**Question:** Are `fileNumber`, `unNumber`, and the H1 "auto-generated Sr. no." three distinct identifiers, two, or one? Which is the primary key concept?

**Why it matters:** S1 requires "UN number-wise AND department-wise" display, so UN number is a first-class grouping axis. We need to know its format, scope, and who assigns it.

**What we know:**
- [OBSERVED] Data has both `fileNumber` (e.g. `ADMIN/2024/001`) and `unNumber` (e.g. `UN-2024-001`) as separate fields per file (`src/data/dummyData.js:32-33`).
- [OBSERVED] AllFiles derives a UN-number filter dropdown dynamically from data and does exact-match filtering (`src/pages/AllFiles.jsx:14, :23, :82-91`).
- [OBSERVED] The CreateFile form has **no UN-number field at all** (`src/pages/CreateFile.jsx:9-17` state; only fileNumber/section/subject/period/type/note/confidential).
- [CLARIFIED] H1 introduces a third concept — an auto Sr.no on submit. H16 wants header/footer to show "UN-No." (so it's user-facing).

**Source-document check:** SD §2.1 lists exactly **one** identifier on the cover — the "file unique number." The physical process knows nothing of a separate UN number vs file number; the split is a prototype artifact. This is a useful clue: **the domain has a single canonical unique number**, and "UN number" / "file number" are most likely two *labels/encodings* of the same identity, not two independent keys.

**CONFLICT:** UN number is filterable/displayable but never captured at creation. Is it the same as the H1 Sr.no? **Likely yes** given the SD's single-number model — confirm.

**Recommended default to confirm:** Treat the **system-generated unique sequence (the H1 Sr.no)** as the single canonical identity assigned on submission; expose it as the "UN-No." (user-facing) and optionally render a human/section-facing `fileNumber` label derived from section+year. Confirm format (`UN-YYYY-NNN`?) and whether UN is global or per-year/per-section.

### Q1.3 — Uniqueness scope of each identifier — 🔴 OPEN
**Question:** Is uniqueness global (org-wide), per-section, or per-year for fileNumber and UN number?

**Why it matters:** Defines the uniqueness constraint and the sequence reset rules.

**What we know:**
- [OBSERVED] Sample fileNumbers embed section + year (`ADMIN/2024/001`, `LEGAL/2024/001`, `ACCOUNTS/2024/015`) (`src/data/dummyData.js:32` across files), suggesting per-section-per-year numbering.
- [OBSERVED] `unNumber` samples (`UN-2024-001`) look year-scoped and org-wide.

**Source-document check:** SD silent on uniqueness scope.

**Recommended default to confirm:** fileNumber unique per section+year; UN number unique org-wide per year. Confirm.

### Q1.4 — Note and correspondence numbering scope and "page-no.-wise on print" — 🟡 PARTIAL
**Question:** Are note numbers and C-numbers strictly file-scoped sequential, never reused, with gaps preserved? What does H18 ("any number → upto submit; print → page-no.-wise") mean?

**Why it matters:** Numbering is the backbone of the audit trail and of the clickable C/n & Note n references.

**What we know:**
- [OBSERVED] `noteNumber` resets per file (1, 2…) (`src/data/dummyData.js:55, :89`); `correspondence.number` is `C/n` per file (`src/data/dummyData.js:129`); AddCorrespondenceModal computes the next number purely as `C/${file.correspondence.length + 1}` (`src/components/AddCorrespondenceModal.jsx:15`).
- [SPECIFIED] SD §2.2A/B: notes are sequential Note1→Note2; correspondence numbered C/1, C/2…; numbering cannot normally change.
- [CLARIFIED] H18 (transcribed, flagged low-confidence): numbering is provisional "up to submit", and on **print** pages are numbered "page-no.-wise."

**Source-document check (RESOLVES the logical half):** SD §2.2A/B + §4.1 fully specify the **logical** numbering: notes added sequentially Note 1 → Note 2 → … on the same note sheet per purpose; correspondence numbered C/1, C/2, C/3 … from the first document (C/1) outward; old notes are permanent. So *logical* numbering is settled (file-scoped, sequential, immutable, first-doc = C/1). The SD does **not** address H18's "page-no.-wise on print," which is about *physical print pagination* — that half stays 🔴 (see Q13.3).

**Recommended default to confirm:** Logical Note/C numbers are file-scoped, sequential, immutable once submitted, gaps preserved (**SD-confirmed**). Print pagination is a separate physical page-number sequence applied at print time — confirm H18 interpretation.

---

## Theme 2 — File Lock ("File locked — Creator / Checker", H6)

The *lock* concept itself is a handwriting addition (H6), so the SD cannot define it directly — but the SD's single-holder movement model and absent-reviewer rules strongly inform the defaults.

### Q2.1 — What does a file "lock" permit and prevent? — 🟡 PARTIAL
**Question:** Is the lock an *editing* lock (only the current holder can add notes/correspondence), a *possession indicator* (shows who currently holds the file), or both?

**Why it matters:** This is a concurrency + permission concept with no code today. It dictates whether the backend needs holder-based write gating and conflict handling.

**What we know:**
- [CLARIFIED] H6 on S6d: "**file locked — Creator / Checker**" — when locked/in someone's hands, indicate whether the Creator or the Checker currently holds it; introduces a file LOCK concept.
- [OBSERVED] No lock concept exists in code; `currentAssignee` (`src/data/dummyData.js:42`) is the closest field and is purely a string FK, never enforced. No "file locked" anywhere (confirmed absent).
- [SPECIFIED] SD §2.2A: "after processing a note the file generally reverts to the originator" — implies single-holder-at-a-time movement.

**Source-document check:** SD §2.2A/§5 establish that the *physical* file is in exactly one party's hands at a time as it moves through the flow. That directly supports modelling the lock as **single-holder possession + write-gate**. The SD doesn't use the word "lock," so the precise rule (read-only for non-holders?) is still ours to confirm.

**Recommended default to confirm:** Lock = the file is held by exactly one party at a time (the current assignee/holder), and only the holder may add notes/correspondence or forward it; everyone else has read-only view. The UI surfaces whether the current holder is the Creator or a Checker (per H6). Confirm.

### Q2.2 — Who can hold a file, and what happens to in-flight edits / drafts on transfer? — 🟡 PARTIAL
**Question:** Can a file be held by only one user, or by a section? When the holder forwards it, do their unsaved drafts travel, lock, or get discarded?

**Why it matters:** Affects draft ownership (S3), concurrency, and whether two reviewers can ever act simultaneously.

**What we know:**
- [OBSERVED] `currentAssignee` is a single user id or null (`src/data/dummyData.js:42, :249`).
- [OBSERVED] Draft notes are local component state only, never persisted (`src/components/AddNoteModal.jsx:25-29`).
- [SPECIFIED] SD §5: if a reviewer is absent, a colleague/reporting officer may take approval and "any concerned person may change the flow" if urgent — implies the holder can change.

**Source-document check:** SD confirms single-party possession during movement (Q2.1) but is silent on draft-on-transfer behavior.

**Recommended default to confirm:** Single-user holder; forwarding transfers the lock; drafts are owner-scoped and do not auto-travel. Confirm whether section-level holding is needed.

### Q2.3 — Override / break-lock authority (absent reviewer case) — ✅ RESOLVED (behavior)
**Question:** Who can forcibly reassign a locked file when the holder is unavailable?

**Why it matters:** SOW explicitly anticipates absent-reviewer workarounds; the backend needs an authority model for override.

**What we know:**
- [SPECIFIED] SD §5: absent reviewer → colleague/reporting officer can approve via mail (attach to correspondence, annotate "on leave, approval received on mail" under the reviewer's name); urgent → "any concerned person may change the flow."
- [OBSERVED] No override mechanism in code.

**Source-document check (RESOLVES):** The SD specifies the override *behavior* precisely: (a) a **colleague or reporting officer** may take the approval offline (on mail), attach that mail as correspondence, and annotate it under the absent reviewer's name; and (b) for **urgent** files, **"any of the concerned"** may change the flow. So the override pathway and the artifact it produces (mail attached + annotation) are domain-confirmed.

**Residual:** Only the precise definition of "any of the concerned" (which roles qualify) needs client confirmation; the mechanism is settled.

**Recommended default to confirm:** Allow a designated reporting officer / section head to reassign or proxy-approve a held file (recording the offline-mail artifact + annotation as the SD describes), and allow any in-flow participant to re-route urgent files — every override logged as a movement. Confirm exactly who counts as "any concerned."

---

## Theme 3 — Workflow & Routing Model

### Q3.1 — Fixed Maker→Checker→Approver chain, or free recipient list? — 🟡 PARTIAL (SD leans "modifiable list")
**Question:** Is the workflow a structured role chain (Maker → Checker(s) → Approver → MD) or an ad-hoc recipient list chosen per forward?

**Why it matters:** Determines whether routing is modeled as a typed state machine or as a generic forwarding graph. This is foundational to the whole backend.

**What we know:**
- [SPECIFIED] S6 names a "Maker-Checker-Approver workflow"; SD §3 names **Originator + Reviewer/Approver only** (two role types, not four).
- [OBSERVED] Data models structured roles: `maker`, `checkers[]`, `approver` on File (`src/data/dummyData.js:46-50`), and `author.role` ('Maker'/'Checker') on notes (`role: 'Maker'` at `src/data/dummyData.js:75`, `role: 'Checker'` at `:103`) — but role is descriptive metadata, never enforced (orchestrator-verified).
- [OBSERVED] The only routing UI is ForwardFileModal: a **free recipient list** (pick section → multi-select users → reorder → priority + remarks) with no role typing (`src/components/ForwardFileModal.jsx:13-15, :28-48`). Any user can be any recipient.
- [SPECIFIED] S18: "Pre-defined recipient workflow **with flexibility for modification**" — implies a default chain that can be edited.

**Source-document check:** SD §3.1 + §5 describe the *physical* model as a **recipient list** the originator plans and "adds on the note," which subsequent reviewers extend ("each reviewer/approver can then add further members in the flow"). The SD never describes a rigid four-role state machine — it describes an **ordered, extendable list of people**. So the domain truth is closer to "modifiable recipient list" than "fixed role chain"; the Maker/Checker/Approver *labels* come from the SOW feature framing.

**TENSION (narrowed):** Data implies typed roles; SD + the only UI both describe a recipient *list*. The SOW's "predefined-but-modifiable" wording reconciles them.

**Recommended default to confirm:** Model routing as a **predefined-but-modifiable ordered recipient list** (the SD model), with role *labels* (Maker/Checker/Approver/MD) layered on for tracking/print (S6d). Confirm the canonical role label set (see Q4.2 re MD vs Approver).

### Q3.2 — How is the "pre-defined recipient workflow" defined, and when? — ✅ RESOLVED
**Question:** Where does the predefined chain come from — set by the originator at creation, by section policy/template, or only at first forward?

**Why it matters:** S18 + SD §3.1 say the originator "plans the initial flow" *at creation*. The prototype has no routing at creation.

**What we know:**
- [SPECIFIED] SD §3.1 / §5: the originator "records the note and **plans the initial flow of the note**" and "**adds the initial list of recipients on the note**"; reviewers can add further members.
- [CLARIFIED] H13 on S18: "**Add checker / recipient**" — must be able to add a checker/recipient mid-flow.
- [OBSERVED] CreateFile has **no recipient/initial-routing UI** (`src/pages/CreateFile.jsx:9-17`). Routing exists only at forward time (`src/components/ForwardFileModal.jsx`).

**Source-document check (RESOLVES):** The SD is explicit and unambiguous: the **originator defines the initial recipient flow at the time of the initial note**, recorded *on the note*; subsequent reviewers/approvers may add further members. So *when* and *by whom* the flow is defined is settled by the domain.

**CONFLICT (with prototype, confirmed by SD):** The prototype offers routing only at forward time — this contradicts the SD. The SD wins: **initial-flow planning belongs at creation/initial-note.**

**Recommended default to confirm:** Capture the initial recipient list at creation/initial-note (originator-planned, per SD), and allow any subsequent holder to add checkers/recipients mid-flow (H13). Confirm only whether *section templates* should pre-seed a default list (the SD doesn't mention templates).

### Q3.3 — Sequential vs parallel checkers (S6a, multiple checker support) — 🟡 PARTIAL (SD implies sequential)
**Question:** When there are multiple checkers, do they act in sequence or in parallel?

**Why it matters:** Sequential vs parallel changes the state model, lock semantics (Theme 2), and how "all checks complete" is computed.

**What we know:**
- [SPECIFIED] S6a: "Multiple checker support."
- [OBSERVED] `checkers[]` is an array with per-checker `status` + `date` (`src/data/dummyData.js:47-49`); samples hold 0–1 entries. ForwardFileModal lets you select multiple recipients **and reorder them** (`src/components/ForwardFileModal.jsx:40-48`), implying an ordered (sequential) chain.
- [SPECIFIED] SD §2.2A: file moves note-by-note and "generally reverts to originator" — implies sequential handling.

**Source-document check:** The SD's single-holder, note-by-note movement (Q2.1) and "list of recipients … add further members in the flow" language imply an **ordered, sequential** progression. The SD never describes two reviewers holding/acting at once. So sequential is the domain default; the SD does not *forbid* parallel, so true parallel review remains a client question.

**Recommended default to confirm:** Sequential by default (ordered list, single holder at a time — consistent with the lock model and the SD). Confirm whether any genuine parallel review is required.

### Q3.4 — "Commenting AFTER checker approval" (S6b) semantics — 🟡 PARTIAL
**Question:** Who can comment after a checker has approved, on what, and does a post-approval comment reopen/revert the note?

**Why it matters:** Affects immutability rules (Theme 5) and whether approved notes are append-only.

**What we know:**
- [SPECIFIED] S6b: "Commenting AFTER checker approval."
- [OBSERVED] Data models this: `note.checkerComments[]` with checkerId/comment/date/action (`src/data/dummyData.js:115-123`), and `note.approvals[]` with paragraph-level approval (`src/data/dummyData.js:112-114`). But ReviewModal only `alert()`s on submit (`src/components/ReviewModal.jsx:17-26`); nothing produces these.

**Source-document check:** SD §2.2A ("old notes remain permanently") + §5 ("each section may add comments to the notes") establish an **append-only annotation** culture — comments accrete and nothing is erased — which supports the default below. But the SD does not address the specific S6b case of commenting *after* a checker has approved, nor whether it triggers a revert. Residual.

**Recommended default to confirm:** Post-approval comments are **append-only annotations** that do not erase the prior approval (consistent with SD permanence) but are recorded in the audit trail; a subsequent revert is a separate explicit action. Confirm whether a post-approval comment can itself trigger revert.

### Q3.5 — The 6 review actions vs the canonical 3 — 🟡 PARTIAL (SD supports the richer taxonomy)
**Question:** Which review actions are in scope — the canonical 3 (Check / Approve / Revert) or the 6 currently rendered?

**Why it matters:** Each action is a state transition the backend must model; scope creep here inflates the state machine.

**What we know:**
- [SPECIFIED] S6c + SOW name **Check / Approve / Revert** as canonical; H5 adds that each must record date-time stamp + department.
- [OBSERVED] ReviewModal renders **6** actions: Check, Approve, Revert, Approve with Conditions, Reject, Request Clarification (`src/components/ReviewModal.jsx:72-113`), exceeding the canonical 3.
- [SPECIFIED] SD §4.3 lists richer remark types (Approval, Correction, Rejection, Clarification request, Additional-documents request, Return to originator) — supports the larger set conceptually. (SD §4.4's worked examples are explicitly "not required.")

**Source-document check:** The SD's *remark taxonomy* (§4.3) maps almost one-to-one onto the prototype's 6 actions — so the richer set is **domain-grounded**, not arbitrary scope creep. The reconciliation: the SD describes the full set of *outcomes a reviewer can record*; the SOW/handwriting choose 3 as the primary *buttons*. Decide whether to expose all six as first-class actions or fold the extras into Approve/Revert variants.

**Recommended default to confirm:** Model the SD §4.3 outcomes as the canonical action set, surfaced as the 3 primary buttons (Check/Approve/Revert) plus Reject / Request-Clarification / Approve-with-Conditions as recognized variants. Each action records timestamp + department (H5). Confirm the button-level UX.

### Q3.6 — Paragraph-level (partial) approval — ✅ RESOLVED (mechanism specified)
**Question:** Is paragraph-level approval ("approve para A but not B", marker A/B/C) in scope?

**Why it matters:** It complicates the note/approval data model and the print-of-approval rendering.

**What we know:**
- [SPECIFIED] SD §4.2 (Annotation): approval/remarks "may be recorded against a **specific paragraph** of the noting … by marking the paragraph or partial portion that will be approved with a mark like '**A**' or any other marking) or reference to a correspondence document."
- [OBSERVED] Data supports it: `note.approvals[{paragraph:'A', approvedBy, date}]` (`src/data/dummyData.js:112-114`); ReviewModal renders paragraph checkboxes derived from `content.split('\n\n')` with A/B/C labels (`src/components/ReviewModal.jsx:28-34, :118-130`) — but selection is unused on submit.

**Source-document check (RESOLVES the mechanism):** Paragraph-level / partial approval is an explicit, named domain behavior in SD §4.2 — it is a real requirement, not an invention. What remains is only the **phasing** decision (full paragraph-level approval in Phase 1 vs whole-note approval first), given its print/signature implications.

**Recommended default to confirm:** Paragraph-level approval is in scope as a domain mechanism (SD §4.2). Confirm only whether Phase 1 implements full paragraph-level granularity or starts with whole-note approval.

---

## Theme 4 — Roles & Access Control

### Q4.1 — Who can open (create) a file? — ✅ RESOLVED
**Question:** Is file creation open to anyone, or restricted by role/section?

**Why it matters:** Drives the very first authorization rule.

**What we know:**
- [SPECIFIED] SD §3.1, explicitly: "**new file can be opened by anyone.**"
- [OBSERVED] No gating in code; any visitor reaches CreateFile (`src/App.jsx` route `/create-file`; no auth guard).

**Source-document check (RESOLVES):** The SD settles this outright — *anyone* can open a new file. (The SD even carries the author's own editorial margin-note "Move this in other section," i.e. relocate the sentence — it does not change the rule.)

**Recommended default to confirm:** Any authenticated user may create a file (SD-confirmed). Confirm only whether section membership is still a prerequisite for *login*, not for creation.

### Q4.2 — MD vs Approver distinction — 🟡 PARTIAL
**Question:** Is "MD" a distinct top-tier approver role, or just the final Approver in the chain?

**Why it matters:** S11 calls out MD approval (incl. offline upload) specifically; the backend needs to know if MD is a special role/state.

**What we know:**
- [SPECIFIED] S11: "MD approval support including UPLOAD OF SCANNED OFFLINE approvals."
- [SPECIFIED] SD §3.2 names only a generic "Reviewer / Approver" — **no "MD"** appears anywhere in the physical-process description.
- [OBSERVED] ReviewModal has a dedicated "MD Approval (Offline)" upload section (`src/components/ReviewModal.jsx:150-185`) — **and this path crashes** because `<FiUpload/>` (`:174`) is rendered but not imported (imports at `:2` are FiX, FiCheck, FiXCircle, FiArrowLeft, FiSend). Helper text says "Any maker or checker can upload physical scanned approval" (`:181`).
- [OBSERVED] No role model distinguishes MD; `approver` is a single embedded {id,name} (`src/data/dummyData.js:50`).

**Source-document check:** The SD recognizes only Originator + Reviewer/Approver. "MD" is purely an SOW-feature term → strongly implies **MD is simply a senior/terminal instance of Reviewer/Approver**, distinguished mainly by the *offline-scan* approval path (S11), not by a separate domain role.

**Recommended default to confirm:** MD = the distinguished final approver in the chain, whose approval may be recorded via an uploaded scanned offline document (S11). Confirm whether MD is always the terminal step and whether non-MD final approvers also exist.

### Q4.3 — Section-level edit rights (S17, H11/H12) — 🔴 OPEN
**Question:** What do "section-level edit rights for Maker/Checker/Approver" actually gate — editing notes, editing the file cover, editing within one's own section only?

**Why it matters:** This is an access-control feature with zero code today; it shapes the permission model.

**What we know:**
- [SPECIFIED] S17: "Section-level edit rights for Maker, Checker, and Approver."
- [SPECIFIED] SD §5: as a file circulates, "each section may add new correspondence, add comments to the notes, seek internal approvals" — describes *what* sections do, not edit-*right* granularity.
- [CLARIFIED] H12 attributes S17 to "Rasika Mam"; H20 marks S17 with a circled emphasis (low-confidence priority mark).
- [OBSERVED] No enforcement anywhere (orchestrator-verified ABSENT). Confidential file3 is openable by everyone (`src/pages/AllFiles.jsx:108-110` badge only).

**Source-document check:** SD describes section *activities* but is silent on edit-right *granularity*. 🔴 Open — confirm with the requester (Rasika).

**Recommended default to confirm:** Edit rights scoped to a user's own section and role within the active workflow step; cross-section users are read-only unless the file is routed to them. Confirm exact granularity with Rasika.

### Q4.4 — Confidential file access (SD §7) — which parts Phase 1 vs Phase 2? — ✅ RESOLVED
**Question:** What does "confidential" enforce in Phase 1 (restricted view? movement-only-with-signature?), and what defers to Phase 2 (temp-file split/merge)?

**Why it matters:** Confidentiality is currently decorative; real enforcement is a security requirement.

**What we know:**
- [SPECIFIED] SD §7: restricted access, secure storage, marked CONFIDENTIAL, **movement only with signature**; temp-file creation+merge for simultaneous use is explicitly **"2nd phase"** for digital.
- [OBSERVED] `confidential` flag exists (file3 true, `src/data/dummyData.js:43, :250`) but is shown to everyone with only a badge; no gating (`src/pages/AllFiles.jsx:108-110`); confidential file activity even leaks into Reports logs.

**Source-document check (RESOLVES):** The SD draws the Phase line for us: **Phase 1** = restricted access + secure storage + CONFIDENTIAL marking + movement only with signature; **Phase 2** = the temp-file split/merge for simultaneous use. The only residual is the precise *authorization rule* (which roles may open a confidential file).

**Recommended default to confirm:** Phase 1 = restrict open/view of confidential files to authorized roles + require signed movement (SD §7); Phase 2 = temp-file split/merge (SD §7). Confirm the Phase-1 authorization rule (whitelist of roles/users per confidential file).

---

## Theme 5 — Audit, Immutability & Movement Log

### Q5.1 — What is editable vs permanently locked? — ✅ RESOLVED (for notes)
**Question:** Once submitted, are notes immutable? Can correspondence be removed? Can the file cover (subject/period/section) change after creation?

**Why it matters:** The N-C model's value is the immutable audit trail; the backend needs explicit append-only vs mutable boundaries.

**What we know:**
- [SPECIFIED] SD §2.2A: "**Old notes remain permanently for audit and record**"; new pages are added as needed; numbering cannot normally change (gaps would indicate deletions).
- [OBSERVED] Nothing persists or mutates today (all stubs), so no immutability is enforced. `isDraft` exists on notes (`src/data/dummyData.js:79, :107`) implying a draft-vs-submitted distinction.
- [CLARIFIED] H2 hints at a "Request to edit/add" mechanism on drafts/files (wording partly unclear — see Q13.1).

**Source-document check (RESOLVES the note rule):** The SD is explicit that **submitted/old notes are permanent** (append-only). Combined with SOW S3 (drafts saved *until submission*), the boundary is clear: **drafts are mutable by their owner; once submitted, notes are immutable.** The SD does not address *file-cover* edits after creation (subject/period/section) — that residual is covered by the H2 "request" mechanism (Q13.1).

**Recommended default to confirm:** Submitted notes are append-only/immutable (SD §2.2A); drafts are freely editable by their owner until submission; file-cover edits after creation require an explicit, logged change (possibly via the H2 "request" mechanism). Confirm cover-edit policy.

### Q5.2 — Movement-log completeness — ✅ RESOLVED (principle)
**Question:** Which events must be logged as movements — only Forward, or also Approve / Revert / Return / Reassign / Create / Close / Transfer?

**Why it matters:** S10 (complete file logs) and the audit guarantee depend on coverage; today only "Forwarded" exists.

**What we know:**
- [SPECIFIED] SD §5: "**All movements are recorded, ensuring traceability from start to closure**"; SD §4.3: "Every remark is signed and dated"; SD §9 (closure step 4): "complete movement history remain part of the permanent record."
- [OBSERVED] `movements[]` has only `action: 'Forwarded'` in data (`src/data/dummyData.js:158, :166, :384`); Return/Reassign/Approve are doc-only. Reports synthesizes logs from create + movement + note events (`src/pages/Reports.jsx:14-61`) but its **Date filter is dead** (`:8, :63-70`) and **Export is a demo alert** (`:72-74`).
- [CLARIFIED] H5: actions must record date-time stamp + department.

**Source-document check (RESOLVES the principle):** The SD mandates that **every movement and every remark is recorded, signed, and dated, and that the complete history is permanent**. So "log everything, immutably, start to closure" is a hard domain requirement — not a nice-to-have. The only residual is enumerating the exact event taxonomy (an engineering detail), which should follow the SD §4.3 remark types + lifecycle events.

**Recommended default to confirm:** Log every state-changing event (create, forward, check, approve, revert, return, reassign, transfer, close) immutably, each with timestamp + actor + department (H5), retained permanently (SD §5/§9). Confirm the final event list.

### Q5.3 — Export of logs/reports (H8) — 🔴 OPEN
**Question:** What formats and which reports must be exportable (CSV/PDF/Excel)? Per-file log, global audit log, or both?

**Why it matters:** S5 marks broad format support as Phase 2; need to know if export is Phase 1.

**What we know:**
- [CLARIFIED] H8 on S10: "**export**" — logs/reports must be exportable.
- [OBSERVED] Reports Export button is a stub alert (`src/pages/Reports.jsx:72-74, :80-82`).

**Source-document check:** Export is a handwriting addition; SD is silent on formats/scope. 🔴 Open.

**Recommended default to confirm:** Phase 1 = export the audit/report log to CSV (and ideally PDF). Confirm formats and scope (per-file vs global).

---

## Theme 6 — Digital Signature (S13)

### Q6.1 — What is the signature mechanism: real PKI, typed name, or image? — 🟡 PARTIAL
**Question:** Is S13 a legally-binding digital signature (PKI/DSC certificate), a typed-name attestation, or an uploaded signature image?

**Why it matters:** PKI/DSC integration is a major backend + compliance undertaking; a typed name is trivial but carries no legal weight. They are not interchangeable.

**What we know:**
- [SPECIFIED] S13: "Digital signature (**if required / approved by**)" — note the conditional phrasing.
- [SPECIFIED] SD §2.2A: a note carries a "**Signature (physical or digital), name, designation, and date**"; SD §7: confidential file "movement only with signature."
- [SPECIFIED] S14: printed docs must show "Sign, Date & Time, Approved By, Location."
- [OBSERVED] ReviewModal has only a **free-text** "Digital Signature" input, placeholder "Enter digital signature or select certificate" (`src/components/ReviewModal.jsx:187-196`); value discarded. No cert/biometric mechanism.
- [CLARIFIED] H9 groups S11/S12/S13 with the S14 approval-on-print bundle.

**Source-document check:** The SD establishes that a signature **accompanies every note** and is "physical **or** digital" with name+designation+date — i.e., the *digital* signature is an accepted equivalent of the physical one, and signature is mandatory for movement of confidential files. But the SD does **not** specify the *mechanism* (PKI/DSC vs typed vs image) or its legal weight — that conditional ("if required") is the open part.

**Recommended default to confirm:** Phase 1 = typed-name + system attestation (user, timestamp, location captured automatically) rendered on print, treated as the "digital" equivalent of the physical signature (SD §2.2A); real PKI/DSC certificate signing deferred unless legally required. **Confirm the legal-weight requirement explicitly** — it changes everything.

### Q6.2 — What metadata must a signature capture (esp. "Location", S14)? — 🟡 PARTIAL
**Question:** Does "Location" mean geolocation, section/office name, or IP/host?

**Why it matters:** Geolocation has privacy/consent implications; section name is trivial.

**What we know:**
- [SPECIFIED] SD §2.2A: the note signature block = **name, designation, date** (no "location").
- [SPECIFIED] S14: "Sign, Date & Time, Approved By, Location."
- [CLARIFIED] H5: actions record "date & time stamp, **dept.**"

**Source-document check:** The SD's signature block is name + designation + date. "Location" appears only in the SOW print requirement, and H5 says "dept." → strongly implies **"Location" = the actor's section/office/department, not GPS.**

**Recommended default to confirm:** Signature/approval captures name, designation, date-time, and **section/department** as "Location" (SD §2.2A + H5), not GPS. Confirm.

---

## Theme 7 — Correspondence Enhancements

### Q7.1 — Page-level linking ("C36 on page 5", S20b / H15) — exact behavior — 🔴 OPEN
**Question:** What does page-level linking do — deep-link a C-reference to a specific page of an attached multi-page document and render/scroll to it?

**Why it matters:** This is a non-trivial document-viewer + anchor feature; the data model needs a page anchor on references.

**What we know:**
- [SPECIFIED] S20b: "Hyperlink / drag-and-drop attachments with PAGE-LEVEL linking (e.g. C36)."
- [CLARIFIED] H15: "email attachment" + email references + hyperlink/drag-drop with page-level linking (e.g. C36).
- [OBSERVED] AddCorrespondenceModal has a Page Range field whose helper references "C/36 on page 5" (`src/components/AddCorrespondenceModal.jsx:184-193`) but **no linking logic exists** — purely cosmetic. Clickable C/n references in notes scroll to the correspondence *card*, not a page within a document (`src/pages/FileDetail.jsx:144-200`, handleReferenceClick).

**Source-document check:** SD §2.2A mentions notes "refer C/12" but only at the *document* level; page-level deep-linking is an SOW/handwriting enhancement the SD does not describe. 🔴 Open.

**Recommended default to confirm:** Page-level linking deep-links a C-reference to a page within the attached document's viewer. Confirm whether this is Phase 1 or tied to the Phase-2 attachment work (Q7.4).

### Q7.2 — Email references / email-attachment integration (S20a, H15) — 🟡 PARTIAL
**Question:** How are emails brought in — manual reference string, uploaded `.eml`/`.msg`, or live mailbox integration?

**Why it matters:** Live integration is a connector project; manual/upload is local.

**What we know:**
- [SPECIFIED] S20a: "Email references integration."
- [SPECIFIED] SD §5: when a reviewer is absent, the approval **mail is attached to the correspondence side** and annotated.
- [CLARIFIED] H15: "email attachment" + email references.
- [OBSERVED] AddCorrespondenceModal offers an "Email Reference" upload-type radio and an Email Reference text field (`src/components/AddCorrespondenceModal.jsx:138-207`); discarded on submit.

**Source-document check:** The SD already treats **an email as a correspondence document** (the absent-reviewer approval mail is "attached to the correspondence side"). So at minimum, an email must be attachable as a C-item. The SD does not describe live mailbox sync — that heavier option is the open part.

**Recommended default to confirm:** Phase 1 = attach an email as a correspondence document (upload `.eml`/`.msg` or a reference string), exactly as the SD's absent-reviewer flow needs; live mailbox sync deferred. Confirm.

### Q7.3 — Drag-and-drop attachment behavior — 🔴 OPEN
**Question:** Is drag-and-drop a Phase-1 UX requirement or a nice-to-have?

**What we know:**
- [OBSERVED] AddCorrespondenceModal already implements client-side drag-drop capture into local state (`src/components/AddCorrespondenceModal.jsx:151-157`), never transmitted.
- [SPECIFIED] S20b pairs drag-drop with page-level linking.

**Source-document check:** Pure UX; SD silent. 🔴 Open.

**Recommended default to confirm:** Drag-drop is UX sugar over the same upload pipeline; schedule it with the attachment work (Q7.4). Confirm.

### Q7.4 — Supported file formats (S5) — confirmed Phase 2 + inward stamping optional — 🟡 PARTIAL
**Question:** Confirm that "attach all printable formats (PDF/Word/Excel/JPG)" is Phase 2, and what minimal attachment support (if any) Phase 1 needs.

**Why it matters:** Storage, preview, and virus-scan concerns are large; phasing must be explicit.

**What we know:**
- [SPECIFIED] S5: support all printable formats.
- [SPECIFIED] SD §6: a received document "is stamped with **inward date and number. Not mandatory**," added as the next C-number, and referenced in the noting if required.
- [CLARIFIED] H4 on S5: marked "**2nd phase**" (trailing "9/w..." unclear — see Q13.2).
- [OBSERVED] `correspondence.fileUrl` is always `'#'` (`src/data/dummyData.js:136`); no real storage/preview/download (FileDetail View/Download buttons are dead, `src/pages/FileDetail.jsx:429-434`).

**Source-document check:** The SD confirms a **data-model fact**: inward date & number are **optional** (§6), so the attachment record must not require them. The *all-formats* support and its Phase-2 timing come from SOW + H4, not the SD.

**Recommended default to confirm:** Full multi-format attachment + preview = Phase 2 (per H4). Phase 1 may store a file reference/placeholder only; inward date/number are optional fields (SD §6). Confirm the minimal Phase-1 attachment capability.

---

## Theme 8 — Print

The print *mechanics* (page-range, summary page, header/footer, page-no-wise pagination) are SOW + handwriting additions; the SD only supplies the **cover/metadata fields** that the print header/footer would carry.

### Q8.1 — Page-range selection + summary page (S16, H11) — 🔴 OPEN
**Question:** What does the print module produce — selectable page ranges plus a generated summary page? What's on the summary page?

**Why it matters:** Print is a structured document-generation feature; it has been explicitly requested by a named stakeholder.

**What we know:**
- [SPECIFIED] S16: "Print with page-range selection AND summary page."
- [CLARIFIED] H11 attributes S16 to "Rasika Mam"; H20 circled-emphasis mark on S16 (low-confidence).
- [OBSERVED] Print is a single demo alert, shown only when `status==='Approved'` (`src/pages/FileDetail.jsx:333, :338`); no template/page-range/summary.

**Source-document check:** SD silent on print mechanics. 🔴 Open — confirm summary-page contents with Rasika.

**Recommended default to confirm:** Print supports page-range selection and an auto-generated summary page (file metadata + approval details). Confirm summary-page contents with the requester.

### Q8.2 — Approval details on printed documents (S14) — 🔴 OPEN (context from SD)
**Question:** Exactly which fields print, and for which actors (Maker, Checker(s), Final Approver, MD)?

**What we know:**
- [SPECIFIED] S14: Sign, Date & Time, Approved By, Location; plus Maker/Checker/Final Approver details.
- [SPECIFIED] SD §2.2A: each note signature already carries name + designation + date — the raw material to print per actor.
- [CLARIFIED] H9 bundles S11/S12/S13/S14 as the "approval-on-print" group.

**Source-document check:** SD supplies the per-actor signature fields (name/designation/date) but not the print *layout*. 🔴 Open on layout.

**Recommended default to confirm:** Print renders all actors in the chain with sign + timestamp + approved-by + section/location (Location = dept, per Q6.2). Confirm exact layout.

### Q8.3 — Header/footer content (H16) — 🔴 OPEN (fields confirmed by SD)
**Question:** Confirm header/footer shows file name, Period, and UN-No on every printed/displayed page.

**What we know:**
- [CLARIFIED] H16: header/footer must show "file name / Period / UN-No."
- [SPECIFIED] SD §2.1: the cover already carries file unique number, section, subject, and start/end period (period **not mandatory**) — i.e., these fields exist to populate a header/footer.
- [OBSERVED] No header/footer in print today (Print is an alert).

**Source-document check:** The SD confirms the *fields* exist on the cover (so populating a header/footer is feasible), but the header/footer requirement itself is from H16. Note the SD caveat: period may be blank (not mandatory), so the footer must tolerate a missing Period.

**Recommended default to confirm:** Header/footer carries file name + Period (may be blank, SD §2.1) + UN number (per H16). Confirm whether this is print-only or also on-screen.

### Q8.4 — Print page numbering "page-no.-wise" (H18) — 🔴 OPEN
**Question:** See Q1.4 — confirm that print applies a physical page-number sequence distinct from logical Note/C numbering.

**What we know:** [CLARIFIED] H18 (flagged unclear). SD settles the *logical* numbering (Q1.4) but is silent on print pagination. Re-confirm wording (Q13.3).

**Recommended default to confirm:** Print assigns sequential physical page numbers across the printed range, distinct from logical Note/C numbers. Confirm H18.

---

## Theme 9 — Closure & Lifecycle

### Q9.1 — File closure & successor-file linkage (SD §9, H17) — ✅ RESOLVED
**Question:** What captures closure — a closure date, a reason, and the UN number of the successor file? Is a closed file read-only forever?

**Why it matters:** Closure + successor linkage is a documented lifecycle stage entirely absent from code.

**What we know:**
- [SPECIFIED] SD §9: a file is closed when full/unmanageable; the **closing date + reason + the unique number of the new (successor) file** are recorded on the cover; in place of the old file, **a new file is opened**; files remain open until closed; documents can be added to open files even after long gaps (months/years). Closure steps: docs arranged in order → file indexed → stored in record room with file number → **start period, end period, and complete movement history remain part of the permanent record**.
- [CLARIFIED] H17: "**File close date**" — capture/display closure date.
- [OBSERVED] Status `'Closed'` never appears in data (only Open/Under Review/Approved) (`src/data/dummyData.js:36` across files); `endPeriod` always null (`:45`); no closure UI (orchestrator-verified ABSENT). Dashboard treats closure inconsistently (overdue logic excludes a 'Closed' status that never exists, `src/pages/Dashboard.jsx:11-14`).

**Source-document check (RESOLVES):** The SD specifies the entire closure stage: trigger (full/unmanageable), captured fields (close date, reason, successor file's unique number), the open-a-new-file-in-place behavior, the "files stay open until closed / documents addable after years" rule, and the permanence of period + full history. The only residual is whether the successor file is **auto-created or manually opened** — the SD's phrasing ("a new file is opened … unique number of new files recorded on the cover") reads as a **manual successor, linked by its number on the old cover.**

**Recommended default to confirm:** Closure captures close date + reason + successor file link (by UN/number), sets status to Closed, makes the file read-only, and retains full history permanently (SD §9). Default: successor is **manually opened and linked** (not auto-created). Confirm.

### Q9.2 — Cross-department permanent transfer — ✅ RESOLVED (behavior)
**Question:** How is a permanent cross-dept transfer modeled vs an ordinary forward — does ownership/section of the file itself change?

**Why it matters:** The SD calls this out specifically (Recovery→Legal example); it differs from routing (the file's home section changes, not just its current holder).

**What we know:**
- [SPECIFIED] SD "Additional Points": a file can be **permanently transferred to another person across departments** depending on requirement (Recovery→Legal due to litigation follow-up); on transfer of an activity from one department to another, the relevant files may be transferred to the receiving department.
- [OBSERVED] No transfer UI (orchestrator-verified ABSENT); only forward exists, which doesn't change `section`.

**Source-document check (RESOLVES the behavior):** The SD confirms permanent cross-department transfer is a real, distinct operation (ownership moves to another person/department), and that activity-level transfers carry the relevant files along. So it must be modeled as a **distinct action from ordinary forwarding** (it changes the file's home/owner, not just the holder). The only residual is whether the **file number/prefix changes** on transfer (SD doesn't say).

**Recommended default to confirm:** Model permanent transfer as a distinct, logged action that reassigns the file's owning person/`section` (ordinary forward does not). Default: the original file number is **retained** for traceability. Confirm whether the number/prefix should change on transfer.

### Q9.3 — Suo-moto notes (SD §8) — ✅ RESOLVED
**Question:** Is a suo-moto note (note without correspondence) a distinct flow/flag, or just a normal note with no C-references?

**Why it matters:** Determines whether the model needs a suo-moto marker or it's implicit.

**What we know:**
- [SPECIFIED] SD §8: internal notes recorded **without correspondence** (policy suggestions, administrative decisions, internal reviews).
- [OBSERVED] No distinct suo-moto concept in code (orchestrator-verified ABSENT); notes can already exist without references (`note.references` can be empty).

**Source-document check (RESOLVES the definition):** The SD defines a suo-moto note precisely: an internal note with **no correspondence**. So functionally it is "a normal note that references no C-document." Whether to add an explicit *category flag* (for filtering/reporting) is the only residual — a UX/reporting choice, not a domain ambiguity.

**Recommended default to confirm:** Suo-moto = a normal note with no correspondence references (SD §8), implemented as the default note path; add an optional "suo-moto" flag only if filtering/reporting needs it. Confirm whether the explicit flag is wanted.

---

## Theme 10 — Inbox Semantics (Inward / Outward, S7)

The Inward/Outward **inbox classification** is an SOW feature (S7); the SD uses "inward" only for incoming letters/stamping, so it does not define the inbox derivation rule. 🔴 Open.

### Q10.1 — Exact rules distinguishing Inward (Final Approved) vs Outward (Revision) — 🔴 OPEN
**Question:** What state transitions put a file into the Inward vs Outward inbox, and do they behave differently (different actions available)?

**Why it matters:** S7 requires the classification; today it's label-only. The backend needs the derivation rule.

**What we know:**
- [SPECIFIED] S7: Inbox classification for INWARD (Final Approved) and OUTWARD (Revision) files.
- [SPECIFIED] SD §2.2B/§6 use "inward" only for incoming *letters/documents* (the C-side), **not** for an inbox concept — so the SOW's "Inward inbox" reuses the word with a different meaning. Flag this terminology clash.
- [OBSERVED] `inboxType` is `'Inward'`|`'Outward'` (`src/data/dummyData.js:51`); Inbox renders it as a badge + filter only, **no behavioral difference** between the two (`src/pages/Inbox.jsx:107-111, :20`). For the hardcoded user, Outward files are assigned to another user so the revision flow is undemonstrable.

**Source-document check:** SD does not define the inbox rule (and uses "inward" differently). 🔴 Open.

**Recommended default to confirm:** Inward = file has reached final approval and is in your queue for action/awareness; Outward = file reverted to you for revision/rework. Each may expose different default actions (Outward → Add Note/resubmit; Inward → acknowledge/route). Confirm derivation (stored flag vs computed) and disambiguate the "inward" term from SD's incoming-letter meaning.

### Q10.2 — Is inboxType stored or derived? — 🔴 OPEN
**Question:** Should Inward/Outward be a persisted field or computed from the workflow state?

**What we know:** [OBSERVED] currently a stored field on File (`src/data/dummyData.js:51`). SD silent.

**Recommended default to confirm:** Derive from workflow state where possible to avoid drift. Confirm.

---

## Theme 11 — DMS Scope & the Separate File Tracking System

### Q11.1 — DMS / old-file retrieval (S15) — confirmed Phase 2 scope and boundary — 🔴 OPEN (Phase 2 per H10)
**Question:** What exactly does the inbuilt DMS cover (version control, secure storage, old-file retrieval), and what's the Phase-1 minimum?

**What we know:**
- [SPECIFIED] S15: "Inbuilt DMS with old file retrieval."
- [CLARIFIED] H10 marks S15 "**Phase 2**."
- [OBSERVED] No DMS; `fileUrl` always `'#'` (`src/data/dummyData.js:136`); no retrieval (orchestrator-verified ABSENT).

**Source-document check:** SD does not describe a DMS (it describes a record room for closed physical files, §9 — conceptually the "old file retrieval" target, but no digital DMS spec). Phasing is from H10. 🔴 Open on scope.

**Recommended default to confirm:** DMS + old-file retrieval = Phase 2 (per H10). Confirm whether any document storage is needed in Phase 1 (see Q7.4).

### Q11.2 — Relationship to the existing separate File Tracking system — ✅ RESOLVED (boundary established)
**Question:** Does this app integrate with, replace, or merely coexist with the existing File Tracking app? Is data shared?

**Why it matters:** Overlap with our movement log / Reports must be clarified to avoid duplication.

**What we know:**
- [SPECIFIED] SD "Additional Points": there is **ALSO a SEPARATE File Tracking system** which "will track & manage the flow of the files across the organisation and provide various reports. **We already have a working application** for demonstrating the functionality."
- [OBSERVED] This prototype has its own movement log + Reports page (`src/pages/Reports.jsx`).

**Source-document check (RESOLVES the boundary):** The SD is explicit that org-wide **file-flow tracking + reports already live in a separate, existing application**. Therefore *this* e-Office app should own the **N-C file content + noting/approval workflow**, and should **not rebuild** org-wide tracking/reporting — at most it feeds the tracking system. The integration *mechanism* (shared IDs? data feed? none?) is the only residual.

**Recommended default to confirm:** This app owns the N-C file/noting/approval workflow; the existing File Tracking system owns org-wide flow tracking + reports. Phase 1: keep our Reports scoped to per-file/audit logs and define a one-way feed (shared file/UN identifiers) to the tracking system. **Confirm the integration mechanism** — this is the key architectural boundary.

---

## Theme 12 — Mobile (S21, H19) — ⛔ DROPPED

### Q12.1 — Mobile scope and feature parity — ⛔ DROPPED (2026-07-03)
**Resolution:** The client instructed that the **mobile application idea is dropped completely for now** — removed from both Phase 1 and Phase 2. No further decision needed. (Original context retained below for the record.)

**Original question:** Is mobile a responsive web build or a native app, and which features must reach parity (view-only vs full approval workflow on mobile)?

**What we knew:**
- [SPECIFIED] S21: "Mobile application development."
- [CLARIFIED] H19 confirmed S21 was in scope — **now superseded by the drop instruction.**
- [OBSERVED] No mobile app; the demo is desktop-oriented.

---

## Theme 13 — Unclear Handwriting to Re-Confirm With Client

These items have low-confidence transcriptions and must be verified verbatim with the client. The SD is the clean *printed base* that was annotated, so it confirms the underlying SOW text but **cannot** decode the handwritten marks themselves. All remain 🔴 OPEN.

### Q13.1 — H2: draft "Request to edit/add" — 🔴 OPEN
**Question:** What is the "Request" mechanism on drafts/files (S3)? A workflow to request edit/add rights from a holder/approver?

**What we know:** [CLARIFIED] H2 on S3: a note about "file name" and a "Request" that can be sent to "edit/add" (wording partly unclear). Relates to lock (Theme 2) and immutability (Q5.1). SD confirms only that drafts are saved until submission and old notes are permanent — consistent with a "request to edit after submission" need, but does not describe such a request.

**Action:** Re-confirm exact wording and intent with client.

### Q13.2 — H4 trailing text on S5 — 🔴 OPEN
**Question:** What is the trailing "9/w..." annotation next to the "2nd phase" mark on S5?

**What we know:** [CLARIFIED] H4: S5 marked Phase 2; trailing fragment unclear. SD does not contain it (it's a handwritten add).

**Action:** Re-confirm; likely a date or initials.

### Q13.3 — H18 numbering semantics — 🔴 OPEN
**Question:** Confirm meaning of "any number → upto submit; print → page-no.-wise" (Q1.4 / Q8.4).

**What we know:** [CLARIFIED] H18 flagged unclear. SD resolves the *logical* numbering (Q1.4) but not this print-pagination annotation.

**Action:** Re-confirm whether this is about provisional logical numbering vs physical print pagination.

### Q13.4 — H20 circled emphasis marks — 🔴 OPEN
**Question:** Are the circled marks on S16 (print), S17 (section edit rights), and S19 (post-approval routing) priority/emphasis from the review meeting?

**What we know:** [CLARIFIED] H20: circled bullets next to S16/S17/S19 — likely emphasis (low-confidence).

**Action:** Confirm whether these denote Phase-1 priority. If so, they affect sequencing.

---

## Theme 14 — Post-Approval Routing (S19, H14)

### Q14.1 — Post-approval routing to actionable dept and return to Maker — 🟡 PARTIAL
**Question:** After final approval, what is the exact sequence — print + attach + send to the actionable department, gather their comments, then return to Maker?

**Why it matters:** S19 is a documented post-approval lifecycle with a circled emphasis mark (H20); it extends the workflow beyond approval.

**What we know:**
- [SPECIFIED] S19: post-approval routing to actionable dept for implementation + comments, then return to Maker.
- [SPECIFIED] SD §5 (a file circulates among sections, which "add comments to the notes") and SD §10 (file returned for correction → originator resubmits) provide the *circulation + return* primitives.
- [CLARIFIED] H14: post-approval action = "**Print, attached & send**" the approved file to the actionable department. H20 circled-emphasis on S19.
- [OBSERVED] No post-approval routing exists; Print is a stub (`src/pages/FileDetail.jsx:338`) and Forward is a stub (`src/components/ForwardFileModal.jsx:17-26`).

**Source-document check:** The SD supplies the building blocks — inter-section circulation with comments (§5) and return-to-originator (§10) — so the *capability* to route post-approval and return is domain-supported. But the SD does not spell out the specific **post-final-approval → implement → return-to-Maker** loop (that exact sequence is the SOW S19 + H14 enhancement). Hence 🟡.

**Recommended default to confirm:** On final approval, the holder prints + attaches the approved file (H14) and routes it to an actionable department; that department implements and adds comments (SD §5); the file then returns to the Maker (SD §10 return primitive). Model these as explicit post-approval states. Confirm the exact step sequence.

---

## Parked Implementation Notes (from discovery; NOT decisions)

These are implementation urges deliberately **not** acted on during discovery. Recorded here so they aren't lost; each should become a backlog item once decisions above are made.

- **P1 — Latent crash: ReviewModal `FiUpload` undefined.** `<FiUpload/>` rendered at `src/components/ReviewModal.jsx:174` but not imported (`:2`). The "Upload Offline MD Approval" path (S11/Q4.2) throws `ReferenceError`. Must fix before the MD-approval flow can be demoed/built.
- **P2 — Latent crash: AddNoteModal `files` undefined.** `handleSearchApprovedFiles` references `files` (`src/components/AddNoteModal.jsx:36`) but only `currentUser` is imported (`:3`). The S4 "Search Approved Files" feature (and H3 "separate search string") crashes on 3+ chars. Affects Theme 1/Theme 4 search work.
- **P3 — Dead deep-link:** Dashboard "Overdue" card links `/all-files?filter=overdue` (`src/pages/Dashboard.jsx:55`) but AllFiles never reads query params (`src/pages/AllFiles.jsx`, no useSearchParams). Decide overdue semantics when defining lifecycle/SLAs.
- **P4 — Overdue logic vs fixed seed dates:** `overdueFiles` uses live `new Date()` against 2024 seed data (`src/pages/Dashboard.jsx:11-14`); with current date 2026 every non-closed file reads as overdue. Define what "overdue" means (SLA per step?) — feeds Theme 5 and any notification design.
- **P5 — Reports Date filter dead + Export stub + raw `<a href>` row links** (`src/pages/Reports.jsx:8, :63-70, :73, :159`). Relevant to Q5.3 export decision.
- **P6 — Redundant/conflicting confidentiality inputs** in CreateFile: a fileType select "Confidential" option (`:78-87`) AND a separate "Mark as Confidential" checkbox (`:126-134`) that can disagree. Resolve when defining confidential model (Q4.4).
- **P7 — `endPeriod` bound in form but missing from initial state** (`src/pages/CreateFile.jsx:9-17` vs `:118`); works only by dynamic key assignment. Relevant to file-cover model + closure (Q9.1, which sets end period). Note SD §2.1: period is **not mandatory**, so blank must be valid.
- **P8 — No catch-all/404 route** (`src/App.jsx`); unknown URLs render an empty shell. Cosmetic, note for routing.
- **P9 — Global search bar non-functional** (`src/components/Layout.jsx:56-61`, no value/onChange/submit). Relates to the cross-entity search ambition (Theme 1/Q13 H3); decide search scope.
- **P10 — `currentAssignee` is the only routing/holder field today** (`src/data/dummyData.js:42`); the lock (Theme 2) and chain (Theme 3) models will likely supersede or extend it.

---

## What Is OUT of Scope for Phase 1 (to confirm)

The following are our recommended Phase-2 deferrals based on [CLARIFIED] handwriting and [SPECIFIED] SD. **Confirm each with the client** — these are proposals, not decisions. Items marked **SD-confirmed** are settled by the source document itself.

| # | Item | Basis | Confidence |
|---|------|-------|-----------|
| O1 | Full multi-format attachment support + preview/download (PDF/Word/Excel/JPG) — S5 | [CLARIFIED] H4 "2nd phase" | High |
| O2 | Inbuilt DMS with old-file retrieval / version control — S15 | [CLARIFIED] H10 "Phase 2" | High |
| O3 | Confidential temp-file split & merge for simultaneous use — SD §7 | [SPECIFIED] **SD-confirmed**: explicitly "2nd phase" for digital | High |
| O4 | Real PKI / DSC certificate digital signatures (vs typed-name attestation) — S13 | [SPECIFIED] S13 "if required"; SD §2.2A allows "physical or digital"; [OBSERVED] only text input | Medium — depends on legal-weight answer (Q6.1) |
| O5 | Page-level linking inside attached documents ("C36 on page 5") — S20b | [INFERRED] depends on attachments (O1) being Phase 2 | Medium — confirm pairing with O1 |
| O6 | Live email-mailbox integration (vs manual email attachment, which SD §5 requires in P1) — S20a | [SPECIFIED] SD §5 needs email-as-correspondence in P1; live sync is the deferred part | Medium |
| O7 | ~~Native mobile application~~ — S21 | ⛔ **DROPPED entirely** (client, 2026-07-03) — neither Phase 1 nor Phase 2 | Settled |
| O8 | Paragraph-level conditional approval, if it complicates Phase 1 — SD §4.2 | [SPECIFIED] SD §4.2 confirms the *mechanism*; only the Phase-1 timing is the deferral question | Low — SD-confirmed mechanism; client may want it in Phase 1 |
| O9 | Notifications (in-app/email/SMS/push) | [OBSERVED] absent; doc-only claim | Medium — confirm |
| O10 | Org-wide file-flow tracking + cross-org reports | [SPECIFIED] **SD-confirmed**: owned by the *separate existing* File Tracking app (Q11.2) — out of *this* app's scope | High — confirm integration only |

**Explicitly IN scope for Phase 1 (everything not deferred above), notably:** UN/dept display (S1), draft notes (S3), approved-file search/reference (S4), Maker-Checker-Approver workflow incl. multiple checkers and post-checker comments (S6), Inward/Outward inbox (S7), created-by visibility (S8), two-page Noting/Correspondence preview (S9), reports + export (S10/H8), MD approval incl. offline upload (S11), final-approval print with page-range + summary + approval details + header/footer (S12/S14/S16/H16), section-level edit rights (S17), predefined-but-modifiable recipient workflow (S18/H13), post-approval routing back to Maker (S19/H14), file lock concept (H6), **closure date + successor linkage (SD §9/H17 — SD-confirmed)**, **cross-dept permanent transfer (SD "Additional Points" — SD-confirmed)**, **suo-moto notes (SD §8 — SD-confirmed)**, **paragraph-level approval mechanism (SD §4.2 — SD-confirmed)**, and **complete immutable audit/movement log (SD §5/§9 — SD-confirmed)** — all subject to the decisions above.

> **Note on the two-page preview orientation (S9 / H7):** [CLARIFIED] H7 maps **L = Noting Side / R = Correspondence Side** (left/right), matching the physical N-C file (SD §2.2 "Left Side" / "Right Side"). [OBSERVED] the prototype actually **stacks the two sides vertically** — NOTING SIDE is the "Top Half" (`src/pages/FileDetail.jsx:349-352`) and CORRESPONDENCE SIDE the "Bottom Half" (`:406-409`) — not side-by-side. The SD author-margin convention (Note-1 author at right margin, later notes at left, SD §2.2A) is still honored; only the pane arrangement differs (top/bottom in code vs left/right in SD/H7). Confirm the intended Phase-1 layout (left/right vs top/bottom). This does not change any decision above; it is recorded so the left/right framing elsewhere in the discovery set is read against the current code reality.
