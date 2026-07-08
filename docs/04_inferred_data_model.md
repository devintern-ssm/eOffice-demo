# 04 — Inferred Data Model (INFERRED, not final)

> **Status of this document:** Everything below is **[INFERRED]** — reconstructed *purely from the frontend* (`src/data/dummyData.js` plus the way pages/modals read it). This is **not** a database schema, **not** a final type model, and contains **no DDL, no nullability decisions, no FK/PK design**. It captures *what shape the data actually has today in the prototype* and where that shape diverges from the SOW / handwritten clarifications. The only data layer in the app is the in-memory JavaScript array `files` exported from `src/data/dummyData.js`; there is no backend, no persistence, and every write is an `alert('... (Demo mode)')` stub. Use this as the starting point for backend planning, not as the target model.
>
> **Source labels** used throughout:
> - `[OBSERVED]` — seen directly in code (file + line cited).
> - `[SPECIFIED]` — from the SOW / DOCX.
> - `[CLARIFIED]` — from the handwritten annotations (H-number cited).
> - `[INFERRED]` — a reasonable assumption, called out as such.

---

## 1. Overview of the observed data layer

`[OBSERVED]` The entire data model lives in `src/data/dummyData.js:1-405` and is exported as five things:

| Export | Shape | Lines | Role |
|---|---|---|---|
| `currentUser` | single object | `dummyData.js:3-9` | The one hardcoded identity (`user1` Rajesh Kumar, Section Officer). No auth; never changes. |
| `sections` | string[] (6 entries) | `dummyData.js:11-18` | The closed list of sections/departments. |
| `users` | object[] (6 entries) | `dummyData.js:20-27` | The directory of selectable people. |
| `files` | object[] (4 entries: `file1`–`file4`) | `dummyData.js:29-388` | The root aggregate. Everything else is embedded inside a file. |
| helpers | functions | `dummyData.js:390-404` | `getFileById`, `getFilesByStatus`, `getFilesByAssignee`, `getFilesByCreator`. |

`[OBSERVED]` The model is a **document/aggregate shape**: a `File` is the root and **embeds** its `notes[]`, `correspondence[]`, and `movements[]` inline. Notes further embed `author`, `references`, `approvals[]`, and `checkerComments[]`. There are no separate top-level collections for notes/correspondence/movements — they exist *only* nested inside a file (`dummyData.js:53-169` for file1 demonstrates the full nesting).

`[OBSERVED]` Cross-references between entities are by **string id** (`createdBy: 'user1'`, `currentAssignee: 'user2'`) or by **human-readable token** (`references.correspondence: ['C/1']`, `referencedIn: ['Note 1']`) — never by object pointer. There is **no helper that resolves a `User` by id** and no lookup for notes/correspondence/movements (`dummyData.js:390-404` only filters `files`).

`[INFERRED]` The id namespaces are flat strings with positional suffixes (`file1..4`, `note1..5`, `corr1..6`, `mov1..3`) — clearly authored by hand, not generated. `noteNumber` and correspondence `number` (`C/n`) **reset per file** (file-scoped sequences), while `id` is globally unique across the seed (`noteNumber:1` appears on note1/note3/note4/note5 — `dummyData.js:56,195,263,328`).

---

## 2. Entities (field-by-field, as observed)

### 2.1 User

`[OBSERVED]` Two distinct user shapes coexist and are **not unified**:
- the singleton `currentUser` (`dummyData.js:3-9`), which **has** an `email`;
- entries in `users[]` (`dummyData.js:20-27`), which **do not** have an `email`.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `id` | string | `'user1'` | PK-by-convention. `dummyData.js:21`. |
| `name` | string | `'Rajesh Kumar'` | `dummyData.js:21`. |
| `designation` | string (free text) | `'Section Officer'`, `'Deputy Director'`, `'Director'`, `'Accountant'`, `'Legal Advisor'`, `'Audit Officer'` | Not an enum; 6 distinct values across `dummyData.js:21-26`. |
| `section` | string (∈ `sections`) | `'Administration'` | `dummyData.js:21`. |
| `email` | string | `'rajesh.kumar@example.com'` | **Only on `currentUser`** (`dummyData.js:8`); absent from `users[]` entries. |

