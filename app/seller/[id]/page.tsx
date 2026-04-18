import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, CarFront, MapPin, Phone, Star, TrendingUp } from 'lucide-react';
import { ListingCardView } from '@/components/marketplace/listing-card-view';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { SellerProfileHero } from '@/components/seller/seller-profile-hero';
import { SellerReviewsSection } from '@/components/seller/seller-reviews-section';
import { buildSellerProfileAboutText } from '@/lib/seller-profile';
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
  const title = `${result.seller.name} - профиль продавца`;
  const about = buildSellerProfileAboutText({
    about: result.seller.about,
    name: result.seller.name,
  });
  const description = `${getSellerTypeLabel(result.seller.type)} на vin2win. ${result.listings.length} активных объявлений, ${result.completedDealsCount} закрытых сделок, рейтинг ${ratingText}. ${about}`.slice(
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
  const about = buildSellerProfileAboutText({
    about: result.seller.about,
    name: result.seller.name,
  });
  const profileSignals = [
    { label: 'Тип профиля', value: getSellerTypeLabel(result.seller.type) },
    { label: 'На платформе', value: `с ${result.seller.onPlatformSince}` },
    {
      label: 'География',
      value: cities.length > 0 ? cities.join(', ') : 'Пока без активной географии',
    },
    {
      label: 'Марки в работе',
      value: makes.length > 0 ? makes.join(', ') : 'Пока без активной специализации',
    },
  ];

  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SellerProfileHero
          seller={result.seller}
          listingCount={result.listings.length}
          cities={cities}
          makes={makes}
          reviewCount={result.reviewSummary.count}
          averageRating={result.reviewSummary.averageRating}
        />

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)]">
          <div className="space-y-8">
            <section
              id="seller-about"
              className="rounded-[28px] border border-border/70 bg-card/92 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                Профиль продавца
              </p>
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.72fr)]">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">О продавце</h2>
                  <p className="mt-2 text-sm font-medium text-foreground/80">{result.seller.name}</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{about}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.seller.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Проверенный продавец
                      </span>
                    ) : null}
                    {result.seller.phone ? (
                      <a
                        href={`tel:${result.seller.phone.replace(/\D/g, '')}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Phone className="h-3.5 w-3.5 text-teal-accent" />
                        {result.seller.phone}
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3">
                  {profileSignals.map((signal) => (
                    <div key={signal.label} className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {signal.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{signal.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="seller-listings" aria-label="Активные объявления продавца">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                    Витрина продавца
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">Активные объявления</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Здесь видна актуальная лента объявлений продавца, его текущий ценовой коридор и общий уровень
                    оформления публикаций.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-right">
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
                <div className="rounded-[28px] border border-dashed border-border/70 bg-card/80 p-6 text-sm leading-6 text-muted-foreground">
                  У продавца пока нет активных публичных лотов. Новые объявления появятся здесь автоматически после
                  публикации.
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
            <section className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                Репутация и сигналы
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Прайс-сегмент
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{priceRange}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Отзывы</p>
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
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Закрытые сделки
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{result.completedDealsCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Архивных публикаций у продавца</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
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
                    <span>Последняя активность: {formatHumanDate(latestListing?.publishedAt ?? latestListing?.createdAt)}.</span>
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
