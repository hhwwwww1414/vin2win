import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import nextConfig from '../next.config.mjs';
import { HomeHero } from '@/components/landing/home-hero';
import { HEADER_SESSION_REFRESH_INTERVAL_MS } from '@/components/marketplace/header';

test('home hero uses responsive precompressed webp assets instead of the original png', () => {
  const markup = renderToStaticMarkup(<HomeHero />);

  assert.match(markup, /main-hero-mobile\.webp/u);
  assert.match(markup, /main-hero-1600\.webp/u);
  assert.doesNotMatch(markup, /main\.png/u);
});

test('main hero assets are served with immutable cache headers', async () => {
  assert.ok(nextConfig.headers);

  const headers = await nextConfig.headers();
  const heroHeaderRules = headers.filter((rule) => rule.source.startsWith('/main-hero-'));

  assert.equal(heroHeaderRules.length, 2);
  for (const rule of heroHeaderRules) {
    assert.ok(
      rule.headers.some(
        (header) =>
          header.key.toLowerCase() === 'cache-control' &&
          header.value === 'public, max-age=31536000, immutable'
      )
    );
  }
});

test('main hero assets stay small enough for mobile networks', async () => {
  const mobile = await stat('public/main-hero-mobile.webp');
  const desktop = await stat('public/main-hero-1600.webp');

  assert.ok(mobile.size < 100_000);
  assert.ok(desktop.size < 100_000);
});

test('marketplace header does not poll session state every few seconds', () => {
  assert.equal(HEADER_SESSION_REFRESH_INTERVAL_MS, 60_000);
});
