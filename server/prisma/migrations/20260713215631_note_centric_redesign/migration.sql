/*
  Warnings:

  - You are about to drop the `WorkflowStep` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "WorkflowStep_fileId_stepOrder_key";

-- DropIndex
DROP INDEX "WorkflowStep_assigneeId_idx";

-- DropIndex
DROP INDEX "WorkflowStep_fileId_idx";

-- AlterTable
ALTER TABLE "Movement" ADD COLUMN "noteNumber" INTEGER;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN "finalizedAt" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WorkflowStep";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "NoteStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "roleLabel" TEXT NOT NULL DEFAULT 'Signatory',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "dept" TEXT,
    "signatureName" TEXT,
    "actedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteStep_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteStep_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteStep_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Correspondence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inwardDate" DATETIME,
    "inwardNumber" TEXT,
    "storageKey" TEXT,
    "mime" TEXT NOT NULL DEFAULT 'application/pdf',
    "originalName" TEXT,
    "pageCount" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Correspondence_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Correspondence" ("createdAt", "fileId", "id", "inwardDate", "inwardNumber", "mime", "number", "originalName", "pageCount", "storageKey", "title", "type", "uploadedById", "uploadedByName") SELECT "createdAt", "fileId", "id", "inwardDate", "inwardNumber", "mime", "number", "originalName", "pageCount", "storageKey", "title", "type", "uploadedById", "uploadedByName" FROM "Correspondence";
DROP TABLE "Correspondence";
ALTER TABLE "new_Correspondence" RENAME TO "Correspondence";
CREATE INDEX "Correspondence_fileId_idx" ON "Correspondence"("fileId");
CREATE UNIQUE INDEX "Correspondence_fileId_number_key" ON "Correspondence"("fileId", "number");
CREATE TABLE "new_File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayNumber" TEXT,
    "customFileNumber" TEXT,
    "subject" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "startPeriod" DATETIME,
    "endPeriod" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "currentHolderId" TEXT,
    "closeDate" DATETIME,
    "closeReason" TEXT,
    "successorFileId" TEXT,
    CONSTRAINT "File_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "File_currentHolderId_fkey" FOREIGN KEY ("currentHolderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "File_successorFileId_fkey" FOREIGN KEY ("successorFileId") REFERENCES "File" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_File" ("closeDate", "closeReason", "confidential", "createdAt", "createdById", "currentHolderId", "customFileNumber", "displayNumber", "endPeriod", "id", "lastUsedAt", "priority", "section", "startPeriod", "status", "subject", "successorFileId") SELECT "closeDate", "closeReason", "confidential", "createdAt", "createdById", "currentHolderId", "customFileNumber", "displayNumber", "endPeriod", "id", "lastUsedAt", "priority", "section", "startPeriod", "status", "subject", "successorFileId" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE UNIQUE INDEX "File_displayNumber_key" ON "File"("displayNumber");
CREATE UNIQUE INDEX "File_successorFileId_key" ON "File"("successorFileId");
CREATE INDEX "File_section_idx" ON "File"("section");
CREATE INDEX "File_status_idx" ON "File"("status");
CREATE INDEX "File_createdById_idx" ON "File"("createdById");
CREATE INDEX "File_currentHolderId_idx" ON "File"("currentHolderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NoteStep_noteId_idx" ON "NoteStep"("noteId");

-- CreateIndex
CREATE INDEX "NoteStep_fileId_idx" ON "NoteStep"("fileId");

-- CreateIndex
CREATE INDEX "NoteStep_signerId_idx" ON "NoteStep"("signerId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteStep_noteId_stepOrder_key" ON "NoteStep"("noteId", "stepOrder");

-- CreateIndex
CREATE INDEX "Note_status_idx" ON "Note"("status");
