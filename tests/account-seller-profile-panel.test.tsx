import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { AccountSellerProfilePanel } from '@/components/account/seller-profile-panel';
import type { SellerProfile } from '@/lib/types';

const sellerProfile: SellerProfile = {
  id: 'seller-1',
  name: 'UnextAuto',
  type: 'company',
  verified: true,
  onPlatformSince: '2020',
  phone: '+7 999 000-00-00',
  about: 'Честные сделки и быстрый выход на связь.',
  avatarUrl: 'https://cdn.example.com/avatar.jpg',
  coverUrl: 'https://cdn.example.com/cover.jpg',
  avatarCropX: 58,
  avatarCropY: 42,
  avatarZoom: 1.25,
  coverCropX: 47,
  coverCropY: 34,
};

test('account seller profile panel renders summary and edit action', () => {
  const markup = renderToStaticMarkup(<AccountSellerProfilePanel sellerProfile={sellerProfile} />);

  assert.match(markup, /Профиль продавца/u);
  assert.match(markup, /Редактировать профиль/u);
  assert.match(markup, /UnextAuto/u);
  assert.match(markup, /Честные сделки и быстрый выход на связь\./u);
  assert.match(markup, /avatar\.jpg/u);
  assert.match(markup, /cover\.jpg/u);
});
