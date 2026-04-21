import assert from 'node:assert/strict';
import test from 'node:test';

import { launchListingSuccessConfetti } from '@/lib/listing-success-confetti';

test('launchListingSuccessConfetti fires every configured burst for the selected mode', async () => {
  const calls: Array<Record<string, unknown>> = [];

  await launchListingSuccessConfetti('soft', {
    reducedMotion: false,
    fire: async (options) => {
      calls.push(options);
    },
  });

  assert.equal(calls.length, 3);
});

test('launchListingSuccessConfetti skips all bursts when reduced motion is enabled', async () => {
  const calls: Array<Record<string, unknown>> = [];

  await launchListingSuccessConfetti('full', {
    reducedMotion: true,
    fire: async (options) => {
      calls.push(options);
    },
  });

  assert.equal(calls.length, 0);
});
