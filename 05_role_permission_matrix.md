# 05 — Role / Permission Matrix

This document defines the actors of the N-C (Noting-Correspondence) file system and maps every workflow action to **who is permitted to perform it per the SOW + handwritten clarifications**, alongside **what the current prototype actually enforces** (almost nothing).

> **Source labels used throughout:**
> `[OBSERVED]` = seen in prototype code (file:line cited) · `[SPECIFIED]` = SOW/DOCX · `[CLARIFIED]` = handwritten annotation (H-number) · `[INFERRED]` = reasonable assumption, flagged as such.

---

## 0. Headline finding: the prototype has NO role model

`[OBSERVED]` There is exactly one identity in the app, hardcoded:

```
src/data/dummyData.js:3-9
currentUser = { id:'user1', name:'Rajesh Kumar', designation:'Section Officer', section:'Administration', email:'...' }
```

`[OBSERVED]` Every screen renders the same actions for this one identity. There is **no login, no role object, no permission check, and no conditional rendering on role anywhere**:
- `ReviewModal` always shows all six action buttons and always labels the reviewer as `currentUser` regardless of who they are (`src/components/ReviewModal.jsx:212-215`).
- `FileDetail` shows Add Note / Add Correspondence / Forward / Review & Approve to everyone; the only conditional rendering is **status-based** (Print appears only when `file.status === 'Approved'`, `src/pages/FileDetail.jsx:333`), never role-based.
- `PendingApprovals` does not even import `currentUser` — it shows *all* `Under Review` files to *anyone* (`src/pages/PendingApprovals.jsx:10`), so a Maker sees the same approval queue as an MD.

`[OBSERVED]` The string `author.role` (`'Maker'` / `'Checker'`) exists **only as descriptive seed metadata** on file1's two notes (`src/data/dummyData.js:75,103`) and is **absent on notes 3/4/5**. It is never read to gate behavior. Designations on `users[]` (Section Officer, Deputy Director, Director, Accountant, Legal Advisor, Audit Officer — `dummyData.js:21-26`) are display strings, not roles.

**Implication for the backend team:** roles below are entirely a *target* model derived from SOW + handwriting. None of them exist in code yet. The "Prototype enforces?" column is therefore "No" on essentially every row; where the prototype even *exposes the UI affordance* (vs. omits it entirely) is noted, because that affects how much UI scaffolding already exists.

> **Layout note (cross-doc consistency):** `[CLARIFIED]` H7 maps the two file sides L = Noting / R = Correspondence, and sibling docs 01/02 describe a left/right "two-pane" view. `[OBSERVED]` the prototype actually **stacks them vertically**: NOTING SIDE is the "Top Half" (`src/pages/FileDetail.jsx:349-352`) and CORRESPONDENCE SIDE the "Bottom Half" (`src/pages/FileDetail.jsx:406-408`). The SOW author-margin convention (Note 1 author at right, later notes at left) is still satisfied; only the left/right-vs-top/bottom framing differs. This does not affect any role/permission row below.

---

## 1. Roles

