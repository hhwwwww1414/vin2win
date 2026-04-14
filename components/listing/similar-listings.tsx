import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ListingCompactRow } from '@/components/marketplace/listing-compact-row';
import type { SaleListing } from '@/lib/types';

interface SimilarListingsProps {
  listings: SaleListing[];
  isAuthenticated?: boolean;
  loginHref?: string;
}

export function SimilarListings({
  listings,
  isAuthenticated = false,
  loginHref,
}: SimilarListingsProps) {
  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 overflow-hidden rounded-[28px] border border-border/70 bg-card/92 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92">
      <div
        className="h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
        aria-hidden="true"
      />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Related shortlist
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">Похожие варианты</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Если текущая карточка вам подходит по сегменту, здесь можно быстро сверить соседние
              варианты по цене, пробегу и состоянию без возврата в общую ленту.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
              {listings.length} карточек
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
            >
              Смотреть все
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {listings.map((listing) => (
            <ListingCompactRow
              key={listing.id}
              listing={listing}
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
