-- AlterTable
ALTER TABLE "products" ADD COLUMN     "common_uses" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "environment" JSONB,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "summary" TEXT;
