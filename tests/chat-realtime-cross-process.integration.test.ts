import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  ensureSubscriberConnected,
  shutdownChatRealtime,
  subscribeToChatEvents,
} from '@/lib/server/chat-realtime';

function hasDatabaseEnv() {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.POSTGRESQL_HOST &&
        process.env.POSTGRESQL_PORT &&
        process.env.POSTGRESQL_USER &&
        process.env.POSTGRESQL_PASSWORD &&
        process.env.POSTGRESQL_DBNAME)
  );
}

test('chat realtime events cross process boundaries for active subscribers', async (t) => {
  if (!hasDatabaseEnv()) {
    t.skip('Database environment is not configured.');
    return;
  }

  await ensureSubscriberConnected();
  t.after(async () => {
    await shutdownChatRealtime();
  });

  const userId = `chat-realtime-user-${Date.now()}`;
  const received = new Promise<{ chatId?: string; totalUnreadCount?: number }>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timed out waiting for realtime event from another process.'));
    }, 5_000);

    const unsubscribe = subscribeToChatEvents(userId, (event) => {
      if (event.type !== 'chat.unread.updated') {
        return;
      }

      clearTimeout(timeoutId);
      unsubscribe();
      resolve({
        chatId: typeof event.payload.chatId === 'string' ? event.payload.chatId : undefined,
        totalUnreadCount:
          typeof event.payload.totalUnreadCount === 'number' ? event.payload.totalUnreadCount : undefined,
      });
    });

    t.after(() => {
      clearTimeout(timeoutId);
      unsubscribe();
    });
  });

  const childScript = `
    import chatRealtimeModule from './lib/server/chat-realtime.ts';
    const { ensureSubscriberConnected, publishChatEvent } = chatRealtimeModule;

    setTimeout(async () => {
      await ensureSubscriberConnected();
      await Promise.resolve(
        publishChatEvent(${JSON.stringify(userId)}, 'chat.unread.updated', {
          chatId: 'chat-cross-process',
          totalUnreadCount: 3,
        })
      );
    }, 1000);

    setTimeout(() => process.exit(0), 2000);
  `;

  const child = spawn(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '-e', childScript],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  const stderrChunks: Buffer[] = [];
  child.stderr.on('data', (chunk) => {
    stderrChunks.push(Buffer.from(chunk));
  });

  t.after(() => {
    if (!child.killed) {
      child.kill();
    }
  });

  const childClosed = new Promise<number | null>((resolve) => {
    child.on('close', resolve);
  });

  const payload = await received;
  const exitCode = await childClosed;

  assert.equal(exitCode, 0, Buffer.concat(stderrChunks).toString('utf8'));
  assert.equal(payload.chatId, 'chat-cross-process');
  assert.equal(payload.totalUnreadCount, 3);
});
