# e-Office — DEMO RUNBOOK (follow blindly, in order)

> **NOTE-CENTRIC model.** A **file is a permanent binder** (UN number) that stays **OPEN**.
> The unit of work is the **NOTE**: each note has its own maker and its own **signature chain**;
> a signer either **Signs & Forwards** or **Sends Back**; the last signer **finalizes** the note
> and the file returns to that note's maker. Notes are done **one at a time**.
>
> Every password is **`Admin@123`**. The login screen has one-click buttons — never type a password.

---

## PART 0 — BEFORE THE MEETING (do this 10 minutes early)

**0.1** Open a terminal in `D:\Sahasrara\eOffice\demo`.

**0.2 Start the backend** — new terminal:
```
cd server
npm run dev
```
SEE: `listening on http://localhost:4000`. Leave it running.

**0.3 Start the frontend** — another terminal, in `D:\Sahasrara\eOffice\demo`:
```
npm run dev
```
SEE: a `localhost:3000` line. Leave it running.

**0.4 Load clean demo data** — another terminal:
```
cd server
npm run seed:demo
```
SEE: `Seeded 6 users … ADMIN/2026/001 … ACC/2026/001 …` (5 binders).

**0.5** Open **Chrome** → **http://localhost:3000** → **F11** (full screen), **Ctrl +** once or twice, make the window **wide** (the file screen is two panes side-by-side).

**0.6** Sample PDFs for the live upload: `D:\Sahasrara\eOffice\demo\demo-samples\1_quotation.pdf`, `2_technical_specs.pdf`, `3_signed_approval.pdf`.

✅ Log out if logged in (top-right) so you start at the login screen.

---

## PART 1 — OPENING LINE (15 seconds)

**SAY:** *"This is the Digital Office — the paper Noting–Correspondence file, made digital. A file is a permanent binder identified by a UN number; it normally stays open for years. The real unit of work is the **note**: someone raises a note, the file travels to each officer to sign it, and when the last officer signs, that note is final and the file comes back. Correspondence is page-numbered — every page is C1, C2, C3… Let me raise a note live."*

---

## PART 2 — THE LIVE STORY: raise a note and get it signed (the main demo)

### As the MAKER (Rutuja)

**2.1 DO:** Login → **`Rutuja · Maker`** → **SEE** the Dashboard.

**2.2 DO:** Click **Create New File** → **Section** = `Administration`; **Subject** = `Procurement of 20 Laptops for the Finance Department` → **Create File**.
**SEE:** the binder opens with a **UN number already assigned** (e.g. `ADMIN/2026/006`), **Status OPEN**, **Current Holder: Rutuja**.
**SAY:** *"The binder gets its UN number the moment it's opened."*

**2.3 DO:** Click **Add Correspondence** → Type `Quotation`, Title `Vendor quotation — laptops`, upload **`1_quotation.pdf`** → **Upload**.
**SEE:** it appears as **C1–C3** on the correspondence side.
**2.4 (optional) DO:** Add Correspondence again → upload **`2_technical_specs.pdf`**.
**SEE:** it appears as **C4–C5** — *page numbers continue across attachments.*
**SAY:** *"Every page gets its own C-number, running continuously across documents."*

**2.5 DO:** Click **Add Note** → in **Note Content** type:
`Proposal to procure 20 laptops for Finance. The quotation is at C1. Recommended for approval.`
**2.6 DO:** In **Signature chain**, tick **Rasika R Sawant** (role shows **Checker**) then **Ravindra Pawar** (role **Approver**).
**SEE:** a numbered **Chain order** appears: `1. Rasika (Checker) → 2. Ravindra (Approver)`.
**2.7 DO:** Click **Submit for Signature**.
**SEE:** Status stays **OPEN**; **Active Note: Note 1 · In Review**; **Current Holder: Rasika**; the left **Signature Chain — Note 1** panel shows Rasika current.
**SAY:** *"The note is now travelling the signature chain. The file itself stays open."*

**2.8 DO:** In the note text, click the blue **C1** link.
**SEE:** the quotation PDF opens **inline** on the correspondence side.

### As the CHECKER (Rasika)

**2.9 DO:** Log out → **`Rasika · Checker`** → left menu **Pending Approvals** → on the *"…20 Laptops…"* row click **Review File**.
**2.10 DO:** Click **Sign / Send Back**.
**SEE:** a dialog — your step is *"Rasika R Sawant (Checker)"*; the two actions are **Sign & Forward** and **Send Back**.
**2.11 DO:** Leave **Sign & Forward** selected, type remark `Checked. Budget available. Recommended.` → click **Sign & Forward**.
**SEE:** **Current Holder → Ravindra**; the chain shows Rasika **Signed ✍** with her remark.
**SAY:** *"She signed and it moved to the next officer. One person can be both checker and approver — it's just a chain."*

### As the APPROVER (Ravi) — the last signer

