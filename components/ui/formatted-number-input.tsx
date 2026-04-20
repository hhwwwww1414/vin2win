'use client';

import { type ChangeEvent, type InputHTMLAttributes, useLayoutEffect, useRef } from 'react';
import { formatGroupedDigits, normalizeDigitString, stripToDigits } from '@/lib/price-formatting';

type FormattedNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type' | 'value'
> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function FormattedNumberInput({
  value,
  onValueChange,
  inputMode = 'numeric',
  ...props
}: FormattedNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digitsBeforeCursorRef = useRef<number | null>(null);
  const displayValue = formatGroupedDigits(value);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selectionStart = event.target.selectionStart ?? event.target.value.length;
    digitsBeforeCursorRef.current = stripToDigits(
      event.target.value.slice(0, selectionStart),
    ).length;

    onValueChange(normalizeDigitString(event.target.value));
  }

  useLayoutEffect(() => {
    if (digitsBeforeCursorRef.current == null) {
      return;
    }

    const input = inputRef.current;
    if (!input) {
      digitsBeforeCursorRef.current = null;
      return;
    }

    const targetDigitCount = digitsBeforeCursorRef.current;

    if (targetDigitCount === 0) {
      input.setSelectionRange(0, 0);
      digitsBeforeCursorRef.current = null;
      return;
    }

    let seenDigits = 0;
    let nextCursorIndex = displayValue.length;

    for (let index = 0; index < displayValue.length; index += 1) {
      if (/\d/.test(displayValue[index] ?? '')) {
        seenDigits += 1;
      }

      if (seenDigits === targetDigitCount) {
        nextCursorIndex = index + 1;
        break;
      }
    }

    input.setSelectionRange(nextCursorIndex, nextCursorIndex);
    digitsBeforeCursorRef.current = null;
  }, [displayValue]);

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode={inputMode}
      pattern="[0-9 ]*"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
    />
  );
}
