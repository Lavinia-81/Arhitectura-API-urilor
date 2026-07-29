/*
  Warnings:

  - You are about to drop the column `content` on the `Poem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Poem" DROP COLUMN "content",
ADD COLUMN     "fullText" TEXT;
