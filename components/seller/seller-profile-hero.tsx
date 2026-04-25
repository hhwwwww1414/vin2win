import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { BadgeCheck, Camera, Share2, Star } from 'lucide-react';
import type { SellerProfile } from '@/lib/types';
import { buildSellerProfileAboutText, buildSellerProfileImageStyles, buildSellerProfileInitials } from '@/lib/seller-profile';
import { cn } from '@/lib/utils';

export type SellerProfileTabKey = 'overview' | 'listing' | 'reviews' | 'logbook';

export type SellerProfileTab = {
  key: SellerProfileTabKey;
  label: string;
  href: string;
  count?: number;
};

interface SellerProfileHeroProps {
  seller: SellerProfile;
  cities: string[];
  reviewCount: number;
  averageRating?: number;
  galleryImages: string[];
  sellerPath: string;
  tabs: SellerProfileTab[];
  activeTab: SellerProfileTabKey;
}

function getSellerReviewWord(count: number) {
  const remainder10 = count % 10;
  const remainder100 = count % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'отзыв';
  }

  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return 'отзыва';
  }

  return 'отзывов';
}

function SellerAvatar({ seller }: { seller: SellerProfile }) {
  const avatarStyle = buildSellerProfileImageStyles({
    cropX: seller.avatarCropX,
    cropY: seller.avatarCropY,
    zoom: seller.avatarZoom,
  });

  return (
    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted shadow-[0_14px_28px_rgba(15,23,42,0.14)] sm:h-[88px] sm:w-[88px]">
      {seller.avatarUrl ? (
        <Image
          src={seller.avatarUrl}
          alt={seller.name}
          fill
          unoptimized
          className="object-cover"
          style={avatarStyle}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--accent-bg-soft)] text-2xl font-semibold text-teal-accent sm:text-3xl">
          {buildSellerProfileInitials(seller.name)}
        </div>
      )}

      {seller.verified ? (
        <span className="absolute bottom-0.5 right-0.5 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-black leading-none text-background ring-2 ring-background">
          pro
        </span>
      ) : null}
    </div>
  );
}

function GallerySlot({
  src,
  alt,
  priority,
  coverStyle,
  hiddenOnMobile,
}: {
  src?: string;
  alt: string;
  priority: boolean;
  coverStyle?: CSSProperties;
  hiddenOnMobile?: boolean;
}) {
  return (
    <div className={cn('relative min-h-0 overflow-hidden bg-muted', hiddenOnMobile && 'hidden md:block')}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          unoptimized
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover"
          style={coverStyle}
        />
      ) : (
        <div className="h-full w-full bg-[linear-gradient(135deg,rgba(129,216,208,0.24),rgba(15,23,42,0.12))]" />
      )}
    </div>
  );
}

export function SellerProfileHero({
  seller,
  cities,
  reviewCount,
  averageRating,
  galleryImages,
  sellerPath,
  tabs,
  activeTab,
}: SellerProfileHeroProps) {
  const about = buildSellerProfileAboutText({
    about: seller.about,
    name: seller.name,
  });
  const coverStyle = buildSellerProfileImageStyles({
    cropX: seller.coverCropX,
    cropY: seller.coverCropY,
  });
  const reviewSummaryLabel = `${reviewCount} ${getSellerReviewWord(reviewCount)}`;
  const location = cities[0] ?? 'Россия';
  const photoCount = Math.max(galleryImages.length, seller.coverUrl ? 1 : 0);
  const visibleGallery = [
    galleryImages[0] ?? seller.coverUrl,
    galleryImages[1],
    galleryImages[2],
  ].filter((src): src is string => Boolean(src));
  const galleryGridClassName =
    visibleGallery.length >= 3
      ? 'md:grid-cols-3'
      : visibleGallery.length === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-1';

  return (
    <section>
      <div className={cn('relative grid h-[160px] overflow-hidden rounded-[22px] bg-muted md:h-[220px]', galleryGridClassName)}>
        {visibleGallery.length > 0 ? (
          visibleGallery.map((src, index) => (
            <GallerySlot
              key={`${src}-${index}`}
              src={src}
              alt={`${seller.name}: фото ${index + 1}`}
              priority={index === 0}
              coverStyle={index === 0 ? coverStyle : undefined}
              hiddenOnMobile={index > 0}
            />
          ))
        ) : (
          <GallerySlot alt={seller.name} priority coverStyle={coverStyle} />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_52%,rgba(0,0,0,0.22))]" aria-hidden="true" />
        {photoCount > 0 ? (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-xl bg-black/62 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <Camera className="h-3.5 w-3.5" />
            {photoCount} фото
          </span>
        ) : null}
      </div>

      <div className="mx-auto max-w-[1090px] px-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
            <div className="-mt-8 sm:-mt-11">
              <SellerAvatar seller={seller} />
            </div>

            <div className="min-w-0 pb-1">
              <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-4xl">
                {seller.name}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                {reviewCount > 0 ? (
                  <Link href={`${sellerPath}?tab=reviews`} className="font-medium text-blue-600 hover:text-blue-500">
                    {reviewSummaryLabel}
                  </Link>
                ) : null}
                {averageRating ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {averageRating.toFixed(1)}
                  </span>
                ) : null}
                {seller.verified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-accent/25 bg-teal-accent/15 px-2.5 py-1 font-semibold text-teal-accent">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Проверенный продавец
                  </span>
                ) : null}
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">{location}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                  с {seller.onPlatformSince} на vin2win
                </span>
              </div>

              <p className="mt-3.5 max-w-2xl text-sm leading-6 text-foreground sm:text-lg sm:leading-7">{about}</p>
            </div>
          </div>

          <Link
            href={sellerPath}
            aria-label="Ссылка на профиль продавца"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors hover:bg-border sm:flex"
          >
            <Share2 className="h-5 w-5" />
          </Link>
        </div>

        <nav id="profile-tabs" aria-label="Разделы профиля продавца" className="mt-6 overflow-x-auto border-b border-border">
          <div className="flex min-w-max items-end gap-6">
            {tabs.map((tab) => {
              const selected = tab.key === activeTab;

              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  aria-current={selected ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-10 items-center gap-1.5 border-b-2 text-[13px] font-semibold transition-colors sm:text-sm',
                    selected
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {tab.count != null ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
                      {tab.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </section>
  );
}
