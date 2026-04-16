const REGISTRATION_PLATE_LATIN_TO_CYRILLIC: Record<string, string> = {
  A: 'А',
  B: 'В',
  C: 'С',
  E: 'Е',
  H: 'Н',
  K: 'К',
  M: 'М',
  O: 'О',
  P: 'Р',
  T: 'Т',
  X: 'Х',
  Y: 'У',
};

export const REGISTRATION_PLATE_ALLOWED_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'] as const;
const REGISTRATION_PLATE_ALLOWED_SET = new Set<string>(REGISTRATION_PLATE_ALLOWED_LETTERS);

export const REGISTRATION_PLATE_REGION_OPTIONS = Array.from({ length: 999 }, (_, index) => {
  const value = String(index + 1);
  return value.length === 1 ? `0${value}` : value;
});

function normalizeRegistrationPlateLetter(value: string) {
  const upper = value.trim().toUpperCase();
  if (!upper) {
    return '';
  }

  const mapped = REGISTRATION_PLATE_LATIN_TO_CYRILLIC[upper] ?? upper;
  return REGISTRATION_PLATE_ALLOWED_SET.has(mapped) ? mapped : '';
}

export function normalizeRegistrationPlateLetters(value: string, maxLength: number) {
  return Array.from(value)
    .map((char) => normalizeRegistrationPlateLetter(char))
    .filter(Boolean)
    .join('')
    .slice(0, maxLength);
}

export function normalizeRegistrationPlateDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function normalizeRegistrationPlateRegion(value: string | null | undefined) {
  const digits = normalizeRegistrationPlateDigits(value ?? '', 3);
  if (digits.length === 1) {
    return `0${digits}`;
  }

  return digits;
}

export function buildRegistrationPlateValue(input: {
  prefix: string;
  digits: string;
  suffix: string;
}) {
  return [
    normalizeRegistrationPlateLetters(input.prefix, 1),
    normalizeRegistrationPlateDigits(input.digits, 3),
    normalizeRegistrationPlateLetters(input.suffix, 2),
  ].join('');
}

export function splitRegistrationPlateValue(value: string | null | undefined) {
  let prefix = '';
  let digits = '';
  let suffix = '';

  for (const char of Array.from(value ?? '')) {
    const normalizedLetter = normalizeRegistrationPlateLetter(char);

    if (!prefix && normalizedLetter) {
      prefix = normalizedLetter;
      continue;
    }

    if (prefix && digits.length < 3 && /\d/.test(char)) {
      digits += char;
      continue;
    }

    if (prefix && digits.length > 0 && suffix.length < 2 && normalizedLetter) {
      suffix += normalizedLetter;
    }
  }

  return { prefix, digits, suffix };
}

export function hasAnyRegistrationPlateValue(value: string | null | undefined, region: string | null | undefined) {
  return buildRegistrationPlateValue({
    ...splitRegistrationPlateValue(value),
  }).length > 0 || normalizeRegistrationPlateRegion(region).length > 0;
}

export function isRegistrationPlateComplete(value: string | null | undefined, region: string | null | undefined) {
  const parts = splitRegistrationPlateValue(value);
  const normalizedRegion = normalizeRegistrationPlateRegion(region);

  return parts.prefix.length === 1 && parts.digits.length === 3 && parts.suffix.length === 2 && normalizedRegion.length >= 2;
}
