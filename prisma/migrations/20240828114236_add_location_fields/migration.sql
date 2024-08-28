/*
  Warnings:

  - Added the required column `expiresAt` to the `QRCode` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AttendanceRecord_qrCodeId_key";

-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "isPotentialProxy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scanLocation" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "location" TEXT DEFAULT '';
