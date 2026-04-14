'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { getVehicleColorMeta, orderVehicleColors } from '@/lib/vehicle-metadata';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ColorSwatchSelectProps = {
  options: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  clearLabel?: string;
  triggerLabel: string;
  emptyAriaLabel?: string;
  className?: string;
};

function getSummaryText(
  selectedValues: string[],
  placeholder: string,
  multiple: boolean
) {
  if (selectedValues.length === 0) {
    return placeholder;
  }

  const labels = selectedValues.map((value) => getVehicleColorMeta(value).label);

  if (!multiple || labels.length === 1) {
    return labels[0];
  }

  return `${labels[0]} +${labels.length - 1}`;
}

export function ColorSwatchSelect({
  options,
  value,
  onChange,
  multiple = false,
  placeholder,
  clearLabel,
  triggerLabel,
  emptyAriaLabel,
  className,
}: ColorSwatchSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedValues = multiple
    ? Array.isArray(value)
      ? value.filter(Boolean)
      : []
    : typeof value === 'string' && value
      ? [value]
      : [];

  const normalizedOptions = useMemo(() => orderVehicleColors(options), [options]);
  const resolvedPlaceholder = placeholder ?? (multiple ? 'Любой' : 'Не указан');
  const resolvedClearLabel = clearLabel ?? (multiple ? 'Любой' : 'Не указан');
  const summaryText = getSummaryText(selectedValues, resolvedPlaceholder, multiple);
  const firstSelectedColor = selectedValues[0] ? getVehicleColorMeta(selectedValues[0]) : null;
  const triggerAriaLabel =
    selectedValues.length > 0
      ? `${triggerLabel}: ${selectedValues.map((selectedValue) => getVehicleColorMeta(selectedValue).label).join(', ')}`
      : emptyAriaLabel ?? `${triggerLabel}: ${resolvedPlaceholder.toLowerCase()}`;

  const toggleValue = (nextValue: string) => {
    if (multiple) {
      const nextValues = selectedValues.includes(nextValue)
        ? selectedValues.filter((value) => value !== nextValue)
        : [...selectedValues, nextValue];

      onChange(nextValues);
      return;
    }

    onChange(nextValue === selectedValues[0] ? '' : nextValue);
    setOpen(false);
  };

  const clearSelection = () => {
    onChange(multiple ? [] : '');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="color-swatch-trigger"
          aria-label={triggerAriaLabel}
          className={cn(
            'flex w-full items-center justify-between rounded-xl border border-border/80 bg-background/75 px-3 py-2.5 text-sm text-left text-foreground outline-none transition-[border-color,box-shadow] focus:border-teal-accent/50 focus:ring-2 focus:ring-teal-accent/15 dark:bg-background/10',
            selectedValues.length === 0 && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {firstSelectedColor ? (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 rounded-full border shadow-sm"
                style={{
                  background: firstSelectedColor.swatch,
                  borderColor: firstSelectedColor.borderColor,
                }}
              />
            ) : null}
            <span className="truncate">{summaryText}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="rounded-2xl border-border/80 bg-popover/98 p-3 shadow-2xl backdrop-blur"
        style={{ width: 'min(24rem, calc(var(--radix-popover-trigger-width) + 2rem))' }}
      >
        <div data-slot="color-swatch-panel" className="space-y-3">
          <button
            type="button"
            onClick={clearSelection}
            aria-pressed={selectedValues.length === 0}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              selectedValues.length === 0
                ? 'bg-muted text-foreground'
                : 'bg-background/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span>{resolvedClearLabel}</span>
            {selectedValues.length === 0 ? <Check className="h-4 w-4" /> : null}
          </button>

          <div className="flex flex-wrap gap-2">
            {normalizedOptions.map((option) => {
              const color = getVehicleColorMeta(option);
              const isSelected = selectedValues.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  aria-label={color.label}
                  aria-pressed={isSelected}
                  title={color.label}
                  onClick={() => toggleValue(option)}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-popover',
                    isSelected
                      ? 'scale-[1.03] ring-2 ring-teal-accent ring-offset-2 ring-offset-popover'
                      : 'hover:scale-105'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-8 w-8 rounded-full border shadow-sm"
                    style={{
                      background: color.swatch,
                      borderColor: color.borderColor,
                    }}
                  />
                  {isSelected ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
