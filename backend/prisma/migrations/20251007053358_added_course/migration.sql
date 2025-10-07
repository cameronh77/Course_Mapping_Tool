/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "public"."Post";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "Course" (
    "Course_ID" SERIAL NOT NULL,
    "Course_Desc" TEXT NOT NULL,
    "Expected_Duration" INTEGER NOT NULL,
    "Number_Teaching_Periods" INTEGER NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("Course_ID")
);
