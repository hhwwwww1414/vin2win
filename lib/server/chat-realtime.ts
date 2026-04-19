import { randomUUID } from 'node:crypto';
import { Client, Pool, type Notification as PgNotification } from 'pg';
import { type ChatRealtimeEvent, type ChatRealtimeEventType } from '@/lib/chat/realtime';

type ChatRealtimeListener = (event: ChatRealtimeEvent) => void;

type ChatRealtimeState = {
  listenersByUserId: Map<string, Set<ChatRealtimeListener>>;
  publishPool?: Pool;
  subscriber?: Client;
  subscriberConnectPromise?: Promise<void>;
  reconnectTimer?: ReturnType<typeof setTimeout>;
};

const CHAT_EVENTS_CHANNEL = 'vin2win_chat_events';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRESQL_HOST;
  const port = process.env.POSTGRESQL_PORT;
  const user = process.env.POSTGRESQL_USER;
  const password = process.env.POSTGRESQL_PASSWORD;
  const dbName = process.env.POSTGRESQL_DBNAME;

  if (!host || !port || !user || !password || !dbName) {
    throw new Error('Database connection settings are not configured for chat realtime.');
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(dbName)}?schema=public`;
}

function getChatRealtimeState(): ChatRealtimeState {
  const globalKey = '__vin2winChatRealtimeState';
  const globalScope = globalThis as typeof globalThis & {
    [globalKey]?: ChatRealtimeState;
  };

  if (!globalScope[globalKey]) {
    globalScope[globalKey] = {
      listenersByUserId: new Map(),
    };
  }

  return globalScope[globalKey];
}

function getPublishPool() {
  const state = getChatRealtimeState();
  if (!state.publishPool) {
    state.publishPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 4,
      idleTimeoutMillis: 30_000,
      allowExitOnIdle: true,
    });
  }

  return state.publishPool;
}

function buildEvent(
  userId: string,
  type: ChatRealtimeEventType,
  payload: Record<string, unknown>,
): ChatRealtimeEvent {
  return {
    id: randomUUID(),
    userId,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
}

function dispatchEvent(event: ChatRealtimeEvent) {
  const listeners = getChatRealtimeState().listenersByUserId.get(event.userId);
  if (!listeners?.size) {
    return;
  }

  for (const listener of listeners) {
    listener(event);
  }
}

function scheduleReconnect() {
  const state = getChatRealtimeState();
  if (state.reconnectTimer || state.listenersByUserId.size === 0) {
    return;
  }

  state.reconnectTimer = setTimeout(() => {
    state.reconnectTimer = undefined;
    void ensureSubscriberConnected();
  }, 1_000);
}

async function disconnectSubscriberIfIdle() {
  const state = getChatRealtimeState();
  if (state.listenersByUserId.size > 0 || !state.subscriber) {
    return;
  }

  const subscriber = state.subscriber;
  state.subscriber = undefined;
  state.subscriberConnectPromise = undefined;
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = undefined;
  }

  try {
    await subscriber.end();
  } catch (error) {
    console.warn('[chat-realtime] failed to close idle subscriber', error);
  }
}

async function createSubscriber() {
  const state = getChatRealtimeState();
  const subscriber = new Client({
    connectionString: getDatabaseUrl(),
    application_name: 'vin2win-chat-realtime',
  });

  subscriber.on('notification', (message: PgNotification) => {
    if (message.channel !== CHAT_EVENTS_CHANNEL || !message.payload) {
      return;
    }

    try {
      const event = JSON.parse(message.payload) as ChatRealtimeEvent;
      if (
        !event ||
        typeof event.userId !== 'string' ||
        typeof event.type !== 'string' ||
        typeof event.createdAt !== 'string'
      ) {
        return;
      }

      dispatchEvent(event);
    } catch (error) {
      console.error('[chat-realtime] failed to parse notification payload', error);
    }
  });

  const handleSubscriberFailure = (error: unknown) => {
    console.error('[chat-realtime] subscriber connection failed', error);
    if (state.subscriber === subscriber) {
      state.subscriber = undefined;
      state.subscriberConnectPromise = undefined;
    }
    scheduleReconnect();
  };

  subscriber.on('error', handleSubscriberFailure);
  subscriber.on('end', () => {
    if (state.subscriber === subscriber) {
      state.subscriber = undefined;
      state.subscriberConnectPromise = undefined;
    }
    scheduleReconnect();
  });

  await subscriber.connect();
  await subscriber.query(`LISTEN ${CHAT_EVENTS_CHANNEL}`);
  state.subscriber = subscriber;
}

export async function ensureSubscriberConnected() {
  const state = getChatRealtimeState();
  if (state.subscriber) {
    return;
  }

  if (state.subscriberConnectPromise) {
    return state.subscriberConnectPromise;
  }

  state.subscriberConnectPromise = createSubscriber()
    .catch((error) => {
      console.error('[chat-realtime] failed to connect subscriber', error);
      scheduleReconnect();
    })
    .finally(() => {
      state.subscriberConnectPromise = undefined;
    });

  return state.subscriberConnectPromise;
}

export function subscribeToChatEvents(userId: string, listener: ChatRealtimeListener) {
  const state = getChatRealtimeState();
  const currentSet = state.listenersByUserId.get(userId) ?? new Set<ChatRealtimeListener>();
  currentSet.add(listener);
  state.listenersByUserId.set(userId, currentSet);
  void ensureSubscriberConnected();

  return () => {
    const listeners = state.listenersByUserId.get(userId);
    if (!listeners) {
      return;
    }

    listeners.delete(listener);
    if (listeners.size === 0) {
      state.listenersByUserId.delete(userId);
    }

    void disconnectSubscriberIfIdle();
  };
}

export async function publishChatEvent(
  userId: string,
  type: ChatRealtimeEventType,
  payload: Record<string, unknown>,
) {
  const event = buildEvent(userId, type, payload);
  await getPublishPool().query('SELECT pg_notify($1, $2)', [
    CHAT_EVENTS_CHANNEL,
    JSON.stringify(event),
  ]);
}

export async function shutdownChatRealtime() {
  const state = getChatRealtimeState();
  state.listenersByUserId.clear();

  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = undefined;
  }

  const subscriber = state.subscriber;
  state.subscriber = undefined;
  state.subscriberConnectPromise = undefined;
  if (subscriber) {
    await subscriber.end().catch(() => undefined);
  }

  const publishPool = state.publishPool;
  state.publishPool = undefined;
  if (publishPool) {
    await publishPool.end().catch(() => undefined);
  }
}
