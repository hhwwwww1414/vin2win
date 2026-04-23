import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  HeaderFavoritesHeartIcon,
  getHeaderFavoritesHeartState,
} from '@/components/marketplace/header-favorites-heart';

test('zero favorites keep the default heart state', () => {
  assert.equal(getHeaderFavoritesHeartState(0), 'default');
});

test('non-zero favorites use the filled red state', () => {
  assert.equal(getHeaderFavoritesHeartState(3), 'filled');
});

test('heart icon render maps states to the expected classes', () => {
  const filled = renderToStaticMarkup(
    <HeaderFavoritesHeartIcon state="filled" className="mr-1.5 h-3.5 w-3.5" />
  );
  const base = renderToStaticMarkup(
    <HeaderFavoritesHeartIcon state="default" className="mr-1.5 h-3.5 w-3.5" />
  );

  assert.match(filled, /fill-current/);
  assert.match(filled, /text-red-500/);
  assert.doesNotMatch(base, /fill-current/);
});
