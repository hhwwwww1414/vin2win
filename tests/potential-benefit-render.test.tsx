import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';

import { DealBlock } from '@/components/listing/deal-block';
import { ListingCardView } from '@/components/marketplace/listing-card-view';
import { ListingCompactRow } from '@/components/marketplace/listing-compact-row';
import { ListingsTable } from '@/components/marketplace/listings-table';
import type { SaleListing } from '@/lib/types';

const listing: SaleListing = {
  id: 'benefit-listing-1',
  type: 'sale',
  make: 'BMW',
  model: 'X5',
  year: 2022,
  price: 1850000,
  priceInHand: 1700000,
  priceOnResources: 1850000,
  potentialBenefit: 150000,
  city: 'Москва',
  images: ['/test.jpg'],
  engine: '2.0 бензин',
  power: 249,
  transmission: 'автомат',
  drive: 'полный',
  bodyType: 'SUV',
  mileage: 54000,
  owners: 1,
  ptsOriginal: true,
  avtotekaStatus: 'green',
  paintCount: 0,
  resourceStatus: 'on_resources',
  sellerType: 'owner',
  color: 'черный',
  steering: 'левый',
  description: 'Тестовое объявление',
  viewCount: 48,
  createdAt: '2026-04-16T10:00:00.000Z',
  seller: {
    id: 'seller-1',
    name: 'vin2win',
    type: 'company',
    verified: true,
    onPlatformSince: 'март 2026',
    phone: '+7 999 000-00-00',
  },
};

test('listing card and compact row render benefit badges', () => {
  const cardMarkup = renderToStaticMarkup(<ListingCardView listing={listing} />);
  const compactMarkup = renderToStaticMarkup(<ListingCompactRow listing={listing} />);

  assert.match(cardMarkup, /Возможная выгода/u);
  assert.match(cardMarkup, /150(?:\s|&nbsp;)000/u);
  assert.match(compactMarkup, /Выгода/u);
  assert.match(compactMarkup, /150(?:\s|&nbsp;)000/u);
});

test('listings table renders a dedicated benefit column and value', () => {
  const markup = renderToStaticMarkup(
    <ListingsTable listings={[listing]} sortKey="benefit_desc" onSortChange={() => {}} />,
  );

  assert.match(markup, />Выгода</u);
  assert.match(markup, /150(?:\s|&nbsp;)000/u);
});

test('deal block renders potential benefit in desktop and mobile price areas', () => {
  const markup = renderToStaticMarkup(<DealBlock listing={listing} />);

  assert.ok((markup.match(/Возможная выгода/g) ?? []).length >= 2);
  assert.match(markup, /150(?:\s|&nbsp;)000/u);
});