| Role | Origin | Definition | Cardinality |
|------|--------|-----------|-------------|
| **Originator / Maker** | `[SPECIFIED]` SOW 3.1, 4.2 · `[OBSERVED]` `File.maker`, `author.role:'Maker'` | Opens the file, writes Note 1, places C/1, plans the initial flow, makes corrections on revert, owns the file when it returns. SOW says *"a new file can be opened by anyone."* | 1 per file (the creator) |
| **Checker** | `[SPECIFIED]` SOW 3.2, 4.3 · `[OBSERVED]` `File.checkers[]` (array), `author.role:'Checker'` | Examines noting, verifies completeness, records "Check", may comment, endorses or returns. | **Multiple** per file `[SPECIFIED]` S6a; data models `checkers[]` as an array (`dummyData.js:47-49`) though samples carry 0-1. |
| **Approver / Final Approver** | `[SPECIFIED]` SOW 3.2, 4.3 · `[OBSERVED]` `File.approver` (`dummyData.js:50,257`) | Evaluates proposal, grants Approve / Approve-with-conditions / Reject; the *final* approver concludes the chain. SOW does not crisply separate "Approver" from "Final Approver." | ≥1 reviewer; exactly 1 *final* approver `[INFERRED]` |
| **MD (Managing Director)** | `[SPECIFIED]` S11 · `[CLARIFIED]` H9 | Highest approval authority. Approval may arrive **offline / scanned** and be uploaded into the file. Whether MD is distinct from "Final Approver" or is the top instance of it is unclear (see open questions). | 1 (org-level) `[INFERRED]` |
| **Actionable-Department user** | `[SPECIFIED]` S19 · `[CLARIFIED]` H14 ("Print, attached & send") | Receives the file **after** final approval for implementation, adds implementation comments, then returns it to the Maker. | 1+ per routing `[INFERRED]` |
| **Admin** (implied) | `[INFERRED]` (docs claim it; not in SOW core) | Manages users/sections/edit-rights; would administer S17 section-level edit rights. The prototype docs claim role-based access incl. Admin (`Quick_Reference_Summary.md:86-108`) but **code has none**. | Org-level `[INFERRED]` |
| **Confidential-access holder** | `[SPECIFIED]` SOW 7 | Whoever is cleared to view/move a CONFIDENTIAL file; movement only with signature. Not a separate "person role" so much as a clearance attribute. `[OBSERVED]` `confidential` flag exists (file3, `dummyData.js:250`) but is purely a badge — no gating (`src/pages/AllFiles.jsx:108-110`). | clearance, not a seat `[INFERRED]` |

**Note on "the same person plays many roles":** `[SPECIFIED]` SOW 5 lets *any concerned person* change the flow when a reviewer is on leave, and `[CLARIFIED]` H13 lets a reviewer add a checker/recipient mid-flow. So these roles are **positional per file**, not fixed per user — the backend should model role as *a participant's relationship to a specific file/note*, not a global user attribute.

---

## 2. Actions × Roles matrix (authoritative intent)

Legend: **Y** = permitted · **N** = not permitted · **C** = conditional (see note) · **—** = role not involved.
"Prototype enforces?" answers *does the running code restrict this action to the right role?* (cite). "Affordance in code?" notes whether the UI element even exists.

