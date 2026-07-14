import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'password123';

/**
 * Base dev/test seed (NOTE-CENTRIC). Seeds users, departments and the per-dept/year number
 * sequences. Files are created through the app/API (integration tests build their own binders);
 * the rich demo dataset lives in seed.demo.ts.
 */
async function main() {
  console.log('Seeding e-Office dev database (note-centric)...');

  // Clear (dev only), children first.
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

  // Prime the per-dept/year sequences so seeded/live files continue in sequence.
  await prisma.numberSequence.createMany({
    data: [
      { deptCode: 'ADMIN', year: 2024, lastSeq: 2 },
      { deptCode: 'LEGAL', year: 2024, lastSeq: 1 },
      { deptCode: 'ACC', year: 2024, lastSeq: 15 },
    ],
  });

  console.log(`Seeded ${users.length} users. Dev password for all users: "${DEV_PASSWORD}"`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
