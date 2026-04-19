import assert from 'node:assert/strict';
import test from 'node:test';
import { HOME_HERO_CTA_VARIANT_A } from '@/lib/home-cta';

test('home hero CTA variant A uses branded sweep animation on both actions', () => {
  assert.equal(HOME_HERO_CTA_VARIANT_A.primary.title, 'Перейти в каталог');
  assert.equal(HOME_HERO_CTA_VARIANT_A.secondary.title, 'Подать объявление');

  assert.match(HOME_HERO_CTA_VARIANT_A.primary.buttonClassName, /relative/);
  assert.match(HOME_HERO_CTA_VARIANT_A.primary.buttonClassName, /overflow-hidden/);
  assert.match(HOME_HERO_CTA_VARIANT_A.secondary.buttonClassName, /relative/);
  assert.match(HOME_HERO_CTA_VARIANT_A.secondary.buttonClassName, /overflow-hidden/);

  assert.match(HOME_HERO_CTA_VARIANT_A.primary.sweepClassName, /landing-cta-sweep/);
  assert.match(HOME_HERO_CTA_VARIANT_A.primary.sweepClassName, /landing-cta-sweep-strong/);
  assert.match(HOME_HERO_CTA_VARIANT_A.secondary.sweepClassName, /landing-cta-sweep/);
  assert.match(HOME_HERO_CTA_VARIANT_A.secondary.sweepClassName, /landing-cta-sweep-soft/);
});
