/*
  Warnings:

  - You are about to drop the column `aDesc` on the `Assessment` table. All the data in the column will be lost.
  - Added the required column `assessmentDesc` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assessmentType` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "aDesc",
ADD COLUMN     "assessmentDesc" TEXT NOT NULL,
ADD COLUMN     "assessmentType" TEXT NOT NULL,
ADD COLUMN     "unitId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;
