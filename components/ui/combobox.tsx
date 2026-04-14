'use client';

import { useId, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type ComboboxProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  customValueLabel?: string;
  allowCustom?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
};

function normalizeComboboxValue(value: string) {
  return value.trim().toLowerCase();
}

function getComboboxScore(option: string, query: string) {
  if (!query) {
    return 0;
  }

  const normalizedOption = normalizeComboboxValue(option);
  const normalizedQuery = normalizeComboboxValue(query);

  if (normalizedOption.startsWith(normalizedQuery)) {
    return 0;
  }

  if (normalizedOption.split(/[\s/-]+/).some((part) => part.startsWith(normalizedQuery))) {
    return 1;
  }

  if (normalizedOption.includes(normalizedQuery)) {
    return 2;
  }

  return 3;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Выберите значение',
  searchPlaceholder = 'Начните вводить',
  emptyLabel = 'Ничего не найдено',
  customValueLabel = 'Использовать своё значение',
  allowCustom = true,
  clearable = false,
  clearLabel = 'Сбросить',
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listId = useId();

  const normalizedQuery = normalizeComboboxValue(query);

  const filteredOptions = useMemo(() => {
    const uniqueOptions = Array.from(new Set(options.filter(Boolean)));

    return uniqueOptions
      .filter((option) => {
        if (!normalizedQuery) {
          return true;
        }

        return getComboboxScore(option, normalizedQuery) < 3;
      })
      .sort((left, right) => {
        const scoreDelta = getComboboxScore(left, normalizedQuery) - getComboboxScore(right, normalizedQuery);

        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return left.localeCompare(right, 'ru');
      });
  }, [normalizedQuery, options]);

  const canUseCustomValue =
    allowCustom &&
    query.trim().length > 0 &&
    !options.some((option) => normalizeComboboxValue(option) === normalizedQuery);

  const closeWithValue = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setQuery('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm text-left text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30 disabled:pointer-events-none disabled:opacity-50',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command shouldFilter={false} loop className="w-full">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
              className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <Command.List id={listId} className="max-h-72 overflow-y-auto p-1">
            {clearable && value ? (
              <Command.Item
                value="__clear__"
                onSelect={() => closeWithValue('')}
                className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground outline-none transition-colors data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
              >
                <span>{clearLabel}</span>
                <Check className="ml-2 h-4 w-4 shrink-0 opacity-0" />
              </Command.Item>
            ) : null}

            {filteredOptions.length === 0 && !canUseCustomValue && !(clearable && value) ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">{emptyLabel}</div>
            ) : null}

            {filteredOptions.map((option) => {
              const selected = normalizeComboboxValue(option) === normalizeComboboxValue(value);

              return (
                <Command.Item
                  key={option}
                  value={option}
                  onSelect={() => closeWithValue(option)}
                  className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                >
                  <span className="truncate">{option}</span>
                  <Check className={cn('ml-2 h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
                </Command.Item>
              );
            })}

            {canUseCustomValue ? (
              <Command.Item
                value={query.trim()}
                onSelect={() => closeWithValue(query.trim())}
                className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
              >
                <span className="truncate">
                  {customValueLabel}: <span className="font-medium">{query.trim()}</span>
                </span>
                <Check className="ml-2 h-4 w-4 shrink-0 opacity-0" />
              </Command.Item>
            ) : null}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