`[OBSERVED]` `currentUser` is a **separate hardcoded singleton**, not looked up from `users[]`, even though `currentUser.id === 'user1' === users[0].id`. `[INFERRED]` In a real model these should converge into one User entity.

`[OBSERVED]` There is **no `role` field on User**. Role exists only as descriptive metadata on *some* note authors (`note.author.role`, see §2.6) and as a conceptual label in `checker.status` strings. The UI never branches on role.

---

### 2.2 File (root aggregate)

`[OBSERVED]` `dummyData.js:30-387`. Four instances.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `id` | string | `'file1'` | PK-by-convention. `dummyData.js:31`. |
| `fileNumber` | string (free text) | `'ADMIN/2024/001'`, `'LEGAL/2024/001'`, `'ACCOUNTS/2024/015'` | **Manually authored**, not generated. CreateFile binds it as a free-text input (`src/pages/CreateFile.jsx:49-58`). |
| `unNumber` | string | `'UN-2024-001'` | Pattern `UN-YYYY-NNN`. `dummyData.js:33`. Used by All Files filter (`src/pages/AllFiles.jsx:14,23`). **No field for it in CreateFile.** |
| `subject` | string | `'Purchase of Office Equipment - AMC Renewal'` | `dummyData.js:34`. |
| `section` | string (∈ `sections`) | `'Administration'` | `dummyData.js:35`. |
| `status` | enum-like string | `'Under Review'` | Observed set: `Open`, `Under Review`, `Approved` (see §3). `dummyData.js:36`. |
| `priority` | enum-like string | `'Normal'` | Observed set: `Normal`, `Urgent`. `dummyData.js:37`. |
| `createdBy` | string (User.id) | `'user1'` | FK-by-string. `dummyData.js:38`. |
| `createdDate` | string `YYYY-MM-DD` | `'2024-01-15'` | Date-only. `dummyData.js:39`. |
| `lastModified` | string `YYYY-MM-DD` | `'2024-01-20'` | `dummyData.js:40`. Used by My Files sort fallback. |
| `lastUsedDate` | string `YYYY-MM-DD` | `'2024-01-20'` | `dummyData.js:41`. Primary My Files sort key (`src/pages/MyFiles.jsx:25-27`) — satisfies SOW **S2**. |
| `currentAssignee` | string (User.id) **or** `null` | `'user2'`, `null` (file3) | FK-by-string. `dummyData.js:42`, null at `:249`. Powers Inbox. |
| `confidential` | boolean | `true` (file3 only) | `dummyData.js:43`, true at `:250`. Renders a badge only; no access gating. |
| `startPeriod` | string `YYYY-MM-DD` | `'2024-01-01'` | `dummyData.js:44`. |
| `endPeriod` | `null` | `null` (all 4) | `dummyData.js:45`. Never populated — see Gaps (closure). |
| `maker` | embedded `{id,name}` | `{ id:'user1', name:'Rajesh Kumar' }` | Denormalized User. `dummyData.js:46`. |
| `checkers` | array of embedded checker objects (0–1 entries) | see §2.7 | `dummyData.js:47-49`. |
| `approver` | embedded `{id,name}` **or** `null` | `{ id:'user3', name:'Amit Patel' }` (file3); `null` elsewhere | `dummyData.js:50`, non-null only at `:257`. |
| `inboxType` | enum-like string | `'Outward'` / `'Inward'` | `Inward` = final approved; `Outward` = revision. `dummyData.js:51` (inline comment), `:258`. |
| `isDraft` | boolean | `false` (all 4) | `dummyData.js:52`. Never true in seed. |
| `notes` | `Note[]` | see §2.6 | Embedded. `dummyData.js:53-125`. |
| `correspondence` | `Correspondence[]` | see §2.5 | Embedded. `dummyData.js:126-151`. |
| `movements` | `Movement[]` (may be empty) | see §2.4 | Embedded. `dummyData.js:152-169`; empty `[]` for file2/file3 (`:235,302`). |

`[OBSERVED]` There are **three overlapping representations of "who is involved"**: top-level `maker`/`checkers[]`/`approver`/`currentAssignee`/`createdBy`, the embedded `note.author` per note, and `movement.from`/`movement.to`. These are denormalized copies and can drift (e.g., `file1.approver` is `null` at `dummyData.js:50` even though `mov2` forwards "For final approval" to user3 at `:166-167`).

