import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { GuestListingTeaserLock } from '@/components/marketplace/guest-listing-teaser-lock';
import { ListingsTable } from '@/components/marketplace/listings-table';
import {
  GUEST_LISTING_TEASER_COUNT,
  getGlobalListingIndex,
  isGuestListingTeaserLocked,
  isGuestListingTeaserLockedByGlobalIndex,
} from '@/lib/marketplace-teaser';
import type { SaleListing } from '@/lib/types';

const baseListing: SaleListing = {
  id: 'guest-teaser-listing-1',
  type: 'sale',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  price: 2500000,
  city: 'Москва',
  images: ['/test.jpg'],
  engine: '2.5 бензин',
  power: 181,
  transmission: 'автомат',
  drive: 'передний',
  bodyType: 'Седан',
  mileage: 42000,
  owners: 1,
  ptsOriginal: true,
  paintCount: 0,
  resourceStatus: 'not_listed',
  sellerType: 'owner',
  color: 'черный',
  steering: 'левый',
  description: 'Гостевой teaser test listing',
  viewCount: 8,
  createdAt: '2026-04-20T10:00:00.000Z',
  seller: {
    id: 'seller-1',
    name: 'vin2win',
    type: 'company',
    verified: true,
    onPlatformSince: '2026-03',
  },
};

function buildListings(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...baseListing,
    id: `guest-teaser-listing-${index + 1}`,
  }));
}

test('marketplace teaser helpers lock guest listings after the first three global items', () => {
  assert.equal(GUEST_LISTING_TEASER_COUNT, 3);
  assert.equal(getGlobalListingIndex(1, 20, 0), 0);
  assert.equal(getGlobalListingIndex(2, 20, 0), 20);

  assert.equal(isGuestListingTeaserLocked({ isAuthenticated: false, page: 1, limit: 20, index: 2 }), false);
  assert.equal(isGuestListingTeaserLocked({ isAuthenticated: false, page: 1, limit: 20, index: 3 }), true);
  assert.equal(isGuestListingTeaserLocked({ isAuthenticated: false, page: 2, limit: 20, index: 0 }), true);
  assert.equal(isGuestListingTeaserLocked({ isAuthenticated: true, page: 2, limit: 20, index: 0 }), false);
  assert.equal(isGuestListingTeaserLockedByGlobalIndex({ isAuthenticated: false, globalIndex: 2 }), false);
  assert.equal(isGuestListingTeaserLockedByGlobalIndex({ isAuthenticated: false, globalIndex: 3 }), true);
  assert.equal(isGuestListingTeaserLockedByGlobalIndex({ isAuthenticated: true, globalIndex: 99 }), false);
});

test('guest listing teaser lock renders login CTA only when locked', () => {
  const lockedMarkup = renderToStaticMarkup(
    <GuestListingTeaserLock locked loginHref="/login?next=%2Fsale">
      <div>Locked listing</div>
    </GuestListingTeaserLock>,
  );

  assert.match(lockedMarkup, /data-guest-listing-teaser-lock="true"/);
  assert.match(lockedMarkup, /href="\/login\?next=%2Fsale"/);
  assert.match(lockedMarkup, /Войти/u);

  const openMarkup = renderToStaticMarkup(
    <GuestListingTeaserLock locked={false} loginHref="/login?next=%2Fsale">
      <div>Open listing</div>
    </GuestListingTeaserLock>,
  );

  assert.doesNotMatch(openMarkup, /data-guest-listing-teaser-lock="true"/);
  assert.doesNotMatch(openMarkup, /Войти/u);
});

test('listings table locks rows after the third guest listing in the current search feed', () => {
  const markup = renderToStaticMarkup(
    <ListingsTable
      listings={buildListings(4)}
      sortKey="date"
      onSortChange={() => {}}
      isAuthenticated={false}
      loginHref="/login?next=%2Fsale"
      listingOffset={0}
    />,
  );

  assert.match(markup, /href="\/login\?next=%2Fsale"/);
  assert.equal((markup.match(/data-guest-listing-teaser-lock="true"/g) ?? []).length, 1);
});
