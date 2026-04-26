'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { FAVORITES_CHANGED_EVENT } from '@/components/marketplace/favorite-toggle';
import { MARKETPLACE_SESSION_REFRESH_EVENT } from '@/components/marketplace/marketplace-runtime-events';
import { type ChatRealtimeEvent, CHAT_WINDOW_EVENT_NAME } from '@/lib/chat/realtime';
import { useChatSound } from '@/hooks/use-chat-sound';

export type SessionUser = {
  id: string;
  name: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
};

type HeaderSessionPayload = {
  authenticated?: boolean;
  user?: SessionUser | null;
  favoriteCount?: number;
  chatUnreadCount?: number;
  chatSoundEnabled?: boolean;
};

type MarketplaceRuntimeValue = {
  sessionUser: SessionUser | null;
  favoriteCount: number;
  chatUnreadCount: number;
  chatSoundEnabled: boolean;
  sessionLoading: boolean;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
};

const CHAT_EVENT_TYPES = [
  'chat.message.created',
  'chat.read.updated',
  'chat.list.updated',
  'chat.unread.updated',
] as const;

export const HEADER_SESSION_CACHE_TTL_MS = 30_000;
export const HEADER_SESSION_REFRESH_INTERVAL_MS = 60_000;
export const CHAT_PRESENCE_NAVIGATION_CLEANUP_DELAY_MS = 10_000;

let headerSessionCache: { payload: HeaderSessionPayload | null; timestamp: number } | null = null;
let headerSessionRequest: Promise<HeaderSessionPayload | null> | null = null;
let sharedChatPresenceClientId: string | null = null;
let chatPresenceCleanupTimer: number | null = null;

const MarketplaceRuntimeContext = createContext<MarketplaceRuntimeValue | null>(null);

function getChatPresenceClientId() {
  sharedChatPresenceClientId ??=
    globalThis.crypto?.randomUUID?.() ?? `chat-client-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return sharedChatPresenceClientId;
}

function isHeaderSessionCacheFresh() {
  return Boolean(headerSessionCache && Date.now() - headerSessionCache.timestamp < HEADER_SESSION_CACHE_TTL_MS);
}

async function fetchHeaderSessionPayload() {
  headerSessionRequest ??= fetch('/api/auth/session', {
    cache: 'no-store',
  })
    .then((response) => response.json().catch(() => null) as Promise<HeaderSessionPayload | null>)
    .finally(() => {
      headerSessionRequest = null;
    });

  return headerSessionRequest;
}

function clearHeaderSessionCache() {
  headerSessionCache = null;
}

function cancelScheduledChatPresenceCleanup() {
  if (!chatPresenceCleanupTimer) {
    return;
  }

  window.clearTimeout(chatPresenceCleanupTimer);
  chatPresenceCleanupTimer = null;
}

function deleteChatPresence(clientId: string) {
  void fetch(`/api/chat-presence?clientId=${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
    keepalive: true,
  }).catch(() => undefined);
}

function scheduleChatPresenceCleanup(clientId: string) {
  cancelScheduledChatPresenceCleanup();
  chatPresenceCleanupTimer = window.setTimeout(() => {
    chatPresenceCleanupTimer = null;
    deleteChatPresence(clientId);
  }, CHAT_PRESENCE_NAVIGATION_CLEANUP_DELAY_MS);
}

