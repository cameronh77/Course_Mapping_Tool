/*
  Warnings:

  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Course_Desc` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `Course_ID` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `Expected_Duration` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `Number_Teaching_Periods` on the `Course` table. All the data in the column will be lost.
  - Added the required column `courseDesc` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expectedDuration` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numberTeachingPeriods` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
DROP COLUMN "Course_Desc",
DROP COLUMN "Course_ID",
DROP COLUMN "Expected_Duration",
DROP COLUMN "Number_Teaching_Periods",
ADD COLUMN     "courseDesc" TEXT NOT NULL,
ADD COLUMN     "courseId" INTEGER NOT NULL,
ADD COLUMN     "expectedDuration" INTEGER NOT NULL,
ADD COLUMN     "numberTeachingPeriods" INTEGER NOT NULL,
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("courseId");

-- CreateTable
CREATE TABLE "Unit" (
    "unitId" INTEGER NOT NULL,
    "unitDesc" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "semestersOffered" INTEGER[],

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("unitId")
);

-- CreateTable
CREATE TABLE "CourseUnit" (
    "courseId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "elective" BOOLEAN NOT NULL,

    CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("courseId","unitId")
);

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE RESTRICT ON UPDATE CASCADE;
