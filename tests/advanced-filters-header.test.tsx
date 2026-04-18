import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ADVANCED_FILTER_HEADER_PILLS,
  getAdvancedFilterHeaderPills,
} from '@/components/marketplace/advanced-filters';
import { createDefaultSaleSearchFilters } from '@/lib/sale-search';

test('advanced filters keep a stable header scaffold before any filter is selected', () => {
  const pills = getAdvancedFilterHeaderPills(createDefaultSaleSearchFilters());

  assert.deepEqual(pills, DEFAULT_ADVANCED_FILTER_HEADER_PILLS);
});

test('advanced filters header prefers real selected-summary pills when they exist', () => {
  const filters = createDefaultSaleSearchFilters();
  filters.make = ['Toyota'];
  filters.model = ['Camry'];
  filters.priceMin = 2500000;

  const pills = getAdvancedFilterHeaderPills(filters);

  assert.equal(pills[0], 'Toyota');
  assert.equal(pills[1], 'Camry');
  assert.match(pills[2], /Цена от 2(?:\s|\u00A0)500(?:\s|\u00A0)000/u);
});

test('advanced filters header surfaces active benefit filters in summary pills', () => {
  const filters = createDefaultSaleSearchFilters();
  filters.hasBenefit = true;
  filters.benefitMin = 150000;

  const pills = getAdvancedFilterHeaderPills(filters);

  assert.ok(pills.some((pill) => /Выгода|Есть выгода/u.test(pill)));
});
