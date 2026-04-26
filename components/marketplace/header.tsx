'use client';

import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutGrid,
  List,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Shield,
  Sun,
  Table,
  UserCircle2,
  X,
} from 'lucide-react';
import {
  HeaderFavoritesHeartIcon,
  getHeaderFavoritesHeartState,
} from '@/components/marketplace/header-favorites-heart';
import { Button } from '@/components/ui/button';
import { FAVORITES_CHANGED_EVENT } from '@/components/marketplace/favorite-toggle';
import { type ChatRealtimeEvent, CHAT_WINDOW_EVENT_NAME } from '@/lib/chat/realtime';
import { SALE_ROUTE } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { useChatSound } from '@/hooks/use-chat-sound';

type ViewMode = 'cards' | 'compact' | 'table';
type SessionUser = {
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

const emptyThemeSubscription = () => () => {};
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

function StableThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptyThemeSubscription, () => true, () => false);
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => {
        if (!mounted) {
          return;
        }

        setTheme(isDark ? 'light' : 'dark');
      }}
      disabled={!mounted}
      className={cn(
        'flex items-center justify-center rounded-xl border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground dark:bg-background/10',
        compact ? 'h-11 w-11' : 'h-9 w-9',
        !mounted && 'pointer-events-none opacity-0',
      )}
      aria-label={mounted ? (isDark ? 'Включить светлую тему' : 'Включить тёмную тему') : 'Переключить тему'}
    >
      {mounted ? (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <span className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

function ViewModeSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') ?? 'cards';

  if (pathname !== SALE_ROUTE) {
    return null;
  }

  const buildHref = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'cards') {
      params.delete('view');
    } else {
      params.set('view', mode);
    }

    const qs = params.toString();
    return qs ? `${SALE_ROUTE}?${qs}` : SALE_ROUTE;
  };

  return (
    <div className={cn('flex items-center rounded-xl border border-border/70 bg-background/45 p-0.5 dark:bg-background/10', compact && 'border-border/60')}>
      {(['cards', 'compact', 'table'] as ViewMode[]).map((mode) => (
        <Link
          key={mode}
          href={buildHref(mode)}
          className={cn(
            'rounded-lg transition-colors',
            compact ? 'p-2.5' : 'p-2',
            view === mode ? 'bg-[var(--accent-bg-soft)] text-teal-accent' : 'text-muted-foreground hover:bg-muted/35 hover:text-foreground',
          )}
          aria-label={mode === 'cards' ? 'Карточки' : mode === 'compact' ? 'Компактный список' : 'Таблица'}
        >
          {mode === 'cards' ? <LayoutGrid className="h-4 w-4" /> : null}
          {mode === 'compact' ? <List className="h-4 w-4" /> : null}
          {mode === 'table' ? <Table className="h-4 w-4" /> : null}
        </Link>
      ))}
    </div>
  );
}

