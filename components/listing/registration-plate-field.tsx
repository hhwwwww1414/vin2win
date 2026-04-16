'use client';

import { useRef, type KeyboardEvent, type RefObject } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  REGISTRATION_PLATE_REGION_OPTIONS,
  buildRegistrationPlateValue,
  normalizeRegistrationPlateDigits,
  normalizeRegistrationPlateLetters,
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

type PlateSegment = 'prefix' | 'digits' | 'suffix';

type PlateSegmentInputProps = {
  value: string;
  placeholder: string;
  disabled: boolean;
  inputMode: 'text' | 'numeric';
  ariaLabel: string;
  className?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function PlateSegmentInput({
  value,
  placeholder,
  disabled,
  inputMode,
  ariaLabel,
  className,
  inputRef,
  onChange,
  onKeyDown,
}: PlateSegmentInputProps) {
  return (
    <input
      ref={inputRef}
      value={value}
      disabled={disabled}
      inputMode={inputMode}
      autoCapitalize="characters"
      autoComplete="off"
      spellCheck={false}
      maxLength={placeholder.length}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={onKeyDown}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'min-w-0 border-0 bg-transparent text-center text-[1.95rem] font-medium leading-none tracking-[-0.04em] text-black outline-none placeholder:text-black/36 disabled:cursor-not-allowed disabled:text-black/22 disabled:placeholder:text-black/18 sm:text-[2.35rem]',
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
  const prefixRef = useRef<HTMLInputElement>(null);
  const digitsRef = useRef<HTMLInputElement>(null);
  const suffixRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);

  const parts = splitRegistrationPlateValue(value);

  const updateNumber = (nextParts: typeof parts) => {
    onChange(buildRegistrationPlateValue(nextParts));
  };

  const focusNextSegment = (segment: PlateSegment) => {
    if (segment === 'prefix') {
      digitsRef.current?.focus();
      return;
    }

    if (segment === 'digits') {
      suffixRef.current?.focus();
      return;
    }

    regionRef.current?.focus();
  };

  const focusPreviousSegment = (segment: PlateSegment) => {
    if (segment === 'suffix') {
      digitsRef.current?.focus();
      return;
    }

    if (segment === 'digits') {
      prefixRef.current?.focus();
    }
  };

  const handleSegmentChange = (segment: PlateSegment, rawValue: string) => {
    const nextValue =
      segment === 'digits'
        ? normalizeRegistrationPlateDigits(rawValue, 3)
        : normalizeRegistrationPlateLetters(rawValue, segment === 'prefix' ? 1 : 2);

    const nextParts = { ...parts, [segment]: nextValue };
    updateNumber(nextParts);

    const maxLength = segment === 'prefix' ? 1 : segment === 'digits' ? 3 : 2;
    if (!unregistered && nextValue.length === maxLength) {
      focusNextSegment(segment);
    }
  };

  const handleSegmentKeyDown = (
    segment: PlateSegment,
    currentValue: string
  ) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !currentValue) {
      focusPreviousSegment(segment);
      return;
    }

    if (event.key === 'ArrowLeft' && event.currentTarget.selectionStart === 0) {
      focusPreviousSegment(segment);
      return;
    }

    if (
      event.key === 'ArrowRight' &&
      event.currentTarget.selectionStart === currentValue.length &&
      currentValue.length > 0
    ) {
      focusNextSegment(segment);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Государственный номер
        </span>
        <div
          className={cn(
            'overflow-hidden rounded-[30px] border border-black/5 bg-[#f3f0eb] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] transition-[box-shadow,transform] focus-within:-translate-y-px focus-within:shadow-[0_16px_38px_rgba(0,0,0,0.16)] sm:px-5 sm:py-4',
            error && 'ring-2 ring-destructive/30'
          )}
        >
          <div className="grid min-h-[82px] grid-cols-[minmax(0,1fr)_94px] items-center gap-3 sm:min-h-[88px] sm:grid-cols-[minmax(0,1fr)_108px] sm:gap-4">
            <div className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-2">
              <PlateSegmentInput
                value={parts.prefix}
                placeholder="О"
                disabled={unregistered}
                inputMode="text"
                ariaLabel="Первая буква госномера"
                inputRef={prefixRef}
                className="w-[1.02ch]"
                onChange={(nextValue) => handleSegmentChange('prefix', nextValue)}
                onKeyDown={handleSegmentKeyDown('prefix', parts.prefix)}
              />
              <PlateSegmentInput
                value={parts.digits}
                placeholder="000"
                disabled={unregistered}
                inputMode="numeric"
                ariaLabel="Три цифры госномера"
                inputRef={digitsRef}
                className="w-[3.15ch]"
                onChange={(nextValue) => handleSegmentChange('digits', nextValue)}
                onKeyDown={handleSegmentKeyDown('digits', parts.digits)}
              />
              <PlateSegmentInput
                value={parts.suffix}
                placeholder="ОО"
                disabled={unregistered}
                inputMode="text"
                ariaLabel="Последние две буквы госномера"
                inputRef={suffixRef}
                className="w-[2.12ch]"
                onChange={(nextValue) => handleSegmentChange('suffix', nextValue)}
                onKeyDown={handleSegmentKeyDown('suffix', parts.suffix)}
              />
            </div>

            <div className="flex h-full min-w-0 flex-col justify-center border-l border-black/10 pl-3 text-black sm:pl-4">
              <div className="relative">
                <select
                  ref={regionRef}
                  value={region}
                  disabled={unregistered}
                  aria-label="Регион госномера"
                  onChange={(event) => onRegionChange(event.target.value)}
                  className="w-full appearance-none bg-transparent pr-5 text-right text-[1.65rem] font-medium leading-none text-black outline-none disabled:cursor-not-allowed disabled:text-black/22 sm:text-[1.95rem]"
                >
                  <option value="">00</option>
                  {REGISTRATION_PLATE_REGION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/38" />
              </div>

              <div className="mt-1 flex items-center justify-end gap-1.5 text-black/72">
                <span className="text-[0.86rem] font-medium tracking-[0.08em]">RUS</span>
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

      <label className="flex cursor-pointer items-center gap-3 text-foreground sm:gap-4">
        <input
          type="checkbox"
          checked={unregistered}
          onChange={(event) => onUnregisteredChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/70 transition-colors peer-checked:border-teal-accent/60 peer-checked:bg-teal-accent/12 peer-checked:text-teal-accent">
          {unregistered ? <Check className="h-4 w-4" /> : null}
        </span>
        <span className="text-base font-medium sm:text-[1.12rem]">Машина не стоит на учёте в ГАИ</span>
      </label>
    </div>
  );
}
