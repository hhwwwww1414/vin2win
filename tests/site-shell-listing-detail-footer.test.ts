import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSiteFooterClassName,
  isMessagesPath,
  isSaleListingDetailPath,
} from '@/components/layout/site-shell';

test('site shell identifies sale listing detail routes only for concrete listing pages', () => {
  assert.equal(isSaleListingDetailPath('/listing/1'), true);
  assert.equal(isSaleListingDetailPath('/listing/abc-123'), true);
  assert.equal(isSaleListingDetailPath('/listing/new'), false);
  assert.equal(isSaleListingDetailPath('/listing/1/photos'), false);
  assert.equal(isSaleListingDetailPath('/sale'), false);
  assert.equal(isSaleListingDetailPath(null), false);
});

test('site shell identifies messages routes as immersive messenger screens', () => {
  assert.equal(isMessagesPath('/messages'), true);
  assert.equal(isMessagesPath('/messages/chat-1'), true);
  assert.equal(isMessagesPath('/messages/chat-1/media'), true);
  assert.equal(isMessagesPath('/sale'), false);
  assert.equal(isMessagesPath(null), false);
});

test('site shell hides the shared footer on sale listing detail pages for the mobile deal block layout', () => {
  const detailFooterClassName = getSiteFooterClassName('/listing/1');
  const marketplaceFooterClassName = getSiteFooterClassName('/sale');

  assert.match(detailFooterClassName, /\bhidden\b/);
  assert.match(detailFooterClassName, /\blg:block\b/);
  assert.doesNotMatch(marketplaceFooterClassName, /\bhidden\b/);
});

test('site shell hides the shared footer on messages routes to keep the messenger viewport fixed', () => {
  const messagesFooterClassName = getSiteFooterClassName('/messages/chat-1');

  assert.match(messagesFooterClassName, /\bhidden\b/);
  assert.doesNotMatch(messagesFooterClassName, /\blg:block\b/);
});
