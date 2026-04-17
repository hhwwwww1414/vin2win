import test from 'node:test';
import assert from 'node:assert/strict';
import { getCitiesForRegion } from '@/lib/ru-regions';

test('Moscow region city list includes Moscow for listing submission flow', () => {
  const cities = getCitiesForRegion('Московская область');

  assert.ok(cities.includes('Москва'));
});
