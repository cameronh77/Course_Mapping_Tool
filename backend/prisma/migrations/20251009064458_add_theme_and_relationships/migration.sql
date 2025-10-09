-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PREREQUISITE', 'COREQUISITE', 'PROGRESSION', 'CONNECTED');

-- AlterTable
ALTER TABLE "CourseUnit" ADD COLUMN     "specialisationSId" INTEGER;

-- CreateTable
CREATE TABLE "Theme" (
    "themeId" SERIAL NOT NULL,
    "themeName" TEXT NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("themeId")
);

-- CreateTable
CREATE TABLE "CourseTheme" (
    "courseId" TEXT NOT NULL,
    "themeId" INTEGER NOT NULL,

    CONSTRAINT "CourseTheme_pkey" PRIMARY KEY ("courseId","themeId")
);

-- CreateTable
CREATE TABLE "UnitTheme" (
    "unitId" TEXT NOT NULL,
    "themeId" INTEGER NOT NULL,

    CONSTRAINT "UnitTheme_pkey" PRIMARY KEY ("unitId","themeId")
);

-- CreateTable
CREATE TABLE "CourseLearningOutcome" (
    "cloId" SERIAL NOT NULL,
    "cloDesc" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseLearningOutcome_pkey" PRIMARY KEY ("cloId")
);

-- CreateTable
CREATE TABLE "UnitLearningOutcome" (
    "uloId" SERIAL NOT NULL,
    "uloDesc" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "cloId" INTEGER,

    CONSTRAINT "UnitLearningOutcome_pkey" PRIMARY KEY ("uloId")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "assessmentId" SERIAL NOT NULL,
    "aDesc" TEXT NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("assessmentId")
);

-- CreateTable
CREATE TABLE "AssessmentULO" (
    "assessmentId" INTEGER NOT NULL,
    "uloId" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "AssessmentULO_pkey" PRIMARY KEY ("assessmentId","uloId","unitId")
);

-- CreateTable
CREATE TABLE "AssessmentRelationship" (
    "assessmentId" INTEGER NOT NULL,
    "relatedId" INTEGER NOT NULL,

    CONSTRAINT "AssessmentRelationship_pkey" PRIMARY KEY ("assessmentId","relatedId")
);

-- CreateTable
CREATE TABLE "Specialisation" (
    "sId" SERIAL NOT NULL,
    "sName" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "Specialisation_pkey" PRIMARY KEY ("sId")
);

-- CreateTable
CREATE TABLE "UnitRelationship" (
    "id" SERIAL NOT NULL,
    "unitId" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "courseId" TEXT,
    "sId" INTEGER,
    "entryType" INTEGER NOT NULL,

    CONSTRAINT "UnitRelationship_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_specialisationSId_fkey" FOREIGN KEY ("specialisationSId") REFERENCES "Specialisation"("sId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTheme" ADD CONSTRAINT "CourseTheme_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTheme" ADD CONSTRAINT "CourseTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("themeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitTheme" ADD CONSTRAINT "UnitTheme_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitTheme" ADD CONSTRAINT "UnitTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("themeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLearningOutcome" ADD CONSTRAINT "CourseLearningOutcome_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitLearningOutcome" ADD CONSTRAINT "UnitLearningOutcome_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitLearningOutcome" ADD CONSTRAINT "UnitLearningOutcome_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "CourseLearningOutcome"("cloId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentULO" ADD CONSTRAINT "AssessmentULO_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("assessmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentULO" ADD CONSTRAINT "AssessmentULO_uloId_fkey" FOREIGN KEY ("uloId") REFERENCES "UnitLearningOutcome"("uloId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentULO" ADD CONSTRAINT "AssessmentULO_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRelationship" ADD CONSTRAINT "AssessmentRelationship_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("assessmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRelationship" ADD CONSTRAINT "AssessmentRelationship_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Assessment"("assessmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialisation" ADD CONSTRAINT "Specialisation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitRelationship" ADD CONSTRAINT "UnitRelationship_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitRelationship" ADD CONSTRAINT "UnitRelationship_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Unit"("unitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitRelationship" ADD CONSTRAINT "UnitRelationship_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitRelationship" ADD CONSTRAINT "UnitRelationship_sId_fkey" FOREIGN KEY ("sId") REFERENCES "Specialisation"("sId") ON DELETE SET NULL ON UPDATE CASCADE;
