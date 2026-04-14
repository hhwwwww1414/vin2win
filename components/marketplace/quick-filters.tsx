'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_FILTERS = [
  { id: 'pre_resources', label: 'До ресурсов' },
  { id: 'on_resources', label: 'На ресурсах' },
] as const;

const QUALITY_FILTERS = [
  { id: 'no_paint', label: 'Без окрасов' },
  { id: 'owners_12', label: '1-2 хоз' },
  { id: 'pts_original', label: 'ПТС оригинал' },
  { id: 'avtoteka_green', label: 'Автотека' },
  { id: 'no_taxi', label: 'Не такси' },
  { id: 'price_in_hand', label: 'Цена в руки' },
  { id: 'no_invest', label: 'Без вложений' },
] as const;

interface QuickFiltersProps {
  active?: string[];
  advancedFilterCount?: number;
  onChange?: (ids: string[]) => void;
  onOpenAdvanced?: () => void;
  className?: string;
}

export function QuickFilters({ active = [], advancedFilterCount = 0, onChange, onOpenAdvanced, className }: QuickFiltersProps) {
  const toggle = (id: string) => {
    if (!onChange) {
      return;
    }

    if (active.includes(id)) {
      onChange(active.filter((item) => item !== id));
      return;
    }

    onChange([...active, id]);
  };

  const clearAll = () => {
    if (!onChange || active.length === 0) {
      return;
    }

    onChange([]);
  };

  const activeCount = active.length;

  function chipClassName(isActive: boolean) {
    return cn(
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium leading-none transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      isActive
        ? 'bg-[var(--accent-bg-soft)] text-teal-accent'
        : 'bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground dark:bg-background/10'
    );
  }

  return (
    <section
      aria-label="Быстрые фильтры"
      className={cn(
        'rounded-[var(--radius-panel)] bg-[var(--surface-soft-strong)] px-3 py-2.5 sm:px-4 sm:py-3',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = active.includes(filter.id);

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => toggle(filter.id)}
              className={chipClassName(isActive)}
              aria-pressed={isActive}
            >
              {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-teal-accent" aria-hidden="true" /> : null}
              {filter.label}
            </button>
          );
        })}

        <span className="mx-0.5 h-4 w-px bg-border/60" aria-hidden="true" />

        {QUALITY_FILTERS.map((filter) => {
          const isActive = active.includes(filter.id);

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => toggle(filter.id)}
              className={chipClassName(isActive)}
              aria-pressed={isActive}
            >
              {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-teal-accent" aria-hidden="true" /> : null}
              {filter.label}
            </button>
          );
        })}

        {activeCount > 0 ? (
          <>
            <span className="mx-0.5 h-4 w-px bg-border/60" aria-hidden="true" />
            <span className="rounded-full bg-[var(--accent-bg-soft)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-teal-accent">
              {activeCount}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Очистить быстрые фильтры"
            >
              <X className="h-3 w-3" />
              Сбросить
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={onOpenAdvanced}
          className={cn(
            'ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            advancedFilterCount > 0
              ? 'bg-[var(--accent-bg-soft)] text-teal-accent'
              : 'text-muted-foreground hover:text-teal-accent'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Все фильтры
          {advancedFilterCount > 0 ? (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-accent text-[10px] font-bold text-[#09090B]">
              {advancedFilterCount}
            </span>
          ) : null}
        </button>
      </div>
    </section>
  );
}
