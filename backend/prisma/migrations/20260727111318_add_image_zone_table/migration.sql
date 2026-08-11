-- CreateTable
CREATE TABLE "image_zone" (
    "id" SERIAL NOT NULL,
    "wholesale_seller_id" INTEGER NOT NULL,
    "images" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "image_zone_wholesale_seller_id_key" ON "image_zone"("wholesale_seller_id");

-- AddForeignKey
ALTER TABLE "image_zone" ADD CONSTRAINT "image_zone_wholesale_seller_id_fkey" FOREIGN KEY ("wholesale_seller_id") REFERENCES "wholesale_sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
