-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR_CODE', 'BLUETOOTH', 'MANUAL');

-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_qrCodeId_fkey";

-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "attendanceMethod" "AttendanceMethod" NOT NULL DEFAULT 'QR_CODE',
ADD COLUMN     "bluetoothSessionId" TEXT,
ALTER COLUMN "qrCodeId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BluetoothSession" (
    "id" TEXT NOT NULL,
    "sessionCode" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BluetoothSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BluetoothSession_sessionCode_key" ON "BluetoothSession"("sessionCode");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_bluetoothSessionId_fkey" FOREIGN KEY ("bluetoothSessionId") REFERENCES "BluetoothSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BluetoothSession" ADD CONSTRAINT "BluetoothSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BluetoothSession" ADD CONSTRAINT "BluetoothSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
