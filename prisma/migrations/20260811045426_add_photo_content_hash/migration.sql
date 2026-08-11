/*
  Warnings:

  - A unique constraint covering the columns `[userId,contentHash]` on the table `Photo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,storedName]` on the table `Photo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Photo_storedName_key";

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN "contentHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Photo_userId_contentHash_key" ON "Photo"("userId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_userId_storedName_key" ON "Photo"("userId", "storedName");
