import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CarFront,
  MapPin,
  Phone,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { ListingCardView } from '@/components/marketplace/listing-card-view';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { SellerReviewsSection } from '@/components/seller/seller-reviews-section';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace-data';
import { getSessionUser } from '@/lib/server/auth';
import { getPublicSellerProfileById } from '@/lib/server/marketplace';

interface SellerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'https://vin2win.ru';

function getSellerTypeLabel(type: 'person' | 'company') {
  return type === 'company' ? 'Компания' : 'Частный продавец';
}

function formatPriceRange(prices: number[]) {
  if (prices.length === 0) {
    return 'Нет активных лотов';
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }

  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}

function formatHumanDate(value: string | undefined) {
  if (!value) {
    return 'Недавно';
  }

  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value));
}

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicSellerProfileById(id);

  if (!result) {
    return {
      title: 'Продавец не найден',
      description: 'Профиль продавца недоступен.',
    };
  }

  const ratingText = result.reviewSummary.averageRating
    ? result.reviewSummary.averageRating.toFixed(1)
    : 'без оценок';
  const title = `${result.seller.name} — профиль продавца`;
  const description = `${getSellerTypeLabel(result.seller.type)} на vin2win. ${result.listings.length} активных объявлений, ${result.completedDealsCount} закрытых сделок, рейтинг ${ratingText}.`.slice(
    0,
    180
  );

  return {
    title,
    description,
    alternates: {
      canonical: `/seller/${result.seller.id}`,
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${SITE_URL}/seller/${result.seller.id}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  const result = await getPublicSellerProfileById(
    id,
    sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined
  );

  if (!result) {
    notFound();
  }

  const loginHref = `/login?next=${encodeURIComponent(`/seller/${id}`)}`;
  const cities = [...new Set(result.listings.map((listing) => listing.city))];
  const makes = [...new Set(result.listings.map((listing) => listing.make))];
  const priceRange = formatPriceRange(result.listings.map((listing) => listing.price));
  const latestListing = result.listings[0];
  const ratingValue = result.reviewSummary.averageRating
    ? result.reviewSummary.averageRating.toFixed(1)
    : 'Новый профиль';
  const statCards = [
    {
      label: 'Активных лотов',
      value: String(result.listings.length),
      note: result.listings.length > 0 ? 'карточек сейчас в продаже' : 'витрина пока пустая',
    },
    {
      label: 'Закрытых сделок',
      value: String(result.completedDealsCount),
      note:
        result.completedDealsCount > 0
          ? 'архив подтверждённых публикаций'
          : 'архивных сделок пока нет',
    },
    {
      label: 'Рейтинг',
      value: ratingValue,
      note:
        result.reviewSummary.count > 0
          ? `${result.reviewSummary.count} отзыва после модерации`
          : 'отзывы появятся после первой проверки',
    },
    {
      label: 'Последняя активность',
      value: formatHumanDate(latestListing?.publishedAt ?? latestListing?.createdAt),
      note: latestListing ? `${latestListing.make} ${latestListing.model}` : 'новые лоты появятся здесь',
    },
  ];
  const profileSignals = [
    { label: 'Тип профиля', value: getSellerTypeLabel(result.seller.type) },
    { label: 'На платформе', value: `с ${result.seller.onPlatformSince}` },
    {
      label: 'География',
      value: cities.length > 0 ? cities.join(', ') : 'Пока без активной географии',
    },
    {
      label: 'Марки в работе',
      value: makes.length > 0 ? makes.join(', ') : 'Пока без специализации',
    },
  ];

  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />

          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Профиль продавца
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  <Building2 className="h-3.5 w-3.5 text-teal-accent" />
                  {getSellerTypeLabel(result.seller.type)}
                </span>
                {result.seller.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Верифицирован
                  </span>
                ) : null}
                {result.seller.phone ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                    <Phone className="h-3.5 w-3.5 text-teal-accent" />
                    {result.seller.phone}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
                {result.seller.name}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Профиль продавца с живой витриной объявлений, статистикой закрытых сделок и
                публичными отзывами после модерации. На платформе с {result.seller.onPlatformSince}
                {cities.length > 0 ? ` • работает по ${cities.join(', ')}` : ''}
                {makes.length > 0 ? ` • фокус на ${makes.slice(0, 3).join(', ')}` : ''}.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                >
                  <Link href="#seller-listings">
                    Смотреть объявления
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-border/80 bg-background/70 dark:bg-background/10">
                  <Link href="#seller-reviews">Отзывы и репутация</Link>
                </Button>
                {result.seller.phone ? (
                  <Button asChild variant="outline" className="border-border/80 bg-background/70 dark:bg-background/10">
                    <a href={`tel:${result.seller.phone.replace(/\D/g, '')}`}>Позвонить продавцу</a>
                  </Button>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {makes.map((make) => (
                  <span
                    key={make}
                    className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10"
                  >
                    {make}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur dark:bg-background/10"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold text-foreground">{card.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)]">
          <div className="space-y-8">
            <section id="seller-listings" aria-label="Активные объявления продавца">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                    Витрина продавца
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">
                    Активные объявления
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Лента показывает только актуальные карточки продавца. Здесь удобно оценивать его
                    текущий ассортимент, ценовой коридор и качество публикаций.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-right dark:bg-background/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Сейчас в продаже
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{result.listings.length}</p>
                </div>
              </div>

              {result.listings.length > 0 ? (
                <div className="space-y-3">
                  {result.listings.map((listing, index) => (
                    <ListingCardView
                      key={listing.id}
                      listing={listing}
                      priority={index < 3}
                      isAuthenticated={Boolean(sessionUser)}
                      loginHref={loginHref}
                      variant="seller-preview"
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-border/70 bg-card/80 p-6 text-sm leading-6 text-muted-foreground dark:bg-surface-elevated/80">
                  У продавца пока нет активных публичных лотов. Профиль уже подготовлен, и новые
                  объявления появятся здесь автоматически после публикации.
                </div>
              )}
            </section>

            <div id="seller-reviews">
              <SellerReviewsSection
                sellerId={result.seller.id}
                sellerName={result.seller.name}
                initialReviews={result.reviews}
                reviewSummary={result.reviewSummary}
                viewerReviewStatus={result.viewerReviewStatus}
                isAuthenticated={Boolean(sessionUser)}
                loginHref={loginHref}
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <section className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                Репутация и сигналы
              </p>
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{result.seller.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      На платформе с {result.seller.onPlatformSince}
                    </p>
                  </div>
                  {result.seller.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Проверен
                    </span>
                  ) : null}
                </div>
                {result.seller.phone ? (
                  <a
                    href={`tel:${result.seller.phone.replace(/\D/g, '')}`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
                  >
                    <Phone className="h-4 w-4" />
                    {result.seller.phone}
                  </a>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 dark:bg-background/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Прайс-сегмент
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{priceRange}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 dark:bg-background/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Отзывы
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold leading-6 text-foreground">
                    <Star className="h-4 w-4 text-amber-400" />
                    {result.reviewSummary.averageRating
                      ? `${result.reviewSummary.averageRating.toFixed(1)} из 5`
                      : 'Пока без оценки'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.reviewSummary.count > 0
                      ? `${result.reviewSummary.count} опубликованных отзывов`
                      : 'Отзывов пока нет'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 dark:bg-background/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Закрытые сделки
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                    {result.completedDealsCount}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    архивных публикаций у продавца
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {profileSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 dark:bg-background/10"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {signal.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                      {signal.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-teal-accent" />
                  Что видно по витрине
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-foreground">
                  <div className="flex items-start gap-3">
                    <CarFront className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
                    <span>
                      {makes.length > 0
                        ? `Работает с ${makes.length} марками`
                        : 'Ассортимент пока формируется'}
                      .
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
                    <span>
                      {cities.length > 0
                        ? `Лоты размещены в ${cities.join(', ')}`
                        : 'География появится вместе с новыми лотами'}
                      .
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
                    <span>Текущий прайс-коридор: {priceRange}.</span>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
