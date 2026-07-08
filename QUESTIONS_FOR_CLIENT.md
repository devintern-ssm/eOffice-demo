# Questions for the Client — eOffice N-C File System

Raised during the pre-demo QA hardening pass (branch `qa/pre-demo-hardening`).
Only **genuinely ambiguous intent** is listed — where the spec is silent or self-contradictory
and the implementation had to pick a default. Each item gives the competing interpretations and
our recommended default (already in the build unless noted). Cross-referenced with
`docs/07_open_questions.md` (appended there too).

Authoritative sources: `docs/08_requirements_decisions.md` (locked decisions) and
`docs/10_round2_review_changes.md` (rounds 2–4). The root docs (`REQUIREMENTS_CHECKLIST.md`,
`DEMO_FEATURES.md`, `FINAL_IMPLEMENTATION_STATUS.md`) describe the **old prototype** and are stale.

---

## Q1. Should the originator retain lifecycle power (route/close) after handing a file off? *(behaviour)*
- **Context:** Lifecycle actions (`route`, `close`) currently accept the **originator** (file creator)
  in addition to the current holder. We tightened **transfer** to holder-only (QA BUG-2), because a
  mid-flow cross-department transfer by someone not holding the file is a clear integrity gap. But
  `route`/`close` still allow the originator, which is *arguably correct* per the post-approval arc
  (`08:74`: on final approval the file is routed and eventually "returns to the Maker").
- **Interpretations:** (a) Only the current holder (or admin) may perform any lifecycle action; or
  (b) the originator keeps route/close authority because the arc centres on them.
- **Recommended default:** Keep (b) for `route`/`close` (originator-driven post-approval arc), holder-only
  for `transfer` (already applied). **Confirm this split.**

## Q2. Should there be separation of duties (Maker ≠ Checker ≠ Approver on the same file)? *(policy)*
- **Context:** Per-file roles are freely chosen. Nothing prevents a user from forwarding a file to
  **themselves** as Checker and then checking/approving their own file. The docs say roles are
  per-file participant relationships chosen explicitly (`05:44`, `10:61`) but never require the actors
  to be distinct.
- **Interpretations:** (a) Allow it (flexible, matches "any user can act in any assigned role"); or
  (b) enforce that the maker/originator cannot also be a checker/approver on the same file.
- **Recommended default:** (a) for the demo; add a soft warning later. **Confirm whether SoD must be enforced.**

## Q3. Must a user-entered custom file number be unique? *(data rule)*
- **Context:** The system number `DEPT/YEAR/SEQ` is auto-generated and unique (`08:36-37`). The optional
  user-entered `customFileNumber` (third identity tier) is currently **not** checked for uniqueness — two
  files can share the same custom number.
- **Interpretations:** (a) Custom number is a free-text label, duplicates allowed; or (b) it must be unique.
- **Recommended default:** (a) — the authoritative identity is the UUID + `DEPT/YEAR/SEQ`; custom is a
  convenience label. **Confirm.**

## Q4. Are in-app notifications in scope for this build? *(scope)*
- **Context:** `08:117` lists notifications (in-app/email/SMS/push) as **Phase 2 / deferred**. The build
  nonetheless ships a working in-app **bell** (forward/approve/revert/assign/comment). This is a bonus, but
  it means there is no doc-defined "expected" notification behaviour to validate against.
- **Recommended default:** Keep the in-app bell (it works and demos well); treat it as an early Phase-2
  deliverable. **Confirm notifications are wanted now, and that email/SMS remain deferred.**

## Q5. Confidential visibility in Reports — what exactly should each role see? *(precise rule)*
- **Context:** Docs mandate restricted access generally (`08:86`) and flag that confidential files
  leaking into Reports was a prototype bug (`05:78`), but never state the precise report rule. The build
  currently: hides confidential files from **non-admins** in reports and lists (unless the user is
  creator/holder/assignee); **admin sees all**.
- **Interpretations:** (a) Admin sees all confidential in reports (current); or (b) even admin sees only
  metadata / must be on an explicit access list (`05:113` — "who composes the access list" is unresolved).
- **Recommended default:** (a). **Confirm, and confirm who may be added to a confidential file's access list.**

## Q6. Sequential-only vs an "any-order / all-can-sign" approval mode? *(feature)*
- **Context:** Locked strictly sequential (`08:44`), but the client later said that **in some cases all
  signatories may approve/comment in any order** (`10:33`, `10:57`) — an any-order/quorum mode that is
  **not built**.
- **Recommended default:** Ship sequential for the demo. If any-order is required, it needs a per-file mode
  flag + quorum design (a Phase-2 item). **Confirm priority.**

## Q7. What is the precise distinction between "Check" and "Approve"? *(semantics)*
- **Context:** Explicitly still unresolved with the client (`10:40`). The build treats **Check** as an
  intermediate reviewer action (advances to the next step; a lone checker hands the file back to the maker
  to add an approver) and **Approve** as the final sign-off (last step → file APPROVED).
- **Recommended default:** as built. **Confirm the semantics match the client's process.**

## Q8. Do draft notes travel with the file, and are they hidden from other holders? *(behaviour, C13)*
- **Context:** `08:60` says drafts do **not** travel and are owner-scoped; client answer C13 (`10:39`) says
  "draft notes travel — needs re-discussion." The build implements: a **draft note is private to its author**
  and only that author (while holding the file) can edit/submit it.
- **Recommended default:** as built (owner-private drafts). **Confirm C13.**

## Q9. Final allowed attachment formats & size for Phase 1? *(scope)*
- **Context:** Scope oscillated: PDF-only → multi-format → **all formats, 25 MB** (`10:54`), but the
  questionnaire C22 still literally reads "Phase 1 supports only PDF / please discuss" (`10:28`). The build
  accepts **all formats** (only PDFs get auto page-counting; MD scanned-approval upload is still PDF-only).
- **Recommended default:** all formats, 25 MB. **Confirm the final allowed-format list and the 25 MB cap.**

## Q10. Print page-range: note-number ranges only, or physical-page ranges too? *(feature)*
- **Context:** Round-3 says print should support **both** note-number and physical-page ranges (`10:56`);
  only **note-number** ranges (all / last / custom From–To) are built. Physical pages come from the browser
  print dialog. Final print formatting also awaits Rasika ma'am's sample PDF (`10:42`, `08:40`).
- **Recommended default:** note-number ranges for the demo. **Confirm whether physical-page ranges are
  required for Phase 1, and share the sample print layout.**
