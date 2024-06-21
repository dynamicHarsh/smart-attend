/*
  Warnings:

  - You are about to drop the column `registrationNumber` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registrationNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registrationNumber` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_registrationNumber_key";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "registrationNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "registrationNumber";

-- CreateIndex
CREATE UNIQUE INDEX "Student_registrationNumber_key" ON "Student"("registrationNumber");
