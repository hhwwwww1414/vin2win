import { CheckCircle } from 'lucide-react';
import { SELLER_LABELS } from '@/lib/listing-utils';
import type { SaleListing } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ListingStatusBlockProps {
  listing: SaleListing;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
  showVerified?: boolean;
  className?: string;
}

/** Продавец + статус "на ресурсах". Не смешивать с чипами. */
export function ListingStatusBlock({
  listing,
  layout = 'horizontal',
  size = 'md',
  showVerified = true,
  className,
}: ListingStatusBlockProps) {
  const sellerLabel = SELLER_LABELS[listing.sellerType] ?? listing.sellerType;
  const onResources = listing.resourceStatus === 'on_resources';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <div
      className={cn(
        'flex text-muted-foreground',
        layout === 'vertical' ? 'flex-col gap-0.5 items-end' : 'items-center gap-1.5',
        className
      )}
    >
      <div className="flex items-center gap-1">
        <span className={cn(textSize)}>{sellerLabel}</span>
        {showVerified && listing.seller.verified && (
          <CheckCircle className={cn('text-success shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} aria-label="Проверенный" />
        )}
      </div>
      {onResources && (
        <span className={cn(textSize, 'text-teal-accent font-medium whitespace-nowrap')}>
          на ресурсах
        </span>
      )}
    </div>
  );
}
