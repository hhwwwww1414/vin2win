import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { SellerProfileHero } from '@/components/seller/seller-profile-hero';
import type { SellerProfile } from '@/lib/types';

const sellerProfile: SellerProfile = {
  id: 'seller-1',
  name: 'UnextAuto',
  type: 'company',
  verified: true,
  onPlatformSince: '2020',
  phone: '+7 999 000-00-00',
  about: 'Ваш надежный партнер в мире автомобилей.',
  avatarUrl: 'https://cdn.example.com/avatar.jpg',
  coverUrl: 'https://cdn.example.com/cover.jpg',
  avatarCropX: 60,
  avatarCropY: 40,
  avatarZoom: 1.4,
  coverCropX: 48,
  coverCropY: 30,
  completedDealsCount: 8,
  reviewCount: 30,
  averageRating: 5,
};

test('seller profile hero renders compact gallery, trust row, and profile tabs', () => {
  const markup = renderToStaticMarkup(
    <SellerProfileHero
      seller={sellerProfile}
      cities={['Москва']}
      reviewCount={30}
      averageRating={5}
      galleryImages={[
        'https://cdn.example.com/cover.jpg',
        'https://cdn.example.com/listing-1.jpg',
        'https://cdn.example.com/listing-2.jpg',
      ]}
      sellerPath="/seller/seller-1"
      activeTab="overview"
      tabs={[
        { key: 'overview', label: 'Обзор', href: '/seller/seller-1' },
        { key: 'listing', label: 'Объявления', href: '/seller/seller-1?tab=listing', count: 12 },
        { key: 'reviews', label: 'Отзывы', href: '/seller/seller-1?tab=reviews', count: 30 },
        { key: 'logbook', label: 'Бортжурнал', href: '/seller/seller-1?tab=logbook' },
      ]}
    />
  );

  assert.match(markup, /UnextAuto/u);
  assert.match(markup, /Ваш надежный партнер в мире автомобилей\./u);
  assert.match(markup, /profile-tabs/u);
  assert.match(markup, /Обзор/u);
  assert.match(markup, /Объявления/u);
  assert.match(markup, /Отзывы/u);
  assert.match(markup, /Бортжурнал/u);
  assert.match(markup, /Проверенный продавец/u);
  assert.doesNotMatch(markup, /12 в продаже/u);
  assert.match(markup, /30 отзывов/u);
  assert.match(markup, /avatar\.jpg/u);
  assert.match(markup, /cover\.jpg/u);
  assert.match(markup, /listing-1\.jpg/u);
  assert.match(markup, /object-position:60% 40%/u);
});
