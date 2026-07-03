# 02 — Screen & Modal Inventory

This document inventories every routed screen, every modal/component-screen, and the Layout shell of the e-Office N-C prototype. It is **discovery only** — no implementation. Every code claim cites `file:line`. Provenance labels: **[OBSERVED]** = seen in code; **[SPECIFIED]** = SOW/DOCX; **[CLARIFIED]** = handwriting (H-number); **[INFERRED]** = my assumption.

A note on the "Real / Partial / Stub" column:
- **Real** = the screen's own behaviour (view/filter/sort/navigation) genuinely works against the mock data layer.
- **Partial** = some interactions work, but at least one advertised action is a stub, dead, or crashes.
- **Stub** = the screen's primary action is a demo `alert()` / non-functional; only navigation or local form state is real.

All persistence is absent: the only data layer is `src/data/dummyData.js` and every state-mutating action ends in an `alert('… (Demo mode)')` **[OBSERVED]**, consistent with the prototype's own claim that it is a frontend-only demo (README.md:131-135).

> **Layout orientation note:** Throughout this doc the File Detail view is described as a "two-pane" Noting + Correspondence viewer. In code the two sides are stacked **vertically**, not left/right: NOTING SIDE is the top half (`src/pages/FileDetail.jsx:349-350`) and CORRESPONDENCE SIDE is the bottom half (`:406-407`). H7 maps L=Noting / R=Correspondence **[CLARIFIED]**, which is the physical-file convention; the SOW author-margin convention (Note-1 author at right, later notes at left) is still satisfied by the code. The left/right vs top/bottom difference is a layout detail, not a behavioural one.

---

## Master inventory table

