'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock3, Eye } from 'lucide-react';
import type { SaleListing } from '@/lib/types';
import { formatPrice, formatMileage } from '@/lib/marketplace-data';
import {
  formatPaintCountValue,
  getListingAgeLabel,
  getListingBadges,
  getListingTitle,
} from '@/lib/listing-utils';
import { ListingImageCarousel } from './listing-image-carousel';
import { ListingStatusBlock } from './listing-status-block';
import { ListingChipsBlock } from './listing-chips-block';
import { CompareToggle } from './compare-toggle';
import { FavoriteToggle } from './favorite-toggle';
import { cn } from '@/lib/utils';

interface ListingCompactRowProps {
  listing: SaleListing;
  priority?: boolean;
  isAuthenticated?: boolean;
  loginHref?: string;
  className?: string;
}

export function ListingCompactRow({
  listing,
  priority = false,
  isAuthenticated = false,
  loginHref,
  className,
}: ListingCompactRowProps) {
  const title = getListingTitle(listing);
  const badges = getListingBadges(listing);
  const paintLabel =
    listing.paintCount === 0 ? 'без окрасов' : formatPaintCountValue(listing.paintCount).toLowerCase();

  return (
    <Link
      href={`/listing/${listing.id}`}
      data-testid="listing-compact-row"
      className={cn(
        'card-interactive-subtle relative block overflow-hidden rounded-xl border border-border bg-card/95 backdrop-blur-sm transition-[border-color,background-color] duration-200',
        'hover:border-teal-accent/35 dark:bg-surface-elevated/90 dark:hover:bg-surface-elevated',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="card-press-carbon pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-0 transition-opacity duration-[180ms] ease-out"
      />

      <div className="relative z-[2] flex items-stretch gap-3 p-3 sm:gap-4">
        <div className="w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
          <div className="aspect-[4/3]">
            <ListingImageCarousel
              images={listing.images}
              videoUrl={listing.videoUrl}
              alt={title}
              size="compact"
              priority={priority}
              className="h-full w-full rounded-lg"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 flex-col justify-center space-y-1">
          <h3 className="truncate font-display text-sm font-semibold text-foreground">{title}</h3>

          <div className="flex items-baseline gap-2">
            <span className="price-primary text-base font-bold leading-none text-foreground tabular-nums">
              {formatPrice(listing.price)}
            </span>
            {listing.priceInHand ? (
              <span className="text-xs text-muted-foreground tabular-nums">в руки {formatPrice(listing.priceInHand)}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="tabular-nums">{formatMileage(listing.mileage)}</span>
            <span>{listing.engine}</span>
            <span>{listing.owners} хоз</span>
            <span className={listing.paintCount === 0 ? 'text-success' : 'text-warning'}>
              {paintLabel}
            </span>
            {listing.avtotekaStatus === 'green' ? (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle className="h-3.5 w-3.5" />
                автотека
              </span>
            ) : null}
            {listing.accident ? (
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                ДТП
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground/90">
            <span>{listing.city}</span>
            <span className="flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5 shrink-0 opacity-60" />
              {getListingAgeLabel(listing)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 shrink-0 opacity-60" />
              {listing.viewCount.toLocaleString('ru-RU')}
            </span>
          </div>
        </div>

        <div className="flex w-[120px] shrink-0 flex-col items-end justify-between py-0.5 text-right sm:w-[140px]">
          <div className="flex items-center gap-2">
            <CompareToggle listingId={listing.id} compact />
            <FavoriteToggle
              listingId={listing.id}
              initialActive={listing.isFavorite}
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
              compact
            />
          </div>

          <div className="flex flex-col items-end gap-1">
            <ListingChipsBlock chips={badges} variant="compact" maxCount={4} className="justify-end" />
            <ListingStatusBlock listing={listing} layout="vertical" size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}
