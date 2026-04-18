import { formatPrice } from '@/lib/marketplace-data';
import { cn } from '@/lib/utils';

type ListingBenefitBadgeVariant = 'card' | 'compact' | 'table' | 'detail';

const BASE_CLASSNAME =
  'inline-flex items-center rounded-full border font-semibold tabular-nums';

export function ListingBenefitBadge({
  amount,
  variant,
  className,
}: {
  amount?: number;
  variant: ListingBenefitBadgeVariant;
  className?: string;
}) {
  if (!amount || amount <= 0) {
    return null;
  }

  if (variant === 'table') {
    return (
      <span
        className={cn(
          BASE_CLASSNAME,
          'border-teal-accent/18 bg-teal-accent/10 px-2 py-0.5 text-[10px] text-teal-accent',
          className,
        )}
      >
        {formatPrice(amount)}
      </span>
    );
  }

  const label = variant === 'compact' ? 'Выгода' : 'Возможная выгода';
  const toneClassName =
    variant === 'compact'
      ? 'border-teal-accent/18 bg-teal-accent/10 px-2 py-0.5 text-[10px] text-teal-accent sm:text-[11px]'
      : 'status-badge-pulse status-badge-pulse-success border-emerald-300/24 bg-emerald-950/80 px-2.5 py-1 text-[10px] text-emerald-50 sm:text-[11px]';

  return (
    <span className={cn(BASE_CLASSNAME, toneClassName, className)}>
      {label} {formatPrice(amount)}
    </span>
  );
}
