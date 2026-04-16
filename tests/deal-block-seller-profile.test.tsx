import test from 'node:test';
import assert from 'node:assert/strict';
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
  assert.match(markup, /Владимир Мажирин/);
  assert.doesNotMatch(markup, /Карточка продавца доступна внутри лота/);
});
