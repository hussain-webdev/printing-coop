-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "selected_finish_config" JSONB,
ADD COLUMN     "size" JSONB,
ADD COLUMN     "width" DOUBLE PRECISION;
