import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCitiesForRegion,
  getRegionForCity,
  getRuRegionOptions,
  resolveRuRegion,
} from '@/lib/ru-regions';

test('Moscow region keeps Moscow in the canonical combined region entry', () => {
  const cities = getCitiesForRegion('Москва и Московская область');

  assert.ok(cities.includes('Москва'));
  assert.ok(getRuRegionOptions().includes('Москва и Московская область'));
  assert.equal(getRegionForCity('Москва'), 'Москва и Московская область');
});

test('legacy Moscow region labels still resolve to the new canonical label', () => {
  assert.equal(resolveRuRegion('Московская область'), 'Москва и Московская область');
  assert.equal(resolveRuRegion('Москва и МО'), 'Москва и Московская область');
});
