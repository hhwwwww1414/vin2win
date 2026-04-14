import { cn } from '@/lib/utils';

type ChipsVariant = 'card' | 'compact' | 'table';

interface ListingChipsBlockProps {
  chips: string[];
  variant?: ChipsVariant;
  maxCount?: number;
  className?: string;
}

const HIGHLIGHT_CHIPS = ['автотека зелёная', 'без окрасов', 'ориг. ПТС'];

export function ListingChipsBlock({
  chips,
  variant = 'card',
  maxCount = 999,
  className,
}: ListingChipsBlockProps) {
  const display = chips.slice(0, maxCount);
  const isCompact = variant === 'compact';
  const isTable = variant === 'table';

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1',
        isCompact || isTable ? 'gap-1' : 'gap-1.5',
        className
      )}
    >
      {display.map((b) => (
        <span
          key={b}
          className={cn(
            'rounded-md font-medium',
            HIGHLIGHT_CHIPS.includes(b)
              ? 'bg-success/15 dark:bg-success/20 text-success'
              : 'bg-muted dark:bg-surface-3 text-muted-foreground',
            isTable ? 'px-1.5 py-0.5 text-[10px]' : isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
          )}
        >
          {b}
        </span>
      ))}
    </div>
  );
}
