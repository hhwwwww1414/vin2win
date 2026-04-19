'use client';

import { useEffect } from 'react';
import { type ChatRealtimeEvent, CHAT_WINDOW_EVENT_NAME } from '@/lib/chat/realtime';

export function useChatEvents(onEvent: (event: ChatRealtimeEvent) => void) {
  useEffect(() => {
    const handleEvent = (rawEvent: Event) => {
      const detail = (rawEvent as CustomEvent<ChatRealtimeEvent>).detail;
      if (!detail) {
        return;
      }

      onEvent(detail);
    };

    window.addEventListener(CHAT_WINDOW_EVENT_NAME, handleEvent as EventListener);
    return () => {
      window.removeEventListener(CHAT_WINDOW_EVENT_NAME, handleEvent as EventListener);
    };
  }, [onEvent]);
}
