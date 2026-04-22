'use client';

import { usePathname } from 'next/navigation';
import { CompareTray } from '@/components/marketplace/compare-tray';
import { cn } from '@/lib/utils';

export function isSaleListingDetailPath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return /^\/listing\/[^/]+$/.test(pathname) && pathname !== '/listing/new';
}

export function isMessagesPath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return pathname === '/messages' || pathname.startsWith('/messages/');
}

export function getSiteFooterClassName(pathname: string | null) {
  return cn(
    'relative z-10 mt-auto border-t border-border pt-8',
    isSaleListingDetailPath(pathname) && 'hidden lg:block',
    isMessagesPath(pathname) && 'hidden',
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSaleListingDetail = isSaleListingDetailPath(pathname);
  const isMessagesPage = isMessagesPath(pathname);
  const showMarketplaceBackground = !isSaleListingDetail;

  return (
    <div
      className={cn('relative flex min-h-dvh flex-col bg-background', isMessagesPage && 'h-dvh overflow-hidden')}
      data-sale-listing-detail={isSaleListingDetail ? 'true' : undefined}
    >
      <a
        href="#page-main"
        className="sr-only absolute left-4 top-4 z-50 rounded-md bg-card px-3 py-2 text-sm font-medium text-foreground shadow focus:not-sr-only"
      >
        Перейти к содержимому
      </a>
      {showMarketplaceBackground ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 top-14 z-0 overflow-hidden opacity-0 dark:opacity-100"
        >
          <div
            className="absolute inset-0 carbon-fiber-center"
            style={{ transform: 'translate3d(0px, 0px, 0px)', opacity: 0.12 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(72% 44% at 50% 0%, rgba(129,216,208,0.035) 0%, transparent 58%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.06))' }}
          />
        </div>
      ) : null}

      <div className={cn('relative z-10 flex flex-1 flex-col', isMessagesPage && 'min-h-0 overflow-hidden')}>{children}</div>
      <CompareTray />

      <footer
        data-site-footer
        className={getSiteFooterClassName(pathname)}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 pb-8 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-dark dark:bg-teal-accent">
              <span className="text-xs font-bold text-white dark:text-[#070809]">V2</span>
            </div>
            <span className="text-sm font-semibold text-foreground">vin2win</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025–2026 vin2win. Профессиональный авторынок.</p>
        </div>
      </footer>
    </div>
  );
}
