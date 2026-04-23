import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { DealBlock } from '@/components/listing/deal-block';
import type { SaleListing } from '@/lib/types';

const listing: SaleListing = {
  id: 'listing-1',
  type: 'sale',
  make: 'BMW',
  model: 'X5',
  year: 2022,
  price: 4500000,
  priceInHand: 4400000,
  priceOnResources: 4600000,
  city: 'Москва',
  images: ['/test.jpg'],
  engine: 'бензин',
  power: 249,
  transmission: 'автомат',
  drive: 'полный',
  bodyType: 'SUV',
  mileage: 54000,
  owners: 1,
  ptsOriginal: true,
  avtotekaStatus: 'green',
  paintCount: 0,
  resourceStatus: 'not_listed',
  sellerType: 'owner',
  color: 'черный',
  steering: 'левый',
  description: 'Тестовое объявление',
  viewCount: 0,
  createdAt: '2026-04-16T10:00:00.000Z',
  seller: {
    id: 'seller-1',
    name: 'Владимир Мажирин',
    type: 'person',
    verified: true,
    onPlatformSince: 'март 2026',
    phone: '+7 999 000-00-00',
  },
};

test('deal block renders seller profile entry as link in desktop and mobile layouts', () => {
  const markup = renderToStaticMarkup(<DealBlock listing={listing} />);

  assert.equal(markup.match(/href="\/seller\/seller-1"/g)?.length, 2);
  assert.match(markup, /PDF клиенту/u);
  assert.match(markup, /Владимир Мажирин/u);
  assert.doesNotMatch(markup, /Карточка продавца доступна внутри лота/u);
});

test('mobile sticky summary keeps only primary CTA while secondary actions stay inline', () => {
  const markup = renderToStaticMarkup(<DealBlock listing={listing} />);
  const secondaryStart = markup.indexOf('data-mobile-secondary-actions="true"');
  const stickyStart = markup.indexOf('data-mobile-deal-block="true"');

  assert.ok(secondaryStart >= 0);
  assert.ok(stickyStart > secondaryStart);

  const mobileSecondaryMarkup = markup.slice(secondaryStart, stickyStart);
  const mobileStickyMarkup = markup.slice(stickyStart);

  assert.match(mobileSecondaryMarkup, /Показать контакт/u);
  assert.match(mobileSecondaryMarkup, /PDF клиенту/u);
  assert.match(mobileStickyMarkup, /Написать/u);
  assert.match(mobileStickyMarkup, /Профиль продавца/u);
  assert.doesNotMatch(mobileStickyMarkup, /Показать контакт/u);
  assert.doesNotMatch(mobileStickyMarkup, /PDF клиенту/u);
});
