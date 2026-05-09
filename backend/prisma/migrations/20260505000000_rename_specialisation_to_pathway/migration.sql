-- Step 1: Drop tables that reference Specialisation (from add_pathway_requirements migration)
DROP TABLE IF EXISTS "PathwayReqUnit";
DROP TABLE IF EXISTS "PathwayRequirement";
DROP TYPE IF EXISTS "RequirementType";

-- Step 2: Create PathwayType enum
CREATE TYPE "PathwayType" AS ENUM ('CORE', 'MAJOR', 'MINOR', 'ENTRY_POINT');

-- Step 3: Create Pathway table
CREATE TABLE "Pathway" (
    "pathwayId" SERIAL NOT NULL,
    "name"      TEXT NOT NULL,
    "type"      "PathwayType" NOT NULL,
    "courseId"  TEXT NOT NULL,

    CONSTRAINT "Pathway_pkey" PRIMARY KEY ("pathwayId")
);

-- Step 4: Seed a CORE pathway for every existing course
INSERT INTO "Pathway" ("name", "type", "courseId")
SELECT 'Core', 'CORE'::"PathwayType", "courseId"
FROM "Course";

-- Step 5: Migrate CourseUnit
-- 5a: Drop FK to Specialisation if it exists
ALTER TABLE "CourseUnit" DROP CONSTRAINT IF EXISTS "CourseUnit_specialisationSId_fkey";

-- 5b: Add surrogate PK column
ALTER TABLE "CourseUnit" ADD COLUMN "id" SERIAL;

-- 5c: Add pathwayId (nullable first so we can fill it)
ALTER TABLE "CourseUnit" ADD COLUMN "pathwayId" INTEGER;

-- 5d: Fill pathwayId with the CORE pathway for each course
UPDATE "CourseUnit" cu
SET "pathwayId" = p."pathwayId"
FROM "Pathway" p
WHERE p."courseId" = cu."courseId" AND p."type" = 'CORE';

-- 5e: Make pathwayId non-nullable
ALTER TABLE "CourseUnit" ALTER COLUMN "pathwayId" SET NOT NULL;

-- 5f: Drop old composite PK
ALTER TABLE "CourseUnit" DROP CONSTRAINT "CourseUnit_pkey";

-- 5g: Set new surrogate PK
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("id");

-- 5h: Drop old specialisationSId column
ALTER TABLE "CourseUnit" DROP COLUMN IF EXISTS "specialisationSId";

-- 5i: Add unique constraint
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_courseId_unitId_pathwayId_key" UNIQUE ("courseId", "unitId", "pathwayId");

-- 5j: Add FK to Pathway
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_pathwayId_fkey"
    FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("pathwayId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Update UnitRelationship — rename sId to pathwayId
ALTER TABLE "UnitRelationship" DROP CONSTRAINT IF EXISTS "UnitRelationship_sId_fkey";
ALTER TABLE "UnitRelationship" RENAME COLUMN "sId" TO "pathwayId";

-- Step 7: Drop Specialisation table
DROP TABLE "Specialisation";

-- Step 8: Add FKs for Pathway
ALTER TABLE "Pathway" ADD CONSTRAINT "Pathway_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Add FK from UnitRelationship to Pathway
ALTER TABLE "UnitRelationship" ADD CONSTRAINT "UnitRelationship_pathwayId_fkey"
    FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("pathwayId") ON DELETE SET NULL ON UPDATE CASCADE;
