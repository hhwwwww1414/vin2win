'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, GitCompareArrows, X } from 'lucide-react';
import { useCompare } from '@/hooks/use-compare';
import { formatPrice } from '@/lib/marketplace-data';
import type { SaleListing } from '@/lib/types';
import { getListingTitle } from '@/lib/listing-utils';
import { cn } from '@/lib/utils';

export function CompareTray() {
  const compare = useCompare();
  const [items, setItems] = useState<SaleListing[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (compare.ids.length === 0) {
        setItems([]);
        return;
      }

      try {
        const response = await fetch(`/api/listings/compare?ids=${compare.ids.join(',')}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Compare preload failed with ${response.status}`);
        }

        const payload = (await response.json().catch(() => null)) as { items?: SaleListing[] } | null;
        if (active) {
          setItems(payload?.items ?? []);
        }
      } catch {
        if (active) {
          setItems([]);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [compare.ids]);

  const orderedItems = useMemo(
    () => compare.ids.map((id) => items.find((listing) => listing.id === id) ?? null),
    [compare.ids, items]
  );

  if (compare.ids.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="pointer-events-auto mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-border/70 bg-card/96 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:bg-surface-overlay/96">
        <div
          className="h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
          aria-hidden="true"
        />

        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
                  <GitCompareArrows className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Сравнение автомобилей</p>
                  <p className="text-xs text-muted-foreground">
                    {compare.ids.length} из {compare.limit} слотов занято
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => compare.clear()}
                className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-teal-accent/35 hover:text-foreground dark:bg-background/10"
              >
                Очистить
              </button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Workspace ready
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Добавляйте карточки из ленты, а затем открывайте compare-workspace, чтобы быстро
                свести цену, пробег, окрас и продавца в один экран.
              </p>
              <Link
                href={`/compare?ids=${compare.ids.join(',')}`}
                prefetch={false}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-dark px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
              >
                Открыть сравнение
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: compare.limit }).map((_, index) => {
              const item = orderedItems[index];

              if (!item) {
                return (
                  <div
                    key={`compare-slot-${index}`}
                    className="rounded-2xl border border-dashed border-border/70 bg-background/55 p-3 dark:bg-background/10"
                  >
                    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/15 text-xs font-medium text-muted-foreground">
                      Свободный слот
                    </div>
                    <p className="mt-3 text-sm font-medium text-muted-foreground">Добавьте карточку из ленты</p>
                  </div>
                );
              }

              const title = getListingTitle(item);
              const image = item.images[0];

              return (
                <div key={item.id} className="relative rounded-2xl border border-border/70 bg-background/60 p-3 dark:bg-background/10">
                  <button
                    type="button"
                    onClick={() => compare.remove(item.id)}
                    aria-label="Убрать из сравнения"
                    className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-card/90 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  <div
                    className={cn(
                      'relative overflow-hidden rounded-xl border border-border/70 bg-muted/20',
                      image ? 'aspect-[16/10]' : 'flex h-24 items-center justify-center'
                    )}
                  >
                    {image ? (
                      <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 1280px) 50vw, 18vw" />
                    ) : (
                      <div className="text-xs text-muted-foreground">Без фото</div>
                    )}
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      {formatPrice(item.price)}
                    </span>
                    <span className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-background/10">
                      {item.city}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
