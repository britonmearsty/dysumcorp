-- AlterTable
ALTER TABLE "file" ADD COLUMN "uploaderName" TEXT;
ALTER TABLE "file" ADD COLUMN "uploaderEmail" TEXT;

-- CreateIndex
CREATE INDEX "file_uploaderEmail_idx" ON "file"("uploaderEmail");
