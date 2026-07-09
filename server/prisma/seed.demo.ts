/**
 * STAGING / DEMO SEED — SICOM "Digital Office" demonstration.
 *
 * Creates the login accounts from the client's demo mail (all password `Admin@123`)
 * and a set of realistic files, including one large procurement file worked through
 * the full workflow (create → check → approve → MD scanned sign-off → route → return),
 * re-authored under the real names. Attachments are real multi-page PDFs.
 *
 * Run:  npm run seed:demo     (backend/ directory)
 *
 * NOTE: this reuses the app's own service layer, so the resulting state is exactly
 * what the running app produces. It respects the current DATABASE_URL and storage
 * driver (disk locally / S3 on staging).
 */
import bcrypt from 'bcryptjs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { prisma } from '../src/prisma.js';
import type { AuthUser } from '../src/middleware/auth.js';
import { createFile } from '../src/modules/files/files.service.js';
import { addNote } from '../src/modules/notes/notes.service.js';
import { addCorrespondence } from '../src/modules/correspondence/correspondence.service.js';
import { forwardFile, actOnFile } from '../src/modules/workflow/workflow.service.js';
import { routeToDept, returnToMaker } from '../src/modules/lifecycle/lifecycle.service.js';
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
  console.log('Seeding SICOM demo database…');

  // Clear (children first).
  await prisma.notification.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.noteReference.deleteMany();
  await prisma.paragraphApproval.deleteMany();
  await prisma.checkerComment.deleteMany();
  await prisma.note.deleteMany();
  await prisma.correspondence.deleteMany();
  await prisma.workflowStep.deleteMany();
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
  // FILE 1 — the big, fully-worked procurement file
  // ══════════════════════════════════════════════════════════════════════════
  const f1 = await createFile({
    subject: 'Procurement of 50 Desktop Computers & Peripherals for the New Regional Office (FY 2026-27)',
    section: 'Administration',
    priority: 'High',
    initialNote:
      'PROPOSAL — PROCUREMENT OF DESKTOP COMPUTERS\n\n' +
      'The new Regional Office at Sector-21 has become operational w.e.f. 01.06.2026 and is presently ' +
      'functioning without adequate computing infrastructure. It is proposed to procure 50 (fifty) ' +
      'desktop computers together with the associated peripherals (UPS, printers and networking ' +
      'accessories) as per the indent of the Regional Head placed at C/1.\n\n' +
      'The estimated expenditure, based on the prevailing GeM rate contract, is approximately ' +
      'Rs. 32.50 lakh, which is within the sanctioned capital budget for FY 2026-27 under the head ' +
      '"Office Equipment — Capital".\n\n' +
      'Approval of the competent authority is solicited to (i) accept the indent and (ii) initiate the ' +
      'procurement by inviting quotations from empanelled vendors.',
  }, rutuja);
  const id1 = f1.id;

  await addCorrespondence(id1, { type: 'Indent / Requisition', title: 'Indent from Regional Head — 50 desktops' }, attach(await pdf('Indent from Regional Head', 3), 'indent.pdf'), rutuja);
  await addCorrespondence(id1, { type: 'Quotation', title: 'Vendor A (Zenith Systems) — Quotation' }, attach(await pdf('Vendor A — Zenith Systems — Quotation', 6), 'zenith.pdf'), rutuja);
  await addCorrespondence(id1, { type: 'Quotation', title: 'Vendor B (Orion Infotech) — Quotation' }, attach(await pdf('Vendor B — Orion Infotech — Quotation', 5), 'orion.pdf'), rutuja);
  await addCorrespondence(id1, { type: 'Quotation', title: 'Vendor C (Pinnacle Computers) — Quotation' }, attach(await pdf('Vendor C — Pinnacle Computers — Quotation', 4), 'pinnacle.pdf'), rutuja);

  await addNote(id1, {
    content:
      'COMPARATIVE EVALUATION\n\n' +
      'Three quotations have been received and are placed at C/2, C/3 and C/4. A comparative statement ' +
      'examining price, warranty, delivery and technical compliance has been prepared.\n\n' +
      'On evaluation, the offer of Vendor A (Zenith Systems) at C/2 is the lowest techno-commercially ' +
      'compliant bid (L1), at Rs. 62,400 per unit inclusive of a 3-year on-site warranty, against ' +
      'Rs. 64,900 (Vendor B, C/3) and Rs. 63,750 (Vendor C, C/4). Vendor A also offers the shortest ' +
      'delivery schedule of 21 days.',
    references: { correspondence: ['C/2', 'C/3', 'C/4'] },
  }, rutuja);

  await addCorrespondence(id1, { type: 'Comparative Statement', title: 'Comparative Statement of Quotations (C.S.)' }, attach(await pdf('Comparative Statement of Quotations', 2), 'cs.pdf'), rutuja);

  await addNote(id1, {
    content:
      'RECOMMENDATION\n\n' +
      'In view of the comparative statement at C/5 and the indent at C/1, it is recommended that the ' +
      'purchase order be placed on Vendor A (Zenith Systems), being the L1 techno-commercially compliant ' +
      'bidder, for supply of 50 desktop computers with peripherals at a total value of Rs. 31,20,000 plus ' +
      'applicable GST.\n\nSubmitted for check (Manager), concurrence (Deputy Managing Director) and the ' +
      'final approval of the Managing Director, in that order.',
    references: { correspondence: ['C/1', 'C/5'] },
  }, rutuja);

  await forwardFile(id1, {
    recipients: [
      { userId: 'u-rasika', role: 'CHECKER' },
      { userId: 'u-ravi', role: 'APPROVER' },
      { userId: 'u-md', role: 'MD' },
    ],
    remarks: 'Submitted for check and approval — procurement of 50 desktops.',
  }, rutuja);

  // Checker (Rasika)
  await addNote(id1, {
    content:
      'SCRUTINY BY MANAGER\n\n' +
      'The proposal has been examined with reference to the General Financial Rules and the delegation of ' +
      'financial powers. The comparative statement at C/5 has been cross-checked with the individual ' +
      'quotations (C/2–C/4) and is found in order. Budget availability under the relevant head is confirmed; ' +
      'the certificate is placed at C/6. There is no procedural infirmity in the proposal.',
    references: { correspondence: ['C/5', 'C/6'] },
  }, rasika);
  await addCorrespondence(id1, { type: 'Certificate', title: 'Budget Availability Certificate' }, attach(await pdf('Budget Availability Certificate', 2), 'budget.pdf'), rasika);
  await actOnFile(id1, { action: 'check', remarks: 'Checked and verified. Budget available (C/6). Recommended for approval.', paragraphs: ['A'] }, rasika);

  // Approver (Ravi / DMD)
  await addNote(id1, {
    content:
      'CONCURRENCE — DEPUTY MANAGING DIRECTOR\n\n' +
      'The proposal and the Manager’s scrutiny are concurred with. The procurement is in the interest of ' +
      'the office and within the sanctioned budget. Approval is accorded, subject to delivery and ' +
      'installation being completed within the quoted 21 days and the warranty terms being incorporated in ' +
      'the purchase order. Placed before the Managing Director for final approval.',
  }, ravi);
  await actOnFile(id1, { action: 'approve', remarks: 'Concurred and approved with conditions. Submitted to the MD for final approval.' }, ravi);

  // MD final approval via a manually-signed, scanned printout (mail point 7)
  await uploadMdApproval(
    id1,
    { remarks: 'Final approval of the Managing Director obtained on the printed noting; the manually-signed copy is scanned and placed on record.' },
    await pdf('Managing Director — Signed Approval (scanned)', 1),
    rutuja,
  );

  // Post-approval routing to Accounts for the PO, then back to the originator
  await routeToDept(id1, { toUserId: 'u-suhas', remarks: 'Routed to Accounts for issue of the purchase order and payment processing.' }, rutuja);
  await addNote(id1, {
    content:
      'ACCOUNTS SECTION\n\n' +
      'The purchase order (No. ADMIN/PO/2026/044) has been issued to Vendor A (Zenith Systems) in ' +
      'accordance with the approvals on record. A copy of the purchase order is placed at C/8. Payment ' +
      'shall be released on receipt of the satisfactory delivery-cum-installation report.',
  }, suhas);
  await addCorrespondence(id1, { type: 'Purchase Order', title: 'Purchase Order ADMIN-PO-2026-044' }, attach(await pdf('Purchase Order ADMIN-PO-2026-044', 3), 'po.pdf'), suhas);
  await returnToMaker(id1, { remarks: 'Purchase order issued (C/8). Returned to the originator for record.' }, suhas);

  await addNote(id1, {
    content:
      'CLOSURE OF ACTION\n\n' +
      'The purchase order has been issued (C/8) and the procurement action is complete. The file is ' +
      'submitted for record and may be retained as a live file pending delivery, installation and release ' +
      'of payment.',
  }, rutuja);

  // ══════════════════════════════════════════════════════════════════════════
  // FILE 2 — currently UNDER REVIEW (for a live check/approve demo)
  // ══════════════════════════════════════════════════════════════════════════
  const f2 = await createFile({
    subject: 'Annual Maintenance Contract (AMC) — Data Centre, Renewal FY 2026-27',
    section: 'Administration', priority: 'Normal',
    initialNote:
      'AMC RENEWAL — DATA CENTRE\n\nThe AMC for the Data Centre equipment expires on 31.07.2026. It is ' +
      'proposed to renew the contract with the incumbent service provider for a further period of one year ' +
      'at the same terms. The draft renewal is placed at C/1. Submitted for check and approval.',
  }, rutuja);
  await addCorrespondence(f2.id, { type: 'Draft Contract', title: 'Draft AMC Renewal Agreement' }, attach(await pdf('Draft AMC Renewal Agreement', 4), 'amc.pdf'), rutuja);
  await forwardFile(f2.id, { recipients: [{ userId: 'u-rasika', role: 'CHECKER' }, { userId: 'u-ravi', role: 'APPROVER' }], remarks: 'For check and approval — AMC renewal.' }, rutuja);
  // left with Rasika (pending) — she can Check/Approve live in the demo.

  // ══════════════════════════════════════════════════════════════════════════
  // FILE 3 — confidential (access-control demo)
  // ══════════════════════════════════════════════════════════════════════════
  const f3 = await createFile({
    subject: 'Confidential — Internal Review of Procurement Process',
    section: 'Administration', priority: 'High', confidential: true,
    initialNote:
      'CONFIDENTIAL NOTE\n\nA confidential internal review of a procurement case has been initiated on the ' +
      'directions of the competent authority. This file is restricted and may be viewed only by the officers ' +
      'involved. Submitted for the Manager’s scrutiny.',
  }, rutuja);
  await forwardFile(f3.id, { recipients: [{ userId: 'u-rasika', role: 'CHECKER' }], remarks: 'Confidential — for the Manager only.' }, rutuja);

  // ══════════════════════════════════════════════════════════════════════════
  // FILE 4 — a working draft (drafts demo)
  // ══════════════════════════════════════════════════════════════════════════
  const f4 = await createFile({ subject: 'Office Stationery Indent — Q3 (working draft)', section: 'Administration', priority: 'Normal' }, rutuja);
  await addNote(f4.id, { content: 'DRAFT — Consolidated stationery indent for Q3. Pending confirmation of vendor rates before submission.', isDraft: true }, rutuja);

  // ── Summary ────────────────────────────────────────────────────────────────
  const files = await prisma.file.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { notes: true, correspondence: true } } } });
  console.log(`\nSeeded ${PEOPLE.length} users (password: ${PWD}) and ${files.length} files:`);
  for (const f of files) console.log(`  • ${f.displayNumber ?? '(draft)'} — ${f.status.padEnd(12)} — ${f._count.notes} notes, ${f._count.correspondence} docs — ${f.subject.slice(0, 60)}`);
  console.log('\nLogins (all password Admin@123):');
  for (const p of PEOPLE) console.log(`  • ${p.email.padEnd(18)} — ${p.name} (${p.role})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error('SEED ERROR:', e); await prisma.$disconnect(); process.exit(1); });
