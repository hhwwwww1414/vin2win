import Link from 'next/link';
import type { ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestListingTeaserLockProps {
  locked: boolean;
  loginHref: string;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

export function GuestListingTeaserLock({
  locked,
  loginHref,
  children,
  className,
  overlayClassName,
  contentClassName,
}: GuestListingTeaserLockProps) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div
      data-guest-listing-teaser-lock="true"
      className={cn('relative isolate block overflow-hidden', className)}
    >
      <div
        aria-hidden="true"
        className={cn(
          'guest-listing-teaser-content pointer-events-none select-none',
          contentClassName,
        )}
      >
        {children}
      </div>

      <div
        className={cn(
          'guest-listing-teaser-overlay absolute inset-0 flex items-center justify-center bg-background/40 p-4 dark:bg-background/55',
          overlayClassName,
        )}
      >
        <div className="max-w-[260px] rounded-[22px] border border-border/70 bg-card/92 px-4 py-4 text-center shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">Откройте всю ленту после входа</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Первые объявления доступны сразу. Для полной выдачи войдите в аккаунт vin2win.
          </p>
          <Link
            href={loginHref}
            prefetch={false}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-teal-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
          >
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
