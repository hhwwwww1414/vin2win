'use client';

import { ChevronDown, Check } from 'lucide-react';
import {
  REGISTRATION_PLATE_REGION_OPTIONS,
  buildRegistrationPlateValue,
  splitRegistrationPlateValue,
} from '@/lib/registration-plate';
import { cn } from '@/lib/utils';

type RegistrationPlateFieldProps = {
  value: string;
  region: string;
  unregistered: boolean;
  onChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onUnregisteredChange: (value: boolean) => void;
  error?: string;
};

function PlateLetterInput({
  value,
  placeholder,
  disabled,
  onChange,
  ariaLabel,
  className,
}: {
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      spellCheck={false}
      maxLength={placeholder.length}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'min-w-0 border-0 bg-transparent text-center text-[2.05rem] font-semibold tracking-[0.04em] text-black outline-none placeholder:text-black/40 disabled:cursor-not-allowed disabled:text-black/25 disabled:placeholder:text-black/20 sm:text-[2.55rem]',
        className
      )}
    />
  );
}

export function RegistrationPlateField({
  value,
  region,
  unregistered,
  onChange,
  onRegionChange,
  onUnregisteredChange,
  error,
}: RegistrationPlateFieldProps) {
  const parts = splitRegistrationPlateValue(value);

  const updateNumber = (nextParts: typeof parts) => {
    onChange(buildRegistrationPlateValue(nextParts));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Государственный номер
        </span>
        <div
          className={cn(
            'rounded-[28px] border border-black/5 bg-[#f3f0eb] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-[box-shadow,transform] focus-within:-translate-y-[1px] focus-within:shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:px-6 sm:py-6',
            error && 'ring-2 ring-destructive/30'
          )}
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_116px] sm:items-center">
            <div className="flex min-w-0 items-center justify-center gap-2 sm:gap-3">
              <PlateLetterInput
                value={parts.prefix}
                placeholder="О"
                disabled={unregistered}
                ariaLabel="Первая буква госномера"
                className="w-[1.2ch]"
                onChange={(nextValue) => updateNumber({ ...parts, prefix: nextValue })}
              />
              <PlateLetterInput
                value={parts.digits}
                placeholder="000"
                disabled={unregistered}
                ariaLabel="Три цифры госномера"
                className="w-[3.7ch]"
                onChange={(nextValue) => updateNumber({ ...parts, digits: nextValue })}
              />
              <PlateLetterInput
                value={parts.suffix}
                placeholder="ОО"
                disabled={unregistered}
                ariaLabel="Последние две буквы госномера"
                className="w-[2.6ch]"
                onChange={(nextValue) => updateNumber({ ...parts, suffix: nextValue })}
              />
            </div>

            <div className="mx-auto flex w-[104px] flex-col border-black/12 pt-1 text-black sm:mx-0 sm:border-l sm:pl-5 sm:pt-0">
              <div className="relative">
                <select
                  value={region}
                  disabled={unregistered}
                  aria-label="Регион госномера"
                  onChange={(event) => onRegionChange(event.target.value)}
                  className="w-full appearance-none bg-transparent pr-6 text-right text-[2rem] font-semibold text-black outline-none disabled:cursor-not-allowed disabled:text-black/25 sm:text-[2.4rem]"
                >
                  <option value="">00</option>
                  {REGISTRATION_PLATE_REGION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              </div>

              <div className="mt-0.5 flex items-center justify-end gap-1.5 text-black/72">
                <span className="text-[0.9rem] font-medium tracking-[0.08em]">RUS</span>
                <span
                  aria-hidden="true"
                  className="h-3.5 w-5 rounded-[2px] border border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_33%,#2b6fff_33%,#2b6fff_66%,#e83939_66%,#e83939_100%)]"
                />
              </div>
            </div>
          </div>
        </div>
        {error ? <span className="block text-xs text-destructive">{error}</span> : null}
      </div>

      <label className="flex cursor-pointer items-center gap-4 text-foreground">
        <input
          type="checkbox"
          checked={unregistered}
          onChange={(event) => onUnregisteredChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background transition-colors peer-checked:border-teal-accent peer-checked:bg-teal-accent peer-checked:text-[#09090B]">
          {unregistered ? <Check className="h-4 w-4" /> : null}
        </span>
        <span className="text-base font-medium sm:text-lg">Машина не стоит на учёте в ГАИ</span>
      </label>
    </div>
  );
}
