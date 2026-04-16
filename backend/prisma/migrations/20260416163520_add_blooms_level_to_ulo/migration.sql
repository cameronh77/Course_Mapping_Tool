-- CreateEnum
CREATE TYPE "BloomsLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYSE', 'EVALUATE', 'CREATE');

-- AlterTable
ALTER TABLE "UnitLearningOutcome" ADD COLUMN     "bloomsLevel" "BloomsLevel";
