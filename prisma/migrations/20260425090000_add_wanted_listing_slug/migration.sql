ALTER TABLE "WantedListing" ADD COLUMN "slug" TEXT;

CREATE UNIQUE INDEX "WantedListing_slug_key" ON "WantedListing"("slug");
