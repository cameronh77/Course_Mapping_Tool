/*
  Warnings:

  - Added the required column `assessmentConditions` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assessmentName` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "assessmentConditions" TEXT NOT NULL,
ADD COLUMN     "assessmentName" TEXT NOT NULL,
ADD COLUMN     "dueWeek" INTEGER[],
ADD COLUMN     "feedbackDetails" TEXT[],
ADD COLUMN     "feedbackWeek" INTEGER[],
ADD COLUMN     "hurdleReq" INTEGER,
ADD COLUMN     "value" INTEGER NOT NULL;
