import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRegistrationPlateRegion } from '@/lib/registration-plate';

test('normalizeRegistrationPlateRegion keeps typed digits without forcing a leading zero', () => {
  assert.equal(normalizeRegistrationPlateRegion('9'), '9');
  assert.equal(normalizeRegistrationPlateRegion('99'), '99');
  assert.equal(normalizeRegistrationPlateRegion('099'), '099');
  assert.equal(normalizeRegistrationPlateRegion('9a9b'), '99');
});