export function MarketplaceRuntimeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [clientId] = useState(getChatPresenceClientId);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatSoundEnabled, setChatSoundEnabled] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sessionBootstrappedRef = useRef(false);
  const lastPresenceSignatureRef = useRef<string | null>(null);
  const lastPresenceSentAtRef = useRef(0);
  const presenceRequestInFlightRef = useRef<string | null>(null);
  const sessionUserIdRef = useRef<string | null>(null);
  const playChatSound = useChatSound(chatSoundEnabled);
  const playChatSoundRef = useRef(playChatSound);
  const activeChatId = pathname?.match(/^\/messages\/([^/]+)$/)?.[1] ?? null;
  const presencePathname = activeChatId ? pathname : null;

  useEffect(() => {
    sessionUserIdRef.current = sessionUser?.id ?? null;
  }, [sessionUser?.id]);

  useEffect(() => {
    playChatSoundRef.current = playChatSound;
  }, [playChatSound]);

  const applySessionPayload = useCallback((payload: HeaderSessionPayload | null) => {
    const authenticated = Boolean(payload?.authenticated);
    const nextUser = authenticated ? payload?.user ?? null : null;
    setSessionUser((current) => {
      if (!current && !nextUser) {
        return current;
      }

      if (
        current &&
        nextUser &&
        current.id === nextUser.id &&
        current.name === nextUser.name &&
        current.role === nextUser.role
      ) {
        return current;
      }

      return nextUser;
    });
    setFavoriteCount(authenticated ? payload?.favoriteCount ?? 0 : 0);
    setChatUnreadCount(authenticated ? payload?.chatUnreadCount ?? 0 : 0);
    setChatSoundEnabled(authenticated ? payload?.chatSoundEnabled ?? true : true);
  }, []);

  const loadSession = useCallback(async (options: { silent?: boolean; force?: boolean } = {}) => {
    if (!options.silent) {
      setSessionLoading(true);
    }

    try {
      if (!options.force && isHeaderSessionCacheFresh()) {
        applySessionPayload(headerSessionCache?.payload ?? null);
        return;
      }

      const payload = await fetchHeaderSessionPayload();
      headerSessionCache = {
        payload,
        timestamp: Date.now(),
      };
      applySessionPayload(payload);
    } catch {
      if (isHeaderSessionCacheFresh()) {
        applySessionPayload(headerSessionCache?.payload ?? null);
      } else if (!options.silent) {
        setSessionUser(null);
        setFavoriteCount(0);
        setChatUnreadCount(0);
        setChatSoundEnabled(true);
      }
    } finally {
      sessionBootstrappedRef.current = true;
      if (!options.silent) {
        setSessionLoading(false);
      }
    }
  }, [applySessionPayload]);

  useEffect(() => {
    void loadSession({ silent: sessionBootstrappedRef.current });
  }, [loadSession]);

  useEffect(() => {
    const handleSessionRefresh = () => {
      clearHeaderSessionCache();
      void loadSession({ silent: true, force: true });
    };

    window.addEventListener(MARKETPLACE_SESSION_REFRESH_EVENT, handleSessionRefresh);
    return () => {
      window.removeEventListener(MARKETPLACE_SESSION_REFRESH_EVENT, handleSessionRefresh);
    };
  }, [loadSession]);

  useEffect(() => {
    if (!sessionUser?.id) {
      return;
    }

    const refreshSession = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void loadSession({ silent: true, force: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadSession({ silent: true, force: true });
      }
    };

    const intervalId = window.setInterval(refreshSession, HEADER_SESSION_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', refreshSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadSession, sessionUser?.id]);

  useEffect(() => {
    const handleFavoritesChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean }>).detail;
      if (typeof detail?.active !== 'boolean') {
        return;
      }

      setFavoriteCount((current) => Math.max(0, current + (detail.active ? 1 : -1)));
    };

    window.addEventListener(FAVORITES_CHANGED_EVENT, handleFavoritesChanged as EventListener);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, handleFavoritesChanged as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleChatSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ chatSoundEnabled?: boolean; chatUnreadCount?: number }>).detail;
      if (typeof detail?.chatSoundEnabled === 'boolean') {
        setChatSoundEnabled(detail.chatSoundEnabled);
      }
      if (typeof detail?.chatUnreadCount === 'number') {
        setChatUnreadCount(detail.chatUnreadCount);
      }
    };

    window.addEventListener('vin2win:chat-settings-updated', handleChatSettingsUpdated as EventListener);
    return () => {
      window.removeEventListener('vin2win:chat-settings-updated', handleChatSettingsUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!sessionUser?.id) {
      return;
    }

    const source = new EventSource('/api/realtime/chat-events');
    const handleEvent = (rawEvent: MessageEvent<string>) => {
      try {
        const event = JSON.parse(rawEvent.data) as ChatRealtimeEvent;
        window.dispatchEvent(new CustomEvent(CHAT_WINDOW_EVENT_NAME, { detail: event }));

        const totalUnreadCount = Number(event.payload.totalUnreadCount);
        if (Number.isFinite(totalUnreadCount)) {
          setChatUnreadCount(totalUnreadCount);
        }

        if (
          event.type === 'chat.message.created' &&
          event.payload.senderId !== sessionUserIdRef.current &&
          document.visibilityState === 'visible'
        ) {
          void playChatSoundRef.current();
        }
      } catch {
        // noop
      }
    };

    for (const eventType of CHAT_EVENT_TYPES) {
      source.addEventListener(eventType, handleEvent as EventListener);
    }

    return () => {
      for (const eventType of CHAT_EVENT_TYPES) {
        source.removeEventListener(eventType, handleEvent as EventListener);
      }
      source.close();
    };
  }, [sessionUser?.id]);

  useEffect(() => {
    if (!sessionUser?.id) {
      return;
    }

    cancelScheduledChatPresenceCleanup();
    let closed = false;

    const sendPresence = async (options: { force?: boolean } = {}) => {
      if (closed) {
        return;
      }

      const payload = {
        clientId,
        activeChatId,
        pathname: presencePathname,
        visibilityState: document.visibilityState,
      };
      const signature = JSON.stringify(payload);
      const now = Date.now();

      if (
        !options.force &&
        lastPresenceSignatureRef.current === signature &&
        now - lastPresenceSentAtRef.current < 15_000
      ) {
        return;
      }

      if (presenceRequestInFlightRef.current === signature) {
        return;
      }

      presenceRequestInFlightRef.current = signature;

      await fetch('/api/chat-presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })
        .then(() => {
          lastPresenceSignatureRef.current = signature;
          lastPresenceSentAtRef.current = Date.now();
        })
        .catch(() => undefined)
        .finally(() => {
          if (presenceRequestInFlightRef.current === signature) {
            presenceRequestInFlightRef.current = null;
          }
        });
    };

    void sendPresence({
      force: true,
    });

    const heartbeatId = window.setInterval(() => {
      void sendPresence();
    }, 30_000);

    const handleVisibilityChange = () => {
      void sendPresence({
        force: true,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      closed = true;
      window.clearInterval(heartbeatId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      scheduleChatPresenceCleanup(clientId);
    };
  }, [activeChatId, clientId, presencePathname, sessionUser?.id]);

  useEffect(() => {
    if (!sessionUser?.id) {
      return;
    }

    const handlePageHide = () => {
      cancelScheduledChatPresenceCleanup();
      deleteChatPresence(clientId);
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [clientId, sessionUser?.id]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    clearHeaderSessionCache();
    cancelScheduledChatPresenceCleanup();
    deleteChatPresence(clientId);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  }, [clientId]);

  const value = useMemo<MarketplaceRuntimeValue>(
    () => ({
      sessionUser,
      favoriteCount,
      chatUnreadCount,
      chatSoundEnabled,
      sessionLoading,
      isLoggingOut,
      logout,
    }),
    [chatSoundEnabled, chatUnreadCount, favoriteCount, isLoggingOut, logout, sessionLoading, sessionUser]
  );

  return <MarketplaceRuntimeContext.Provider value={value}>{children}</MarketplaceRuntimeContext.Provider>;
}

export function useMarketplaceRuntime() {
  const value = useContext(MarketplaceRuntimeContext);
  if (!value) {
    throw new Error('useMarketplaceRuntime must be used inside MarketplaceRuntimeProvider.');
  }

  return value;
}