| # | Action | Maker | Checker | Approver | MD | Action-Dept | Admin | Source | Prototype enforces? | Affordance in code? |
|---|--------|:-----:|:-------:|:--------:|:--:|:-----------:|:-----:|--------|---------------------|---------------------|
| 1 | **Open / create a file** | Y | C¹ | C¹ | C¹ | C¹ | C¹ | `[SPECIFIED]` SOW 3.1 ("anyone") | **No** — `CreateFile.handleSubmit` is `alert('… Demo mode')` then navigate; no role check, no persistence (`src/pages/CreateFile.jsx:19-24`) | Form exists; File Number is free-text not auto-gen (`CreateFile.jsx:49-58`); **no UN-number field**; **no initial-routing UI** — conflicts H1 & SOW 3.1 |
| 2 | **Write Note 1** | Y | — | — | — | — | — | `[SPECIFIED]` SOW 4.2 (originator drafts initial note) | **No** — `AddNoteModal.handleSubmit` alerts only (`src/components/AddNoteModal.jsx:15-23`) | Yes (modal) |
| 3 | **Add a subsequent note** | Y | Y | Y | Y | Y | — | `[SPECIFIED]` SOW 2.2A ("each new member continues on the same note sheet") | **No** — same alert stub | Yes |
| 4 | **Comment AFTER checker approval** | C² | Y | Y | Y | — | — | `[SPECIFIED]` S6b · models `checkerComments[]` (`dummyData.js:115-123`) | **No** — no post-approval comment flow distinct from a normal note; nothing persists | Partial — `checkerComments[]` modeled in data only; no UI path produces them |
| 5 | **Attach correspondence (C/n)** | Y | Y | Y | Y | Y | — | `[SPECIFIED]` SOW 6, S5 (Phase 2 per H4) | **No** — `AddCorrespondenceModal` submit alerts (`src/components/AddCorrespondenceModal.jsx:35-40`) | Yes — incl. file/drag-drop + email-ref toggle + page-range field, but submit discards all |
| 6 | **Reference an existing APPROVED file when noting** | Y | Y | Y | Y | — | — | `[SPECIFIED]` S4 · `[CLARIFIED]` H3 ("Search string – separate") | **No** — and **CRASHES**: `handleSearchApprovedFiles` references undefined `files` (only `currentUser` imported) → ReferenceError on 3+ chars (`src/components/AddNoteModal.jsx:31-45, import line 3`) | Yes but broken |
| 7 | **Check** (the canonical "Check" action) | N | Y | C³ | C³ | — | — | `[SPECIFIED]` SOW 4.3, S6c · `[CLARIFIED]` H5 (must stamp date-time + dept) | **No** — `ReviewModal` shows the button to everyone; submit alerts (`ReviewModal.jsx:24`); no date-time/dept capture (H5 unmet) | Yes (button) |
| 8 | **Approve** | N | C³ | Y | Y | — | — | `[SPECIFIED]` SOW 4.3, S6c | **No** — any identity can click Approve | Yes |
| 9 | **Approve-with-conditions (paragraph-level A/B/C)** | N | C³ | Y | Y | — | — | `[SPECIFIED]` SOW 4.2 (mark a paragraph "A"); models `approvals[{paragraph}]` (`dummyData.js:112-114`) | **No** — paragraph checkboxes are local state, unused on submit (`ReviewModal.jsx:28-34,118-136`) | Yes (UI present; exceeds canonical 3 actions) |
| 10 | **Revert / Return to originator** | N | Y | Y | Y | — | — | `[SPECIFIED]` SOW 4.3, 10, S6c | **No** — button present, alert-only | Yes |
| 11 | **Reject** | N | C³ | Y | Y | — | — | `[SPECIFIED]` SOW 4.3 ("Rejection") | **No** | Yes — **note:** SOW/H name only Check/Approve/Revert as canonical 3; modal exposes 6 (scope creep) |
| 12 | **Request clarification** | N | Y | Y | Y | — | — | `[SPECIFIED]` SOW 4.3 ("Clarification request") | **No** | Yes (6th button) |
| 13 | **Plan initial recipient list (at creation)** | Y | — | — | — | — | — | `[SPECIFIED]` SOW 3.1, 5, S18 | **No — affordance MISSING**: `CreateFile` has no recipient/routing UI at all (`CreateFile.jsx` form fields). Routing only exists at *forward time* | **No** at creation |
| 14 | **Add a checker / recipient mid-flow** | Y | Y | Y | Y | C⁴ | — | `[CLARIFIED]` H13 · `[SPECIFIED]` SOW 5 ("each reviewer can add further members") | **No** — `ForwardFileModal` lets anyone multi-select/reorder recipients; submit alerts (`src/components/ForwardFileModal.jsx:17-26`) | Yes (the one real recipient-workflow UI) |
| 15 | **Reroute when reviewer is on leave** | Y | Y | Y | C | C | — | `[SPECIFIED]` SOW 5 ("any concerned person may change the flow"; colleague takes approval on mail, attach to correspondence, write 'on leave…') | **No** — no leave/delegation concept; ForwardFileModal would be the closest stub | Partial (generic forward only) |
| 16 | **Upload MD / offline scanned approval** | C⁵ | C⁵ | C⁵ | Y | — | — | `[SPECIFIED]` S11 · `[CLARIFIED]` H9 | **No — and CRASHES**: clicking "Upload Offline MD Approval" renders `<FiUpload/>` which is **not imported** → ReferenceError (`ReviewModal.jsx:174` vs imports `:2`). Helper text even says "Any maker or checker can upload" (`:181`) | Yes but broken |
| 17 | **Apply digital signature** | C | Y | Y | Y | — | — | `[SPECIFIED]` S13 ("if required / approved by") · `[CLARIFIED]` H9 | **No** — free-text input only; value discarded (`ReviewModal.jsx:188-195`); not a real signing/cert mechanism | Partial (text box) |
| 18 | **Grant FINAL approval** | N | N | C⁶ | Y | — | — | `[SPECIFIED]` SOW 4.3 ("final decision"), S6, S11 | **No** — no notion of "final"; any Approve alert is identical | No distinct affordance |
| 19 | **Print final approved file** | Y | Y | Y | Y | Y | — | `[SPECIFIED]` S12, S16 · `[CLARIFIED]` H11 (Rasika Mam: page-range + summary), H18 (page-no-wise on print), H14 | **No** — Print button only when `status==='Approved'`, onClick alerts (`FileDetail.jsx:333-343`); **no page-range, no summary page, no approval-detail template** (S14/S16 unmet) | Partial (status-gated alert) |
| 20 | **Post-approval route to actionable dept + return to Maker** | C⁷ | — | C⁷ | C⁷ | Y | — | `[SPECIFIED]` S19 · `[CLARIFIED]` H14 ("Print, attached & send") | **No — affordance MISSING**: no post-approval routing or return-to-maker flow exists | **No** |
| 21 | **Section-level edit rights** | Y | Y | Y | — | — | C⁸ | `[SPECIFIED]` S17 · `[CLARIFIED]` H12 (Rasika Mam) | **No — ABSENT**: no edit-rights model; notes/files not editable at all (all stubs) | **No** |
| 22 | **Close file (record closure date + successor)** | C⁹ | N | C⁹ | C⁹ | — | C⁹ | `[SPECIFIED]` SOW 9 · `[CLARIFIED]` H17 ("File close date") | **No — ABSENT**: status `'Closed'` never used; `endPeriod` always null; no closure UI | **No** |
| 23 | **Transfer file permanently across departments** | C¹⁰ | — | C¹⁰ | C¹⁰ | — | C¹⁰ | `[SPECIFIED]` SOW "Additional Points" (Recovery→Legal example) | **No — ABSENT**: no cross-dept transfer UI; only generic forward exists | **No** |
| 24 | **Access a CONFIDENTIAL file** | C¹¹ | C¹¹ | C¹¹ | C¹¹ | C¹¹ | C¹¹ | `[SPECIFIED]` SOW 7 ("restricted access; movement only with signature") | **No — NOT enforced**: confidential file3 is openable by everyone; only a badge renders (`AllFiles.jsx:108-110`); its notes/movements even leak into Reports | Badge only |

