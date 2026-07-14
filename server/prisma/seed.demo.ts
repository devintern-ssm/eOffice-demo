/**
 * STAGING / DEMO SEED — SICOM "Digital Office" (NOTE-CENTRIC).
 *
 * Login accounts from the client's demo mail (all password `Admin@123`) plus realistic
 * binders. The unit of workflow is the NOTE: each note has its own maker and its own signature
 * chain; the file is a permanent binder that stays OPEN. Includes one large procurement binder
 * worked end-to-end (proposal note → checked & approved → MD offline signature → PO note in
 * Accounts → back to maker) and a standing Accounts bills register.
 *
 * Run:  npm run seed:demo     (server/ directory)
 * Reuses the app's own service layer, so the resulting state is exactly what the app produces.
 */
import bcrypt from 'bcryptjs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { prisma } from '../src/prisma.js';
import type { AuthUser } from '../src/middleware/auth.js';
import { createFile } from '../src/modules/files/files.service.js';
import { addNote } from '../src/modules/notes/notes.service.js';
import { addCorrespondence } from '../src/modules/correspondence/correspondence.service.js';
import { signNote } from '../src/modules/workflow/workflow.service.js';
import { handoverFile } from '../src/modules/lifecycle/lifecycle.service.js';
import { uploadMdApproval } from '../src/modules/approvals/approvals.service.js';

const PWD = 'Admin@123';

// ── People (from the client demo mail + a couple of supporting staff) ─────────
const PEOPLE = [
  { id: 'u-admin', name: 'System Administrator', designation: 'Super Admin', section: 'Administration', role: 'ADMIN', email: 'admin@demo.com' },
  { id: 'u-rutuja', name: 'Rutuja Sawant', designation: 'Section Officer', section: 'Administration', role: 'MAKER', email: 'rutuja@demo.com' },
  { id: 'u-rasika', name: 'Rasika R Sawant', designation: 'Manager', section: 'Administration', role: 'CHECKER', email: 'rasika@demo.com' },
  { id: 'u-ravi', name: 'Ravindra Pawar', designation: 'Deputy Managing Director', section: 'Administration', role: 'APPROVER', email: 'ravi@demo.com' },
  { id: 'u-md', name: 'Managing Director', designation: 'Managing Director', section: 'Administration', role: 'MD', email: 'md@demo.com' },
  { id: 'u-suhas', name: 'Suhas Sonawane', designation: 'Accounts Officer', section: 'Accounts', role: 'MAKER', email: 'suhas@demo.com' },
];

const DEPARTMENTS = [
  { name: 'Administration', code: 'ADMIN' },
  { name: 'Accounts', code: 'ACC' },
  { name: 'Legal', code: 'LEGAL' },
  { name: 'Audit', code: 'AUDIT' },
  { name: 'Finance', code: 'FIN' },
  { name: 'Engineering', code: 'ENG' },
];

const authUser = (id: string): AuthUser => {
  const p = PEOPLE.find((x) => x.id === id)!;
  return { id: p.id, role: p.role as AuthUser['role'], section: p.section, name: p.name };
};

// signer helpers
const S = (userId: string, roleLabel: string) => ({ userId, roleLabel });

// ── Realistic multi-page PDF generator ────────────────────────────────────────
async function pdf(title: string, pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const para =
    'This document forms part of the official Noting-Correspondence file and is placed on record for ' +
    'the consideration of the competent authority. The particulars herein have been verified with ' +
    'reference to the relevant rules, the sanctioned budget provision and the prevailing rate contracts. ' +
    'All annexures are enclosed and page-numbered sequentially. Recommendations are subject to the ' +
    'approval of the sanctioning authority and the availability of funds under the relevant head.';
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([595, 842]);
    let y = 800;
    page.drawText('SICOM LIMITED — DIGITAL OFFICE', { x: 40, y, size: 9, font: bold }); y -= 22;
    page.drawText(title, { x: 40, y, size: 14, font: bold }); y -= 16;
    page.drawText(`Annexure — page ${p + 1} of ${pages}`, { x: 40, y, size: 9, font }); y -= 22;
    const words = para.split(' ');
    let line = '';
    for (let i = 0; i < 60 && y > 60; i++) {
      for (const w of words) {
        if ((line + ' ' + w).length > 92) { page.drawText(line, { x: 40, y, size: 10, font }); y -= 15; line = w; if (y < 60) break; }
        else line = line ? `${line} ${w}` : w;
      }
      if (y < 60) break;
      page.drawText(line, { x: 40, y, size: 10, font }); y -= 15; line = '';
    }
  }
  return Buffer.from(await doc.save());
}

