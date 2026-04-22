import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BIRTH_DATE_INVALID_ERROR,
  BIRTH_DATE_REQUIRED_ERROR,
  formatBirthDateForStorage,
  parseBirthDateInput,
} from '@/lib/birth-date';

test('birth date parser preserves the submitted calendar date', () => {
  const parsed = parseBirthDateInput('1992-07-15');

  assert.equal(formatBirthDateForStorage(parsed), '1992-07-15');
});

test('birth date parser rejects an empty value', () => {
  assert.throws(() => parseBirthDateInput(''), {
    message: BIRTH_DATE_REQUIRED_ERROR,
  });
});

test('birth date parser rejects impossible dates', () => {
  assert.throws(() => parseBirthDateInput('2024-02-31'), {
    message: BIRTH_DATE_INVALID_ERROR,
  });
});

test('birth date parser rejects dates in the future', () => {
  const today = new Date();
  const nextYear = today.getUTCFullYear() + 1;

  assert.throws(() => parseBirthDateInput(`${nextYear}-01-01`), {
    message: BIRTH_DATE_INVALID_ERROR,
  });
});
