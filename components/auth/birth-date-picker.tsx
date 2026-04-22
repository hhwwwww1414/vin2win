'use client';

import { useId, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  formatBirthDateForStorage,
  formatBirthDateLabel,
  tryParseBirthDate,
} from '@/lib/birth-date';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_LABELS = Array.from({ length: 12 }, (_, monthIndex) =>
  new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, monthIndex, 1, 12)))
);

const MIN_YEAR = 1900;
const now = new Date();
const CURRENT_YEAR = now.getUTCFullYear();
const CURRENT_MONTH = now.getUTCMonth();
const CURRENT_DAY = now.getUTCDate();
const CURRENT_MONTH_START = Date.UTC(CURRENT_YEAR, CURRENT_MONTH, 1, 12);
const MIN_MONTH_START = Date.UTC(MIN_YEAR, 0, 1, 12);
const TODAY = new Date(Date.UTC(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY, 12));

type BirthDatePickerProps = {
  id?: string;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
};

function buildUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

function getDefaultVisibleDate() {
  return buildUtcDate(CURRENT_YEAR - 25, CURRENT_MONTH, 1);
}

function getMonthStart(year: number, monthIndex: number) {
  return Date.UTC(year, monthIndex, 1, 12);
}

function getMonthCells(year: number, monthIndex: number) {
  const firstDay = buildUtcDate(year, monthIndex, 1);
  const firstWeekday = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = buildUtcDate(year, monthIndex + 1, 0).getUTCDate();
  const cells: Array<Date | null> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(buildUtcDate(year, monthIndex, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function isSameDay(left: Date | null, right: Date) {
  return Boolean(
    left &&
      left.getUTCFullYear() === right.getUTCFullYear() &&
      left.getUTCMonth() === right.getUTCMonth() &&
      left.getUTCDate() === right.getUTCDate()
  );
}

function isFutureDate(value: Date) {
  return value.getTime() > TODAY.getTime();
}

function formatDayLabel(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);
}

export function BirthDatePicker({
  id,
  value,
  error,
  onChange,
}: BirthDatePickerProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const helperId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const selectedDate = tryParseBirthDate(value);
  const initialVisibleDate = selectedDate ?? getDefaultVisibleDate();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(initialVisibleDate.getUTCFullYear());
  const [visibleMonth, setVisibleMonth] = useState(initialVisibleDate.getUTCMonth());

  const monthCells = getMonthCells(visibleYear, visibleMonth);
  const canGoPrevMonth = getMonthStart(visibleYear, visibleMonth) > MIN_MONTH_START;
  const canGoNextMonth = getMonthStart(visibleYear, visibleMonth) < CURRENT_MONTH_START;
  const descriptionId = error ? errorId : helperId;
  const years = Array.from(
    { length: CURRENT_YEAR - MIN_YEAR + 1 },
    (_, index) => CURRENT_YEAR - index
  );

  const syncVisibleDate = (nextDate: Date) => {
    setVisibleYear(nextDate.getUTCFullYear());
    setVisibleMonth(nextDate.getUTCMonth());
  };

  const setSafeMonth = (nextMonth: number, nextYear = visibleYear) => {
    if (nextYear === CURRENT_YEAR && nextMonth > CURRENT_MONTH) {
      setVisibleMonth(CURRENT_MONTH);
      return;
    }

    setVisibleMonth(nextMonth);
  };

  const shiftMonth = (delta: number) => {
    const nextDate = buildUtcDate(visibleYear, visibleMonth + delta, 1);
    const nextMonthStart = getMonthStart(nextDate.getUTCFullYear(), nextDate.getUTCMonth());

    if (nextMonthStart < MIN_MONTH_START || nextMonthStart > CURRENT_MONTH_START) {
      return;
    }

    syncVisibleDate(nextDate);
  };

  const helperText = selectedDate
    ? `Сохраним как ${formatBirthDateForStorage(selectedDate)}.`
    : 'Поле обязательно при регистрации.';

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">Дата рождения</span>
      <Popover
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            syncVisibleDate(selectedDate ?? getDefaultVisibleDate());
          }

          setIsOpen(nextOpen);
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={fieldId}
            type="button"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={descriptionId}
            data-testid="birth-date-trigger"
            className={cn(
              'group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-border/80 bg-background/75 px-4 py-3 text-left text-sm outline-none transition-all hover:border-teal-accent/40 focus-visible:border-teal-accent/60 focus-visible:ring-4 focus-visible:ring-teal-accent/20 dark:bg-background/10',
              error && 'border-destructive/40 bg-destructive/5 focus-visible:ring-destructive/15'
            )}
          >
            <span
              className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.08),transparent_36%)]"
              aria-hidden="true"
            />
            <span className="relative flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-accent/15 bg-[var(--accent-bg-soft)] text-teal-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <CalendarDays className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-sm font-medium',
                    selectedDate ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {selectedDate ? formatBirthDateLabel(value) : 'Выберите день, месяц и год'}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {selectedDate ? 'Можно открыть календарь и изменить дату.' : 'Откроется календарь с выбором по месяцам.'}
                </span>
              </span>
            </span>
            <ChevronDown
              className={cn(
                'relative h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={10}
          className="w-[min(22rem,calc(100vw-2rem))] rounded-[28px] border-border/70 bg-background/95 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur"
        >
          <div
            className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.08),transparent_30%)]"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center gap-2 border-b border-border/70 px-4 py-4">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                disabled={!canGoPrevMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground outline-none transition-colors hover:border-teal-accent/40 hover:text-teal-accent focus-visible:border-teal-accent/50 focus-visible:ring-2 focus-visible:ring-teal-accent/20 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="grid flex-1 grid-cols-[minmax(0,1fr)_104px] gap-2">
                <label htmlFor={`${fieldId}-month`} className="sr-only">
                  Месяц
                </label>
                <select
                  id={`${fieldId}-month`}
                  value={String(visibleMonth)}
                  onChange={(event) => {
                    setSafeMonth(Number(event.target.value));
                  }}
                  className="h-10 rounded-2xl border border-border/70 bg-background/80 px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-teal-accent/50 focus:ring-2 focus:ring-teal-accent/20"
                >
                  {MONTH_LABELS.map((label, monthIndex) => (
                    <option
                      key={label}
                      value={monthIndex}
                      disabled={visibleYear === CURRENT_YEAR && monthIndex > CURRENT_MONTH}
                    >
                      {label}
                    </option>
                  ))}
                </select>
                <label htmlFor={`${fieldId}-year`} className="sr-only">
                  Год
                </label>
                <select
                  id={`${fieldId}-year`}
                  value={String(visibleYear)}
                  onChange={(event) => {
                    const nextYear = Number(event.target.value);
                    setVisibleYear(nextYear);
                    setSafeMonth(visibleMonth, nextYear);
                  }}
                  className="h-10 rounded-2xl border border-border/70 bg-background/80 px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-teal-accent/50 focus:ring-2 focus:ring-teal-accent/20"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={!canGoNextMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground outline-none transition-colors hover:border-teal-accent/40 hover:text-teal-accent focus-visible:border-teal-accent/50 focus-visible:ring-2 focus-visible:ring-teal-accent/20 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Следующий месяц"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-4">
              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <span
                    key={label}
                    className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1" data-testid="birth-date-calendar">
                {monthCells.map((day, index) => {
                  if (!day) {
                    return <span key={`empty-${index}`} className="h-11 rounded-2xl" aria-hidden="true" />;
                  }

                  const selected = isSameDay(selectedDate, day);
                  const today = isSameDay(TODAY, day);
                  const disabled = isFutureDate(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={disabled}
                      aria-label={formatDayLabel(day)}
                      aria-pressed={selected}
                      onClick={() => {
                        onChange(formatBirthDateForStorage(day));
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex h-11 items-center justify-center rounded-2xl border border-transparent text-sm font-medium outline-none transition-all focus-visible:border-teal-accent/50 focus-visible:ring-2 focus-visible:ring-teal-accent/20',
                        selected &&
                          'bg-teal-dark text-white shadow-[0_14px_30px_rgba(13,148,136,0.22)] hover:bg-teal-medium',
                        !selected &&
                          'bg-background/70 text-foreground hover:border-teal-accent/40 hover:bg-[var(--accent-bg-soft)] hover:text-teal-accent',
                        today && !selected && 'border border-teal-accent/35 text-teal-accent',
                        disabled && 'cursor-not-allowed opacity-30 hover:bg-background/70 hover:text-foreground'
                      )}
                    >
                      {day.getUTCDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border/70 px-4 py-3">
              <p className="text-xs leading-5 text-muted-foreground">
                {selectedDate
                  ? `Выбрано: ${formatBirthDateLabel(value)}.`
                  : 'Дата сохраняется как отдельное поле профиля без времени.'}
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <p
        id={descriptionId}
        className={cn('text-xs leading-5', error ? 'text-destructive' : 'text-muted-foreground')}
      >
        {error ?? helperText}
      </p>
    </div>
  );
}