### Conditional notes

1. **C¹ (open file):** `[SPECIFIED]` SOW 3.1 literally says *"a new file can be opened by anyone,"* so every role can create. Whoever creates becomes the Maker for that file. (Conflicts with `[CLARIFIED]` H1 "Auto-generated Sr. no. upon submission" — see open questions on numbering authority.)
2. **C² (Maker comment after checker approval):** `[INFERRED]` the Maker would normally respond to checker comments via a new note rather than a "checker comment," but S6b's intent (commenting *after* checker approval) is reviewer-side; Maker participation is by adding a subsequent note (row 3).
3. **C³ (Checker doing Approve/Reject/conditions):** `[INFERRED]` depends on org hierarchy — a senior checker may also hold approval authority; SOW does not forbid it. Backend should make this a per-file grant, not a global rule.
4. **C⁴ (Action-Dept adding recipients):** `[INFERRED]` post-approval the action dept adds implementation comments and returns to Maker; whether it can extend the flow further is unspecified.
5. **C⁵ (Maker/Checker uploading MD approval):** `[SPECIFIED]`/`[OBSERVED]` the prototype's own helper text says *"Any maker or checker can upload physical scanned approval"* (`ReviewModal.jsx:181`), matching SOW 5's "colleague takes approval on mail, attaches it." So upload of an *offline* approval is broadly permitted; the *authority being recorded* is the MD's.
6. **C⁶ (Approver = Final Approver?):** `[INFERRED]` SOW conflates them; "final" is whoever concludes the chain (possibly MD). See open questions.
7. **C⁷ (who triggers post-approval routing):** `[INFERRED]` likely the final approver or Maker; SOW says it returns to Maker after the dept acts.
8. **C⁸ (Admin & edit rights):** `[CLARIFIED]` H12 attributes S17 to Rasika Mam but does not say who *grants* the rights; `[INFERRED]` an Admin/section-head assigns them.
9. **C⁹ (close file):** `[SPECIFIED]` SOW 9 — closure is a custodial/originator-side act when a file is full; exact authority unspecified.
10. **C¹⁰ (cross-dept transfer):** `[SPECIFIED]` SOW Additional Points — driven by activity transfer; authority unspecified.
11. **C¹¹ (confidential access):** `[SPECIFIED]` SOW 7 — restricted to cleared participants; the backend must define the clearance list. Today it is fully open.

