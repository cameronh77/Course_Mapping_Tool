-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('COMPLETE_UNIT', 'MIN_CREDITS', 'COMPLETE_N_FROM', 'CUSTOM');

-- AlterTable
ALTER TABLE "Specialisation" ADD COLUMN "color" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "entrySemester" INTEGER,
ADD COLUMN "entryYear" INTEGER;

-- CreateTable
CREATE TABLE "PathwayRequirement" (
    "reqId" SERIAL NOT NULL,
    "sId" INTEGER NOT NULL,
    "type" "RequirementType" NOT NULL,
    "label" TEXT NOT NULL,
    "targetValue" TEXT,
    "logicGroup" TEXT,

    CONSTRAINT "PathwayRequirement_pkey" PRIMARY KEY ("reqId")
);

-- CreateTable
CREATE TABLE "PathwayReqUnit" (
    "reqId" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "PathwayReqUnit_pkey" PRIMARY KEY ("reqId","unitId")
);

-- AddForeignKey
ALTER TABLE "PathwayRequirement" ADD CONSTRAINT "PathwayRequirement_sId_fkey" FOREIGN KEY ("sId") REFERENCES "Specialisation"("sId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayReqUnit" ADD CONSTRAINT "PathwayReqUnit_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "PathwayRequirement"("reqId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayReqUnit" ADD CONSTRAINT "PathwayReqUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;
