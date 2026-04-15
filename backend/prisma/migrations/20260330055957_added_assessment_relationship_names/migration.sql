/*
  Warnings:

  - Added the required column `connectionType` to the `AssessmentRelationship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AssessmentRelationship" ADD COLUMN     "connectionType" TEXT NOT NULL;
