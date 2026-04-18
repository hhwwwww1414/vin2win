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

test('seller profile hero renders cover, avatar, trust row, and about navigation', () => {
  const markup = renderToStaticMarkup(
    <SellerProfileHero
      seller={sellerProfile}
      listingCount={12}
      cities={['Москва']}
      makes={['Land Rover', 'BMW']}
      reviewCount={30}
      averageRating={5}
    />
  );

  assert.match(markup, /UnextAuto/u);
  assert.match(markup, /Ваш надежный партнер в мире автомобилей\./u);
  assert.match(markup, /О продавце/u);
  assert.match(markup, /Объявления/u);
  assert.match(markup, /Отзывы/u);
  assert.match(markup, /Проверенный продавец/u);
  assert.match(markup, /avatar\.jpg/u);
  assert.match(markup, /cover\.jpg/u);
  assert.match(markup, /object-position:60% 40%/u);
});
