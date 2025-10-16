-- DropForeignKey
ALTER TABLE "public"."CourseLearningOutcome" DROP CONSTRAINT "CourseLearningOutcome_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseTheme" DROP CONSTRAINT "CourseTheme_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseTheme" DROP CONSTRAINT "CourseTheme_themeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseUnit" DROP CONSTRAINT "CourseUnit_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseUnit" DROP CONSTRAINT "CourseUnit_unitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseUnitTags" DROP CONSTRAINT "CourseUnitTags_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseUnitTags" DROP CONSTRAINT "CourseUnitTags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CourseUnitTags" DROP CONSTRAINT "CourseUnitTags_unitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tag" DROP CONSTRAINT "Tag_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UnitLearningOutcome" DROP CONSTRAINT "UnitLearningOutcome_unitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UnitTheme" DROP CONSTRAINT "UnitTheme_themeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UnitTheme" DROP CONSTRAINT "UnitTheme_unitId_fkey";

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnitTags" ADD CONSTRAINT "CourseUnitTags_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnitTags" ADD CONSTRAINT "CourseUnitTags_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnitTags" ADD CONSTRAINT "CourseUnitTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("tagId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTheme" ADD CONSTRAINT "CourseTheme_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTheme" ADD CONSTRAINT "CourseTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("themeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitTheme" ADD CONSTRAINT "UnitTheme_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitTheme" ADD CONSTRAINT "UnitTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("themeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLearningOutcome" ADD CONSTRAINT "CourseLearningOutcome_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitLearningOutcome" ADD CONSTRAINT "UnitLearningOutcome_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;