---

### 2.3 Maker / Approver (embedded value objects on File)

`[OBSERVED]` `maker` (`dummyData.js:46`) and `approver` (`dummyData.js:50,257`) share the same minimal shape.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `id` | string (User.id) | `'user1'` | Denormalized FK. |
| `name` | string | `'Rajesh Kumar'` | Denormalized. |

`[OBSERVED]` They carry **no `section`, `designation`, status, or date** — a thinner copy of User than `movement.from`/`movement.to` (which add `section`) and than `checker` (which adds `status`+`date`). `approver` can be `null` (`dummyData.js:50`).

---

### 2.4 Movement (embedded on File)

`[OBSERVED]` `dummyData.js:152-169` (file1), `:377-386` (file4). file2/file3 have `movements: []`.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `id` | string | `'mov1'` | `dummyData.js:154`. |
| `from` | embedded `{id,name,section}` | `{ id:'user1', name:'Rajesh Kumar', section:'Administration' }` | `dummyData.js:155`. |
| `to` | embedded `{id,name,section}` | `{ id:'user2', name:'Priya Sharma', section:'Administration' }` | `dummyData.js:156`. |
| `date` | string ISO-ish `YYYY-MM-DDThh:mm:ss` | `'2024-01-15T10:35:00'` | `dummyData.js:157`. |
| `action` | enum-like string | `'Forwarded'` | **Only value present** is `Forwarded` (`:158,166,383`). |
| `remarks` | string | `'For review and approval'` | `dummyData.js:159`. |

`[OBSERVED]` `movement.from`/`movement.to` are the **only** embedded user copies that include `section` (`dummyData.js:155-156`), making them richer than `maker`/`approver`. This is the closest thing to a routing/audit log in the data, but it is static seed data — `ForwardFileModal.handleSubmit` does not append to it.

---

### 2.5 Correspondence (embedded on File)

`[OBSERVED]` `dummyData.js:126-151` (file1), plus corr3–corr6. Six instances total.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `id` | string | `'corr1'` | `dummyData.js:128`. |
| `number` | string `C/n` | `'C/1'` | File-scoped sequence; resets per file. `dummyData.js:129`. |
| `type` | enum-like string | `'Quotation'` | Observed set: `Quotation`, `Report`, `Court Order`, `Bill`, `Order` (see §3). `dummyData.js:130`. |
| `title` | string | `'AMC Quotation for Office Equipment'` | `dummyData.js:131`. |
| `inwardDate` | string `YYYY-MM-DD` | `'2024-01-10'` | `dummyData.js:132`. |
| `inwardNumber` | string | `'IN/2024/045'`, `'AUDIT/2024/012'`, `'COURT/2024/003'`, `'WO/2023/089'` | Free-form stamp number. `dummyData.js:133`. |
| `uploadedBy` | string (User.id) | `'user1'` | FK-by-string. `dummyData.js:134`. |
| `uploadDate` | string ISO-ish | `'2024-01-15T09:00:00'` | `dummyData.js:135`. |
| `fileUrl` | string | `'#'` | **Always `'#'`** — no real document anywhere (`dummyData.js:136` and every other corr). View/Download buttons are dead (`src/pages/FileDetail.jsx:429-434`). |
| `referencedIn` | string[] of `Note n` | `['Note 1']` | Inverse of `note.references.correspondence`. `dummyData.js:137`. |

`[OBSERVED]` The `C/n ↔ Note n` linkage is **bidirectional but maintained by hand**: `note.references.correspondence` points C-ward (`dummyData.js:80-83`) and `correspondence.referencedIn` points Note-ward (`dummyData.js:137`). Nothing in code keeps these two in sync.

---

### 2.6 Note (embedded on File)

