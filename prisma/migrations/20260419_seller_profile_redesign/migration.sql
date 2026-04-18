-- AlterTable
ALTER TABLE "SellerProfile"
ADD COLUMN     "about" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "avatarStorageKey" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "coverStorageKey" TEXT,
ADD COLUMN     "avatarCropX" DOUBLE PRECISION,
ADD COLUMN     "avatarCropY" DOUBLE PRECISION,
ADD COLUMN     "avatarZoom" DOUBLE PRECISION,
ADD COLUMN     "coverCropX" DOUBLE PRECISION,
ADD COLUMN     "coverCropY" DOUBLE PRECISION;
