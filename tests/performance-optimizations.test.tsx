import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import nextConfig from '../next.config.mjs';
import { HomeHero } from '@/components/landing/home-hero';
import {
  CHAT_PRESENCE_NAVIGATION_CLEANUP_DELAY_MS,
  HEADER_SESSION_CACHE_TTL_MS,
  HEADER_SESSION_REFRESH_INTERVAL_MS,
} from '@/components/marketplace/header';
import {
  CHAT_LIST_REFRESH_INTERVAL_MS,
  CHAT_THREAD_REFRESH_INTERVAL_MS,
} from '@/components/messages/chat-shell';
import { CHAT_PUSH_SETUP_STATE_CACHE_TTL_MS } from '@/components/messages/chat-push-setup';
import { PUSH_PUBLIC_KEY_CACHE_TTL_MS } from '@/lib/push/browser';

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

test('client side account data is cached across route transitions', () => {
  assert.ok(HEADER_SESSION_CACHE_TTL_MS >= 30_000);
  assert.ok(CHAT_PUSH_SETUP_STATE_CACHE_TTL_MS >= 60_000);
  assert.ok(PUSH_PUBLIC_KEY_CACHE_TTL_MS >= 10 * 60_000);
});

test('chat presence survives normal app-router navigation', () => {
  assert.ok(CHAT_PRESENCE_NAVIGATION_CLEANUP_DELAY_MS >= 5_000);
});

test('chat shell uses realtime events instead of immediate aggressive polling', async () => {
  assert.ok(CHAT_THREAD_REFRESH_INTERVAL_MS >= 15_000);
  assert.ok(CHAT_LIST_REFRESH_INTERVAL_MS >= 30_000);

  const source = await readFile('components/messages/chat-shell.tsx', 'utf8');
  assert.doesNotMatch(source, /\n\s*runRefresh\(\);\s*\n\s*const intervalId/u);
});

test('marketplace listing links do not auto-prefetch detail routes from dense lists', async () => {
  const files = [
    'components/marketplace/listing-card-view.tsx',
    'components/marketplace/listing-compact-row.tsx',
    'components/marketplace/listings-table.tsx',
  ];
  const listingLinkPattern = /<Link\b(?=[^>]*href=\{`\/listing\/\$\{listing\.id\}`\})[^>]*>/gu;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const links = [...source.matchAll(listingLinkPattern)].map((match) => match[0]);
    const linksWithAutoPrefetch = links.filter((link) => !link.includes('prefetch={false}'));

    assert.ok(links.length > 0, `${file} should contain listing detail links`);
    assert.deepEqual(linksWithAutoPrefetch, [], `${file} has listing links without prefetch={false}`);
  }
});

test('low-priority informational link groups do not auto-prefetch pages on mobile', async () => {
  const files = [
    'components/layout/site-shell.tsx',
    'components/landing/homepage-seo-sections.tsx',
    'components/legal/published-info-page.tsx',
  ];
  const mappedLinkPattern = /<Link\b(?=[^>]*href=\{link\.href\})[^>]*>/gu;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const links = [...source.matchAll(mappedLinkPattern)].map((match) => match[0]);
    const linksWithAutoPrefetch = links.filter((link) => !link.includes('prefetch={false}'));

    assert.ok(links.length > 0, `${file} should contain mapped informational links`);
    assert.deepEqual(linksWithAutoPrefetch, [], `${file} has informational links without prefetch={false}`);
  }
});

test('chat presence does not resend just because a non-chat route changed', async () => {
  const source = await readFile('components/marketplace/header.tsx', 'utf8');

  assert.match(source, /const presencePathname = activeChatId \? pathname : null;/u);
  assert.match(source, /pathname: presencePathname,/u);
  assert.match(source, /\}, \[activeChatId, clientId, presencePathname, sessionUser\?\.id\]\);/u);
});