`[OBSERVED]` `dummyData.js:54-124` (file1 has 2 notes; files 2/3/4 have 1 each). Five instances total.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `id` | string | `'note1'` | `dummyData.js:54`. |
| `noteNumber` | number | `1`, `2` | **Resets per file** (file-scoped). `dummyData.js:55`. Drives author-margin layout in FileDetail. |
| `content` | string (multiline) | `'Subject: …\n\nReference: Quotation at C/1\n…'` | Contains the literal `C/n` and `Note n` tokens that FileDetail regex-detects. `dummyData.js:57-70`. |
| `author` | embedded `{id,name,designation, role?}` | see below | `dummyData.js:71-76`. `role` present **only on file1 notes**. |
| `date` | string ISO-ish | `'2024-01-15T10:30:00'` | `dummyData.js:77`. |
| `status` | enum-like string | `'Submitted'` | Observed set: `Submitted`, `Checked`, `Approved` (see §3). `dummyData.js:78`. |
| `isDraft` | boolean | `false` | **Present only on file1 notes** (`dummyData.js:79,107`); **absent** from note3/note4/note5. |
| `references` | embedded `{correspondence:string[], notes:string[]}` | `{ correspondence:['C/1'], notes:[] }` | `dummyData.js:80-83`. |
| `approvals` | `Approval[]` | `[{paragraph:'A',…}]` (note2 only) | `dummyData.js:84,112-114`. |
| `checkerComments` | `CheckerComment[]` | one entry (note2 only) | **Present only on file1 notes** (`dummyData.js:85,115-123`); **absent** from note3/note4/note5. |

`[OBSERVED]` **`note.author` shape is inconsistent across instances:**
- file1 note1/note2 authors include `role` (`'Maker'` / `'Checker'`) — `dummyData.js:71-76, 99-104`.
- file2/file3/file4 note authors have `id`/`name`/`designation` **but no `role`** — `dummyData.js:207-211, 274-278, 337-341`.

`[OBSERVED]` Likewise `isDraft` and `checkerComments` exist on file1's notes but are entirely missing from the other files' notes. `[INFERRED]` This means the prototype has **no single canonical Note shape**; consumers must treat `role`, `isDraft`, and `checkerComments` as optional.

#### note.author (embedded value object)

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `id` | string (User.id) | `'user1'` | `dummyData.js:72`. |
| `name` | string | `'Rajesh Kumar'` | `dummyData.js:73`. |
| `designation` | string | `'Section Officer'` | `dummyData.js:74`. |
| `role` | enum-like string (optional) | `'Maker'` / `'Checker'` | **Only on file1 notes** — `'Maker'` at `dummyData.js:75`, `'Checker'` at `:103`. Descriptive only; never branched on. |

---

### 2.7 Checker entry (embedded on File.checkers[])

`[OBSERVED]` `dummyData.js:47-49` (file1), `:254-256` (file3). file2/file4 have `checkers: []`.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `id` | string (User.id) | `'user2'` | `dummyData.js:48`. |
| `name` | string | `'Priya Sharma'` | `dummyData.js:48`. |
| `status` | enum-like string (lowercase) | `'checked'` / `'approved'` | `dummyData.js:48,255`. Lowercase, unlike `File.status`/`Note.status` which are Title Case. |
| `date` | string `YYYY-MM-DD` | `'2024-01-18'` | `dummyData.js:48`. |

`[OBSERVED]` Only **0 or 1** checker appears in any seed file, even though SOW **S6a** requires *multiple* checkers; the array shape supports it but the data never exercises it.

---

### 2.8 Approval (embedded on Note.approvals[])

`[OBSERVED]` `dummyData.js:112-114`. **Single instance** in the entire dataset (note2). All other notes have `approvals: []`.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `paragraph` | string (single letter) | `'A'` | Paragraph-level approval marker — supports SOW §4.2 annotation. `dummyData.js:113`. |
| `approvedBy` | string (User.id) | `'user2'` | FK-by-string. `dummyData.js:113`. |
| `date` | string ISO-ish | `'2024-01-18T14:20:00'` | `dummyData.js:113`. |

`[INFERRED]` `paragraph: 'A'` lines up with `ReviewModal`'s paragraph checkboxes labelled `String.fromCharCode(65+index)` (A/B/C…) — see `src/components/ReviewModal.jsx`. The marker is an opaque letter, not a content offset; the link from `'A'` back to a specific paragraph of `note.content` is **positional/by-convention only**, not stored.

---

### 2.9 CheckerComment (embedded on Note.checkerComments[])

`[OBSERVED]` `dummyData.js:115-123`. **Single instance** (note2). Field absent on note3/4/5.

