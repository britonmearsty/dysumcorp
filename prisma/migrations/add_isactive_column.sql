-- Add isActive column to portal table
-- Run this SQL directly on your Neon database

ALTER TABLE portal ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
