/*
  Warnings:

  - Added the required column `courseId` to the `QRCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `QRCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
