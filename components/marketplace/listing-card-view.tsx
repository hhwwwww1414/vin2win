'use client';

import type { MouseEvent, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Play,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { SaleListing } from '@/lib/types';
import { formatMileage, formatPrice } from '@/lib/marketplace-data';
import {
  SELLER_LABELS,
  formatEngineSpec,
  getAvtotekaStatusLabel,
  getListingAgeLabel,
  getListingBadges,
  getListingTitle,
} from '@/lib/listing-utils';
import { cn } from '@/lib/utils';
import { CompareToggle } from './compare-toggle';
import { FavoriteToggle } from './favorite-toggle';
import { ListingImageCarousel } from './listing-image-carousel';

interface ListingCardViewProps {
  listing: SaleListing;
  priority?: boolean;
  isAuthenticated?: boolean;
  loginHref?: string;
  variant?: 'marketplace' | 'seller-preview';
  className?: string;
}

type ChipTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const UTILITY_BUTTON_CLASSNAME =
  'border-border/70 bg-background/88 text-muted-foreground hover:border-teal-accent/20 hover:bg-background hover:text-foreground dark:bg-background/30';
const MEDIA_STATUS_BADGE_CLASSNAME =
  'border shadow-[0_10px_24px_rgba(0,0,0,0.34)] backdrop-blur-md [text-shadow:0_1px_1px_rgba(0,0,0,0.42)]';
const PRICE_STATUS_BADGE_CLASSNAME =
  'inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tabular-nums shadow-[0_10px_24px_rgba(0,0,0,0.18)] sm:text-[11px]';

/** Badges that are already clearly visible in the main visual or spec rows */
const STAT_DUPLICATE_BADGES = new Set(['без окрасов', '1 хоз', 'автотека зелёная', 'ориг. ПТС']);

function getAvtotekaTone(status: SaleListing['avtotekaStatus']): ChipTone {
  switch (status) {
    case 'green':
      return 'success';
    case 'yellow':
      return 'warning';
    case 'red':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function ListingCardView({
  listing,
  priority = false,
  isAuthenticated = false,
  loginHref,
  variant = 'marketplace',
  className,
}: ListingCardViewProps) {
  const title = getListingTitle(listing);
  const allBadges = getListingBadges(listing);
  const badges = allBadges.filter((badge) => !STAT_DUPLICATE_BADGES.has(badge)).slice(0, 3);
  const isNoPaint = listing.paintCount === 0;
  const sellerLabel = SELLER_LABELS[listing.sellerType] ?? listing.sellerType;
  const subtitle = [listing.trim, listing.color].filter(Boolean).join(' · ');
  const galleryImages = listing.images.slice(0, 4);
  const hiddenGalleryCount = Math.max(0, listing.images.length - galleryImages.length);
  const sellerLocation = listing.inspectionCity ?? listing.city;
  const mediaLabel = listing.videoUrl
    ? listing.images.length > 0
      ? `Видео + ${listing.images.length} фото`
      : 'Видео'
    : `${listing.images.length} фото`;
  const resourceBadge =
    listing.resourceStatus === 'on_resources'
      ? {
          label: 'На ресурсах',
          className: `${MEDIA_STATUS_BADGE_CLASSNAME} border-white/14 bg-black/72 text-white`,
        }
      : listing.resourceStatus === 'pre_resources'
        ? {
            label: 'До ресурсов',
            className: `${MEDIA_STATUS_BADGE_CLASSNAME} border-amber-300/24 bg-amber-950/76 text-amber-100`,
          }
        : {
            label: 'Не на ресурсах',
            className:
              `status-badge-pulse status-badge-pulse-attention ${MEDIA_STATUS_BADGE_CLASSNAME} border-white/14 bg-black/78 text-white`,
          };
  const noPaintBadge = isNoPaint
    ? {
        label: 'Без окрасов',
        className:
          `status-badge-pulse status-badge-pulse-success ${MEDIA_STATUS_BADGE_CLASSNAME} border-emerald-300/24 bg-emerald-950/80 text-emerald-50`,
      }
    : null;

  const overviewRows = [
    { label: 'Двигатель', value: formatEngineSpec(listing) },
    { label: 'Привод', value: listing.drive },
    { label: 'Коробка', value: listing.transmission },
    { label: 'Пробег', value: formatMileage(listing.mileage) },
    { label: 'Кузов', value: listing.bodyType },
    { label: 'Владельцы', value: `${listing.owners} хоз.` },
  ];

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const url = `${window.location.origin}/listing/${listing.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Ссылка скопирована',
          description: 'Ссылка на объявление сохранена в буфер обмена.',
        });
      }
    } catch {
      toast({
        title: 'Не удалось поделиться',
        description: 'Попробуйте ещё раз.',
        variant: 'destructive',
      });
    }
  };

  if (variant === 'seller-preview') {
    return (
      <Link
        href={`/listing/${listing.id}`}
        className={cn(
          'group block overflow-hidden rounded-[22px] border border-border/70 bg-card/95 shadow-[var(--shadow-surface)] transition-all duration-200',
          'hover:-translate-y-0.5 hover:border-teal-accent/30 hover:shadow-[var(--shadow-floating)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
      >
        <div className="flex flex-col gap-3 p-3 sm:grid sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:gap-4 sm:p-4">
          <div className="overflow-hidden rounded-[18px] border border-border/60 bg-muted/60">
            <ListingImageCarousel
              images={listing.images}
              videoUrl={listing.videoUrl}
              alt={title}
              size="landscape"
              priority={priority}
              className="h-full w-full rounded-[18px]"
            />
          </div>

          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold leading-tight text-foreground sm:text-xl">
              {title}
            </h3>
            <div className="mt-2 inline-flex items-baseline rounded-xl bg-background/70 px-3 py-2 dark:bg-background/20">
              <span className="font-display text-[1.25rem] font-bold tracking-tight text-foreground tabular-nums">
                {formatPrice(listing.price)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        'group relative block overflow-hidden rounded-[24px] border border-border/70 bg-card/95 text-card-foreground shadow-[var(--shadow-surface)] transition-[transform,box-shadow,border-color] duration-200',
        'hover:-translate-y-0.5 hover:border-teal-accent/18 hover:shadow-[var(--shadow-floating)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      <article className="flex flex-col lg:min-h-[278px] lg:grid lg:grid-cols-[320px_minmax(0,1fr)_196px_40px] xl:grid-cols-[336px_minmax(0,1fr)_208px_40px]">
        <div className="p-2.5 sm:p-3 lg:pr-3">
          <div className="flex flex-col gap-2">
            <div className="relative h-[168px] overflow-hidden rounded-[18px] bg-muted/65 sm:h-[178px] lg:h-[190px] xl:h-[202px]">
              <ListingImageCarousel
                images={listing.images}
                videoUrl={listing.videoUrl}
                alt={title}
                size="landscape"
                priority={priority}
                className="h-full w-full rounded-[18px]"
              />

              <div className="absolute left-2 top-2 z-10 flex max-w-[74%] flex-wrap items-center gap-1">
                {resourceBadge ? (
                  <span className={cn('rounded-full px-2 py-0.5 text-[8px] font-medium sm:text-[9px]', resourceBadge.className)}>
                    {resourceBadge.label}
                  </span>
                ) : null}
                {noPaintBadge ? (
                  <span className={cn('rounded-full px-2 py-0.5 text-[8px] font-medium sm:text-[9px]', noPaintBadge.className)}>
                    {noPaintBadge.label}
                  </span>
                ) : null}
              </div>

              <div className="absolute right-2 top-2 z-10 flex items-center gap-1 lg:hidden">
                <CompareToggle listingId={listing.id} compact className={UTILITY_BUTTON_CLASSNAME} />
                <FavoriteToggle
                  listingId={listing.id}
                  initialActive={listing.isFavorite}
                  isAuthenticated={isAuthenticated}
                  loginHref={loginHref}
                  compact
                  className={UTILITY_BUTTON_CLASSNAME}
                />
              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/72 via-black/20 to-transparent px-2 pb-2 pt-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[9px] font-medium text-white backdrop-blur-sm sm:text-[10px]">
                  {listing.videoUrl ? <Play className="h-3 w-3 fill-white" /> : <Camera className="h-3 w-3" />}
                  {mediaLabel}
                </span>
              </div>
            </div>

            {galleryImages.length > 1 ? (
              <div className="hidden grid-cols-4 gap-2 md:grid">
                {galleryImages.map((image, index) => {
                  const showOverflow = index === galleryImages.length - 1 && hiddenGalleryCount > 0;

                  return (
                    <div
                      key={`${image}:${index}`}
                      className="relative h-8 overflow-hidden rounded-[12px] border border-border/60 bg-muted/60"
                    >
                      <Image
                        src={image}
                        alt={`${title} — превью ${index + 1}`}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                      {showOverflow ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white backdrop-blur-[2px]">
                          +{hiddenGalleryCount}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col border-t border-border/50 px-3.5 py-3 sm:px-4 lg:border-l lg:border-t-0 lg:px-4 lg:py-3.5">
          <div className="flex h-full min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
              <MetaItem icon={<MapPin className="h-3.5 w-3.5" />} text={listing.city} />
              <MetaItem icon={<Clock3 className="h-3.5 w-3.5" />} text={getListingAgeLabel(listing)} />
              <MetaItem icon={<Eye className="h-3.5 w-3.5" />} text={`${listing.viewCount.toLocaleString('ru-RU')} просмотров`} />
            </div>

            <div className="mt-2 min-w-0">
              <h3 className="line-clamp-2 text-[16px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[17px] lg:text-[18px] xl:text-[19px]">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1 line-clamp-1 text-[11px] leading-[1.35] text-muted-foreground sm:text-[12px]">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="mt-2.5 lg:hidden">
              <PriceColumn
                listing={listing}
                sellerLabel={sellerLabel}
                compact
              />
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-x-5 gap-y-0 sm:grid-cols-2">
              {overviewRows.map((row) => (
                <SpecRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {listing.ptsOriginal ? (
                <InfoChip icon={<CheckCircle2 className="h-3 w-3" />} tone="success">
                  ПТС оригинал
                </InfoChip>
              ) : null}
              {listing.avtotekaStatus && listing.avtotekaStatus !== 'unknown' ? (
                <InfoChip icon={<ShieldCheck className="h-3 w-3" />} tone={getAvtotekaTone(listing.avtotekaStatus)}>
                  {`Автотека ${getAvtotekaStatusLabel(listing.avtotekaStatus).toLowerCase()}`}
                </InfoChip>
              ) : null}
              {badges.map((badge) => (
                <InfoChip key={badge} tone="neutral">
                  {badge}
                </InfoChip>
              ))}
            </div>

            <div className="mt-auto flex items-start gap-2.5 border-t border-border/50 pt-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/75 text-[11px] font-semibold text-foreground">
                {getSellerInitials(listing.seller.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[12px] font-semibold text-foreground sm:text-[13px]">
                    {listing.seller.name}
                  </span>
                  {listing.seller.verified ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-teal-accent sm:text-[10px]">
                      <ShieldCheck className="h-3 w-3" />
                      Проверенный
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-[11px]">
                  {sellerLocation}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden border-l border-border/50 px-3.5 py-3.5 lg:flex lg:flex-col">
          <PriceColumn
            listing={listing}
            sellerLabel={sellerLabel}
          />
        </div>

        <div className="hidden border-l border-border/50 px-1 py-3.5 lg:flex lg:flex-col lg:items-center lg:gap-1">
          <CompareToggle listingId={listing.id} compact className={UTILITY_BUTTON_CLASSNAME} />
          <FavoriteToggle
            listingId={listing.id}
            initialActive={listing.isFavorite}
            isAuthenticated={isAuthenticated}
            loginHref={loginHref}
            compact
            className={UTILITY_BUTTON_CLASSNAME}
          />
          <UtilityActionButton ariaLabel="Поделиться объявлением" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
          </UtilityActionButton>
        </div>
      </article>
    </Link>
  );
}

function MetaItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-teal-accent/85">{icon}</span>
      <span>{text}</span>
    </span>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/45 py-1 last:border-b-0 sm:last:border-b">
      <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">{label}</span>
      <span className="text-right text-[11px] font-medium text-foreground sm:text-[12px] xl:text-[13px]">
        {value}
      </span>
    </div>
  );
}

function InfoChip({
  children,
  icon,
  tone = 'neutral',
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: ChipTone;
}) {
  const toneClassName =
    tone === 'success'
      ? 'border-success/15 bg-success/10 text-success'
      : tone === 'warning'
        ? 'border-warning/15 bg-warning/10 text-warning'
        : tone === 'danger'
          ? 'border-destructive/15 bg-destructive/10 text-destructive'
          : tone === 'accent'
            ? 'border-teal-accent/18 bg-teal-accent/10 text-teal-accent'
            : 'border-border/60 bg-background/60 text-muted-foreground dark:bg-background/22';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium sm:text-[10px]', toneClassName)}>
      {icon}
      {children}
    </span>
  );
}

function PriceColumn({
  listing,
  sellerLabel,
  compact = false,
}: {
  listing: SaleListing;
  sellerLabel: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex h-full flex-col justify-between', compact && 'gap-2.5')}>
      <div>
        <p className={cn('font-display font-semibold tracking-[-0.03em] text-foreground tabular-nums', compact ? 'text-[19px] sm:text-[20px]' : 'text-[20px] xl:text-[22px]')}>
          {formatPrice(listing.price)}
        </p>
        {listing.priceInHand ? (
          <div className="mt-2">
            <span
              className={cn(
                PRICE_STATUS_BADGE_CLASSNAME,
                'status-badge-pulse status-badge-pulse-success border-emerald-300/24 bg-emerald-950/80 text-emerald-50'
              )}
            >
              В руки {formatPrice(listing.priceInHand)}
            </span>
          </div>
        ) : null}
        {listing.priceOnResources ? (
          <p className={cn('text-[11px] text-muted-foreground sm:text-[12px]', listing.priceInHand ? 'mt-1.5' : 'mt-1')}>
            На ресурсах {formatPrice(listing.priceOnResources)}
          </p>
        ) : null}

        <div className="mt-2.5 space-y-2">
          <PriceFact label="Статус продавца" value={sellerLabel} />
        </div>

        {!listing.needsInvestment ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {!listing.needsInvestment ? <InfoChip tone="success">Без вложений</InfoChip> : null}
          </div>
        ) : null}
      </div>

      <div className={cn('mt-2.5', compact && 'mt-0')}>
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-foreground px-3.5 py-2 text-[11px] font-medium text-background transition-colors group-hover:opacity-96 sm:text-[12px]">
          Открыть объявление
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function PriceFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
        {label}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-foreground sm:text-[12px]">
        {value}
      </p>
    </div>
  );
}

function UtilityActionButton({
  ariaLabel,
  children,
  onClick,
}: {
  ariaLabel: string;
  children: ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors',
        UTILITY_BUTTON_CLASSNAME
      )}
    >
      {children}
    </button>
  );
}

function getSellerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'V2';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
