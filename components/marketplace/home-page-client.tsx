'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownUp, ArrowRight, BellRing, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
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
const HERO_HIGHLIGHTS = ['Проверенные продавцы', 'Полная история', 'Уведомления о новых'] as const;

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
      const params = buildSaleSearchParams({ ...filters, ...nextFilters });
      const view = nextView ?? viewMode;
      if (view !== 'cards') {
        params.set('view', view);
      }

      const query = params.toString();
      router.replace(buildSaleHref(query), { scroll: false });
    },
    [filters, router, viewMode]
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
  const totalListingsLabel = result.total.toLocaleString('ru-RU');
  const activeFilterCount = filters.filters.length;
  const heroPanels = [
    {
      icon: Sparkles,
      title: 'Живая лента',
      value: totalListingsLabel,
      description: 'предложений в продаже',
    },
    {
      icon: SlidersHorizontal,
      title: 'Фильтры',
      value: activeFilterCount > 0 ? `${activeFilterCount} применено` : 'Все объявления',
      description: activeFilterCount > 0 ? 'фильтры уже применены к выдаче' : 'настройте параметры для точного поиска',
    },
    {
      icon: BellRing,
      title: 'Уведомления',
      value: isAuthenticated ? 'Включены' : 'После входа',
      description: 'узнавайте о новых объявлениях первыми',
    },
  ];

  return (
    <main id="page-main" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <section className="relative mb-5 overflow-hidden rounded-[var(--radius-panel)] border border-border/70 bg-[var(--surface-soft-strong)] shadow-[var(--shadow-surface)] dark:bg-[var(--surface-soft-strong)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_24%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent" aria-hidden="true" />
        <div className="relative grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)] lg:p-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
              <ShieldCheck className="h-3.5 w-3.5" />
              Маркетплейс автомобилей
            </div>
            <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2.35rem] lg:leading-[1.08]">
              Автомобили в продаже для профессиональных продавцов, подборщиков и менеджеров
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Актуальные объявления с полной историей, проверенными данными и удобным сравнением.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-95 dark:bg-teal-accent dark:text-[#09090B]"
              >
                Расширенный поиск
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/wanted"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/70 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-teal-accent/40 hover:text-teal-accent dark:bg-background/10"
              >
                Лента запросов на подбор
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {HERO_HIGHLIGHTS.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/70 bg-background/65 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:bg-background/10"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
            {heroPanels.map((panel) => {
              const Icon = panel.icon;

              return (
                <div
                  key={panel.title}
                  className="rounded-[var(--radius-card)] border border-border/70 bg-background/70 p-3.5 dark:bg-background/10"
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <Icon className="h-4 w-4 text-teal-accent" />
                    {panel.title}
                  </div>
                  <p className="mt-2.5 text-[1.4rem] font-semibold tracking-tight text-foreground">{panel.value}</p>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{panel.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="hidden">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-accent">Маркетплейс автомобилей</p>
        <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Автомобили в продаже для профессиональных продавцов, подборщиков и менеджеров
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Актуальные объявления с полной историей, проверенными данными и удобным сравнением.
        </p>
      </section>

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
            <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg dark:bg-surface-elevated">
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
          priorityIndices={new Set([0, 1, 2])}
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
                  priority={index < 3}
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
                  priority={index < 3}
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