| Field | Observed shape/type | Example | Notes |
|---|---|---|---|
| `checkerId` | string (User.id) | `'user2'` | `dummyData.js:117`. |
| `checkerName` | string | `'Priya Sharma'` | `dummyData.js:118`. |
| `comment` | string | `'Verified inventory. Quotation is reasonable.'` | `dummyData.js:119`. |
| `date` | string ISO-ish | `'2024-01-18T14:20:00'` | `dummyData.js:120`. |
| `action` | enum-like string | `'checked'` | Only value present. `dummyData.js:121`. |

`[INFERRED]` This object is the model's expression of SOW **S6b** (commenting after checker approval), but it lives only on the one note that also has an `approvals[]` entry, so there is no example of a comment added *after* approval at runtime (nothing persists).

---

## 3. Enum-like value sets observed

`[OBSERVED]` None of these are declared as enums in code; they are the distinct literal values seen in the seed (and, where noted, hardcoded in option lists in the UI). Casing is inconsistent across families.

| Field | Observed values | Source lines | Notes / SOW tension |
|---|---|---|---|
| `File.status` | `Open`, `Under Review`, `Approved` | `dummyData.js:36,177,243,310` | `Closed`, `Rejected`, `Draft`, `Returned` appear in **list-page filter dropdowns** (e.g. `src/pages/MyFiles.jsx` status select) and in prototype docs but **never in data**. Closure status absent (Gaps §5). |
| `File.priority` | `Normal`, `Urgent` | `dummyData.js:37,178` | Only two. |
| `File.inboxType` | `Inward` (final approved), `Outward` (revision) | `dummyData.js:51,190,258,323` | SOW **S7**. Only file3 is `Inward`. Cosmetic only in Inbox. |
| `File.confidential` | `true`, `false` | `dummyData.js:43,250` | Only file3 `true`. |
| `File.isDraft` | `false` | `dummyData.js:52` (all) | Never `true`. |
| `Note.status` | `Submitted`, `Checked`, `Approved` | `dummyData.js:78,106,280,343` | Title Case. |
| `Note.isDraft` | `false` | `dummyData.js:79,107` | Present only on file1 notes. |
| `Note.author.role` | `Maker`, `Checker` | `dummyData.js:75,103` | Present only on file1 notes; descriptive. |
| `Movement.action` | `Forwarded` | `dummyData.js:158,166,383` | **Only one value.** Docs claim `Approved`/`Rejected`/`Returned`/`Reassigned` too — none in data. (Note: an unrelated `action: 'checked'` at `dummyData.js:121` belongs to a **CheckerComment** entry, not a movement — don't conflate the two when grepping `action:`.) |
| `Correspondence.type` | `Quotation`, `Report`, `Court Order`, `Bill`, `Order` | `dummyData.js:130,142,225,292,355,367` | The **add-correspondence modal** offers a longer list (Letter/Voucher/Circular/Representation/Email/Other) not present in seed. |
| `Checker.status` | `checked`, `approved` | `dummyData.js:48,255` | **lowercase** (differs from Note/File status casing). |
| `CheckerComment.action` | `checked` | `dummyData.js:121` | Only value. |
| `sections` | `Administration`, `Accounts`, `Legal`, `Audit`, `Finance`, `Engineering` | `dummyData.js:11-18` | Closed list; also hardcoded again in several pages instead of imported. |

---

## 4. Relationships

### 4.1 Entity-relationship diagram (inferred)

```mermaid
erDiagram
    USER ||--o{ FILE : "createdBy / currentAssignee (string id)"
    USER ||..o{ NOTE : "author (embedded copy)"
    USER ||..o{ CORRESPONDENCE : "uploadedBy (string id)"

    FILE ||--|{ NOTE : "embeds notes[]"
    FILE ||--o{ CORRESPONDENCE : "embeds correspondence[]"
    FILE ||--o{ MOVEMENT : "embeds movements[] (may be empty)"
    FILE ||..|| MAKER : "embeds maker {id,name}"
    FILE ||..o| APPROVER : "embeds approver {id,name} or null"
    FILE ||--o{ CHECKER_ENTRY : "embeds checkers[] (0..1 in seed)"

    NOTE ||..|| NOTE_AUTHOR : "embeds author {id,name,designation,role?}"
    NOTE ||--o{ APPROVAL : "embeds approvals[] (paragraph-level)"
    NOTE ||--o{ CHECKER_COMMENT : "embeds checkerComments[]"
    NOTE ||..o{ CORRESPONDENCE : "references.correspondence ['C/n'] (string token)"
    NOTE ||..o{ NOTE : "references.notes ['Note n'] (string token)"

    CORRESPONDENCE ||..o{ NOTE : "referencedIn ['Note n'] (inverse, string token)"

    MOVEMENT ||..|| MOVE_FROM : "embeds from {id,name,section}"
    MOVEMENT ||..|| MOVE_TO : "embeds to {id,name,section}"

    FILE {
        string id PK
        string fileNumber "free text"
        string unNumber
        string subject
        string section
        string status
        string priority
        string createdBy FK
        string currentAssignee FK_or_null
        bool   confidential
        string inboxType
        bool   isDraft
        date   endPeriod "always null"
    }
    NOTE {
        string id PK
        number noteNumber "file-scoped"
        string content "contains C/n, Note n tokens"
        string status
        bool   isDraft "file1 notes only"
    }
    CORRESPONDENCE {
        string id PK
        string number "C/n file-scoped"
        string type
        string fileUrl "always #"
    }
    MOVEMENT {
        string id PK
        string action "only Forwarded"
        date   date
    }
```

### 4.2 Narrative

`[OBSERVED]`
- **File is the aggregate root.** Notes, correspondence, and movements have **no independent existence** — they are embedded arrays inside a single file object (`dummyData.js:53,126,152`). There is no global note/correspondence/movement table.
- **User links are by string id, denormalized everywhere.** `File.createdBy`/`currentAssignee` hold ids (`dummyData.js:38,42`); `maker`/`approver`/`checkers[]`/`note.author`/`movement.from`/`movement.to` all embed *copies* of user fields with **different subsets** (maker = `{id,name}`; movement = `{id,name,section}`; note.author = `{id,name,designation,role?}`). No resolver reconciles them, so they can disagree.
- **The C/n ↔ Note n graph is string-token based and hand-mirrored.** `note.references.correspondence` and `correspondence.referencedIn` are two independently-authored arrays of human strings (`'C/1'`, `'Note 1'`) — `dummyData.js:80-83,137`. The clickable-reference feature in FileDetail parses these tokens *out of `note.content` text* via regex, not from the `references` object — so the structured `references` field and the rendered links derive from two different sources.
- **Approval is paragraph-scoped but the paragraph link is positional.** `Approval.paragraph: 'A'` (`dummyData.js:113`) is an opaque letter; nothing in the stored note ties letter `A` to a specific substring of `content`. The mapping is by render-order convention only.
- **Workflow participation is modeled three times.** maker/checkers/approver (the role triad), `currentAssignee` (who holds it now), and `movements[]` (history) are parallel, partly-redundant views; keeping them consistent is left entirely to whoever authors the data.

---

## 5. Gaps & tensions in the model

> All items `[INFERRED]` from comparing the observed shape against `[SPECIFIED]` SOW and `[CLARIFIED]` handwriting. None of these are implementation proposals — they are recorded only to inform backend planning. Implementation urges deferred to `07_open_questions`.

### 5.1 Fields present in data but unused / underused by the UI

| Field | Where | Observation |
|---|---|---|
| `note.references.{correspondence,notes}` | `dummyData.js:80-83` | Structured reference arrays exist, but FileDetail builds its clickable links by **regex over `note.content`**, not from this object — so the field is effectively decorative in the current UI. |
| `note.approvals[]` (incl. `paragraph`) | `dummyData.js:112-114` | One seed instance; ReviewModal *collects* paragraph selections but discards them on submit, so the field is never produced at runtime. |
| `note.checkerComments[]` | `dummyData.js:115-123` | One seed instance, file1 only; no runtime path creates them (SOW S6b unrealized in behavior). |
| `note.isDraft` | `dummyData.js:79` | Present (always `false`) on file1 notes only; never `true`, never read to alter rendering. |
| `note.author.role` | `dummyData.js:75,103` | Descriptive metadata; UI never branches on it. |
| `File.isDraft` | `dummyData.js:52` | Always `false`; no draft-file path. |
| `File.endPeriod` | `dummyData.js:45` | Always `null`; bound in CreateFile but never populated/used. |
| `File.lastModified` | `dummyData.js:40` | Only consumed as a *fallback* sort key in My Files; otherwise unused (lastUsedDate is primary). |
| `correspondence.referencedIn` | `dummyData.js:137` | Inverse link is stored but the UI doesn't render "referenced in Note n" anywhere. |
| `correspondence.uploadDate` / `uploadedBy` | `dummyData.js:134-135` | Stored, not surfaced on the correspondence cards. |
| `movement.remarks` | `dummyData.js:159` | Rendered in FileDetail timeline; but `from.section`/`to.section` (`:155-156`) are the only place section travels with a user and are not shown distinctly. |

### 5.2 Concepts required by SOW / handwriting but ABSENT from the model

| Concept | Source | Status in model | Tension |
|---|---|---|---|
| **UN-number auto-generation / sequence** | `[CLARIFIED]` H1 ("Auto-generated Sr. no. upon submission"); `[SPECIFIED]` S1 | `unNumber` is a **static hand-authored string** (`dummyData.js:33`); there is **no sequence/counter entity** and **no UN field in CreateFile**. | Direct conflict: H1 says system-generated on submit, but `fileNumber` is free-text input and `unNumber` isn't captured at all in the create form. |
| **File auto-number (`fileNumber`)** | `[CLARIFIED]` H1; `[SPECIFIED]` S1 | `fileNumber` is free-text (`dummyData.js:32`, input at `CreateFile.jsx:49-58`). | Conflict with "auto-generated Sr. no." |
| **File lock + holder (Creator / Checker)** | `[CLARIFIED]` H6 ("file locked - Creator / Checker") | **No `lock`/`heldBy`/`lockedBy` field** anywhere on File. `currentAssignee` is the nearest proxy but carries no lock semantics and no "is it the creator or the checker" flag. | Required concept entirely missing from the model. |
| **Closure date + successor-file link** | `[CLARIFIED]` H17 ("File close date"); `[SPECIFIED]` SOW §9 | No `closedDate`, no `successorFileId`, no `closureReason`; `status` enum has no `Closed` value in data; `endPeriod` always `null` (`dummyData.js:45`). | Whole closure/successor lifecycle unmodeled. |
| **Cross-department permanent transfer** | `[SPECIFIED]` SOW "Additional Points" | `movement.action` only ever `'Forwarded'` (`dummyData.js:158`); no `transfer`/`permanent`/`fromDept→toDept` ownership-change concept; `File.section` is single-valued with no transfer history. | Transfer is a distinct lifecycle event with no field/enum to represent it. |
| **Digital signature object** | `[SPECIFIED]` S13/S14 | No signature entity/field on Note or File; ReviewModal has only a free-text "digital signature" input that is discarded. `[OBSERVED]` no `signature` field exists in `dummyData.js`. | Approval-on-print bundle (H9, S14: Sign/Date-Time/Approved-By/Location) has no backing model. |
| **Approval-on-print metadata (location, date-time, approver block)** | `[SPECIFIED]` S14; `[CLARIFIED]` H9 | `Approval` has `approvedBy`+`date` only (`dummyData.js:113`); no `location`, no consolidated Maker/Checker/Approver print block. | Print bundle under-modeled. |
| **Page-level C-link (e.g. C36 on page 5)** | `[SPECIFIED]` S20b; `[CLARIFIED]` H15 | `correspondence.number` is whole-document `C/n` (`dummyData.js:129`); no page field, no per-page anchor. AddCorrespondenceModal shows a cosmetic "Page Range" input that nothing stores. | Page-level linking impossible with current shape. |
| **Email attachment / email reference** | `[SPECIFIED]` S20a; `[CLARIFIED]` H15 | No email entity/field; `correspondence.type` has no `Email`; `fileUrl` always `'#'`. AddCorrespondenceModal offers an "Email Reference" sub-form that is discarded. | Email-as-correspondence unmodeled. |
| **Draft-vs-submitted note state (durable)** | `[SPECIFIED]` S3; `[CLARIFIED]` H2 | `note.isDraft` exists but only on file1 notes and always `false` (`dummyData.js:79,107`); no draft persistence; no "request edit/add rights" concept (H2). | Field present but inconsistent and never used; the H2 "request to edit/add" mechanism has no model at all. |
| **Audit / immutability of old notes** | `[SPECIFIED]` SOW §2A ("old notes remain permanently"); prototype docs claim immutable trail | Data *shapes* an audit trail (dated notes/movements/approvals) but there is **no immutability marker, no version, no append-only constraint** in the model — it's a plain mutable array. | Permanence is asserted by docs, not represented in the model. |
| **Recipient / routing list as a first-class entity** | `[SPECIFIED]` S18; `[CLARIFIED]` H13 ("Add checker / recipient") | No `recipients[]` / `routingPlan` / `workflowSteps[]` field on File. ForwardFileModal builds a recipient order list **in local component state only**; it never lands in the model, and CreateFile has no initial-routing field at all. | The "pre-defined recipient workflow" and "originator plans initial flow" (SOW §3.1/§5) have no persistent home. |
| **Post-approval routing to actionable dept then return to maker** | `[SPECIFIED]` S19; `[CLARIFIED]` H14 | No field tracks "routed for implementation" vs "returned to maker"; `movement.action` lacks such values; no `implementationStatus`. | S19 lifecycle stage unmodeled. |
| **Multiple checkers** | `[SPECIFIED]` S6a | `checkers[]` is an array (shape supports it) but seed never exceeds 1 entry (`dummyData.js:47-49,254-256`). | Shape OK; only the data is thin — flag for test coverage, not a model gap. |
| **Section-level edit rights** | `[SPECIFIED]` S17; `[CLARIFIED]` H12 | No permission/ACL/edit-rights field on File, Section, or User. | Entire access-rights dimension absent (no role on User either). |
| **Suo-moto note (note without correspondence)** | `[SPECIFIED]` SOW §8 | Representable incidentally (a note with empty `references.correspondence`), but there is **no explicit flag** distinguishing a suo-moto note from one whose correspondence simply isn't linked yet. | Concept exists only by absence; no first-class marker. |
| **Confidential access enforcement** | `[SPECIFIED]` SOW §7 | `confidential: true` exists (`dummyData.js:250`) but there is no access-list, no clearance field, no "movement only with signature" constraint. | Flag present, enforcement model absent. |

### 5.3 Internal consistency tensions (within the data itself)

`[OBSERVED]`
- **Non-uniform Note shape:** `role`, `isDraft`, `checkerComments` exist on file1's notes and are missing from notes in file2/3/4 (`dummyData.js:71-85` vs `:207-218`). Any consumer must treat them as optional.
- **Two User shapes:** `currentUser` has `email`; `users[]` entries do not (`dummyData.js:8` vs `:21-26`).
- **Casing inconsistency in status families:** `File.status`/`Note.status` are Title Case (`'Under Review'`) but `Checker.status`/`CheckerComment.action` are lowercase (`'checked'`) — `dummyData.js:36` vs `:48,121`.
- **Denormalization drift risk:** `file1.approver === null` (`dummyData.js:50`) while `mov2` already forwards "For final approval" to user3 (`:166-167`); the triad and the movement history are not reconciled.
- **Date format split:** files use date-only `YYYY-MM-DD` (`dummyData.js:39`) while notes/movements/correspondence-upload use ISO-ish `YYYY-MM-DDThh:mm:ss` (`:77,135,157`). `[CLARIFIED]` H5 requires date **and time** stamps on actions — the date-only file fields would not satisfy that.

---

## 6. Quick reference — entity → file:line index

| Entity / value object | Defined at |
|---|---|
| `currentUser` | `src/data/dummyData.js:3-9` |
| `sections` | `src/data/dummyData.js:11-18` |
| `users[]` | `src/data/dummyData.js:20-27` |
| `File` (file1) | `src/data/dummyData.js:30-170` |
| `maker` | `src/data/dummyData.js:46` |
| `checkers[]` (checker entry) | `src/data/dummyData.js:47-49` |
| `approver` | `src/data/dummyData.js:50,257` |
| `Note` (note1/note2) | `src/data/dummyData.js:54-124` |
| `note.author` | `src/data/dummyData.js:71-76` |
| `note.references` | `src/data/dummyData.js:80-83` |
| `note.approvals[]` (Approval) | `src/data/dummyData.js:112-114` |
| `note.checkerComments[]` (CheckerComment) | `src/data/dummyData.js:115-123` |
| `Correspondence` | `src/data/dummyData.js:126-151` |
| `Movement` | `src/data/dummyData.js:152-169` |
| helpers | `src/data/dummyData.js:390-404` |