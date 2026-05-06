-- Backfill UnitRelationship.pathwayId for rows created before pathway scoping.
-- Any relationship without a pathwayId is attributed to the CORE pathway of its course.
UPDATE "UnitRelationship" ur
SET "pathwayId" = p."pathwayId"
FROM "Pathway" p
WHERE ur."pathwayId" IS NULL
  AND ur."courseId" IS NOT NULL
  AND p."courseId" = ur."courseId"
  AND p."type" = 'CORE';
