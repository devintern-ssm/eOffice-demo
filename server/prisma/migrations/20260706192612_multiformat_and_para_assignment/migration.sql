-- AlterTable
ALTER TABLE "Correspondence" ADD COLUMN "originalName" TEXT;
ALTER TABLE "Correspondence" ADD COLUMN "pageCount" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ParagraphApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "paragraphMark" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "approvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParagraphApproval_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ParagraphApproval" ("approvedAt", "approvedById", "approvedByName", "id", "noteId", "paragraphMark") SELECT "approvedAt", "approvedById", "approvedByName", "id", "noteId", "paragraphMark" FROM "ParagraphApproval";
DROP TABLE "ParagraphApproval";
ALTER TABLE "new_ParagraphApproval" RENAME TO "ParagraphApproval";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
