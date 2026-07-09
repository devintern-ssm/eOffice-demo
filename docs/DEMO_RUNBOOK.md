# e-Office — DEMO RUNBOOK (follow blindly, in order)

> Read each step, do exactly what **DO** says, confirm **SEE**, optionally read **SAY** aloud.
> Every password is **`Admin@123`**. The login screen has one-click buttons — you never type a password.

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
SEE: `Seeded 6 users … ADMIN/2026/001 … ADMIN/2026/002 … ADMIN/2026/003 … (draft)`.

**0.5** Open **Chrome** → go to **http://localhost:3000** → press **F11** (full screen) and **Ctrl +** once or twice so text is large. Make the window **wide** (the file screen shows two panes side-by-side).

**0.6** Confirm the sample files exist (you'll upload these live):
`D:\Sahasrara\eOffice\demo\demo-samples\1_quotation.pdf`, `2_technical_specs.pdf`, `3_signed_approval.pdf`.

✅ You are ready. Log out if you're logged in (top-right exit icon) so you start at the login screen.

---

## PART 1 — OPENING LINE (10 seconds)

**SAY:** *"This is the Digital Office — the paper Noting–Correspondence file, made digital. A file has two sides: the Noting side where officers write and sign remarks, and the Correspondence side where documents are attached. Files move up an approval chain — Maker, Checker, Approver, MD — and everything is tracked. Let me create one live."*

---

## PART 2 — THE LIVE STORY: create a file and get it approved (the main demo)

### As the MAKER (Rutuja)

**2.1 DO:** On the login screen, click **`Rutuja · Maker`**.
**SEE:** the **Dashboard** with KPI cards.

**2.2 DO:** Click **Create New File** (top-right).

**2.3 DO:** Fill the form:
- **Section/Department:** choose **Administration**
- **Subject:** type `Procurement of 20 Laptops for the Finance Department`
- **Initial Note:** type `Proposal to procure 20 laptops for Finance. The vendor quotation is placed at C/1. Put up for approval.`

**2.4 DO:** Click **Create File**.
**SEE:** the file opens. Left = file info; right = **NOTING SIDE** (your note is "Note 1") and **CORRESPONDENCE SIDE** (empty). Status = **DRAFT**.
**SAY:** *"It opens as a draft. No file number yet — that's assigned when I submit it."*

**2.5 DO:** Click **Add Correspondence** (left side buttons).
**2.6 DO:** In the modal: **Document Type** = `Quotation`; **Title** = `Vendor quotation — laptops`; leave **File Upload** selected; click the upload box → pick **`D:\Sahasrara\eOffice\demo\demo-samples\1_quotation.pdf`**.
**2.7 DO:** Click **Upload Correspondence**.
**SEE:** **C/1** appears on the right, labelled **p. 1–3 (3 pg)**.

**2.8 (optional, to show continuous paging) DO:** Click **Add Correspondence** again → Type `Technical Specs`, Title `Specifications`, upload **`2_technical_specs.pdf`** → Upload.
**SEE:** **C/2** appears as **p. 4–5** — *the page numbers continue from the previous PDF.*
**SAY:** *"Notice the page numbering runs continuously across attachments — page 4 follows page 3."*

**2.9 DO:** Click **Add Note**.
**2.10 DO:** In **Note Content**, type: `The quotation at C/1 is the lowest compliant offer. Recommended for approval.`
**2.11 DO:** Scroll down to **Assign reviewers (optional)**. In the **Reviewer chain** list, tick **Rasika R Sawant** (a role box appears showing **CHECKER** — leave it) and tick **Ravindra Pawar** (shows **APPROVER** — leave it).
**2.12 DO:** Click **Submit Note**.
**SEE:** the file now has a **number** (e.g. **ADMIN/2026/004**), status = **UNDER_REVIEW**, and the **Approval Flow** panel (left) shows Rasika as the current step.
**SAY:** *"On submit it gets its number, and it's now with the Checker."*

**2.13 DO:** In the note text, click the blue **C/1** link.
**SEE:** the quotation PDF opens **inline** on the correspondence side.
**SAY:** *"Clicking a reference opens that document right here."*

### As the CHECKER (Rasika)

**2.14 DO:** Click the **exit icon** (top-right) to log out → click **`Rasika · Checker`**.
**2.15 DO:** In the left menu click **Pending Approvals**.
**SEE:** a list including **"Procurement of 20 Laptops for Finance"** (there may be other rows too — ignore them).
**2.16 DO:** On the **"…20 Laptops…"** row, click **Review File**.
**2.17 DO:** Click **Review & Approve**.
**SEE:** the modal shows *"Your step: Step 1 — Rasika R Sawant (CHECKER)"*.
**2.18 DO:** Click the **Check** button → in the remarks box type `Verified. Budget available. Recommended.` → click **Submit Review**.
**SEE:** the file moves to **Ravindra Pawar**; Approval Flow shows Rasika **CHECKED**.

### As the APPROVER (Ravi)

**2.19 DO:** Log out → click **`Ravi · Approver`** → **Pending Approvals** → on the **"…20 Laptops…"** row click **Review File**.
**2.20 DO:** Click **Review & Approve** → click **Approve** → remarks `Approved.` → **Submit Review**.
**SEE:** status becomes **APPROVED**; Approval Flow shows both steps signed with names and dates.
**SAY:** *"Fully approved, with a signed trail — who signed, when, and their remarks."*

### Print it

**2.21 DO:** Click **Print…** → choose **Noting** → **All notes** → **Open Print View**.
**SEE:** a clean printable page opens in a new tab with a header, the notes, and an **Approval Summary** table.
**SAY:** *"This is the printable noting sheet with the approval summary. Noting and Correspondence print as two separate PDFs."* Close the tab.

✅ **That's the core loop. Everything below is "and it also does…".**

---

## PART 3 — SHOW A COMPLETE, REAL FILE (30 seconds)

**3.1 DO:** In the top **search box**, type `Procurement of 50` → click the result **ADMIN/2026/001**.
**SEE:** a large file — many notes on the left, **C/1…C/8** on the right.
**3.2 SAY, pointing:**
- *"This is a fully-processed procurement file — 9 notes, 8 attachments, 26 continuously-numbered pages."*
- Point at **Approval Flow** (left): *"Checker, Deputy MD, and the MD — the MD approved via a scanned, manually-signed copy, which is stored as C/7 and page-numbered."*
- Point at **File Movement**: *"Full history — every movement, including it going to Accounts for the purchase order and coming back."*
**3.3 DO:** Click **Open** on any **C/n** card → the PDF shows inline.

---

## PART 4 — QUICK FEATURE HITS (pick any, ~15 sec each)

**4.1 Drafts.** DO: (as Rutuja — log out, `Rutuja · Maker`) → left menu **Drafts** → SEE the "Office Stationery Indent" draft. SAY: *"Drafts are private to the author until submitted."*

**4.2 Notifications.** DO: click the **bell** (top-right). SEE: alerts (e.g. "your file was approved"). SAY: *"Everyone is notified when a file reaches them or is approved."*

**4.3 Search.** DO: top search box → type `AMC` → click the result. SAY: *"Instant search by number or subject."*

**4.4 Confidential.** SAY: *"File ADMIN/2026/003 is marked confidential."* DO: log out → `Suhas · Accounts` → left menu **All Files**. SEE: **003 is NOT listed** for him. SAY: *"Confidential files are visible only to the people involved."*

---

## PART 5 — SUPER ADMIN (the second dashboard)

**5.1 DO:** Log out → click **`Admin`**.
**SEE:** **Super Admin Dashboard** with system-wide counts (Total Files / Under Review / Approved / Closed), and a shorter menu.
**SAY:** *"The Super Admin is oversight-only — it manages users and departments and sees reports, but cannot open the file contents."*

**5.2 DO:** Left menu **Users**.
**SEE:** the **Departments** panel (chips + Add Department) and the user table.
**DO (optional):** type a name like `Human Resources` and code `HR` → **Add Department**. SAY: *"New departments can be added here."*

**5.3 DO:** Left menu **Reports & Logs** → the **All Files** tab.
**SEE:** every file with **Submitted By** and **Department** columns.
**DO:** click **Export CSV**. SAY: *"The all-files report with Submitted-By and Department — exactly as requested — and it exports to CSV."*

**5.4 DO (proves the lock):** click any file number in the report → SEE a "restricted / not available to the admin" message. SAY: *"The admin can see the register but not the noting content."*

---

## PART 6 — IF THEY ASK "did you do point X from our mail?" (answer table)

| They ask about… | You say / show |
|---|---|
| Super-admin report with Submitted-By + Department | ✅ Part 5.3 (done — with CSV) |
| More file formats than PDF | ✅ "Any format — Word, Excel, images — uploads." |
| Continuous page numbering | ✅ Part 2.8 / Part 3 (C/1 p.1–3, C/2 p.4–5…) |
| Draft notes shown | ✅ Part 4.1 |
| Two dashboards (Super Admin + User) | ✅ Part 5.1 vs Part 2.1 |
| Two separate PDFs (Noting / Correspondence) | ✅ Part 2.21 — print each side separately |
| MD signed printout scanned + numbered | ✅ Part 3.2 — C/7 is the scanned MD approval, page-numbered |
| Email integration / file location / discussion module | "Those three your mail flagged for separate discussion — happy to take them next." |
| Exact noting print format | "We match your template once you share it; the approval summary is already there." |

---

## PART 7 — IF SOMETHING GOES WRONG

- **A screen looks stuck or empty:** press **F5** (reload) and log in again.
- **A quick-login button doesn't work / data looks messy:** in the seed terminal run `npm run seed:demo` again, then **F5**. (This resets everything to the clean demo — you lose the file you created live, which is fine.)
- **"Add Note" is missing on a file:** you're not the current holder — that's correct behaviour; only the person holding the file can add a note.
- **Backend terminal shows an error / :4000 not responding:** in the `server` folder run `npm run dev` again.
- **You got lost in the middle of the live flow:** just jump to **Part 3** (show the finished file) — it stands on its own.

---

### One-line cheat sheet (keep visible)
Login buttons → **Rutuja** (make) → **Rasika** (check) → **Ravi** (approve) → **MD** / **Suhas** / **Admin**. Password `Admin@123`.
Create → Add Correspondence → Add Note (tick reviewers) → Submit → (Rasika) Review & Approve = Check → (Ravi) Review & Approve = Approve → Print. Then show **ADMIN/2026/001**. Then **Admin** for the report.