const attach = (buf: Buffer, name: string) => ({ buffer: buf, mimetype: 'application/pdf', originalname: name });

async function main() {
  console.log('Seeding SICOM demo database (note-centric)…');

  // Clear (children first).
  await prisma.notification.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.noteReference.deleteMany();
  await prisma.paragraphApproval.deleteMany();
  await prisma.checkerComment.deleteMany();
  await prisma.noteStep.deleteMany();
  await prisma.note.deleteMany();
  await prisma.correspondence.deleteMany();
  await prisma.file.deleteMany();
  await prisma.numberSequence.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  await prisma.department.createMany({ data: DEPARTMENTS });
  const passwordHash = await bcrypt.hash(PWD, 10);
  await prisma.user.createMany({ data: PEOPLE.map((p) => ({ ...p, passwordHash })) });

  const rutuja = authUser('u-rutuja');
  const rasika = authUser('u-rasika');
  const ravi = authUser('u-ravi');
  const md = authUser('u-md');
  const suhas = authUser('u-suhas');

  // ══════════════════════════════════════════════════════════════════════════
  // BINDER 1 — the big, fully-worked procurement file (ADMIN/2026/001)
  // ══════════════════════════════════════════════════════════════════════════
  const f1 = await createFile({
    subject: 'Procurement of 50 Desktop Computers & Peripherals for the New Regional Office (FY 2026-27)',
    section: 'Administration',
    priority: 'High',
  }, rutuja);
  const id1 = f1.id;

  // Correspondence first — each PAGE gets its own C-number (page-level numbering).
  await addCorrespondence(id1, { type: 'Indent / Requisition', title: 'Indent from Regional Head — 50 desktops' }, attach(await pdf('Indent from Regional Head', 3), 'indent.pdf'), rutuja);      // C1–C3
  await addCorrespondence(id1, { type: 'Quotation', title: 'Vendor A (Zenith Systems) — Quotation' }, attach(await pdf('Vendor A — Zenith Systems', 6), 'zenith.pdf'), rutuja);                     // C4–C9
  await addCorrespondence(id1, { type: 'Quotation', title: 'Vendor B (Orion Infotech) — Quotation' }, attach(await pdf('Vendor B — Orion Infotech', 5), 'orion.pdf'), rutuja);                       // C10–C14
  await addCorrespondence(id1, { type: 'Quotation', title: 'Vendor C (Pinnacle Computers) — Quotation' }, attach(await pdf('Vendor C — Pinnacle Computers', 4), 'pinnacle.pdf'), rutuja);            // C15–C18
  await addCorrespondence(id1, { type: 'Comparative Statement', title: 'Comparative Statement of Quotations (C.S.)' }, attach(await pdf('Comparative Statement of Quotations', 2), 'cs.pdf'), rutuja); // C19–C20

  // NOTE 1 — Rutuja proposes; chain: Rasika (check) → Ravi (approve). She routes it and each signs.
  await addNote(id1, {
    content:
      'PROPOSAL & RECOMMENDATION — PROCUREMENT OF 50 DESKTOP COMPUTERS\n\n' +
      'The new Regional Office at Sector-21 is functioning without adequate computing infrastructure. It is ' +
      'proposed to procure 50 desktop computers with peripherals per the Regional Head’s indent at C1.\n\n' +
      'Three quotations have been received (Zenith at C4, Orion at C10, Pinnacle at C15) and evaluated in the ' +
      'comparative statement at C19. Vendor A (Zenith Systems) is the L1 techno-commercially compliant bidder ' +
      'at Rs. 62,400/unit incl. 3-year on-site warranty.\n\n' +
      'It is recommended that the purchase order be placed on Vendor A for a total value of Rs. 31,20,000 plus ' +
      'GST. Submitted for check (Manager) and approval (Deputy Managing Director).',
    references: { correspondence: ['C1', 'C4', 'C10', 'C15', 'C19'] },
    signers: [S('u-rasika', 'Checker'), S('u-ravi', 'Approver')],
  }, rutuja);

  // Rasika holds it now — she files the budget certificate, then signs & forwards.
  await addCorrespondence(id1, { type: 'Certificate', title: 'Budget Availability Certificate' }, attach(await pdf('Budget Availability Certificate', 2), 'budget.pdf'), rasika); // C21–C22
  await signNote(id1, { remarks: 'Checked with reference to GFR and the delegation of powers. Comparative statement (C19) cross-verified with C4/C10/C15. Budget available — certificate at C21. Recommended.' }, rasika);
  // Ravi (DMD) — final signer on this note → note finalizes and returns to Rutuja.
  await signNote(id1, { remarks: 'Concurred and approved, subject to delivery within 21 days and warranty terms in the PO.' }, ravi);

  // NOTE 2 — Rutuja puts the file up for the MD; MD signs OFFLINE (scanned, page-numbered).
  await addNote(id1, {
    content:
      'SUBMISSION TO THE MANAGING DIRECTOR\n\n' +
      'The proposal at Note 1 has been checked by the Manager and concurred by the Deputy Managing Director. ' +
      'It is placed before the Managing Director for final approval. The MD’s approval will be obtained on the ' +
      'printed noting and the manually-signed copy scanned onto the file.',
    signers: [S('u-md', 'MD')],
  }, rutuja);
  // The MD records their own offline signature (they hold the file at this step); the scanned,
  // manually-signed copy is filed as correspondence and joins the page numbering.
  await uploadMdApproval(
    id1,
    { remarks: 'Final approval of the Managing Director on the printed noting; manually-signed copy scanned and placed on record.' },
    await pdf('Managing Director — Signed Approval (scanned)', 1), // C23
    md,
  );

  // Hand the binder to Accounts so Suhas can raise the purchase-order note.
  await handoverFile(id1, { toUserId: 'u-suhas', remarks: 'Handed to Accounts for issue of the purchase order.' }, rutuja);
  await addCorrespondence(id1, { type: 'Purchase Order', title: 'Purchase Order ADMIN-PO-2026-044' }, attach(await pdf('Purchase Order ADMIN-PO-2026-044', 3), 'po.pdf'), suhas); // C24–C26
  // NOTE 3 — Suhas records the PO (self-recorded, no external signatories).
  await addNote(id1, {
    content:
      'ACCOUNTS SECTION — PURCHASE ORDER ISSUED\n\n' +
      'In accordance with the approvals on record, purchase order No. ADMIN/PO/2026/044 has been issued to ' +
      'Vendor A (Zenith Systems). A copy is placed at C24. Payment will be released on receipt of the ' +
      'satisfactory delivery-cum-installation report.',
    references: { correspondence: ['C24'] },
    signers: [],
  }, suhas);
  // Suhas hands the binder back to the originator for record; it stays OPEN.
  await handoverFile(id1, { toUserId: 'u-rutuja', remarks: 'Purchase order issued (C24). Returned to the originator for record.' }, suhas);

  // ══════════════════════════════════════════════════════════════════════════
  // BINDER 2 — a note currently IN REVIEW (for a live sign/send-back demo)
  // ══════════════════════════════════════════════════════════════════════════
  const f2 = await createFile({
    subject: 'Annual Maintenance Contract (AMC) — Data Centre, Renewal FY 2026-27',
    section: 'Administration', priority: 'Normal',
  }, rutuja);
  await addCorrespondence(f2.id, { type: 'Draft Contract', title: 'Draft AMC Renewal Agreement' }, attach(await pdf('Draft AMC Renewal Agreement', 4), 'amc.pdf'), rutuja);
  await addNote(f2.id, {
    content:
      'AMC RENEWAL — DATA CENTRE\n\nThe AMC for the Data Centre equipment expires on 31.07.2026. It is proposed ' +
      'to renew with the incumbent provider for one year at the same terms. The draft is at C1. Submitted for ' +
      'check and approval.',
    references: { correspondence: ['C1'] },
    signers: [S('u-rasika', 'Checker'), S('u-ravi', 'Approver')],
  }, rutuja);
  // left in review with Rasika — she can Sign / Send back live in the demo.

  // ══════════════════════════════════════════════════════════════════════════
  // BINDER 3 — confidential (access-control demo)
  // ══════════════════════════════════════════════════════════════════════════
  const f3 = await createFile({
    subject: 'Confidential — Internal Review of Procurement Process',
    section: 'Administration', priority: 'High', confidential: true,
  }, rutuja);
  await addNote(f3.id, {
    content:
      'CONFIDENTIAL NOTE\n\nA confidential internal review has been initiated on the directions of the competent ' +
      'authority. This binder is restricted to the officers involved. Submitted for the Manager’s scrutiny.',
    signers: [S('u-rasika', 'Checker')],
  }, rutuja);

  // ══════════════════════════════════════════════════════════════════════════
  // BINDER 4 — a working draft note (drafts demo)
  // ══════════════════════════════════════════════════════════════════════════
  const f4 = await createFile({ subject: 'Office Stationery Indent — Q3', section: 'Administration', priority: 'Normal' }, rutuja);
  await addNote(f4.id, { content: 'DRAFT — Consolidated stationery indent for Q3. Pending confirmation of vendor rates before submission.', isDraft: true }, rutuja);

  // ══════════════════════════════════════════════════════════════════════════
  // BINDER 5 — Accounts standing "bills register" (never-closing file archetype)
  // ══════════════════════════════════════════════════════════════════════════
  const f5 = await createFile({ subject: 'Inward Bills Register — Accounts (FY 2026-27)', section: 'Accounts', priority: 'Normal' }, suhas);
  await addCorrespondence(f5.id, { type: 'Bill / Invoice', title: 'Electricity bill — June 2026' }, attach(await pdf('Electricity Bill — June 2026', 2), 'bill-jun.pdf'), suhas); // C1–C2
  await addNote(f5.id, {
    content: 'BILL PASSED — Electricity, June 2026\n\nThe electricity bill at C1 (Rs. 1,84,320) has been verified against the sanctioned load and meter reading. Recommended for payment.',
    references: { correspondence: ['C1'] },
    signers: [S('u-ravi', 'Approver')],
  }, suhas);
  await signNote(f5.id, { remarks: 'Verified and passed for payment.' }, ravi); // Note 1 finalized → back to Suhas
  await addCorrespondence(f5.id, { type: 'Bill / Invoice', title: 'Housekeeping services — June 2026' }, attach(await pdf('Housekeeping Services — June 2026', 1), 'bill-hk.pdf'), suhas); // C3
  await addNote(f5.id, {
    content: 'BILL PASSED — Housekeeping, June 2026\n\nThe housekeeping bill at C3 (Rs. 46,000) is in order per the service contract. Recommended for payment.',
    references: { correspondence: ['C3'] },
    signers: [S('u-ravi', 'Approver')],
  }, suhas);
  // Note 2 left IN REVIEW with Ravi — shows a standing file with an active note mid-chain.

  // ── Summary ────────────────────────────────────────────────────────────────
  const files = await prisma.file.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { notes: true, correspondence: true } } } });
  console.log(`\nSeeded ${PEOPLE.length} users (password: ${PWD}) and ${files.length} binders:`);
  for (const f of files) console.log(`  • ${f.displayNumber ?? '(unnumbered)'} — ${f.status.padEnd(6)} — ${f._count.notes} notes, ${f._count.correspondence} docs — ${f.subject.slice(0, 56)}`);
  console.log('\nLogins (all password Admin@123):');
  for (const p of PEOPLE) console.log(`  • ${p.email.padEnd(18)} — ${p.name} (${p.role})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error('SEED ERROR:', e); await prisma.$disconnect(); process.exit(1); });
