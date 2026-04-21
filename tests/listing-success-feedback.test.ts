import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getListingSuccessCelebrationMode,
  getListingSuccessConfettiBursts,
} from '@/lib/listing-success-feedback';

test('draft status maps to the soft celebration mode', () => {
  assert.equal(getListingSuccessCelebrationMode('DRAFT'), 'soft');
});

test('non-draft success statuses map to the full celebration mode', () => {
  assert.equal(getListingSuccessCelebrationMode('PENDING'), 'full');
  assert.equal(getListingSuccessCelebrationMode('PUBLISHED'), 'full');
});

test('soft confetti preset stays quieter than the full preset', () => {
  const soft = getListingSuccessConfettiBursts('soft');
  const full = getListingSuccessConfettiBursts('full');

  assert.ok(soft.length > 0);
  assert.ok(full.length > 0);
  assert.ok(
    soft.reduce((sum, burst) => sum + burst.particleCount, 0) <
      full.reduce((sum, burst) => sum + burst.particleCount, 0)
  );
});

test('missing status still falls back to the full celebration mode', () => {
  assert.equal(getListingSuccessCelebrationMode(null), 'full');
});
