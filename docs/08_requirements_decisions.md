# 08 — Requirements Decisions Log

**Date:** 2026-07-03 · **Basis:** client-completed questionnaire *"eOffice_Requirements_Questionnaire_v2 edited answer.docx"* reconciled against `07_open_questions.md`, the process document, and the prototype.

This log closes out the open questions. For every item it records **the decision, its source, and its status**, so the next (backend/architecture) session can proceed from a settled baseline. It supersedes the "open" framing of `07_open_questions.md` (that file is kept as the analysis trail and now carries a banner pointing here).

**As of 2026-07-03 there are no open questions blocking backend planning** — the six clarifications flagged in Section A were answered by the client (A1–A4) or are low-stakes defaults we're proceeding on (A5–A6).

**Status legend:**
- ✅ **DECIDED (client)** — the client answered (questionnaire or follow-up); their wording is authoritative.
- 🟩 **DEFAULT APPLIED** — the client left it blank; per instruction we proceeded with our recommended default. Reversible on request.
- 📘 **SETTLED (process doc)** — already answered by the process document; client raised no disagreement.
- ⛔ **DROPPED / OUT OF SCOPE** — removed by explicit instruction or clarified as non-existent.

---

## Section A — Clarifications (resolved 2026-07-03)

All six flagged items were put to the client and answered. **A1–A4 are decided** (below); **A5–A6 are low-stakes defaults** we are proceeding on unless told otherwise.

