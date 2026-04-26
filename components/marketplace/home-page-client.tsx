'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownUp } from 'lucide-react';
import { AdvancedFilters } from '@/components/marketplace/advanced-filters';
import { GuestListingTeaserLock } from '@/components/marketplace/guest-listing-teaser-lock';
import { ListingCardView } from '@/components/marketplace/listing-card-view';
import { ListingCompactRow } from '@/components/marketplace/listing-compact-row';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { ListingsTable } from '@/components/marketplace/listings-table';
import { QuickFilters } from '@/components/marketplace/quick-filters';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SALE_SEARCH_SORT_OPTIONS, buildSaleSearchParams, getSaleSearchCurrentStepLabel, getSaleSearchRequestParams, parseSaleSearchParams } from '@/lib/sale-search';
import { isGuestListingTeaserLocked } from '@/lib/marketplace-teaser';
import type { SaleSearchFacets, SaleSearchFilters, SaleSearchResult } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { SALE_ROUTE } from '@/lib/routes';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'compact' | 'table';
const PENDING_SAVED_SEARCH_KEY = 'vin2win:pending-saved-search';

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold">0</div>
      <h3 className="mb-1 text-base font-semibold text-foreground">Подходящих объявлений пока нет</h3>
      <p className="mb-5 max-w-md text-sm text-muted-foreground">
        По текущим параметрам не найдено опубликованных карточек. Ослабьте один или несколько фильтров и повторите поиск.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
      >
        Сбросить фильтры
      </button>
    </div>
  );
}

function getViewMode(searchParams: URLSearchParams): ViewMode {
  const view = searchParams.get('view');
  return view === 'compact' || view === 'table' ? view : 'cards';
}

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [] as Array<number | 'ellipsis'>;
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const normalized = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((left, right) => left - right);
  const items: Array<number | 'ellipsis'> = [];

  normalized.forEach((page, index) => {
    const previous = normalized[index - 1];
    if (previous && page - previous > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  });

  return items;
}

function buildSaleHref(queryString?: string) {
  return queryString ? `${SALE_ROUTE}?${queryString}` : SALE_ROUTE;
}

