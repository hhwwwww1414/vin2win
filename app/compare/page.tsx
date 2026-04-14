import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, GitCompareArrows, Gauge, Sparkles, Wallet } from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { Button } from '@/components/ui/button';
import { formatMileage, formatPrice } from '@/lib/marketplace-data';
import { formatEngineSpec, formatPaintCountValue, getAvtotekaStatusLabel, getListingTitle } from '@/lib/listing-utils';
import { getSessionUser } from '@/lib/server/auth';
import { getSaleListingsByIds } from '@/lib/server/marketplace';
import type { SaleListing } from '@/lib/types';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Сравнение автомобилей',
  description: 'Сравните до четырёх карточек по ключевым параметрам: цене, пробегу, владельцам и состоянию.',
  robots: {
    index: false,
    follow: false,
  },
};

const MAX_COMPARE_ITEMS = 4;

const sellerTypeLabels: Record<SaleListing['sellerType'], string> = {
  owner: 'Собственник',
  flip: 'Перепродажа',
  broker: 'Подбор',
  commission: 'Комиссия',
};

type CompareRowConfig = {
  key:
    | 'price'
    | 'year'
    | 'city'
    | 'bodyType'
    | 'mileage'
    | 'engine'
    | 'power'
    | 'transmission'
    | 'drive'
    | 'owners'
    | 'paintCount'
    | 'avtotekaStatus'
    | 'sellerType'
    | 'viewCount';
  label: string;
  better?: 'min' | 'max';
  render: (listing: SaleListing) => string;
};

const COMPARE_ROWS: CompareRowConfig[] = [
  { key: 'price', label: 'Цена', better: 'min', render: (listing) => formatPrice(listing.price) },
  { key: 'year', label: 'Год', better: 'max', render: (listing) => String(listing.year) },
  { key: 'city', label: 'Город', render: (listing) => listing.city },
  { key: 'bodyType', label: 'Кузов', render: (listing) => listing.bodyType },
  { key: 'mileage', label: 'Пробег', better: 'min', render: (listing) => formatMileage(listing.mileage) },
  { key: 'engine', label: 'Двигатель', render: (listing) => formatEngineSpec(listing) },
  { key: 'power', label: 'Мощность', better: 'max', render: (listing) => `${listing.power} л.с.` },
  { key: 'transmission', label: 'Коробка', render: (listing) => listing.transmission },
  { key: 'drive', label: 'Привод', render: (listing) => listing.drive },
  { key: 'owners', label: 'Владельцы', better: 'min', render: (listing) => String(listing.owners) },
  {
    key: 'paintCount',
    label: 'Окрашено',
    better: 'min',
    render: (listing) => formatPaintCountValue(listing.paintCount),
  },
  {
    key: 'avtotekaStatus',
    label: 'Автотека',
    render: (listing) => (listing.avtotekaStatus ? getAvtotekaStatusLabel(listing.avtotekaStatus) : '—'),
  },
  {
    key: 'sellerType',
    label: 'Тип продавца',
    render: (listing) => sellerTypeLabels[listing.sellerType],
  },
  {
    key: 'viewCount',
    label: 'Просмотры',
    better: 'max',
    render: (listing) => listing.viewCount.toLocaleString('ru-RU'),
  },
];

function formatRange(values: number[], formatter: (value: number) => string) {
  if (values.length === 0) {
    return '—';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return formatter(min);
  }

  return `${formatter(min)} - ${formatter(max)}`;
}

