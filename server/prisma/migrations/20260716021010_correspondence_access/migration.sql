-- CreateTable
CREATE TABLE "CorrespondenceAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "correspondenceId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CorrespondenceAccess_correspondenceId_fkey" FOREIGN KEY ("correspondenceId") REFERENCES "Correspondence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CorrespondenceAccess_correspondenceId_idx" ON "CorrespondenceAccess"("correspondenceId");

-- CreateIndex
CREATE INDEX "CorrespondenceAccess_fileId_idx" ON "CorrespondenceAccess"("fileId");
