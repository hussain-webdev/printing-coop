/*
  Warnings:

  - You are about to drop the column `summary` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "summary",
ADD COLUMN     "materials" TEXT;
