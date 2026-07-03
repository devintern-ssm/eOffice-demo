# Phase 1.2 — Noting & Correspondence

**Goal:** make the two sides of the file real — add sequential notes (with drafts and references) and upload correspondence documents (PDF), all persisted with an append-only audit trail.

## What was built

**Backend**
- **StorageProvider** (`server/src/services/storage.ts`) — disk-backed blob storage behind an interface (swaps to S3/Azure for the Phase-2 DMS without touching call sites).
- **Notes** — `POST /files/:id/notes` adds the next sequential note (holder-only, per the single-holder model). Supports **draft vs submitted** (`isDraft`), **suo-moto** (no correspondence), and **references** to `C/n` / `Note n`. Writes an append-only `Movement`.
- **Correspondence** — `POST /files/:id/correspondence` (multipart) uploads a **PDF** (validated; **PDF-only per decision C13**) or records an **email reference** (no file). Auto-assigns the next `C/n`. `GET /files/:id/correspondence/:corrId/file` streams the stored PDF. Writes a `Movement`.
- Both mounted as nested routers under `/files/:id/...` (auth inherited).

**Frontend**
- `src/api/notes.js`, `src/api/correspondence.js`, and `apiUpload` / `apiBlob` helpers in `src/api/client.js`.
- **Add Note modal** → real `POST`; **Save Draft** and **Submit** both persist; the **"Search Approved Files"** feature now calls the API (this fixes a latent crash in the old prototype).
- **Add Correspondence modal** → real **PDF upload** (drag-and-drop or picker) with client + server validation; email-reference option.
- **File Detail** refreshes in place after adding a note/correspondence; the correspondence **View / Download** buttons now stream the real PDF.

## What you should test

Act as a user who **holds** the file (e.g. **Rajesh** holds `ADMIN/2024/002`; open it from the **Inbox**).

1. **Add a note (submit):** open a file you hold → **Add Note** → type content, tick a **Reference Correspondence** box (e.g. C/1) → **Submit Note**. The modal closes and a new **Note N** appears immediately, with the `C/1` reference rendered as a **clickable link** (click it → scrolls to C/1).
2. **Add a draft note:** same, but click **Save Draft** → the note is saved with status **DRAFT**.
3. **Search approved files:** in the Add Note modal, type 3+ chars in **Search Approved Files** → results appear (e.g. `LEGAL/2024/001`), click one to copy a reference into the note. (Old prototype crashed here — now fixed.)
4. **Upload correspondence (PDF):** **Add Correspondence** → choose type + title → drag or pick a **PDF** → **Upload**. A new **C/N** card appears; click **View** (opens the PDF in a new tab) and **Download**.
5. **Non-PDF is rejected:** try uploading a non-PDF → you get "Phase 1 supports PDF files only".
6. **Email reference:** switch to **Email Reference**, enter a subject → **Upload** → a `C/N` entry appears (no View/Download, since there's no file).
7. **Holder-only rule:** as a user who does **not** hold the file, the Add Note call is rejected (403). *(Full multi-user testing is easier once the login screen lands in 1.10.)*
8. **Audit trail:** expand **File Movement** on the file — you'll see `NOTE_ADDED` / `UPLOAD` entries recorded.

## Notes / limitations
- **Forwarding and Check/Approve/Revert are still stubs** — they become real in **1.3** (workflow engine). Adding a note here doesn't yet advance the workflow or change the holder.
- Editing an existing draft note in place isn't wired yet (you can add a new draft); in-place draft editing comes with the workflow slice.
- Email references store a reference string only (no file); live mailbox sync is Phase 2.
- The `ReviewModal` still has the old `FiUpload` import crash — it will be rewritten in **1.3**, so don't use "Review & Approve" yet.
- Uploaded PDFs are stored under `server/uploads/` (gitignored).
