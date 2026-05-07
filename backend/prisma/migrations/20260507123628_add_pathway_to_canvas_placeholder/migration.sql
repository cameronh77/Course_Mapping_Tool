-- AlterTable
ALTER TABLE "CanvasPlaceholder" ADD COLUMN     "pathwayId" INTEGER;

-- AddForeignKey
ALTER TABLE "CanvasPlaceholder" ADD CONSTRAINT "CanvasPlaceholder_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("pathwayId") ON DELETE SET NULL ON UPDATE CASCADE;