const NAV_LINKS = [
  {
    href: SALE_ROUTE,
    label: 'В продаже',
    match: (pathname: string) =>
      pathname === SALE_ROUTE || (/^\/listing\/[^/]+$/.test(pathname) && pathname !== '/listing/new'),
  },
  { href: '/wanted', label: 'В подбор', match: (pathname: string) => pathname === '/wanted' || pathname.startsWith('/wanted/') },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              'flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive ? 'bg-background/80 text-foreground dark:bg-white/10' : 'text-muted-foreground hover:bg-muted/35 hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function MessageLink({ unreadCount, mobile = false, onNavigate }: { unreadCount: number; mobile?: boolean; onNavigate?: () => void }) {
  if (mobile) {
    return (
      <Link href="/messages" onClick={onNavigate} className="flex items-center rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/40">
        <MessageCircle className="mr-2 h-4 w-4 text-teal-accent" />
        Сообщения
        {unreadCount > 0 ? (
          <span className="ml-auto rounded-full border border-teal-accent/30 bg-[var(--accent-bg-soft)] px-2 py-0.5 text-xs text-teal-accent">
            {unreadCount}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
      <Link href="/messages">
        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
        Сообщения
        {unreadCount > 0 ? (
          <span className="ml-1 rounded-full border border-teal-accent/30 bg-[var(--accent-bg-soft)] px-1.5 py-0.5 text-[10px] leading-none text-teal-accent">
            {unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

function AuthControls({
  sessionUser,
  favoriteCount,
  chatUnreadCount,
  loading,
  isLoggingOut,
  onLogout,
  onNavigate,
  mobile = false,
}: {
  sessionUser: SessionUser | null;
  favoriteCount: number;
  chatUnreadCount: number;
  loading: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
  const favoritesHeartState = getHeaderFavoritesHeartState(favoriteCount);

  if (loading) {
    return <div className={cn('rounded-lg bg-muted/60', mobile ? 'h-9 w-full' : 'h-9 w-28 animate-pulse')} />;
  }

  if (!sessionUser) {
    if (mobile) {
      return (
        <div className="grid gap-2 border-t border-border/50 pt-3">
          <Button asChild variant="outline" className="justify-start" onClick={onNavigate}>
            <Link href={`/login${nextPath}`}>
              <LogIn className="mr-2 h-4 w-4" />
              Войти
            </Link>
          </Button>
          <Button asChild className="justify-start bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam" onClick={onNavigate}>
            <Link href={`/register${nextPath}`}>
              <UserCircle2 className="mr-2 h-4 w-4" />
              Регистрация
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
          <Link href={`/login${nextPath}`}>
            <LogIn className="mr-1.5 h-3.5 w-3.5" />
            Войти
          </Link>
        </Button>
        <Button asChild size="sm" className="h-9 bg-teal-dark px-3 text-xs font-semibold text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam">
          <Link href={`/register${nextPath}`}>Регистрация</Link>
        </Button>
      </div>
    );
  }

  if (mobile) {
    return (
      <div className="grid gap-2 border-t border-border/50 pt-3">
        <Link href="/account#favorites" onClick={onNavigate} className="flex items-center rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/40">
          <HeaderFavoritesHeartIcon state={favoritesHeartState} className="mr-2 h-4 w-4" />
          Избранное
          <span className="ml-auto rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
            {favoriteCount}
          </span>
        </Link>
        <MessageLink unreadCount={chatUnreadCount} mobile onNavigate={onNavigate} />
        <Link href="/account" onClick={onNavigate} className="flex items-center rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/40">
          <UserCircle2 className="mr-2 h-4 w-4 text-teal-accent" />
          Кабинет
        </Link>
        {sessionUser.role !== 'USER' ? (
          <Link href="/admin" onClick={onNavigate} className="flex items-center rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/40">
            <Shield className="mr-2 h-4 w-4 text-teal-accent" />
            Панель
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex items-center rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut className="mr-2 h-4 w-4 text-teal-accent" />
          {isLoggingOut ? 'Выходим...' : 'Выйти'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
        <Link href="/account#favorites">
          <HeaderFavoritesHeartIcon state={favoritesHeartState} className="mr-1.5 h-3.5 w-3.5" />
          Избранное
          <span className="ml-1 rounded-full border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
            {favoriteCount}
          </span>
        </Link>
      </Button>
      <MessageLink unreadCount={chatUnreadCount} />
      {sessionUser.role !== 'USER' ? (
        <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
          <Link href="/admin">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Панель
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground">
        <Link href="/account">
          <UserCircle2 className="mr-1.5 h-3.5 w-3.5" />
          {sessionUser.name.split(' ')[0] || 'Кабинет'}
        </Link>
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={onLogout} disabled={isLoggingOut}>
        <LogOut className="mr-1.5 h-3.5 w-3.5" />
        {isLoggingOut ? 'Выходим...' : 'Выйти'}
      </Button>
    </div>
  );
}

export function MarketplaceHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const playChatSound = useChatSound(chatSoundEnabled);
  const activeChatId = pathname?.match(/^\/messages\/([^/]+)$/)?.[1] ?? null;
  const presencePathname = activeChatId ? pathname : null;

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
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    void loadSession({ silent: sessionBootstrappedRef.current });
  }, [loadSession]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
          event.payload.senderId !== sessionUser.id &&
          document.visibilityState === 'visible'
        ) {
          void playChatSound();
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
  }, [playChatSound, sessionUser?.id]);

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

  const submitHref = sessionUser ? '/listing/new' : '/login?next=%2Flisting%2Fnew';

  const handleLogout = async () => {
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
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 border-b transition-all duration-300',
          scrolled
            ? 'border-border/80 bg-[var(--surface-soft-strong)] backdrop-blur-md dark:bg-[var(--surface-soft-strong)]'
            : 'border-transparent bg-background/72 dark:bg-surface-2/82',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-dark dark:bg-teal-accent">
                <span className="text-xs font-bold text-white dark:text-[#09090B]">V2</span>
              </div>
              <span className="hidden text-sm font-semibold text-foreground sm:block">vin2win</span>
            </Link>

            <nav className="hidden items-center gap-0.5 overflow-x-auto scrollbar-hide sm:flex" aria-label="Навигация">
              <Suspense fallback={<div className="flex gap-0.5">{[1, 2].map((item) => <div key={item} className="h-9 w-20 animate-pulse rounded-md bg-muted" />)}</div>}>
                <NavLinks />
              </Suspense>
            </nav>

            <div className="hidden shrink-0 items-center gap-1 sm:flex">
              <Suspense fallback={null}>
                <ViewModeSwitcher />
              </Suspense>
              <StableThemeToggle />
              <AuthControls
                sessionUser={sessionUser}
                favoriteCount={favoriteCount}
                chatUnreadCount={chatUnreadCount}
                loading={sessionLoading}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
              />
              <Button size="sm" className="h-9 bg-teal-dark px-3 text-xs font-semibold text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam" asChild>
                <Link href={submitHref}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Подать
                </Link>
              </Button>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              {sessionUser ? (
                <Link
                  href="/messages"
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground dark:bg-background/10"
                >
                  <MessageCircle className="h-4 w-4" />
                  {chatUnreadCount > 0 ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full border border-teal-accent/30 bg-[var(--accent-bg-soft)] px-1.5 py-0.5 text-[10px] leading-none text-teal-accent">
                      {chatUnreadCount}
                    </span>
                  ) : null}
                </Link>
              ) : null}
              <StableThemeToggle compact />
              <Button size="sm" className="h-9 bg-teal-dark px-3 text-xs font-semibold text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam" asChild>
                <Link href={submitHref} onClick={() => setMobileOpen(false)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Подать
                </Link>
              </Button>
              <button
                type="button"
                aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground dark:bg-background/10"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-20 sm:hidden" aria-modal="true" role="dialog" aria-label="Мобильное меню">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <nav className="absolute left-0 right-0 top-14 border-b border-border bg-[var(--surface-soft-strong)] shadow-[var(--shadow-floating)] backdrop-blur-md dark:bg-[var(--surface-soft-strong)]" aria-label="Мобильная навигация">
            <div className="flex flex-col gap-1 px-4 py-3">
              <Suspense fallback={null}>
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </Suspense>
              <div className="mt-1 flex items-center justify-between border-t border-border/50 pt-2">
                <span className="text-xs text-muted-foreground">Режим отображения</span>
                <Suspense fallback={null}>
                  <ViewModeSwitcher compact />
                </Suspense>
              </div>
              <AuthControls
                mobile
                sessionUser={sessionUser}
                favoriteCount={favoriteCount}
                chatUnreadCount={chatUnreadCount}
                loading={sessionLoading}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
