import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSaleSearchParams,
  createDefaultSaleSearchFilters,
  parseSaleSearchParams,
} from '@/lib/sale-search';

function ensureServerEnv() {
  process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:1/test?schema=public';
  process.env.POSTGRESQL_HOST ??= '127.0.0.1';
  process.env.POSTGRESQL_PORT ??= '5432';
  process.env.POSTGRESQL_USER ??= 'test';
  process.env.POSTGRESQL_PASSWORD ??= 'test';
  process.env.POSTGRESQL_DBNAME ??= 'test';
  process.env.S3_ENDPOINT ??= 'https://example.com';
  process.env.S3_BUCKET ??= 'test';
  process.env.S3_ACCESS_KEY ??= 'test';
  process.env.S3_SECRET_KEY ??= 'test';
  process.env.S3_PUBLIC_URL ??= 'https://cdn.example.com';
}

test('parseSaleSearchParams reads benefit filters and benefit sort', () => {
  const params = new URLSearchParams([
    ['hasBenefit', 'true'],
    ['benefitMin', '100000'],
    ['benefitMax', '300000'],
    ['sort', 'benefit_desc'],
  ]);

  const filters = parseSaleSearchParams(params) as {
    hasBenefit?: boolean;
    benefitMin?: number;
    benefitMax?: number;
    sort: string;
  };

  assert.equal(filters.hasBenefit, true);
  assert.equal(filters.benefitMin, 100000);
  assert.equal(filters.benefitMax, 300000);
  assert.equal(filters.sort, 'benefit_desc');
});

test('buildSaleSearchParams serializes benefit filters and benefit sort', () => {
  const query = buildSaleSearchParams({
    ...createDefaultSaleSearchFilters(),
    hasBenefit: true,
    benefitMin: 100000,
    benefitMax: 300000,
    sort: 'benefit_desc',
  } as typeof createDefaultSaleSearchFilters extends () => infer T ? T & {
    hasBenefit?: boolean;
    benefitMin?: number;
    benefitMax?: number;
    sort: string;
  } : never).toString();

  assert.match(query, /(?:^|&)hasBenefit=true(?:&|$)/);
  assert.match(query, /(?:^|&)benefitMin=100000(?:&|$)/);
  assert.match(query, /(?:^|&)benefitMax=300000(?:&|$)/);
  assert.match(query, /(?:^|&)sort=benefit_desc(?:&|$)/);
});

test('fixture fallback keeps only positive-benefit listings when sorting by benefit', async () => {
  ensureServerEnv();
  const { searchPublishedSaleListings } = await import('@/lib/server/marketplace');
  const result = await searchPublishedSaleListings({
    ...createDefaultSaleSearchFilters(),
    sort: 'benefit_desc' as never,
  });

  assert.ok(result.items.length > 0);

  const benefits = result.items.map((item) => (item as { potentialBenefit?: number }).potentialBenefit ?? 0);

  assert.ok(benefits.every((value) => value > 0));
  assert.deepEqual(
    benefits,
    [...benefits].sort((left, right) => right - left),
  );
});
