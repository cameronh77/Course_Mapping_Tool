-- DropForeignKey
ALTER TABLE "public"."AssessmentRelationship" DROP CONSTRAINT "AssessmentRelationship_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssessmentRelationship" DROP CONSTRAINT "AssessmentRelationship_relatedId_fkey";

-- AlterTable
ALTER TABLE "AssessmentRelationship" ADD COLUMN     "unitId" TEXT,
ALTER COLUMN "connectionType" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TeachingActivityRelationship" (
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "TeachingActivityRelationship_pkey" PRIMARY KEY ("sourceId","targetId")
);

-- AddForeignKey
ALTER TABLE "AssessmentRelationship" ADD CONSTRAINT "AssessmentRelationship_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRelationship" ADD CONSTRAINT "AssessmentRelationship_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Assessment"("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingActivityRelationship" ADD CONSTRAINT "TeachingActivityRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "TeachingActivity"("activityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingActivityRelationship" ADD CONSTRAINT "TeachingActivityRelationship_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "TeachingActivity"("activityId") ON DELETE CASCADE ON UPDATE CASCADE;
