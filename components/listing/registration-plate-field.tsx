'use client';

import Image from 'next/image';
import { useRef, type KeyboardEvent, type RefObject } from 'react';
import { Check } from 'lucide-react';
import {
  buildRegistrationPlateValue,
  normalizeRegistrationPlateDigits,
  normalizeRegistrationPlateLetters,
  normalizeRegistrationPlateRegion,
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
        'min-w-0 border-0 bg-transparent text-center font-display text-[clamp(1.85rem,8.4vw,2.35rem)] font-semibold leading-none tracking-[0.04em] text-black uppercase [font-variant-numeric:tabular-nums] outline-none placeholder:text-black/14 disabled:cursor-not-allowed disabled:text-black/24 disabled:placeholder:text-black/12 sm:text-[3.05rem] sm:tracking-[0.08em]',
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
  const regionRef = useRef<HTMLInputElement>(null);

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

  const handleSegmentKeyDown =
    (segment: PlateSegment, currentValue: string) => (event: KeyboardEvent<HTMLInputElement>) => {
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

  const handleRegionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !region) {
      suffixRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowLeft' && event.currentTarget.selectionStart === 0) {
      suffixRef.current?.focus();
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
            'w-full max-w-[520px] overflow-hidden rounded-[6px] border-2 border-black bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-[box-shadow,transform] focus-within:-translate-y-px focus-within:shadow-[0_16px_30px_rgba(15,23,42,0.14)]',
            error && 'ring-2 ring-destructive/25'
          )}
        >
          <div className="grid min-h-[92px] grid-cols-[minmax(0,1fr)_clamp(78px,23vw,100px)] items-stretch sm:min-h-[108px] sm:grid-cols-[minmax(0,1fr)_120px]">
            <div className="grid min-w-0 grid-cols-[1.45fr_3.25fr_2.55fr] items-center gap-1 px-1.5 min-[430px]:gap-2 min-[430px]:px-3 sm:gap-4 sm:px-6">
              <PlateSegmentInput
                value={parts.prefix}
                placeholder="A"
                disabled={unregistered}
                inputMode="text"
                ariaLabel="Первая буква госномера"
                inputRef={prefixRef}
                className="w-full"
                onChange={(nextValue) => handleSegmentChange('prefix', nextValue)}
                onKeyDown={handleSegmentKeyDown('prefix', parts.prefix)}
              />
              <PlateSegmentInput
                value={parts.digits}
                placeholder="777"
                disabled={unregistered}
                inputMode="numeric"
                ariaLabel="Три цифры госномера"
                inputRef={digitsRef}
                className="w-full"
                onChange={(nextValue) => handleSegmentChange('digits', nextValue)}
                onKeyDown={handleSegmentKeyDown('digits', parts.digits)}
              />
              <PlateSegmentInput
                value={parts.suffix}
                placeholder="AA"
                disabled={unregistered}
                inputMode="text"
                ariaLabel="Последние две буквы госномера"
                inputRef={suffixRef}
                className="w-full"
                onChange={(nextValue) => handleSegmentChange('suffix', nextValue)}
                onKeyDown={handleSegmentKeyDown('suffix', parts.suffix)}
              />
            </div>

            <div className="flex min-w-0 flex-col justify-between border-l-2 border-black px-1.5 py-2.5 sm:px-3 sm:py-3">
              <input
                ref={regionRef}
                value={region}
                disabled={unregistered}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                maxLength={3}
                aria-label="Регион госномера"
                placeholder="777"
                onFocus={(event) => event.currentTarget.select()}
                onKeyDown={handleRegionKeyDown}
                onChange={(event) => onRegionChange(normalizeRegistrationPlateRegion(event.target.value))}
                className="w-full border-0 bg-transparent text-center font-display text-[clamp(1.35rem,6.4vw,1.75rem)] font-semibold leading-none text-black [font-variant-numeric:tabular-nums] outline-none placeholder:text-black/18 disabled:cursor-not-allowed disabled:text-black/24 disabled:placeholder:text-black/14 sm:text-[2.15rem]"
              />

              <div className="flex justify-center pt-2">
                <Image
                  src="/plate-rus.svg"
                  alt=""
                  width={63}
                  height={15}
                  className="h-auto w-[52px] select-none min-[430px]:w-[60px] sm:w-[63px]"
                />
              </div>
            </div>
          </div>
        </div>
        {error ? <span className="block text-xs text-destructive">{error}</span> : null}
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-foreground sm:gap-3">
        <input
          type="checkbox"
          checked={unregistered}
          onChange={(event) => onUnregisteredChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background/70 transition-colors peer-checked:border-teal-accent/60 peer-checked:bg-teal-accent/12 peer-checked:text-teal-accent">
          {unregistered ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
        <span className="text-sm font-medium sm:text-base">Машина не стоит на учёте в ГАИ</span>
      </label>
    </div>
  );
}
