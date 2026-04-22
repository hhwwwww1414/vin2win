const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_BIRTH_YEAR = 1900;

export const BIRTH_DATE_REQUIRED_ERROR = 'Укажите дату рождения.';
export const BIRTH_DATE_INVALID_ERROR = 'Укажите корректную дату рождения.';

function buildUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

export function normalizeBirthDateInput(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isBirthDateErrorMessage(value: string | null | undefined) {
  return value === BIRTH_DATE_REQUIRED_ERROR || value === BIRTH_DATE_INVALID_ERROR;
}

export function parseBirthDateInput(value: string): Date {
  const normalized = normalizeBirthDateInput(value);
  if (!normalized) {
    throw new Error(BIRTH_DATE_REQUIRED_ERROR);
  }

  const match = ISO_DATE_PATTERN.exec(normalized);
  if (!match) {
    throw new Error(BIRTH_DATE_INVALID_ERROR);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birthDate = buildUtcDate(year, month - 1, day);

  if (
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    throw new Error(BIRTH_DATE_INVALID_ERROR);
  }

  const today = new Date();
  const latestBirthDate = buildUtcDate(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  if (year < MIN_BIRTH_YEAR || birthDate.getTime() > latestBirthDate.getTime()) {
    throw new Error(BIRTH_DATE_INVALID_ERROR);
  }

  return birthDate;
}

export function tryParseBirthDate(value: string) {
  try {
    return parseBirthDateInput(value);
  } catch {
    return null;
  }
}

export function formatBirthDateForStorage(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatBirthDateLabel(value: string) {
  const birthDate = parseBirthDateInput(value);

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(birthDate);
}
