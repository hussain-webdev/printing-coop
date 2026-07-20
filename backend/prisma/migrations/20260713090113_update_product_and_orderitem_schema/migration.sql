/*
  Warnings:

  - You are about to drop the column `height` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `products` table. All the data in the column will be lost.
  - Added the required column `height` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selected_finish_config` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "height" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "selected_finish_config" JSONB NOT NULL,
ADD COLUMN     "size" JSONB NOT NULL,
ADD COLUMN     "width" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "height",
DROP COLUMN "width";
