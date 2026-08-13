/*
  Warnings:

  - A unique constraint covering the columns `[receipt_number]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receipt_number` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "receipt_number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_receipt_number_key" ON "orders"("receipt_number");