| # | Item | ✅ Resolution |
|---|------|--------------|
| **A1** | Is there a newer codebase than the demo? | ✅ **No — it does not exist; we build it.** The *"already implemented"* phrasing in answers D3/D12 describes **intended design**, not existing code. The discovery set (`02`/`04`/`05`/`06`) remains the valid baseline; the backend is **greenfield**. |
| **A2** | Digital-signature legal weight | ✅ **Phase 1 = typed name + automatic system attestation** (user, timestamp, section), shown on print. Certificate-based **PKI/DSC deferred** (Phase 2, only if later required). |
| **A3** | File Tracking integration boundary | ✅ **No integration — no such software exists.** The "separate File Tracking system" is a **physical/manual** process today. *(This corrects the process document's claim of "a working application.")* This app **stands alone**; there is nothing to feed. Org-wide cross-org tracking stays **out of scope** for now. |
| **A4** | Phase 1 / Phase 2 split | ✅ **Accepted** as proposed in Section E. |
| **A5** | Report export formats | 🟩 Proceeding with **CSV + PDF** (per-file + org-wide audit log). Reversible on request. |
| **A6** | Numbering label & "Inward" term | 🟩 Proceeding: **`DEPT/YEAR/SEQ` is the displayed number**, "UN-No." = a label for it; **"Inward" uses your D7 meaning** (routed-to-you). Reversible on request. |

---

## Section B — Decisions now locked (client-answered)

| 07 ref | Topic | ✅ Decision (client) | Q# |
|--------|-------|----------------------|----|
| Q1.1 | **File number generation** | System **auto-generates** the number on submission as **`DEPT/YEAR/SEQ`** (e.g. `ACC/2026/001`); department code + year derived automatically; sequence system-managed. Users may **optionally** enter a separate custom `fileNumber`. | D1 |
| Q1.2 / Q1.3 | **Identifier model & uniqueness** | Three-tier identity: **internal UUID** (org-wide, permanent, the primary key) + **`DEPT/YEAR/SEQ`** display number (unique **per department + year, sequence resets yearly**) + optional user-entered custom `fileNumber`. | D1, D2 |
| Q4.3 | **Section-level edit rights** | A user may edit **only notes they authored**, and **only while status is `DRAFT` or `REVERTED`**. Correspondence may be added by the **Maker or the active Checker**. Everyone else is **read-only unless the file is routed to them**. *(Client: "already implemented this way" → see A1.)* | D3 |
| Q8.1 / Q8.2 | **Print — page range & approval summary** | Page-range selection = **full / last note / custom range**. An **approval summary table** at the end lists every actor with **role, name, designation, department, date/time, location, signature**. Output is **two separate PDFs: a Noting PDF and a Correspondence PDF**. | D5 |
| Q8.3 | **Header / footer** | Every printed page: **header** = file number, department, subject, printed date; **footer** = page number + **confidential watermark**. On-screen "header" = the existing file-cover panel at the top of File Detail. *(Rasika Ma'am to provide a sample PDF.)* | D6 |
| Q10.1 | **Inbox Inward / Outward rule** | **Inward** = file/note **routed to you** (you are the next pending workflow step). **Outward** = file **reverted to you for rework** (status `REVERTED`). *(Note: this redefines SOW's "Inward = final approved" — see A6b.)* | D7 |
| Q9.2 | **Cross-department transfer — number** | File number **does not change** on transfer; the same unique number is kept throughout. Transfer is logged in movement history with **from-department, to-department, initiator, date, reason**. | D11 |
| Q3.1 | **Routing model** | A **modifiable recipient list**: steps added mid-flow via an **"Add Reviewer"** action, removed if not yet completed, reordered by insert position. Originator sets the initial list at note creation; any active reviewer can add steps. | C5 |
| Q3.3 | **Sequential vs parallel checkers** | **Strictly sequential** by `stepOrder` — step 2 cannot act until step 1 completes. **Parallel review is not supported.** | C6 |
| Q7.4 | **Attachment formats (Phase 1)** | **Phase 1 supports PDF only.** (Multi-format = Phase 2; inward date/number remain optional.) | C13 |
| S9 / H7 | **Two-page preview layout** | **On screen: keep stacked top/bottom** (Noting top, Correspondence below). **In print PDF: side-by-side** (Noting left, Correspondence right, two-column). *(Client: print already side-by-side → see A1.)* | D12 |
| Q13.1 | **The "Request to edit/add" note (H2)** | Interpreted as: **the responsible role is assigned at file creation**, and viewing/editing permissions follow from that role assignment. (So it folds into the role-based edit-rights model, Q4.3 — not a separate request workflow.) | D13 |

---

## Section C — Defaults applied where you left it blank

Per your instruction ("do your suggested thing for no answers"), we proceeded as follows. All are reversible.

| 07 ref | Topic | 🟩 Default applied | Confirm? |
|--------|-------|--------------------|----------|
| Q1.2 | UN-No. vs display number | `DEPT/YEAR/SEQ` is the single displayed number; "UN-No." is a label for it. | A6a |
| Q1.4 | Note/C numbering fixed once submitted | Logical Note/C numbers are file-scoped, sequential, immutable once submitted, gaps preserved (matches C2 wording). | — |
| Q2.1 | One holder at a time | One holder holds/edits; others read-only; screen shows whether Creator or Checker holds it — **narrowed by D3** (holder edits only own notes in DRAFT/REVERTED). | — |
| Q2.2 | Drafts on transfer | Draft notes are owner-scoped and do **not** travel when the file moves. | — |
| Q3.4 | Comment after approval | Append-only; does not erase prior approval; revert is a separate explicit action. | — |
| Q3.5 | Review actions | Core **Check / Approve / Revert**; Reject / Request-clarification / Approve-with-conditions as variants; every action stamps date, time, department. | — |
| Q4.2 | MD role | MD = senior **terminal** approver; approval may be an uploaded scanned document; not a separate process role. | — |
| Q5.1 / C14 | File-cover edits after creation | Allowed but recorded as a logged change. | — |
| Q5.3 | Report/log export | **CSV + PDF**, both per-file and org-wide audit log. | A5 |
| Q6.1 | Signature mechanism | **Phase 1 = typed name + system attestation** (user, timestamp, section) on print; PKI/DSC deferred. | ✅ A2 (confirmed) |
| Q6.2 | "Location" | = actor's **section/office**, not GPS. | — |
| Q7.2 | Email references | Phase 1 = attach an email as a correspondence document/reference; live mailbox sync deferred. | — |
| Q11.1 | DMS / old-file retrieval | **Phase 2.** Phase-1 minimum = store & view **PDF** attachments (needed anyway by C13). | ✅ A4 |
| Q11.2 | File Tracking integration | ✅ **No integration — the separate tracking system is physical/manual; no software exists.** This app stands alone; org-wide cross-org tracking is out of scope. | ✅ A3 (confirmed) |
| Q13.2 | Handwriting "9/w…" | Unreadable and not clarified; treated as **immaterial** and dropped unless it resurfaces. | (n/a) |
| Q13.3 / Q8.4 | "any number up to submit; print page-no.-wise" | Logical numbers provisional until submit, then fixed; **print uses its own physical page numbers** (separate sequence). Consistent with C2. | — |
| Q13.4 | Circled emphasis (Print, Section-edit-rights, Post-approval routing) | Treated as **Phase-1 priorities**. | A4 |
| Q14.1 | Post-approval routing | On final approval: print + attach + route the approved file to the actionable department, which implements and comments; file then returns to Maker. | — |

---

## Section D — Settled by the process document (client raised no disagreement)

📘 These stand as previously analyzed (Part 3 of the questionnaire; disagreement box left blank):

- **Who can open a file:** any user.
- **Initial routing:** originator plans the flow on the note at creation; later reviewers add members.
- **Absent-reviewer override:** colleague/reporting officer may approve by email (attached + annotated "on leave, approval received on mail"); if urgent, any concerned person may change the flow — all recorded.
- **Paragraph-level approval:** may be recorded against a specific paragraph (marked 'A' etc.). *Mechanism confirmed; Phase-1 granularity is in Section E.*
- **Confidential files:** restricted access, secure storage, CONFIDENTIAL mark, movement only with signature. Temp-file split/merge = Phase 2.
- **Permanent notes & audit:** submitted notes are permanent; every action signed, dated, recorded; full movement history retained.
- **File closure:** cover records close date + reason + successor file's number; a new file opens in its place; documents addable after long gaps; full history permanent.
- **Cross-department transfer:** permanent transfer supported; related files move on activity transfer. *(Number does not change — D11.)*
- **Suo-moto notes:** notes with no correspondence, supported as ordinary notes.
- **~~Existing File Tracking app~~ — CORRECTED:** the client clarified the org-wide File Tracking is a **physical/manual process — no software exists** (the process document's "working application" was inaccurate). So there is nothing to integrate with; this app stands alone, and org-wide cross-org tracking is out of scope (A3).
- **Data details:** file-cover start/end period **not mandatory**; correspondence inward date/number **not mandatory**; a file is opened **for a purpose** (AMC, purchase, customer, project…) that groups its documents.

---

## Section E — Scope changes & Phase 1 / Phase 2

### ⛔ Dropped from scope (by instruction)
- **Mobile application (native *and* responsive) — DROPPED completely for now.** Removed from Phase 1 and Phase 2. (Was SOW S21 / annotation H19 / questionnaire D9 / Part-4 item 7.) Reflected in `06` and `07`.

### Phase split (proposal — please confirm, A4)

**Phase 1 (build now):** auto-numbering & three-tier identity (D1/D2); draft notes; approved-file search/reference; modifiable sequential recipient workflow with "Add Reviewer" (C5/C6); Check/Approve/Revert + variants with date/time/dept stamping; Inward/Outward inbox per D7; created-by visibility; two-page Noting/Correspondence view (stacked on screen); reports + **CSV/PDF export**; MD approval incl. offline scan upload; **print** (page-range + approval-summary + header/footer + separate Noting/Correspondence PDFs, D5/D6); section-level edit rights per D3; post-approval routing + return to Maker; file-lock/holder indicator; closure + successor linkage; cross-dept transfer (number unchanged); suo-moto notes; **PDF-only attachments** (C13); paragraph-level approval *mechanism*; complete immutable audit log; typed-name signature + attestation.

**Phase 2 (deferred — confirm):**

| # | Deferred item | Basis |
|---|---------------|-------|
| 1 | Multi-format attachments + preview/download (Word/Excel/JPG…) beyond PDF | H4 "2nd phase"; C13 "Phase 1 PDF only" |
| 2 | Inbuilt DMS + old-file retrieval / version control | H10 "Phase 2" (Phase-1 keeps PDF store/view) |
| 3 | Confidential temp-file split & merge | Process doc "2nd phase" |
| 4 | Certificate-based (PKI/DSC) signatures | ✅ Deferred (A2 — Phase 1 uses typed-name + attestation) |
| 5 | Page-level linking inside documents ("C36 on page 5") | Pairs with multi-format attachments |
| 6 | Live email-mailbox integration (manual attach stays Phase 1) | Heavier connector work |
| 7 | ~~Native mobile app~~ | **DROPPED** (see above) |
| 8 | Paragraph-level approval *full granularity* (Phase 1 may start whole-note) | Mechanism confirmed; granularity optional |
| 9 | Notifications (in-app/email/SMS/push) | Not in process doc |
| 10 | Org-wide flow tracking + cross-org reports | ⛔ Out of scope (not Phase 1 or 2) — currently a physical/manual process, no software to own it (A3) |

---

## Section F — Discovery flags to carry into backend planning

1. **"Already implemented" claims — RESOLVED (A1).** The client confirmed there is **no newer codebase**; D3/D12's "already implemented" phrasing described *intended design*. Nothing to re-baseline — the discovery docs remain valid and the backend is **greenfield**.
2. **File Tracking is physical — CORRECTED (A3).** The process document said a File Tracking "working application" exists; the client clarified it is a **physical/manual** process with **no software**. This app does **not** integrate with or depend on it, and org-wide cross-org tracking is **out of scope**. (Also correct `07` Q11.2 / the process-doc-derived claim if reused.)
3. **Three-tier identity.** The data model must carry a permanent internal **UUID** (PK) *plus* a per-year **`DEPT/YEAR/SEQ`** display number (dept+year, yearly reset) *plus* an optional custom `fileNumber`. Feeds `04_inferred_data_model.md`.
4. **"Inward" redefinition.** Client's D7 meaning ("routed to you / next step") differs from SOW S7 ("final approved"). Use the client's definition; watch for the term's double meaning (it also names incoming letters on the correspondence side).
5. **Statuses named by client:** `DRAFT`, `REVERTED` (edit-gating, D3) and a step model with `stepOrder` (C6). Concrete enough to seed the workflow state machine.
6. **Print is two PDFs** (Noting + Correspondence), side-by-side layout, with a confidential watermark and an approval-summary table — a structured document-generation component, not a browser print dialog.