function HomeContent({
  initialResult,
  initialQueryString,
  facets,
  isAuthenticated,
}: {
  initialResult: SaleSearchResult;
  initialQueryString: string;
  facets: SaleSearchFacets;
  isAuthenticated: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState(initialResult);
  const [activeQueryString, setActiveQueryString] = useState(initialQueryString);
  const [loading, setLoading] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSavingSearch, setIsSavingSearch] = useState(false);

  const filters = useMemo(() => parseSaleSearchParams(searchParams), [searchParams]);
  const requestParams = useMemo(() => getSaleSearchRequestParams(searchParams), [searchParams]);
  const requestQueryString = requestParams.toString();
  const viewMode = getViewMode(searchParams);
  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(buildSaleHref(searchParams.toString()))}`, [searchParams]);
  const navigationFilters = useMemo(
    () => parseSaleSearchParams(searchParams, { applyQuickFilterAliases: false, dedupeQuickFilterAliases: true }),
    [searchParams]
  );

  useEffect(() => {
    let active = true;

    if (requestQueryString === activeQueryString) {
      return;
    }

    setLoading(true);

    async function load() {
      try {
        const response = await fetch(`/api/listings/search?${requestQueryString}`, {
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as SaleSearchResult & { error?: string };

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Не удалось загрузить объявления.');
        }

        if (!active) {
          return;
        }

        setResult(payload);
        setActiveQueryString(requestQueryString);
      } catch (error) {
        if (active) {
          toast({
            title: 'Поиск временно недоступен',
            description: error instanceof Error ? error.message : 'Попробуйте обновить страницу.',
            variant: 'destructive',
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [activeQueryString, requestQueryString]);

  const updateSearch = useCallback(
    (nextFilters: Partial<typeof filters>, nextView?: ViewMode) => {
      const params = buildSaleSearchParams({ ...navigationFilters, ...nextFilters });
      const view = nextView ?? viewMode;
      if (view !== 'cards') {
        params.set('view', view);
      }

      const query = params.toString();
      router.replace(buildSaleHref(query), { scroll: false });
    },
    [navigationFilters, router, viewMode]
  );

  const resetFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (viewMode !== 'cards') {
      params.set('view', viewMode);
    }
    const query = params.toString();
    router.replace(buildSaleHref(query), { scroll: false });
  }, [router, viewMode]);

  const handleSaveSearch = useCallback(async (nextFilters: typeof filters, name?: string) => {
    if (!isAuthenticated) {
      window.sessionStorage.setItem(
        PENDING_SAVED_SEARCH_KEY,
        JSON.stringify({
          filters: nextFilters,
          name,
          href: buildSaleHref(searchParams.toString()),
        })
      );
      window.location.href = loginHref;
      return;
    }

    setIsSavingSearch(true);
    try {
      const response = await fetch('/api/account/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          filters: nextFilters,
          notifyEnabled: true,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string };

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось сохранить поиск.');
      }

      toast({
        title: 'Поиск сохранён',
        description: 'Он появился в вашем кабинете и готов к уведомлениям по новым совпадениям.',
      });
    } catch (error) {
      toast({
        title: 'Не удалось сохранить поиск',
        description: error instanceof Error ? error.message : 'Попробуйте ещё раз.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSearch(false);
    }
  }, [isAuthenticated, loginHref, searchParams]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const rawIntent = window.sessionStorage.getItem(PENDING_SAVED_SEARCH_KEY);
    if (!rawIntent) {
      return;
    }

    try {
      const intent = JSON.parse(rawIntent) as { filters?: SaleSearchFilters; name?: string };
      window.sessionStorage.removeItem(PENDING_SAVED_SEARCH_KEY);

      if (!intent.filters) {
        return;
      }

      void handleSaveSearch(intent.filters, intent.name);
    } catch {
      window.sessionStorage.removeItem(PENDING_SAVED_SEARCH_KEY);
    }
  }, [handleSaveSearch, isAuthenticated]);

  const pageItems = buildPageItems(result.page, result.totalPages);
  const sortLabel = getSaleSearchCurrentStepLabel(filters.sort);
  return (
    <main id="page-main" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-5">
        <QuickFilters
          active={filters.filters}
          advancedFilterCount={
            (filters.make.length > 0 ? 1 : 0) +
            (filters.model.length > 0 ? 1 : 0) +
            (filters.region ? 1 : 0) +
            (filters.city.length > 0 ? 1 : 0) +
            (filters.yearFrom ? 1 : 0) +
            (filters.yearTo ? 1 : 0) +
            (filters.priceMin ? 1 : 0) +
            (filters.priceMax ? 1 : 0) +
            (filters.mileageMin || filters.mileageMax ? 1 : 0) +
            (filters.engineDisplacementMin || filters.engineDisplacementMax ? 1 : 0) +
            (filters.powerMin || filters.powerMax ? 1 : 0) +
            filters.bodyType.length +
            filters.transmission.length +
            filters.drive.length +
            filters.color.length +
            (filters.ptsOriginal ? 1 : 0) +
            (filters.avtotekaStatus === 'green' ? 1 : 0) +
            (filters.noAccident ? 1 : 0) +
            (filters.noTaxi ? 1 : 0) +
            (filters.noCarsharing ? 1 : 0) +
            (filters.hasPhoto ? 1 : 0) +
            (filters.priceInHand ? 1 : 0) +
            (filters.hasBenefit ? 1 : 0) +
            (filters.benefitMin || filters.benefitMax ? 1 : 0) +
            (filters.noInvestment ? 1 : 0)
          }
          onChange={(ids) => updateSearch({ filters: ids, page: 1 })}
          onOpenAdvanced={() => setShowAdvancedFilters(true)}
        />
      </section>

      <AdvancedFilters
        open={showAdvancedFilters}
        onOpenChange={setShowAdvancedFilters}
        filters={filters}
        facets={facets}
        canSaveSearch={isAuthenticated}
        isSavingSearch={isSavingSearch}
        onApply={(nextFilters) => updateSearch({ ...nextFilters, page: 1 })}
        onReset={resetFilters}
        onSaveSearch={handleSaveSearch}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Объявления в продаже
            <span className="ml-2 font-normal tabular-nums text-muted-foreground">({result.total})</span>
          </h2>
        </div>

        <div className="relative self-start">
          <button
            type="button"
            onClick={() => setShowSort((value) => !value)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              showSort
                ? 'border-[var(--accent-border-soft)] bg-[var(--accent-bg-soft)] text-teal-accent'
                : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground dark:bg-surface-elevated'
            )}
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
            {sortLabel}
          </button>

          {showSort ? (
            <div className="absolute left-0 top-full z-20 mt-1.5 w-[min(13rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:left-auto sm:right-0 sm:w-52 dark:bg-surface-elevated">
              {SALE_SEARCH_SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    updateSearch({ sort: option.value, page: 1 });
                    setShowSort(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2.5 text-left text-sm transition-colors',
                    option.value === filters.sort
                      ? 'bg-[var(--accent-bg-soft)] font-medium text-teal-accent'
                      : 'text-foreground hover:bg-muted/40'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mb-4 rounded-[var(--radius-card)] border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
          Обновляем выдачу по вашим параметрам...
        </div>
      ) : null}

      {result.items.length === 0 ? (
        <EmptyState onReset={resetFilters} />
      ) : viewMode === 'table' ? (
        <ListingsTable
          listings={result.items}
          sortKey={filters.sort}
          onSortChange={(sort) => updateSearch({ sort, page: 1 })}
          priorityIndices={new Set([0])}
          isAuthenticated={isAuthenticated}
          loginHref={loginHref}
          listingOffset={(result.page - 1) * result.limit}
          className="w-full"
        />
      ) : (
        <section className="space-y-2.5">
          {result.items.map((listing, index) => {
            const teaserLocked = isGuestListingTeaserLocked({
              isAuthenticated,
              page: result.page,
              limit: result.limit,
              index,
            });

            return viewMode === 'cards' ? (
              <GuestListingTeaserLock
                key={listing.id}
                locked={teaserLocked}
                loginHref={loginHref}
                className="rounded-[24px]"
              >
                <ListingCardView
                  listing={listing}
                  priority={index === 0}
                  isAuthenticated={isAuthenticated}
                  loginHref={loginHref}
                  className="w-full"
                />
              </GuestListingTeaserLock>
            ) : (
              <GuestListingTeaserLock
                key={listing.id}
                locked={teaserLocked}
                loginHref={loginHref}
                className="rounded-xl"
              >
                <ListingCompactRow
                  listing={listing}
                  priority={index === 0}
                  isAuthenticated={isAuthenticated}
                  loginHref={loginHref}
                  className="w-full"
                />
              </GuestListingTeaserLock>
            );
          })}
        </section>
      )}

      {result.totalPages > 1 ? (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (result.page > 1) {
                    updateSearch({ page: result.page - 1 });
                  }
                }}
                className={cn(result.page === 1 && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>
            {pageItems.map((item, index) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === result.page}
                    onClick={(event) => {
                      event.preventDefault();
                      updateSearch({ page: item });
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (result.page < result.totalPages) {
                    updateSearch({ page: result.page + 1 });
                  }
                }}
                className={cn(result.page === result.totalPages && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </main>
  );
}

function HomePageContent({
  initialResult,
  initialQueryString,
  facets,
  isAuthenticated,
}: {
  initialResult: SaleSearchResult;
  initialQueryString: string;
  facets: SaleSearchFacets;
  isAuthenticated: boolean;
}) {
  return (
    <div className="relative isolate min-h-full">
      <MarketplaceHeader />
      <div className="relative z-10">
        <HomeContent
          initialResult={initialResult}
          initialQueryString={initialQueryString}
          facets={facets}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}

export function HomePageClient({
  initialResult,
  initialQueryString,
  facets,
  isAuthenticated,
}: {
  initialResult: SaleSearchResult;
  initialQueryString: string;
  facets: SaleSearchFacets;
  isAuthenticated: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-full">
          <MarketplaceHeader />
          <main className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-5 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <div key={item} className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          </main>
        </div>
      }
    >
      <HomePageContent
        initialResult={initialResult}
        initialQueryString={initialQueryString}
        facets={facets}
        isAuthenticated={isAuthenticated}
      />
    </Suspense>
  );
}
