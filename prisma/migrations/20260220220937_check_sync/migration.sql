-- AlterTable
ALTER TABLE "user" ADD COLUMN     "subscriptionPlan" TEXT DEFAULT 'free',
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'active';

-- CreateTable
CREATE TABLE "portal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "whiteLabeled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "textColor" TEXT NOT NULL DEFAULT '#0f172a',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "cardBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "logoUrl" TEXT,
    "storageProvider" TEXT,
    "storageFolderId" TEXT,
    "storageFolderPath" TEXT,
    "useClientFolders" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "requireClientName" BOOLEAN NOT NULL DEFAULT true,
    "requireClientEmail" BOOLEAN NOT NULL DEFAULT false,
    "maxFileSize" BIGINT NOT NULL DEFAULT 52428800,
    "allowedFileTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "welcomeMessage" TEXT,
    "submitButtonText" TEXT NOT NULL DEFAULT 'Initialize Transfer',
    "successMessage" TEXT NOT NULL DEFAULT 'Transmission Verified',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "uploaderName" TEXT,
    "uploaderEmail" TEXT,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "storageUsed" BIGINT NOT NULL DEFAULT 0,
    "portalsCreated" INTEGER NOT NULL DEFAULT 0,
    "filesUploaded" INTEGER NOT NULL DEFAULT 0,
    "bandwidth" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portal_slug_key" ON "portal"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "portal_customDomain_key" ON "portal"("customDomain");

-- CreateIndex
CREATE INDEX "portal_userId_idx" ON "portal"("userId");

-- CreateIndex
CREATE INDEX "file_portalId_idx" ON "file"("portalId");

-- CreateIndex
CREATE INDEX "file_uploaderEmail_idx" ON "file"("uploaderEmail");

-- CreateIndex
CREATE INDEX "usage_tracking_userId_idx" ON "usage_tracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "usage_tracking_userId_month_key" ON "usage_tracking"("userId", "month");

-- AddForeignKey
ALTER TABLE "portal" ADD CONSTRAINT "portal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
