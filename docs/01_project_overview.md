# e-Office N-C File System — Project Overview

## 1. What this system is, and the problem it solves

This project digitizes the **Noting–Correspondence (N-C) file** — the backbone of how government departments and public-sector organizations process decisions, approvals, and records.

In a traditional office, when something needs a decision (renewing a maintenance contract, approving a purchase, responding to a court order), staff open a **physical file folder**. That folder travels desk to desk: someone writes a note proposing an action, a senior reviews and signs it, supporting documents get attached, and eventually a final authority approves it. The folder is then acted on and archived. Decades later, anyone can pull the file and see exactly *what was decided, by whom, on what date, and based on which documents.*

That paper process gives offices four things they cannot live without:
- **Accountability** — every note is signed; you always know who said what.
- **Traceability** — every movement of the file is recorded, start to closure.
- **Structured approvals** — a clear maker → checker → approver chain.
- **A permanent record** — nothing is erased; the history *is* the file.

The downside of paper is obvious: files get lost, sit on desks, can't be in two places at once, and are painfully slow to search. This system recreates the *exact same discipline* digitally, while removing the friction.

## 2. The two-sides metaphor: Noting vs Correspondence

Every physical N-C file is literally two-sided, and the digital version preserves this. [SPECIFIED — DOCX §2.2]

| Side | What it holds | How it's numbered |
|------|---------------|-------------------|
| **NOTING SIDE (Left)** | The sequential, signed **notes** — proposals, observations, approvals, instructions. This is the decision trail. | `Note 1 → Note 2 → Note 3 …` |
| **CORRESPONDENCE SIDE (Right)** | The supporting **documents** — incoming letters, bills, quotations, court orders, reports. | `C/1, C/2, C/3 …` |

The two sides talk to each other through **references**. A note doesn't re-paste a document; it points to it: *"As per the quotation at **C/1**, I propose…"* or *"Refer to the observation in **Note 2**."* In this prototype those `C/n` and `Note n` tokens are **live clickable links** — clicking one scrolls to and highlights the target document or note. [OBSERVED — `src/pages/FileDetail.jsx`, `renderNoteContent()` / `handleReferenceClick()`]

A small visual touch carries over from paper convention: the **originator's** name sits at the **right** margin of the first note, while **later reviewers'** names sit at the **left** margin. [SPECIFIED — DOCX §2.2A] [OBSERVED — `FileDetail.jsx` note rendering]

One layout caveat for planners: the physical *left/right* convention (Noting on the left, Correspondence on the right — also mapped by handwriting H7: L = Noting, R = Correspondence) is rendered in the current prototype as **stacked top/bottom panes** — the Noting Side is the top half and the Correspondence Side the bottom half — so the conceptual metaphor is preserved without literally reproducing a side-by-side layout. [CLARIFIED — H7] [OBSERVED — `src/pages/FileDetail.jsx:349` ("Top Half"), `:406` ("Bottom Half")]

```
        NOTING SIDE (left / top pane)     |   CORRESPONDENCE SIDE (right / bottom pane)
  --------------------------------------- | -------------------------------
  Note 1: "Renew AMC. See bill at C/1."   |   C/1  Vendor Quotation
                       — Originator (R)    |   C/2  Audit Report
  Note 2: "Approved subject to budget."   |   C/3  Court Order
       (L) Reviewer —                      |
```

*(The diagram shows the conceptual left/right pairing; on screen the two panes are stacked vertically — see the layout caveat above.)*

## 3. Who uses it

These are **conceptual roles** drawn from how the office actually works (the prototype itself does not yet enforce them — see §6). [SPECIFIED — DOCX §3] [OBSERVED — no role enforcement; `src/data/dummyData.js` ships a single hardcoded user]

- **Originator / Maker** — opens the file, writes the first note proposing an action, attaches the first document, and plans where the file should go next.
- **Checker(s)** — one or more reviewers who examine the proposal, add comments, and either endorse or send it back. [SPECIFIED — multiple checkers, S6a]
- **Approver** — the authority who signs off the decision.
- **MD (Managing Director)** — top-level final approval; may approve *offline* (e.g., on a printout), in which case the scanned approval is uploaded back into the file. [SPECIFIED — S11]
- **Actionable department** — after final approval, the department that actually *implements* the decision, then returns the file to the Maker. [SPECIFIED — S19]

