import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanAutoTitle,
  normalizeAutomobileModelTitle,
} from '@/scripts/vehicle-catalog/import';

test('cleanAutoTitle normalizes malformed automobile source year prefixes', () => {
  assert.equal(
    cleanAutoTitle('2023LAND ROVER Range Rover Sport Photos, engines &amp; full specs '),
    '2023 LAND ROVER Range Rover Sport'
  );
  assert.equal(
    cleanAutoTitle('22025 BMW X3 (G45) Photos, engines &amp; full specs '),
    '2025 BMW X3 (G45)'
  );
  assert.equal(
    cleanAutoTitle('2010Ford Taurus Photos, engines &amp; full specs '),
    '2010 Ford Taurus'
  );
});

test('normalizeAutomobileModelTitle strips leading year and brand tokens', () => {
  assert.equal(
    normalizeAutomobileModelTitle(
      cleanAutoTitle('2023LAND ROVER Range Rover Sport Photos, engines &amp; full specs '),
      'Land Rover'
    ),
    'Range Rover Sport'
  );
  assert.equal(
    normalizeAutomobileModelTitle(
      cleanAutoTitle('2010Ford Taurus Photos, engines &amp; full specs '),
      'Ford'
    ),
    'Taurus'
  );
});
