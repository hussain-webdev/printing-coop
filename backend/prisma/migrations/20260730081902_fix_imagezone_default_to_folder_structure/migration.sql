/*
  Warnings:

  - Made the column `images` on table `image_zone` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "image_zone" ALTER COLUMN "images" SET NOT NULL,
ALTER COLUMN "images" SET DEFAULT '{"Home": []}';
