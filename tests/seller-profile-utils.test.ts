import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSellerProfileAboutText,
  buildSellerProfileImageStyles,
  buildSellerProfileInitials,
} from '@/lib/seller-profile';

test('buildSellerProfileAboutText returns trimmed seller text when present', () => {
  const result = buildSellerProfileAboutText({
    about: '  Честно подбираем и продаем автомобили без сюрпризов.  ',
  });

  assert.equal(result, 'Честно подбираем и продаем автомобили без сюрпризов.');
});

test('buildSellerProfileAboutText returns fallback when text is missing', () => {
  const result = buildSellerProfileAboutText({
    name: 'UnextAuto',
  });

  assert.match(result, /UnextAuto/);
});

test('buildSellerProfileInitials keeps two visible initials for placeholders', () => {
  assert.equal(buildSellerProfileInitials('Unext Auto'), 'UA');
  assert.equal(buildSellerProfileInitials('Иван'), 'И');
});

test('buildSellerProfileImageStyles keeps stable crop and zoom values', () => {
  const result = buildSellerProfileImageStyles({
    cropX: 62,
    cropY: 38,
    zoom: 1.35,
  });

  assert.deepEqual(result, {
    objectPosition: '62% 38%',
    transform: 'scale(1.35)',
  });
});

test('buildSellerProfileImageStyles falls back to centered framing', () => {
  const result = buildSellerProfileImageStyles({});

  assert.deepEqual(result, {
    objectPosition: '50% 50%',
    transform: 'scale(1)',
  });
});
