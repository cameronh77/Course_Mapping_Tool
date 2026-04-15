-- AlterTable
ALTER TABLE "AssessmentULO" ADD COLUMN     "reversed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TeachingActivityAssessment" ADD COLUMN     "reversed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TeachingActivityULO" ADD COLUMN     "reversed" BOOLEAN NOT NULL DEFAULT false;
