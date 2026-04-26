import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { ListingBenefitBadge } from '@/components/marketplace/listing-benefit-badge';
import { ListingCardView } from '@/components/marketplace/listing-card-view';
import { ListingCompactRow } from '@/components/marketplace/listing-compact-row';
import type { SaleListing } from '@/lib/types';

const listing: SaleListing = {
  id: 'layout-listing-1',
  type: 'sale',
  make: 'Land Rover',
  model: 'Range Rover Sport',
  year: 2020,
  price: 8270000,
  priceInHand: 8100000,
  priceOnResources: 8270000,
  potentialBenefit: 170000,
  city: 'Moscow',
  images: ['/test.jpg'],
  engine: '3.0 petrol',
  power: 400,
  transmission: 'AT',
  drive: 'AWD',
  bodyType: 'SUV',
  mileage: 37700,
  owners: 1,
  ptsOriginal: true,
  avtotekaStatus: 'green',
  paintCount: 0,
  resourceStatus: 'on_resources',
  sellerType: 'owner',
  color: 'White',
  steering: 'left',
  trim: 'HSE Dynamic',
  description: 'Layout regression test listing',
  viewCount: 2,
  createdAt: '2026-04-16T10:00:00.000Z',
  seller: {
    id: 'seller-1',
    name: 'UNEXTAUTO',
    type: 'company',
    verified: true,
    onPlatformSince: '2026-03',
    phone: '+7 999 000-00-00',
    averageRating: 4.9,
  },
};

test('listing card desktop grid gives the price rail more width', () => {
  const markup = renderToStaticMarkup(<ListingCardView listing={listing} />);

  assert.match(markup, /lg:grid-cols-\[320px_minmax\(0,1fr\)_216px_40px\]/u);
  assert.match(markup, /xl:grid-cols-\[336px_minmax\(0,1fr\)_228px_40px\]/u);
});

test('card benefit badge keeps its content on a single line', () => {
  const markup = renderToStaticMarkup(<ListingBenefitBadge amount={170000} variant="card" />);

  assert.match(markup, /whitespace-nowrap/u);
});

test('listing card seller row shows rating next to the verified badge', () => {
  const markup = renderToStaticMarkup(<ListingCardView listing={listing} />);

  assert.match(markup, /Проверенный/u);
  assert.match(markup, /4\.9/u);
  assert.match(markup, /M11\.525 2\.295/u);
});

test('listing card renders a static mobile cover before loading the interactive gallery', () => {
  const markup = renderToStaticMarkup(<ListingCardView listing={listing} />);

  assert.match(markup, /data-mobile-static-cover="true"/u);
  assert.doesNotMatch(markup, /touch-pan-x/u);
});

test('compact listing row also avoids server-rendering the carousel for mobile', () => {
  const markup = renderToStaticMarkup(<ListingCompactRow listing={listing} />);

  assert.match(markup, /data-mobile-static-cover="true"/u);
  assert.doesNotMatch(markup, /touch-pan-x/u);
});
