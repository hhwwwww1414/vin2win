import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRegistrationPlateValue,
  splitRegistrationPlateValue,
} from '@/lib/registration-plate';

test('buildRegistrationPlateValue normalizes latin lookalikes and strips invalid characters', () => {
  const value = buildRegistrationPlateValue({
    prefix: 'm',
    digits: '1a92',
    suffix: 'm x',
  });

  assert.equal(value, 'М192МХ');
});

test('splitRegistrationPlateValue returns editable plate segments from stored value', () => {
  assert.deepEqual(splitRegistrationPlateValue('М192ММ'), {
    prefix: 'М',
    digits: '192',
    suffix: 'ММ',
  });

  assert.deepEqual(splitRegistrationPlateValue(undefined), {
    prefix: '',
    digits: '',
    suffix: '',
  });
});
