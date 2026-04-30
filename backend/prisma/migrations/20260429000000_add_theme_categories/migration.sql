-- CreateTable
CREATE TABLE "ThemeCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "indexLabel" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "ThemeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeCategoryTag" (
    "categoryId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ThemeCategoryTag_pkey" PRIMARY KEY ("categoryId","tagId")
);

-- AddForeignKey
ALTER TABLE "ThemeCategory" ADD CONSTRAINT "ThemeCategory_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeCategoryTag" ADD CONSTRAINT "ThemeCategoryTag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ThemeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeCategoryTag" ADD CONSTRAINT "ThemeCategoryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("tagId") ON DELETE CASCADE ON UPDATE CASCADE;