**2.12 DO:** Log out → **`Ravi · Approver`** → **Pending Approvals** → **Review File** → **Sign / Send Back**.
**SEE:** the button reads **Sign & Finalize** (he's the last signer).
**2.13 DO:** Remark `Approved.` → **Sign & Finalize**.
**SEE:** **Note 1 → FINALIZED**; **Active Note** clears; the file returns to its maker (**Current Holder: Rutuja**). The note shows both signatories with names, dates and remarks.
**SAY:** *"The last signature finalizes the note, and the file comes back to the person who raised it — ready for the next note. The file never had to 'close'."*

✅ **That's the core loop. Everything below is "and it also does…".**

---

## PART 3 — SHOW A COMPLETE, REAL BINDER (30 seconds)

**3.1 DO:** Top **search box** → `Procurement of 50` → open **ADMIN/2026/001**.
**SEE:** a large binder — **3 notes**, each **FINALIZED** with its **own signature chain**, and **8 correspondence groups** (C1–C3 … C24–C26, 26 continuously-numbered pages).
**3.2 SAY, pointing:**
- *"Note 1 was checked by the Manager and approved by the Deputy MD — see the two signatures under the note."*
- *"Note 2 went to the Managing Director, who signed **offline**; the scanned signed copy is filed as **C23** and takes its place in the page numbering."*
- *"Note 3 was raised in **Accounts** by a different officer — the file was **handed over** to Accounts to issue the purchase order (C24–C26), then handed back. Same binder, different departments, and it's still **OPEN**."*
**3.3 DO:** On any correspondence group click **Show N pages** → click a page chip (e.g. **C4**) → the PDF opens to that page.

---

## PART 4 — THE STANDING FILE (never closes) — 20 seconds

**4.1 DO:** Search `Bills Register` → open **ACC/2026/001** (log in as **`Suhas · Accounts`** first if prompted).
**SEE:** an Accounts binder with **Note 1 finalized** (a bill passed for payment) and **Note 2 in review** — a live, ever-growing register.
**SAY:** *"An accounts bills file like this never closes — officers keep adding notes and correspondence to the same binder indefinitely. That's exactly the standing-file case."*

---

## PART 5 — QUICK FEATURE HITS (pick any, ~15 sec each)

**5.1 Drafts.** As Rutuja → left menu **Drafts** → open **ADMIN/2026/004** → SEE the draft note with **Put up for signature**. SAY: *"Draft notes are private to their maker until put up."*
**5.2 Send back.** In a live in-review note, choose **Send Back** instead of Sign → the note returns to its maker as **RETURNED**, who can **Edit & Resubmit**.
**5.3 Notifications.** Click the **bell** — officers are alerted when a note reaches them or is finalized.
**5.4 Confidential.** **ADMIN/2026/003** is confidential. Log in as **`Suhas · Accounts`** → **All Files** → SEE it is **not listed** for him.
**5.5 Print.** On any binder → **Print…** → **Noting** → each note prints with **its own signatory block**; Noting and Correspondence print as two separate PDFs.

---

## PART 6 — SUPER ADMIN (the second dashboard)

**6.1 DO:** Log out → **`Admin`**.
**SEE:** **Super Admin Dashboard** — system counts (Total Files / Open / Notes In Review / Closed) and a shorter menu.
**SAY:** *"The Super Admin is oversight-only — users, departments and reports, but not the file contents."*
**6.2 DO:** **Reports & Logs** → **All Files** tab → **Submitted By** + **Department** columns → **Export CSV**.
**6.3 DO (proves the lock):** click any file number → SEE a *restricted* message. SAY: *"The register, not the noting content."*

---

## PART 7 — ANSWER TABLE (if they ask "did you do X?")

| They ask about… | You say / show |
|---|---|
| The note is the unit, not the file | ✅ Part 2 — each note has its own maker + signature chain |
| File stays open / never closes | ✅ Part 4 — the Accounts bills register |
| Same person checks and approves | ✅ "The chain is just people; one person can be both — two actions, Sign or Send back." |
| Page-level C-numbers | ✅ Part 2.4 / Part 3 — C1, C2 … C26; reference a single page (C4) |
| Continuous note pages | ✅ Part 3 — Note 1 p.1, Note 2 p.2 … on the noting side |
| MD signed printout scanned + numbered | ✅ Part 3.2 — C23 is the scanned MD signature |
| Cross-department movement | ✅ Part 3.2 — handed to Accounts and back |
| Per-note signatories on print | ✅ Part 5.5 |
| Two dashboards (Super Admin + User) | ✅ Part 6 vs Part 2.1 |

---

## PART 8 — IF SOMETHING GOES WRONG

- **A screen looks stuck/empty:** press **F5** and log in again.
- **Data looks messy / you want a clean slate:** in the seed terminal run `npm run seed:demo`, then **F5**.
- **"Add Note" isn't shown:** either you're not the current holder, or a note is already in progress (finish that note first — notes are sequential).
- **Backend error / :4000 down:** in `server` run `npm run dev` again.
- **Lost mid-flow:** jump to **Part 3** (the finished binder) — it stands on its own.

---

### One-line cheat sheet (keep visible)
Login → **Rutuja** (raise note) → **Rasika** (Sign & Forward) → **Ravi** (Sign & Finalize) → back to Rutuja.
Create binder (UN auto) → Add Correspondence (C-pages) → **Add Note** → tick signer chain → **Submit for Signature** → each signer **Sign / Send Back**. Then show **ADMIN/2026/001** and **ACC/2026/001**. Then **Admin** for reports. Password `Admin@123`.
