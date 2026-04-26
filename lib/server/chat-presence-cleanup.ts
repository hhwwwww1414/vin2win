export const CHAT_PRESENCE_CLEANUP_INTERVAL_MS = 60_000;

let lastChatPresenceCleanupAt = 0;

export function shouldRunChatPresenceCleanup(now = Date.now()) {
  if (
    lastChatPresenceCleanupAt > 0 &&
    now - lastChatPresenceCleanupAt < CHAT_PRESENCE_CLEANUP_INTERVAL_MS
  ) {
    return false;
  }

  lastChatPresenceCleanupAt = now;
  return true;
}

export function resetChatPresenceCleanupGateForTests() {
  lastChatPresenceCleanupAt = 0;
}
