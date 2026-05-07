-- CreateTable
CREATE TABLE "CanvasPlaceholder" (
    "id" SERIAL NOT NULL,
    "courseId" TEXT NOT NULL,
    "placeholderType" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "options" JSONB,
    "unitOptions" JSONB,

    CONSTRAINT "CanvasPlaceholder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CanvasPlaceholder" ADD CONSTRAINT "CanvasPlaceholder_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;