| Screen | Path / Route | Source file | Purpose | Key UI elements | Data source | Role visibility | Real / Partial / Stub |
|---|---|---|---|---|---|---|---|
| **Dashboard** | `/` (index) | `src/pages/Dashboard.jsx:1-123` | Landing overview: 4 KPI stat cards + Recent Activity feed | 4 stat cards (Pending My Action, Files I Created, Awaiting Approval, Overdue), Recent Activity list, "Create New File" header button | Inline filters over `files` (`Dashboard.jsx:8-26`); not the `getFilesBy*` helpers | None — counts computed only for hardcoded `currentUser` user1 (`dummyData.js:3-9`) | **Partial** — read-only aggregations are real; Overdue card deep-link is dead and the overdue count is meaningless against 2026 date |
| **My Files** | `/my-files` | `src/pages/MyFiles.jsx:1-158` | Files created by current user, with search/filter/sort | Search box, status filter, sort-by select (Last Used / Created / File Number), per-card "View File" | `files.filter(createdBy===currentUser.id)` inline (`MyFiles.jsx:12`); does not use `getFilesByCreator` (`dummyData.js:402`) | None — "My" is fixed to user1 (`dummyData.js:3`) | **Real** (as read-only list) — search/filter/sort all work |
| **Inbox** | `/inbox` | `src/pages/Inbox.jsx:1-149` | Files assigned to user; only screen surfacing Inward/Outward | Search, status filter, **type filter (Inward / Outward)**, inbox-type badge, "View File" | `files.filter(currentAssignee===currentUser.id)` inline (`Inbox.jsx:12`); not `getFilesByAssignee` (`dummyData.js:398`) | None — assignee fixed to user1; only file2 matches | **Partial** — filters work, but Inward vs Outward is cosmetic only (badge `Inbox.jsx:107-111`, no behavioural difference) |
| **Pending Approvals** | `/pending-approvals` | `src/pages/PendingApprovals.jsx:1-96` | Lists all files in `Under Review` | Search box (fileNumber/subject only), per-card "Review File", **hardcoded status badge** | `files.filter(status==='Under Review')` inline (`PendingApprovals.jsx:10`); not `getFilesByStatus` (`dummyData.js:394`) | None — `currentUser` is not even imported; shows ALL under-review files regardless of approver | **Partial** — list/search real, but not a true per-approver queue; status badge hardcoded `'Under Review'` / `#ed8936` (`:59-61`) |
| **Sent Files** | `/sent-files` | `src/pages/SentFiles.jsx:1-110` | Files the user created that have ≥1 movement | Search (fileNumber/subject only), status filter, "View File" | `files.filter(createdBy===currentUser.id && movements.length>0)` inline (`SentFiles.jsx:11-13`) | None — `createdBy` fixed to user1 | **Partial** — filtering works, but cards never show recipient/destination despite `movements[]` data existing (`dummyData.js:152-169`) |
| **All Files** | `/all-files` | `src/pages/AllFiles.jsx:1-148` | Global registry across all sections | Search, status filter, **section filter**, **UN-number filter**, confidential badge, "View File" | Full `files` array directly (`AllFiles.jsx:16`); sections hardcoded (`:13`), UN numbers derived via Set (`:14`) | None — confidential file3 shown to everyone with only a badge (`:108-110`), no gating | **Real** (as registry) — all 4 filters work; but ignores `?filter=overdue` from Dashboard (no `useSearchParams`) |
| **File Detail** | `/file/:fileId` | `src/pages/FileDetail.jsx:1-491` | Richest screen: two-pane N-C viewer (Noting + Correspondence, stacked top/bottom), clickable cross-refs, hosts all 4 modals | Collapsible File Cover + Movement timeline; Noting side; Correspondence side; Quick Actions (Add Note, Add Correspondence, Forward, Review & Approve, Print); clickable `C/n` & `Note n` refs; per-corr View/Download | `getFileById(fileId)` (`dummyData.js:390`); "File not found" fallback (`FileDetail.jsx:26-35`) | None — all action buttons unconditionally shown; only status-based conditional is Print (status==='Approved', `:333`). Note-1 author at right margin (`:379`), later at left (`:368`) is layout, not access | **Partial** — view/refs/scroll-highlight/collapse real; Print is a stub `alert` (`:338`); corr View/Download dead (`:429-434`); all 4 modals stubs |
| **Create File** | `/create-file` | `src/pages/CreateFile.jsx:1-185` | Form to create a new N-C file | File Number (**free-text**), section select, subject, period dates, file type, confidential checkbox, initial note, initial correspondence upload, Create/Cancel | Controlled `formData` (`CreateFile.jsx:9-17`); section list from `dummyData` (`:71`) | None — any user sees identical form | **Stub** — submit is `alert('File created successfully! (Demo mode)')` + navigate (`:19-24`); nothing persists |
| **Reports** | `/reports` | `src/pages/Reports.jsx:1-188` | File Reports & Logs: audit-log table + KPI cards + Export | Export Logs button, search, section filter, **date filter (dead)**, KPI cards, log table, per-row file link | `files.flatMap` synthesizes created/movement/note logs (`Reports.jsx:14-61`) | None — full cross-section log including confidential file3 activity visible to all | **Partial** — aggregation/search/section-filter real; Export is `alert` (`:73`); date filter is dead (`:8` never read); row links use raw `<a href>` (`:159`) breaking SPA nav |
| **Add Note** | modal (hosted by File Detail) | `src/components/AddNoteModal.jsx:1-205` | Compose sequential note, reference corr/notes, search approved files, forward, save draft | Note textarea, corr/notes reference checkboxes, **Search Approved Files (crashes)**, Forward To (free-text), Submit/Save Draft/Cancel | Local state (`AddNoteModal.jsx:7-13`); `file.correspondence`/`file.notes` checkboxes; author = `currentUser` (`:3`) | None — author always hardcoded `currentUser` | **Stub** — submit/draft are `alert`s (`:18,20,27`); references/forwardTo collected but unused; **Search Approved Files crashes** |
| **Add Correspondence** | modal (hosted by File Detail) | `src/components/AddCorrespondenceModal.jsx:1-223` | Add a C/n document via upload or email reference | Auto-shown next C-number, document type select (10 types), title, inward date/number, **File-upload + drag-drop**, email reference, page-range field, Upload/Cancel | Local state (`AddCorrespondenceModal.jsx:6-13`); `nextCorrNumber = C/${length+1}` (`:15`) | None — anyone can add | **Stub** — submit is `alert('Correspondence C/n added… (Demo mode)')` (`:38`); file selection/drag-drop real but never transmitted |
| **Forward File** | modal (hosted by File Detail) | `src/components/ForwardFileModal.jsx:1-186` | Only recipient-workflow UI: pick section, multi-select recipients, reorder, priority, remarks | Section select, recipient checkboxes, up/down reorder, priority select, remarks textarea, empty-recipient guard, Forward/Cancel | Local state (`ForwardFileModal.jsx:7-11`); `users` filtered by section (`:13-15`) | None — recipients are plain `users` with no role filtering (no restriction to valid checkers/approvers) | **Partial** — section filter, multi-select, reorder, priority, remarks, guard all real; forward action is `alert` (`:24`); no movement recorded |
| **Review & Approve** | modal (hosted by File Detail) | `src/components/ReviewModal.jsx:1-233` | Maker-Checker review/approval with 6 actions, paragraph approval, MD upload, signature | **6 action buttons** (Check/Approve/Revert/Approve w/ Conditions/Reject/Request Clarification), paragraph A/B/C checkboxes, **MD offline upload (crashes)**, digital-signature text input, forward-to, remarks | Local state (`ReviewModal.jsx:7-13`); `latestNote = file.notes[last]` (`:15`); reviewer = `currentUser` (`:3`) | None — any user sees all 6 actions incl. Approve/Reject and MD upload; `note.author.role` not consulted | **Partial** — action selection/paragraph/signature/remarks real; submit is `alert` (`:24`); **MD upload path crashes** |
| **Layout (shell)** | wraps all routes | `src/components/Layout.jsx:1-107` | App shell: header + collapsible sidebar nav + content slot | 7 sidebar nav links (`:23-31`), menu toggle, **global search (dead)**, **notification bell + hardcoded badge "3" (dead)**, **user profile (static, dead)** | `menuItems` array (`:23-31`); `currentUser` for profile (`:70-71`) | None — all 7 nav items shown to everyone; profile is the single hardcoded user (Rajesh Kumar, Section Officer) | **Partial** — nav links + sidebar toggle real; global search, notifications, profile dead |
| **App (router root)** | n/a | `src/App.jsx:1-34` | Declares the 9-route table inside `BrowserRouter` + `Layout` | 9 `<Route>` definitions (`App.jsx:19-27`) | none | None — no protected/role-gated routes; no `path="*"` catch-all | **Real** — routing is genuinely wired; no 404 route; `/create-file` has no sidebar entry |

