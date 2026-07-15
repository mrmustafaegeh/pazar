-- CreateEnum
CREATE TYPE "ListingImageStatus" AS ENUM ('QUARANTINE', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" "ListingImageStatus" NOT NULL DEFAULT 'QUARANTINE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "quarantineKey" TEXT NOT NULL,
    "publicKey" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingImage_listingId_idx" ON "ListingImage"("listingId");
CREATE INDEX "ListingImage_status_idx" ON "ListingImage"("status");
CREATE INDEX "ListingImage_deletedAt_idx" ON "ListingImage"("deletedAt");

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