function getWinningIds(listings: SaleListing[], row: CompareRowConfig) {
  if (!row.better) {
    return new Set<string>();
  }

  const numericEntries = listings
    .map((listing) => ({
      id: listing.id,
      value: listing[row.key],
    }))
    .filter((entry): entry is { id: string; value: number } => typeof entry.value === 'number');

  if (numericEntries.length === 0) {
    return new Set<string>();
  }

  const bestValue =
    row.better === 'min'
      ? Math.min(...numericEntries.map((entry) => entry.value))
      : Math.max(...numericEntries.map((entry) => entry.value));

  return new Set(numericEntries.filter((entry) => entry.value === bestValue).map((entry) => entry.id));
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const rawIds = Array.isArray(params?.ids) ? params.ids[0] : params?.ids;
  const ids = rawIds?.split(',').map((value) => value.trim()).filter(Boolean).slice(0, MAX_COMPARE_ITEMS) ?? [];
  const sessionUser = await getSessionUser();
  const listings = await getSaleListingsByIds(ids, sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined);
  const winnersByRow = new Map(COMPARE_ROWS.map((row) => [row.key, getWinningIds(listings, row)]));
  const heroCards = [
    {
      label: 'В сравнении',
      value: `${listings.length}/${MAX_COMPARE_ITEMS}`,
      description: listings.length > 0 ? 'карточек уже в workspace' : 'workspace пока пустой',
      icon: GitCompareArrows,
    },
    {
      label: 'Прайс-коридор',
      value: formatRange(listings.map((listing) => listing.price), formatPrice),
      description: 'быстрый ориентир по бюджету',
      icon: Wallet,
    },
    {
      label: 'Пробег',
      value: formatRange(listings.map((listing) => listing.mileage), formatMileage),
      description: 'разброс по эксплуатации',
      icon: Gauge,
    },
    {
      label: 'Свежий год',
      value: listings.length ? String(Math.max(...listings.map((listing) => listing.year))) : '—',
      description: 'самая новая карточка в подборке',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />

          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                <GitCompareArrows className="h-3.5 w-3.5" />
                Compare workspace
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
                Сравнение автомобилей без лишнего шума
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Сведите в один рабочий экран до четырех карточек, быстро оцените цену, пробег,
                окрас, тип продавца и технику, а затем откройте сильнейший вариант в detail-view.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                >
                  <Link href="/">
                    Добавить карточки
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-border/80 bg-background/70 dark:bg-background/10">
                  <Link href="/">Вернуться к ленте</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {heroCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur dark:bg-background/10"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-teal-accent" />
                      {card.label}
                    </div>
                    <p className="mt-3 text-xl font-semibold text-foreground">{card.value}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {listings.length === 0 ? (
          <section className="mt-8 rounded-[32px] border border-border/70 bg-card/88 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/88 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
              <div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-lg font-semibold text-teal-accent">
                  0
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Подборка пока не собрана</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Сравнение оживает, когда вы добавляете карточки прямо из ленты. Выберите несколько
                  машин через compare-toggle, и этот экран превратится в рабочий shortlist.
                </p>
                <div className="mt-6">
                  <Button
                    asChild
                    className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                  >
                    <Link href="/">Перейти в ленту</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {[
                  'Добавляйте карточки в сравнение прямо с витрины через compare-toggle.',
                  'Сводите в один экран цену, пробег, окрас и историю продавца.',
                  'Открывайте detail-view уже по shortlist, а не по всей выдаче.',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 dark:bg-background/10"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-sm font-semibold text-teal-accent">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-[32px] border border-border/70 bg-card/92 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92">
            <div className="border-b border-border/60 px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                    Рабочая матрица
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">Compare board</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Верхний ряд помогает быстро оценить позиционирование карточек, а таблица ниже
                    подсвечивает лучшие значения по ключевым числовым метрикам.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-right dark:bg-background/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Выбрано
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{listings.length}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="min-w-[1080px] w-full border-collapse">
                <thead>
                  <tr className="align-top">
                    <th className="sticky left-0 z-20 min-w-[200px] bg-card/96 px-5 py-5 text-left align-top backdrop-blur dark:bg-surface-elevated/96 sm:px-6">
                      <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Параметры
                        </p>
                        <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                          Слева ключевые метрики, справа карточки в одном рабочем срезе.
                        </p>
                      </div>
                    </th>
                    {listings.map((listing, index) => {
                      const title = getListingTitle(listing);
                      const cover = listing.images[0];

                      return (
                        <th key={listing.id} className="min-w-[240px] px-4 py-5 text-left align-top">
                          <div className="rounded-2xl border border-border/70 bg-background/70 p-3 dark:bg-background/10">
                            <div
                              className={cn(
                                'relative overflow-hidden rounded-xl border border-border/70 bg-muted/30',
                                cover ? 'aspect-[16/10]' : 'flex h-36 items-center justify-center'
                              )}
                            >
                              {cover ? (
                                <Image
                                  src={cover}
                                  alt={title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 1280px) 50vw, 18vw"
                                />
                              ) : (
                                <div className="text-xs text-muted-foreground">Без фото</div>
                              )}
                            </div>

                            <div className="mt-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link
                                  href={`/listing/${listing.id}`}
                                  className="line-clamp-2 text-sm font-semibold leading-6 text-foreground transition-colors hover:text-teal-accent"
                                >
                                  {title}
                                </Link>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {listing.city} • {listing.year}
                                </p>
                              </div>
                              <span className="rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:bg-background/10">
                                #{index + 1}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                                {formatPrice(listing.price)}
                              </span>
                              <span className="rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-background/10">
                                {formatMileage(listing.mileage)}
                              </span>
                              <span className="rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-background/10">
                                {listing.paintCount === 0 ? 'Без окрасов' : `${listing.paintCount} окр.`}
                              </span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.key} className="border-t border-border/60">
                      <td className="sticky left-0 z-10 bg-card/96 px-5 py-4 align-top backdrop-blur dark:bg-surface-elevated/96 sm:px-6">
                        <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm font-medium text-foreground dark:bg-background/10">
                          {row.label}
                        </div>
                      </td>
                      {listings.map((listing) => {
                        const isWinner = winnersByRow.get(row.key)?.has(listing.id);

                        return (
                          <td key={`${listing.id}-${row.key}`} className="px-4 py-4 align-top">
                            <div
                              className={cn(
                                'rounded-2xl border px-4 py-3 text-sm font-medium text-foreground',
                                isWinner
                                  ? 'border-teal-accent/30 bg-[var(--accent-bg-soft)] text-teal-accent'
                                  : 'border-border/70 bg-background/65 dark:bg-background/10'
                              )}
                            >
                              {row.render(listing)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