---

## (a) Stub & dead-button catalogue

Every fake/non-functional surface, with `file:line`. **[OBSERVED]** throughout.

### `alert('… (Demo mode)')` stubs (state-mutating actions that persist nothing)

| Action | Source | Line |
|---|---|---|
| Create File submit | `src/pages/CreateFile.jsx` | `:22` — `alert('File created successfully! (Demo mode)')` |
| Add Note — submit | `src/components/AddNoteModal.jsx` | `:20` — `alert('Note submitted successfully! (Demo mode)')` |
| Add Note — submit (draft path) | `src/components/AddNoteModal.jsx` | `:18` |
| Add Note — Save Draft | `src/components/AddNoteModal.jsx` | `:27` |
| Add Correspondence — Upload | `src/components/AddCorrespondenceModal.jsx` | `:38` — `alert(\`Correspondence ${nextCorrNumber} added… (Demo mode)\`)` |
| Forward File — Forward | `src/components/ForwardFileModal.jsx` | `:24` — `alert(\`File forwarded to N recipient(s)! (Demo mode)\`)` |
| Review & Approve — Submit | `src/components/ReviewModal.jsx` | `:24` — `alert(\`File ${action}! (Demo mode)\`)` |
| File Detail — Print | `src/pages/FileDetail.jsx` | `:338` — `alert('Print functionality… (Demo mode)')` |
| Reports — Export Logs | `src/pages/Reports.jsx` | `:73` — `alert('Exporting file logs… (Demo mode)')` |

