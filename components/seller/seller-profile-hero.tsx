import Image from 'next/image';
import type { SellerProfile } from '@/lib/types';
import { buildSellerProfileAboutText, buildSellerProfileImageStyles, buildSellerProfileInitials } from '@/lib/seller-profile';

interface SellerProfileHeroProps {
  seller: SellerProfile;
  listingCount: number;
  cities: string[];
  makes: string[];
  reviewCount: number;
  averageRating?: number;
}

export function SellerProfileHero({
  seller,
  listingCount,
  cities,
  makes,
  reviewCount,
  averageRating,
}: SellerProfileHeroProps) {
  const about = buildSellerProfileAboutText({
    about: seller.about,
    name: seller.name,
  });
  const avatarStyle = buildSellerProfileImageStyles({
    cropX: seller.avatarCropX,
    cropY: seller.avatarCropY,
    zoom: seller.avatarZoom,
  });
  const coverStyle = buildSellerProfileImageStyles({
    cropX: seller.coverCropX,
    cropY: seller.coverCropY,
  });

  return (
    <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[0_20px_54px_rgba(15,23,42,0.12)]">
      <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#10181F_0%,#1B3C3F_32%,#2D5A5A_58%,#78CFC7_100%)] sm:h-72">
        {seller.coverUrl ? (
          <Image
            src={seller.coverUrl}
            alt={seller.name}
            fill
            unoptimized
            className="object-cover"
            style={coverStyle}
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,11,15,0.12),rgba(9,11,15,0.5))]" aria-hidden="true" />
      </div>

      <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
        <div className="-mt-14 flex flex-col gap-5 sm:-mt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {seller.avatarUrl ? (
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-[5px] border-white bg-background shadow-[0_20px_40px_rgba(15,23,42,0.18)] sm:h-32 sm:w-32">
                  <Image
                    src={seller.avatarUrl}
                    alt={seller.name}
                    fill
                    unoptimized
                    className="object-cover"
                    style={avatarStyle}
                  />
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-[5px] border-white bg-[linear-gradient(135deg,rgba(129,216,208,0.34),rgba(45,90,90,0.92))] text-3xl font-semibold text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)] sm:h-32 sm:w-32">
                  {buildSellerProfileInitials(seller.name)}
                </div>
              )}

              <div className="pb-1">
                <div className="flex flex-wrap gap-2">
                  {seller.verified ? (
                    <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                      Проверенный продавец
                    </span>
                  ) : null}
                  {cities[0] ? (
                    <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
                      {cities[0]}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
                    На платформе с {seller.onPlatformSince}
                  </span>
                  {averageRating ? (
                    <span className="rounded-full border border-teal-accent/25 bg-[var(--accent-bg-soft)] px-3 py-1 text-xs font-medium text-teal-dark">
                      {averageRating.toFixed(1)} • {reviewCount} отзывов
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{seller.name}</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
                {listingCount} в продаже
              </span>
              {makes.length > 0 ? (
                <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {makes.slice(0, 2).join(' • ')}
                </span>
              ) : null}
            </div>
          </div>

          <p className="max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">{about}</p>

          <div className="flex flex-wrap gap-6 border-t border-border/70 pt-4 text-sm font-medium text-muted-foreground">
            <a href="#seller-listings" className="transition-colors hover:text-foreground">Объявления</a>
            <a href="#seller-reviews" className="transition-colors hover:text-foreground">Отзывы</a>
            <a href="#seller-about" className="transition-colors hover:text-foreground">О продавце</a>
          </div>
        </div>
      </div>
    </section>
  );
}
