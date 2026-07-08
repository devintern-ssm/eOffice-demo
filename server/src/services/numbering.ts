import { prisma } from '../prisma.js';
import { deptCodeForSection } from '../utils/domain.js';

/**
 * Allocate the next DEPT/YEAR/SEQ file number for a section (D1/D2):
 * - sequence is per (department, year) and resets each year,
 * - allocation is transactional to avoid collisions under concurrency.
 * Returns e.g. "ACC/2026/001".
 */
export async function allocateFileNumber(section: string, year: number): Promise<string> {
  // Prefer the admin-managed Department code; fall back to the static map for legacy names.
  const dept = await prisma.department.findUnique({ where: { name: section } });
  const deptCode = dept?.code ?? deptCodeForSection(section);

  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.numberSequence.findUnique({
      where: { deptCode_year: { deptCode, year } },
    });
    if (!existing) {
      await tx.numberSequence.create({ data: { deptCode, year, lastSeq: 1 } });
      return 1;
    }
    const updated = await tx.numberSequence.update({
      where: { deptCode_year: { deptCode, year } },
      data: { lastSeq: { increment: 1 } },
    });
    return updated.lastSeq;
  });

  return `${deptCode}/${year}/${String(seq).padStart(3, '0')}`;
}
