import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  HeaderFavoritesHeartIcon,
  getHeaderFavoritesHeartState,
} from '@/components/marketplace/header-favorites-heart';

test('zero favorites keep the default heart state', () => {
  assert.equal(
    getHeaderFavoritesHeartState({ favoriteCount: 0, pathname: '/sale', hash: '' }),
    'default'
  );
});

test('non-zero favorites use the filled tiffany state', () => {
  assert.equal(
    getHeaderFavoritesHeartState({ favoriteCount: 3, pathname: '/sale', hash: '' }),
    'filled'
  );
});

test('account favorites route overrides count and forces the active red state', () => {
  assert.equal(
    getHeaderFavoritesHeartState({ favoriteCount: 0, pathname: '/account', hash: '#favorites' }),
    'active'
  );
});

test('heart icon render maps filled and active states to the expected classes', () => {
  const filled = renderToStaticMarkup(
    <HeaderFavoritesHeartIcon state="filled" className="mr-1.5 h-3.5 w-3.5" />
  );
  const active = renderToStaticMarkup(
    <HeaderFavoritesHeartIcon state="active" className="mr-1.5 h-3.5 w-3.5" />
  );
  const base = renderToStaticMarkup(
    <HeaderFavoritesHeartIcon state="default" className="mr-1.5 h-3.5 w-3.5" />
  );

  assert.match(filled, /fill-current/);
  assert.match(filled, /text-teal-accent/);
  assert.match(active, /fill-current/);
  assert.match(active, /text-red-500/);
  assert.doesNotMatch(base, /fill-current/);
});
