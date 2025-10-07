/*
  Warnings:

  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `CourseUnit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Unit` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."CourseUnit" DROP CONSTRAINT "CourseUnit_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseUnit" DROP CONSTRAINT "CourseUnit_unitId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
ALTER COLUMN "courseId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("courseId");

-- AlterTable
ALTER TABLE "CourseUnit" DROP CONSTRAINT "CourseUnit_pkey",
ALTER COLUMN "courseId" SET DATA TYPE TEXT,
ALTER COLUMN "unitId" SET DATA TYPE TEXT,
ADD CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("courseId", "unitId");

-- AlterTable
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_pkey",
ALTER COLUMN "unitId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Unit_pkey" PRIMARY KEY ("unitId");

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE RESTRICT ON UPDATE CASCADE;
