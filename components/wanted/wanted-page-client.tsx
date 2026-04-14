'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Gauge,
  MapPin,
  MessageCircle,
  Palette,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { formatPrice } from '@/lib/marketplace-data';
import type { WantedListing } from '@/lib/types';
import { cn } from '@/lib/utils';

function WantedCard({ listing }: { listing: WantedListing }) {
  const budgetLabel = listing.budgetMin
    ? `${formatPrice(listing.budgetMin)} — ${formatPrice(listing.budgetMax)}`
    : `до ${formatPrice(listing.budgetMax)}`;

  const date = new Date(listing.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

  const facts = [
    listing.yearFrom
      ? {
          icon: Calendar,
          label: 'Год от',
          value: String(listing.yearFrom),
        }
      : null,
    listing.mileageMax
      ? {
          icon: Gauge,
          label: 'Пробег',
          value: `до ${listing.mileageMax.toLocaleString('ru-RU')} км`,
        }
      : null,
    listing.ownersMax
      ? {
          icon: Users,
          label: 'Владельцы',
          value: `до ${listing.ownersMax} хоз`,
        }
      : null,
    listing.region
      ? {
          icon: MapPin,
          label: 'Регион',
          value: listing.region,
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }>;

  const metaChips = [
    listing.transmission,
    listing.engine ? `Двиг: ${listing.engine}` : null,
    listing.paintAllowed ? 'Окрасы допустимы' : 'Без окрасов',
  ].filter(Boolean);

  return (
    <Link
      href={`/wanted/${listing.id}`}
      className={cn(
        'group relative block overflow-hidden rounded-[26px] border border-border/70 bg-card/92 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:bg-surface-elevated/92',
        'transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-teal-accent/30 dark:hover:bg-surface-elevated',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
      />

      <div className="relative z-[2] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {listing.author.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                  <ShieldCheck className="h-3 w-3" />
                  Верифицирован
                </span>
              ) : null}
              <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:bg-background/10">
                На платформе с {listing.author.onPlatformSince}
              </span>
            </div>
            <h2 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-foreground">
              {listing.models.join(', ')}
            </h2>
          </div>

          <div className="shrink-0 rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-right dark:bg-background/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Бюджет
            </p>
            <div className="mt-1 text-base font-semibold tabular-nums text-foreground sm:text-lg">
              {budgetLabel}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{date}</div>
          </div>
        </div>

        {facts.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {facts.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-2xl border border-border/70 bg-background/65 px-3 py-3 dark:bg-background/10"
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-teal-accent" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {metaChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10"
            >
              {chip}
            </span>
          ))}
          {listing.restrictions?.map((restriction) => (
            <span
              key={restriction}
              className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning"
            >
              {restriction}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
            <Palette className="h-3.5 w-3.5 text-teal-accent" />
            {listing.paintAllowed ? 'Окрасы допустимы' : 'Без окрасов'}
          </span>
        </div>

        {listing.comment ? (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{listing.comment}</p>
        ) : null}

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground">{listing.author.name}</span>
            <p className="mt-1 text-xs text-muted-foreground">Запрос готов к прямому ответу по лоту</p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1.5 text-sm font-medium text-teal-accent">
            <MessageCircle className="h-3.5 w-3.5" />
            Написать
          </span>
        </div>
      </div>
    </Link>
  );
}

export function WantedPageClient({ initialListings }: { initialListings: WantedListing[] }) {
  const heroPanels = [
    {
      label: 'Активных запросов',
      value: String(initialListings.length),
      description: initialListings.length > 0 ? 'в рабочей ленте рынка' : 'лента готова к первому запуску',
    },
    {
      label: 'Формат',
      value: 'B2B demand board',
      description: 'бюджет, ограничения и приоритетные модели в одном брифе',
    },
    {
      label: 'Результат',
      value: 'Быстрый intake',
      description: 'продавцы сразу видят рамки запроса и отвечают точнее',
    },
  ];

  const emptyStateSteps = [
    'Укажите бюджет, год и пробег, чтобы отсечь нерелевантный поток.',
    'Добавьте ограничения по окрасам, владельцам и истории автомобиля.',
    'Запрос сразу станет понятным для продавцов и подборщиков в ленте.',
  ];

  return (
    <div className="relative isolate min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative mb-6 overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />
          <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.85fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Wanted board
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
                Запросы в подбор для точного B2B-потока
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Фиксируйте бюджет, ограничения и приоритетные модели так, чтобы продавцы и
                подборщики сразу понимали рамки сделки, а не тратили время на уточнение базовых
                вводных.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/listing/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-dark px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95 dark:bg-teal-accent dark:text-[#09090B]"
                >
                  <Plus className="h-4 w-4" />
                  Создать запрос
                </Link>
                <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground dark:bg-background/10">
                  <ShieldCheck className="h-4 w-4 text-teal-accent" />
                  {initialListings.length > 0
                    ? `${initialListings.length} активных запросов уже в ленте`
                    : 'Лента готова принять первый запрос'}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {heroPanels.map((panel) => (
                <div
                  key={panel.label}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur dark:bg-background/10"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {panel.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold text-foreground">{panel.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{panel.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {initialListings.length === 0 ? (
          <section className="rounded-[32px] border border-border/70 bg-card/88 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/88 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.85fr)]">
              <div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-lg font-semibold text-teal-accent">
                  0
                </div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Пока нет активных запросов на подбор
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Страница больше не должна выглядеть как пустой контейнер. Первый запрос задаёт
                  стандарты ленты: бюджет, ограничения и понятный сценарий коммуникации для тех,
                  кто будет подбирать вам автомобили.
                </p>
                <div className="mt-6">
                  <Link
                    href="/listing/new"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-dark px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95 dark:bg-teal-accent dark:text-[#09090B]"
                  >
                    <Plus className="h-4 w-4" />
                    Создать запрос
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                {emptyStateSteps.map((item, index) => (
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
                <Link
                  href="/listing/new"
                  className="inline-flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
                >
                  <span>Перейти к созданию запроса</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid gap-3 lg:gap-4">
            {initialListings.map((listing) => (
              <WantedCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