---

## 3. Phase tagging that intersects roles

`[CLARIFIED]` From the handwriting, these role-bearing actions are **Phase 2** and should not block Phase-1 role design:
- Row 5 attach-all-formats (H4) · Row (DMS/old-file retrieval, S15, H10) · confidential temp-file/merge handling (SOW 7, "2nd phase").

Everything else above is implicitly **Phase 1**.

---

## 4. Open role questions (for the planning meeting)

1. **Can *anyone* really open a file?** `[SPECIFIED]` SOW 3.1 says yes, but `[CLARIFIED]` H1 ("auto-generated Sr. no. upon submission") implies the *number* is system-assigned. Does "anyone can open" mean any authenticated user, or any user within a section? And who is allowed to open a **confidential** file (SOW 7)?
2. **MD vs Approver vs "Final Approver" — distinct seats or one ladder?** S11 calls out MD specifically and S14 lists "Final Approver" separately from "Approver." Are these three roles, or one approval chain where MD is the top rung? This determines whether row 7/8/18 need separate grants.
3. **What does "file locked – Creator / Checker" (`[CLARIFIED]` H6) actually permit/forbid?** Is a "lock" an exclusive write-hold (only the current holder can edit, mirroring the physical "file is in X's hands") and others are read-only? Does locking block forwarding, or only editing? This is the closest thing to a concurrency/permission primitive in the requirements and is currently undefined in code.
4. **Multiple checkers (S6a): sequential or parallel?** Does the file move checker→checker in order (the `recipientOrder[]` reorder UI in ForwardFileModal hints at sequence), or can checkers act independently? Does *every* checker need to "Check" before an Approver can Approve?
5. **Six review actions vs. canonical three.** `[OBSERVED]` `ReviewModal` exposes Check / Approve / Revert / Approve-with-conditions / Reject / Request Clarification, but SOW + handwriting (S6c, H5) name only **Check / Approve / Revert**. Are Reject / Conditions / Clarification in scope, and are they role-gated differently?
6. **Section-level edit rights (S17/H12): granularity?** Per-section, per-file, or per-note? Who assigns them (Admin? section head?) and do they override the "file locked" holder?
7. **Confidential access list:** SOW 7 says "restricted access… movement only with signature." Who composes the access list — the Maker at creation, or an Admin? How does it interact with cross-dept transfer (row 23) of a confidential file?
8. **Post-approval routing authority (row 20, S19/H14):** who pushes the approved file to the actionable dept — the final approver automatically, or the Maker manually after print? And can the action-dept user edit notes or only comment?
9. **Delegation / on-leave (row 15, SOW 5):** should the backend model a formal delegate, or just allow "any concerned person" to act (as SOW literally states) with an audit note? The latter is permissive and has access-control implications.
10. **Is there an Admin role at all?** Prototype docs claim one (`Quick_Reference_Summary.md:86-108`) but neither SOW core nor the handwriting names it explicitly. If S17 edit-rights and user/section management are in scope, an Admin seat is implied but unconfirmed.

---

## 5. One-line takeaway for the backend team

Design roles as **per-file participant relationships** (Maker/Checker[]/Approver/Final-Approver/MD/Action-Dept) plus two orthogonal attributes — **confidential clearance** (SOW 7) and a **lock holder** (H6) — and an **Admin** for edit-rights/user admin. The prototype contributes UI scaffolding for *some* of these actions (notably the Forward recipient workflow and the Review action buttons) but **enforces none of them** and contains two confirmed crashes on role-adjacent paths (MD-upload `FiUpload` and approved-file search `files`), so all permission logic is greenfield.
