-- CreateTable
CREATE TABLE "TeachingActivity" (
    "activityId" SERIAL NOT NULL,
    "activityName" TEXT NOT NULL,
    "activityDesc" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "position" JSONB,

    CONSTRAINT "TeachingActivity_pkey" PRIMARY KEY ("activityId")
);

-- CreateTable
CREATE TABLE "TeachingActivityAssessment" (
    "activityId" INTEGER NOT NULL,
    "assessmentId" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "TeachingActivityAssessment_pkey" PRIMARY KEY ("activityId","assessmentId")
);

-- CreateTable
CREATE TABLE "TeachingActivityULO" (
    "activityId" INTEGER NOT NULL,
    "uloId" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "TeachingActivityULO_pkey" PRIMARY KEY ("activityId","uloId")
);

-- AddForeignKey
ALTER TABLE "TeachingActivity" ADD CONSTRAINT "TeachingActivity_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingActivityAssessment" ADD CONSTRAINT "TeachingActivityAssessment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "TeachingActivity"("activityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingActivityAssessment" ADD CONSTRAINT "TeachingActivityAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingActivityULO" ADD CONSTRAINT "TeachingActivityULO_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "TeachingActivity"("activityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingActivityULO" ADD CONSTRAINT "TeachingActivityULO_uloId_fkey" FOREIGN KEY ("uloId") REFERENCES "UnitLearningOutcome"("uloId") ON DELETE CASCADE ON UPDATE CASCADE;
