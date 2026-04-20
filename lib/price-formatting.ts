const GROUPED_NUMBER_FORMATTER = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

const NON_BREAKING_SPACE_PATTERN = /[\u00A0\u202F]/g;
const NON_DIGIT_PATTERN = /\D+/g;

function normalizeGroupingWhitespace(value: string) {
  return value.replace(NON_BREAKING_SPACE_PATTERN, ' ');
}

export function stripToDigits(value: string) {
  return value.replace(NON_DIGIT_PATTERN, '');
}

export function normalizeDigitString(value: string) {
  const digits = stripToDigits(value);
  if (!digits) {
    return '';
  }

  return String(Number.parseInt(digits, 10));
}

export function parseFormattedInteger(value: string) {
  const normalized = normalizeDigitString(value);
  if (!normalized) {
    return undefined;
  }

  return Number(normalized);
}

export function formatGroupedNumber(value: number | string) {
  const numericValue =
    typeof value === 'number' ? value : parseFormattedInteger(value);

  if (numericValue == null || !Number.isFinite(numericValue)) {
    return '';
  }

  return normalizeGroupingWhitespace(GROUPED_NUMBER_FORMATTER.format(numericValue));
}

export function formatGroupedDigits(value: string) {
  return formatGroupedNumber(value);
}

export function formatPrice(value: number | string) {
  const formattedValue = formatGroupedNumber(value);
  return formattedValue ? `${formattedValue} ₽` : '';
}
