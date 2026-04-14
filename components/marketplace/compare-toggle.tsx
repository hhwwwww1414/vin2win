'use client';

import { GitCompareArrows } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCompare } from '@/hooks/use-compare';
import { cn } from '@/lib/utils';

export function CompareToggle({
  listingId,
  className,
  compact = false,
}: {
  listingId: string;
  className?: string;
  compact?: boolean;
}) {
  const compare = useCompare();
  const active = compare.has(listingId);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!active && compare.ids.length >= compare.limit) {
      toast({
        title: 'Лимит сравнения достигнут',
        description: `Одновременно можно сравнить не более ${compare.limit} автомобилей.`,
      });
      return;
    }

    compare.toggle(listingId);
  };

  return (
    <button
      type="button"
      aria-label={active ? 'Убрать из сравнения' : 'Добавить к сравнению'}
      aria-pressed={active}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full border backdrop-blur transition-colors',
        compact ? 'h-8 w-8' : 'h-9 w-9',
        active
          ? 'border-teal-accent/40 bg-teal-accent/12 text-teal-accent'
          : 'border-border/80 bg-card/90 text-muted-foreground hover:border-teal-accent/30 hover:text-foreground',
        className
      )}
    >
      <GitCompareArrows className="h-4 w-4" />
    </button>
  );
}
