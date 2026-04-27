/*
  Warnings:

  - You are about to drop the column `creemCustomerId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `hadTrial` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `creem_subscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "file" ADD COLUMN     "storageFileId" TEXT,
ADD COLUMN     "uploadSessionId" TEXT;

-- AlterTable
ALTER TABLE "portal" ADD COLUMN     "companyEmail" TEXT,
ADD COLUMN     "companyWebsite" TEXT,
ADD COLUMN     "gradientEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT '#8b5cf6',
ADD COLUMN     "textboxSectionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "textboxSectionPlaceholder" TEXT,
ADD COLUMN     "textboxSectionRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "textboxSectionTitle" TEXT,
ADD COLUMN     "welcomeToastDelay" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "welcomeToastDuration" INTEGER NOT NULL DEFAULT 3000,
ADD COLUMN     "welcomeToastMessage" TEXT,
ALTER COLUMN "primaryColor" SET DEFAULT '#6366f1',
ALTER COLUMN "textColor" SET DEFAULT '#1e293b',
ALTER COLUMN "backgroundColor" SET DEFAULT '#f1f5f9';

-- AlterTable
ALTER TABLE "user" DROP COLUMN "creemCustomerId",
DROP COLUMN "hadTrial",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "notifyOnDownload" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnPortalCreate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnSignIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnStorageWarning" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnUpload" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "polarCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "polarCustomerId" TEXT,
ADD COLUMN     "polarSubscriptionId" TEXT,
ADD COLUMN     "portalLogo" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "storageDeleteBehavior" TEXT NOT NULL DEFAULT 'ask',
ADD COLUMN     "weeklyReports" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "creem_subscription";

-- CreateTable
CREATE TABLE "upload_session" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "uploaderName" TEXT,
    "uploaderEmail" TEXT,
    "uploaderNotes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "totalSize" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "upload_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r2_staging_upload" (
    "id" TEXT NOT NULL,
    "stagingKey" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "targetProvider" TEXT,
    "targetPath" TEXT,
    "targetFileId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "r2Etag" TEXT,
    "r2Hash" TEXT,
    "uploaderName" TEXT,
    "uploaderEmail" TEXT,
    "fileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "r2_staging_upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_session_portalId_idx" ON "upload_session"("portalId");

-- CreateIndex
CREATE INDEX "upload_session_uploaderEmail_idx" ON "upload_session"("uploaderEmail");

-- CreateIndex
CREATE INDEX "upload_session_uploadedAt_idx" ON "upload_session"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "r2_staging_upload_stagingKey_key" ON "r2_staging_upload"("stagingKey");

-- CreateIndex
CREATE INDEX "r2_staging_upload_status_portalId_idx" ON "r2_staging_upload"("status", "portalId");

-- CreateIndex
CREATE INDEX "r2_staging_upload_portalId_status_idx" ON "r2_staging_upload"("portalId", "status");

-- CreateIndex
CREATE INDEX "file_uploadSessionId_idx" ON "file"("uploadSessionId");

-- AddForeignKey
ALTER TABLE "upload_session" ADD CONSTRAINT "upload_session_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "upload_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
