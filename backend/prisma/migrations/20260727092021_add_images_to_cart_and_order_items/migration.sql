-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "images" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "images" JSONB DEFAULT '[]';
