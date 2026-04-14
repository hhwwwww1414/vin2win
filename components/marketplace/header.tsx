'use client';

import { useEffect, useState, Suspense, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Plus, LayoutGrid, List, Table, Menu, X, LogIn, LogOut, Shield, UserCircle2, Heart, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FAVORITES_CHANGED_EVENT } from '@/components/marketplace/favorite-toggle';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'compact' | 'table';
type SessionUser = {
  id: string;
  name: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
};

const emptyThemeSubscription = () => () => {};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center justify-center rounded-xl border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground dark:bg-background/10',
        compact ? 'h-11 w-11' : 'h-9 w-9'
      )}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
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
        !mounted && 'pointer-events-none opacity-0'
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

  if (pathname !== '/') {
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
    return qs ? `/?${qs}` : '/';
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
            view === mode ? 'bg-[var(--accent-bg-soft)] text-teal-accent' : 'text-muted-foreground hover:bg-muted/35 hover:text-foreground'
          )}
          aria-label={mode === 'cards' ? 'Карточки' : mode === 'compact' ? 'Компактный список' : 'Таблица'}
        >
          {mode === 'cards' && <LayoutGrid className="h-4 w-4" />}
          {mode === 'compact' && <List className="h-4 w-4" />}
          {mode === 'table' && <Table className="h-4 w-4" />}
        </Link>
      ))}
    </div>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'В продаже', match: (pathname: string) => pathname === '/' },
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
              isActive ? 'bg-background/80 text-foreground dark:bg-white/10' : 'text-muted-foreground hover:bg-muted/35 hover:text-foreground'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function AuthControls({
  sessionUser,
  favoriteCount,
  loading,
  isLoggingOut,
  onLogout,
  onNavigate,
  mobile = false,
}: {
  sessionUser: SessionUser | null;
  favoriteCount: number;
  loading: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : '';

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
            <Heart className="mr-2 h-4 w-4 text-teal-accent" />
            Избранное
            <span className="ml-auto rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
              {favoriteCount}
            </span>
          </Link>
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
          <Heart className="mr-1.5 h-3.5 w-3.5" />
          Избранное
          <span className="ml-1 rounded-full border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
            {favoriteCount}
          </span>
        </Link>
      </Button>
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
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    let active = true;

    async function loadSession() {
      setSessionLoading(true);
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              authenticated?: boolean;
              user?: SessionUser | null;
              favoriteCount?: number;
            }
          | null;

        if (!active) {
          return;
        }

        setSessionUser(payload?.authenticated ? payload.user ?? null : null);
        setFavoriteCount(payload?.authenticated ? payload.favoriteCount ?? 0 : 0);
      } catch {
        if (active) {
          setSessionUser(null);
          setFavoriteCount(0);
        }
      } finally {
        if (active) {
          setSessionLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [pathname]);

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

  const submitHref = sessionUser ? '/listing/new' : '/login?next=%2Flisting%2Fnew';

  const handleLogout = async () => {
    setIsLoggingOut(true);
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
          scrolled ? 'border-border/80 bg-[var(--surface-soft-strong)] backdrop-blur-md dark:bg-[var(--surface-soft-strong)]' : 'border-transparent bg-background/72 dark:bg-surface-2/82'
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
              <AuthControls sessionUser={sessionUser} favoriteCount={favoriteCount} loading={sessionLoading} isLoggingOut={isLoggingOut} onLogout={handleLogout} />
              <Button size="sm" className="h-9 bg-teal-dark px-3 text-xs font-semibold text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam" asChild>
                <Link href={submitHref}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Подать
                </Link>
              </Button>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:hidden">
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