### `fileUrl: '#'` (no real documents)

- All `correspondence[]` entries carry `fileUrl: '#'` — `src/data/dummyData.js:136` (and each subsequent corr entry). The File Detail per-correspondence **View / Download buttons have no `onClick`** (`src/pages/FileDetail.jsx:429-434`) → dead.
- Create File "Initial Correspondence" `<input type="file">` has **no `onChange`** — `src/pages/CreateFile.jsx:155-159` → selected file never read.

### Hardcoded badges / counts / static labels

| Item | Source | Line |
|---|---|---|
| Notification badge count `"3"` (no handler) | `src/components/Layout.jsx` | `:65` (button `:63-66`) |
| Global search input — no `value`/`onChange`/submit | `src/components/Layout.jsx` | `:59` |
| User profile — static display, no dropdown/logout | `src/components/Layout.jsx` | `:67-73` |
| Pending Approvals status badge — hardcoded `'Under Review'` / `#ed8936` | `src/pages/PendingApprovals.jsx` | `:59-61` |
| Reports date filter — state declared, never read | `src/pages/Reports.jsx` | `:8` (control `:110-118`; filter logic `:63-70` ignores it) |
| Dashboard Overdue card deep-link `/all-files?filter=overdue` — never consumed | `src/pages/Dashboard.jsx` `:55` ↔ `src/pages/AllFiles.jsx` (no `useSearchParams`) |
| Reports row links use raw `<a href>` instead of `<Link>` (full reload) | `src/pages/Reports.jsx` | `:159` |

### The 2 latent crashes (confirmed by re-reading the files)

1. **`ReviewModal` — `FiUpload` not imported.** Clicking "Upload Offline MD Approval" sets `showMdUpload=true`, which renders `<FiUpload/>` at `src/components/ReviewModal.jsx:~174`, but the import line is `import { FiX, FiCheck, FiXCircle, FiArrowLeft, FiSend } from 'react-icons/fi'` (`src/components/ReviewModal.jsx:2`) — **`FiUpload` is absent** → `ReferenceError: FiUpload is not defined`. **[OBSERVED]** This affects SOW S11 (MD offline-approval upload) **[SPECIFIED]**.

2. **`AddNoteModal` — `files` not imported.** `handleSearchApprovedFiles` references `files.filter(...)` at `src/components/AddNoteModal.jsx:36`, but the only import is `import { currentUser } from '../data/dummyData'` (`src/components/AddNoteModal.jsx:3`) — **`files` is undefined**. Typing >2 chars in "Search Approved Files" (guard at `:33`) throws `ReferenceError: files is not defined`. **[OBSERVED]** This affects SOW S4 (search/reference approved files) **[SPECIFIED]** and H3 ("separate search string") **[CLARIFIED]**.

### Other dead/non-spec surfaces worth flagging for backend planning

- `App.jsx` has **no `path="*"` catch-all** — unknown URLs render the shell with a blank main area (`src/App.jsx:19-27`). **[OBSERVED]**
- `/create-file` is routed (`src/App.jsx`) but **has no sidebar nav entry** (`src/components/Layout.jsx:23-31`); reachable only via in-page buttons. **[OBSERVED]**
- ReviewModal exposes **6 actions** vs the canonical **3 (Check/Approve/Revert)** named in the SOW S6c **[SPECIFIED]** and handwriting **[CLARIFIED]** — scope creep relative to spec; surfaced here, not silently reconciled.

