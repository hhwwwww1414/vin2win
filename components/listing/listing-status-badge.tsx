'use client';

import type { ListingStatusValue } from '@/lib/listing-status';
import { LISTING_STATUS_BADGE_CLASSES, getListingStatusLabel } from '@/lib/listing-status';
import { cn } from '@/lib/utils';

export function ListingStatusBadge({
  status,
  className,
}: {
  status: ListingStatusValue;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        LISTING_STATUS_BADGE_CLASSES[status],
        className
      )}
    >
      {getListingStatusLabel(status)}
    </span>
  );
}