## 4. The life of a file, in one story

> The Administration office needs to renew its equipment maintenance contract. **Rajesh (Originator) opens a new file**, attaches the vendor's quotation as **C/1**, and writes **Note 1**: *"Propose renewing the AMC per the quotation at C/1."* He **routes** the file to his reviewer. **The Checker reviews it**, and either **approves** (signing Note 2) or **reverts** it with remarks like *"Resubmit with budget confirmation."* If reverted, Rajesh corrects and resubmits. Once the chain is satisfied, it reaches **final approval** (potentially the MD, possibly via an uploaded offline sign-off). The approved file is then **printed** — carrying the approval details (who, when, where). It is **routed to the actionable department** to implement, which adds its comments and **returns the file to the Maker**. Much later, when the file is full or the matter concludes, it is **closed** — its closing date and the number of any successor file are recorded, and the complete history is retained permanently.

This open → note → attach → route → approve/revert → final approval → print → post-approval routing & return → closure arc is the entire purpose of the system. [SPECIFIED — DOCX §4–§9]

## 5. The value: more than a document store

A shared drive can hold PDFs. This system is fundamentally different because it captures **process and accountability**, not just files:

- **Decisions are first-class.** The noting trail records *reasoning and authority*, not just documents.
- **Everything is linked and navigable.** Notes cite specific documents (`C/n`) and earlier notes — one click jumps you there.
- **Movement is tracked end-to-end.** Who held the file, when, and why — a full audit trail. [SPECIFIED — DOCX §5; S10]
- **Approvals are structured and provable.** Maker–Checker–Approver chain with timestamps, conditions, and printable approval details. [SPECIFIED — S6, S14]
- **Inward vs Outward inbox.** Distinguishes *final-approved* action items from *revisions* needing rework. [SPECIFIED — S7]
- **Permanent, searchable record.** Nothing is silently deleted; files stay retrievable across years. [SPECIFIED — DOCX §9]

In short: a document store answers *"where is the file?"* — this system answers *"what was decided, by whom, why, and on what basis?"*

## 6. What exists today (honest status)

**This repository is an approved *visual prototype*, not the finished software.** It is a **frontend-only** demonstration built to show stakeholders the intended screens and flows. Specifically:

- **All data is mock data.** A single file (`src/data/dummyData.js`) holds four sample files and a handful of users; there is **no backend, no database, and no persistence**. [OBSERVED]
- **Actions are demo stubs.** Creating a file, adding a note, attaching correspondence, forwarding, approving, and printing all end in a `"… (Demo mode)"` pop-up. Nothing is actually saved or sent. [OBSERVED — submit handlers across `CreateFile.jsx:22`, `AddNoteModal.jsx:18-20`, `AddCorrespondenceModal.jsx` submit, `ForwardFileModal.jsx:24`, `ReviewModal.jsx:24`]
- **No login or roles yet.** The app always runs as one hardcoded user ("Rajesh Kumar, Section Officer"); the Maker/Checker/Approver/MD distinction is *conceptual only* and not enforced anywhere. [OBSERVED — `dummyData.js`; no permission checks in any screen]
- **What genuinely works** is the *experience*: browsing files, the two-pane Noting/Correspondence view, clickable `C/n` and `Note n` cross-references, list search/filter/sort, and the multi-step forward-recipient picker — all real, client-side behaviors over the sample data. [OBSERVED — `FileDetail.jsx`, list pages, `ForwardFileModal.jsx`]
- **A couple of screens have known latent crashes** in this build (the "Search Approved Files" box and the "Upload Offline MD Approval" path), noted here only so the next team isn't surprised. [OBSERVED — `AddNoteModal.jsx` undefined `files`; `ReviewModal.jsx` missing `FiUpload` import]

**Bottom line for planners:** the prototype reliably communicates *what the product should be and how it should feel.* The next phase is to build the real engine behind it — persistence, authentication and roles, and turning every "Demo mode" action into a genuine, recorded operation.

---

*Source labels used above: **[OBSERVED]** = verified in prototype code; **[SPECIFIED]** = from the SOW / N-C DOCX; **[CLARIFIED]** = handwritten annotations; **[INFERRED]** = reasoned assumption.*