---

## (b) Role-visibility note — the UI never branches on role

**The prototype has no authentication and no role model in code.** `src/data/dummyData.js:3-9` exports a single hardcoded singleton:

```
currentUser = { id:'user1', name:'Rajesh Kumar', designation:'Section Officer', section:'Administration', email:'…' }
```

Consequences observed across every screen above:

- **Identity is immutable.** There is no login, no user switcher, no `currentUser` setter anywhere. Every "personalized" view — My Files (`createdBy===currentUser.id`, `MyFiles.jsx:12`), Inbox (`currentAssignee===currentUser.id`, `Inbox.jsx:12`), Sent Files (`SentFiles.jsx:11-13`) — resolves to the same one user. **[OBSERVED]**
- **No permission gating on actions.** File Detail shows Add Note, Add Correspondence, Forward, and Review & Approve unconditionally to everyone (`src/pages/FileDetail.jsx`); the only conditional is status-based Print (`:333`). ReviewModal shows all 6 actions (incl. Approve/Reject/MD-upload) to any user; `note.author.role` exists in data (`dummyData.js:75,103`, file1 notes only) but is **never read** by the UI. **[OBSERVED]**
- **Pending Approvals is the clearest violation of the domain model:** it does not even import `currentUser` and lists **all** `Under Review` files (`PendingApprovals.jsx:10`), so a Maker sees the same queue as an MD. **[OBSERVED]** In a real N-C system this should scope to the approver awaiting signature. **[SPECIFIED]** (SOW S6 Maker-Checker-Approver)
- **Confidentiality is decorative.** Confidential file3 (`dummyData.js:250`) renders a "CONFIDENTIAL" badge in All Files (`AllFiles.jsx:108-110`) and its activity appears in Reports, with **no access restriction** and no protected route in `App.jsx`. **[OBSERVED]** Conflicts with SOW §7 (restricted access, movement only with signature) **[SPECIFIED]**.
- **Maker / Checker / Approver / MD are conceptual only.** `author.role` is descriptive string metadata on file1's notes (`dummyData.js:75,103`) and is never enforced or branched on. **[OBSERVED]**

This directly conflicts with the prototype's own docs, which **claim** enforced role-based access for Originator / Reviewer / Approver / Admin (Quick_Reference_Summary.md:8,86-108; Screen_Structure_Proposal.md:512). **No such enforcement exists in code.** Surfaced as a conflict, not reconciled.

Relevant handwriting for the backend team to keep in scope (not yet present in code): H5 (Check/Approve/Revert must record date-time stamp + department) **[CLARIFIED]**; H6 ("file locked — Creator / Checker": a lock indicating who currently holds the file) **[CLARIFIED]**; H13 ("Add checker / recipient" mid-flow) **[CLARIFIED]**. None of these have any implementation; record for `07_open_questions`.

---

### Files cited in this inventory (absolute paths)

- `D:\Sahasrara\eOffice\demo\src\App.jsx`
- `D:\Sahasrara\eOffice\demo\src\components\Layout.jsx`
- `D:\Sahasrara\eOffice\demo\src\components\AddNoteModal.jsx`
- `D:\Sahasrara\eOffice\demo\src\components\AddCorrespondenceModal.jsx`
- `D:\Sahasrara\eOffice\demo\src\components\ForwardFileModal.jsx`
- `D:\Sahasrara\eOffice\demo\src\components\ReviewModal.jsx`
- `D:\Sahasrara\eOffice\demo\src\pages\Dashboard.jsx`, `MyFiles.jsx`, `Inbox.jsx`, `PendingApprovals.jsx`, `SentFiles.jsx`, `AllFiles.jsx`, `FileDetail.jsx`, `CreateFile.jsx`, `Reports.jsx`
- `D:\Sahasrara\eOffice\demo\src\data\dummyData.js`