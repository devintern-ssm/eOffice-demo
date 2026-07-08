import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'password123';

async function main() {
  console.log('Seeding e-Office dev database...');

  // Clear (dev only), children first.
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

  // Departments / sections (admin-manageable — observation #1).
  await prisma.department.createMany({
    data: [
      { name: 'Administration', code: 'ADMIN' },
      { name: 'Accounts', code: 'ACC' },
      { name: 'Legal', code: 'LEGAL' },
      { name: 'Audit', code: 'AUDIT' },
      { name: 'Finance', code: 'FIN' },
      { name: 'Engineering', code: 'ENG' },
    ],
  });

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  // Fixed IDs so re-seeding doesn't invalidate existing JWTs (tokens reference user id).
  const users = await Promise.all(
    [
      { id: 'u-rajesh', name: 'Rajesh Kumar', designation: 'Section Officer', section: 'Administration', role: 'MAKER', email: 'rajesh.kumar@example.com' },
      { id: 'u-priya', name: 'Priya Sharma', designation: 'Deputy Director', section: 'Administration', role: 'CHECKER', email: 'priya.sharma@example.com' },
      { id: 'u-amit', name: 'Amit Patel', designation: 'Director', section: 'Administration', role: 'APPROVER', email: 'amit.patel@example.com' },
      { id: 'u-sneha', name: 'Sneha Reddy', designation: 'Accountant', section: 'Accounts', role: 'MAKER', email: 'sneha.reddy@example.com' },
      { id: 'u-vikram', name: 'Vikram Singh', designation: 'Legal Advisor', section: 'Legal', role: 'MAKER', email: 'vikram.singh@example.com' },
      { id: 'u-anjali', name: 'Anjali Mehta', designation: 'Audit Officer', section: 'Audit', role: 'CHECKER', email: 'anjali.mehta@example.com' },
      { id: 'u-md', name: 'M. D. Rao', designation: 'Managing Director', section: 'Administration', role: 'MD', email: 'md@example.com' },
      { id: 'u-admin', name: 'System Admin', designation: 'Administrator', section: 'Administration', role: 'ADMIN', email: 'admin@example.com' },
    ].map((u) => prisma.user.create({ data: { ...u, passwordHash } })),
  );

  const byEmail = (email: string) => {
    const u = users.find((x) => x.email === email)!;
    return u;
  };
  const rajesh = byEmail('rajesh.kumar@example.com');
  const priya = byEmail('priya.sharma@example.com');
  const amit = byEmail('amit.patel@example.com');
  const sneha = byEmail('sneha.reddy@example.com');
  const vikram = byEmail('vikram.singh@example.com');

  // Prime the per-dept/year sequences so new files continue after the seed.
  await prisma.numberSequence.createMany({
    data: [
      { deptCode: 'ADMIN', year: 2024, lastSeq: 2 },
      { deptCode: 'LEGAL', year: 2024, lastSeq: 1 },
      { deptCode: 'ACC', year: 2024, lastSeq: 15 },
    ],
  });

  // File 1 — AMC renewal, under review
  await prisma.file.create({
    data: {
      displayNumber: 'ADMIN/2024/001',
      subject: 'Purchase of Office Equipment - AMC Renewal',
      section: 'Administration',
      status: 'UNDER_REVIEW',
      priority: 'Normal',
      confidential: false,
      startPeriod: new Date('2024-01-01'),
      createdById: rajesh.id,
      currentHolderId: priya.id,
      createdAt: new Date('2024-01-15T10:30:00'),
      lastUsedAt: new Date('2024-01-20T10:00:00'),
      notes: {
        create: [
          {
            noteNumber: 1,
            content:
              'Subject: AMC Renewal.\n\nThe annual maintenance contract for office equipment is due for renewal. Reference: Quotation at C/1.\n\nProposal: Approve the AMC renewal per quotation C/1 and forward to Accounts for payment.',
            authorId: rajesh.id, authorName: rajesh.name, authorRole: 'MAKER',
            status: 'SUBMITTED', submittedAt: new Date('2024-01-15T10:30:00'),
            references: { create: [{ targetType: 'CORRESPONDENCE', targetRef: 'C/1' }] },
          },
          {
            noteNumber: 2,
            content:
              'Reviewed the proposal. The quotation is reasonable vs market rates. Please refer to the inventory at C/2. Recommendation: Approve after verification.',
            authorId: priya.id, authorName: priya.name, authorRole: 'CHECKER',
            status: 'CHECKED',
            references: { create: [{ targetType: 'CORRESPONDENCE', targetRef: 'C/2' }, { targetType: 'NOTE', targetRef: 'Note 1' }] },
            paragraphApprovals: { create: [{ paragraphMark: 'A', approvedById: priya.id, approvedByName: priya.name }] },
            checkerComments: { create: [{ authorId: priya.id, authorName: priya.name, comment: 'Verified inventory. Quotation reasonable.', action: 'checked' }] },
          },
        ],
      },
      correspondence: {
        create: [
          { number: 'C/1', type: 'Quotation', title: 'AMC Quotation for Office Equipment', inwardDate: new Date('2024-01-10'), inwardNumber: 'IN/2024/045', uploadedById: rajesh.id, uploadedByName: rajesh.name },
          { number: 'C/2', type: 'Report', title: 'Office Equipment Inventory List', inwardDate: new Date('2024-01-17'), inwardNumber: 'IN/2024/052', uploadedById: rajesh.id, uploadedByName: rajesh.name },
        ],
      },
      steps: {
        create: [
          { stepOrder: 1, assigneeId: priya.id, assigneeName: priya.name, roleAtStep: 'CHECKER', status: 'CHECKED', actedAt: new Date('2024-01-18T14:20:00'), dept: 'Administration', signatureName: priya.name },
          { stepOrder: 2, assigneeId: amit.id, assigneeName: amit.name, roleAtStep: 'APPROVER', status: 'PENDING' },
        ],
      },
      movements: {
        create: [
          { type: 'CREATE', actorId: rajesh.id, actorName: rajesh.name, fromSection: 'Administration', remarks: 'File opened' },
          { type: 'FORWARD', actorId: rajesh.id, actorName: rajesh.name, toUserId: priya.id, toName: priya.name, remarks: 'For review and approval' },
        ],
      },
    },
  });

  // File 2 — Audit compliance, submitted, held by maker
  await prisma.file.create({
    data: {
      displayNumber: 'ADMIN/2024/002',
      subject: 'Compliance with Audit Observations',
      section: 'Administration',
      status: 'SUBMITTED',
      priority: 'Urgent',
      startPeriod: new Date('2024-01-01'),
      createdById: rajesh.id,
      currentHolderId: rajesh.id,
      createdAt: new Date('2024-01-12T09:15:00'),
      lastUsedAt: new Date('2024-01-19T09:00:00'),
      notes: {
        create: [{
          noteNumber: 1,
          content: 'Subject: Compliance with Audit Observations.\n\nThe audit team raised observations regarding procurement. Reference: Audit Report at C/1.\n\nProposal: Prepare an action plan and submit a compliance report within 30 days.',
          authorId: rajesh.id, authorName: rajesh.name, authorRole: 'MAKER', status: 'SUBMITTED', submittedAt: new Date('2024-01-12T09:15:00'),
          references: { create: [{ targetType: 'CORRESPONDENCE', targetRef: 'C/1' }] },
        }],
      },
      correspondence: { create: [{ number: 'C/1', type: 'Report', title: 'Audit Report - Procurement Procedures', inwardDate: new Date('2024-01-10'), inwardNumber: 'AUDIT/2024/012', uploadedById: rajesh.id, uploadedByName: rajesh.name }] },
      movements: { create: [{ type: 'CREATE', actorId: rajesh.id, actorName: rajesh.name, remarks: 'File opened' }] },
    },
  });

  // File 3 — Court order, confidential, approved
  await prisma.file.create({
    data: {
      displayNumber: 'LEGAL/2024/001',
      subject: 'Court Order - Stay on Land Acquisition',
      section: 'Legal',
      status: 'APPROVED',
      priority: 'Urgent',
      confidential: true,
      startPeriod: new Date('2024-01-01'),
      createdById: vikram.id,
      currentHolderId: null,
      createdAt: new Date('2024-01-08T11:00:00'),
      lastUsedAt: new Date('2024-01-16T11:00:00'),
      notes: {
        create: [{
          noteNumber: 1,
          content: 'Subject: Court Order - Stay on Land Acquisition.\n\nA stay order has been received from the High Court. Reference: Court Order at C/1.\n\nProposal: Comply with the order and suspend acquisition activities.',
          authorId: vikram.id, authorName: vikram.name, authorRole: 'MAKER', status: 'APPROVED', submittedAt: new Date('2024-01-08T11:00:00'),
          references: { create: [{ targetType: 'CORRESPONDENCE', targetRef: 'C/1' }] },
        }],
      },
      correspondence: { create: [{ number: 'C/1', type: 'Court Order', title: 'High Court Stay Order - Land Acquisition', inwardDate: new Date('2024-01-08'), inwardNumber: 'COURT/2024/003', uploadedById: vikram.id, uploadedByName: vikram.name }] },
      steps: {
        create: [
          { stepOrder: 1, assigneeId: priya.id, assigneeName: priya.name, roleAtStep: 'CHECKER', status: 'CHECKED', actedAt: new Date('2024-01-14'), dept: 'Administration', signatureName: priya.name },
          { stepOrder: 2, assigneeId: amit.id, assigneeName: amit.name, roleAtStep: 'APPROVER', status: 'APPROVED', actedAt: new Date('2024-01-16'), dept: 'Administration', signatureName: amit.name },
        ],
      },
      movements: { create: [{ type: 'CREATE', actorId: vikram.id, actorName: vikram.name, remarks: 'File opened' }, { type: 'APPROVE', actorId: amit.id, actorName: amit.name, remarks: 'Approved' }] },
    },
  });

  // File 4 — Contractor bill, under review (Accounts)
  await prisma.file.create({
    data: {
      displayNumber: 'ACC/2024/015',
      subject: 'Payment Voucher - Contractor Bill',
      section: 'Accounts',
      status: 'UNDER_REVIEW',
      priority: 'Normal',
      startPeriod: new Date('2024-01-01'),
      createdById: sneha.id,
      currentHolderId: priya.id,
      createdAt: new Date('2024-01-19T10:00:00'),
      lastUsedAt: new Date('2024-01-20T10:00:00'),
      notes: {
        create: [{
          noteNumber: 1,
          content: 'Subject: Payment Voucher - Contractor Bill.\n\nBill received for construction completed in December 2023. Reference: Bill at C/1, Work Order at C/2.\n\nProposal: Approve payment as per bill C/1.',
          authorId: sneha.id, authorName: sneha.name, authorRole: 'MAKER', status: 'SUBMITTED', submittedAt: new Date('2024-01-19T10:00:00'),
          references: { create: [{ targetType: 'CORRESPONDENCE', targetRef: 'C/1' }, { targetType: 'CORRESPONDENCE', targetRef: 'C/2' }] },
        }],
      },
      correspondence: {
        create: [
          { number: 'C/1', type: 'Bill', title: 'Contractor Bill - December 2023', inwardDate: new Date('2024-01-18'), inwardNumber: 'IN/2024/055', uploadedById: sneha.id, uploadedByName: sneha.name },
          { number: 'C/2', type: 'Order', title: 'Work Order - Construction Work', inwardDate: new Date('2023-11-15'), inwardNumber: 'WO/2023/089', uploadedById: sneha.id, uploadedByName: sneha.name },
        ],
      },
      steps: { create: [{ stepOrder: 1, assigneeId: priya.id, assigneeName: priya.name, roleAtStep: 'CHECKER', status: 'PENDING' }] },
      movements: { create: [{ type: 'CREATE', actorId: sneha.id, actorName: sneha.name, fromSection: 'Accounts', remarks: 'File opened' }, { type: 'FORWARD', actorId: sneha.id, actorName: sneha.name, toUserId: priya.id, toName: priya.name, remarks: 'For approval' }] },
    },
  });

  console.log(`Seeded ${users.length} users and 4 files. Dev password for all users: "${DEV_PASSWORD}"`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
