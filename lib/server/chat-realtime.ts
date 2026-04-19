import { randomUUID } from 'node:crypto';
import { type ChatRealtimeEvent, type ChatRealtimeEventType } from '@/lib/chat/realtime';

type ChatRealtimeListener = (event: ChatRealtimeEvent) => void;

type ChatRealtimeState = {
  listenersByUserId: Map<string, Set<ChatRealtimeListener>>;
};

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

function buildEvent(userId: string, type: ChatRealtimeEventType, payload: Record<string, unknown>): ChatRealtimeEvent {
  return {
    id: randomUUID(),
    userId,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
}

export function subscribeToChatEvents(userId: string, listener: ChatRealtimeListener) {
  const state = getChatRealtimeState();
  const currentSet = state.listenersByUserId.get(userId) ?? new Set<ChatRealtimeListener>();
  currentSet.add(listener);
  state.listenersByUserId.set(userId, currentSet);

  return () => {
    const listeners = state.listenersByUserId.get(userId);
    if (!listeners) {
      return;
    }

    listeners.delete(listener);
    if (listeners.size === 0) {
      state.listenersByUserId.delete(userId);
    }
  };
}

export function publishChatEvent(userId: string, type: ChatRealtimeEventType, payload: Record<string, unknown>) {
  const listeners = getChatRealtimeState().listenersByUserId.get(userId);
  if (!listeners?.size) {
    return;
  }

  const event = buildEvent(userId, type, payload);
  for (const listener of listeners) {
    listener(event);
  }
}
