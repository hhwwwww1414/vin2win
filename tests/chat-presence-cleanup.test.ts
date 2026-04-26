import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHAT_PRESENCE_CLEANUP_INTERVAL_MS,
  resetChatPresenceCleanupGateForTests,
  shouldRunChatPresenceCleanup,
} from '@/lib/server/chat-presence-cleanup';

test('chat presence cleanup gate allows the first cleanup and throttles nearby heartbeats', () => {
  resetChatPresenceCleanupGateForTests();

  assert.equal(shouldRunChatPresenceCleanup(1_000), true);
  assert.equal(shouldRunChatPresenceCleanup(1_000 + CHAT_PRESENCE_CLEANUP_INTERVAL_MS - 1), false);
  assert.equal(shouldRunChatPresenceCleanup(1_000 + CHAT_PRESENCE_CLEANUP_INTERVAL_MS), true);
});

test('chat presence cleanup gate can be reset between isolated processes/tests', () => {
  resetChatPresenceCleanupGateForTests();

  assert.equal(shouldRunChatPresenceCleanup(2_000), true);
  resetChatPresenceCleanupGateForTests();
  assert.equal(shouldRunChatPresenceCleanup(2_001), true);
});
