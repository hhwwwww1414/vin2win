import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/header';
import {
  SellerProfileHero,
  type SellerProfileTab,
  type SellerProfileTabKey,
} from '@/components/seller/seller-profile-hero';
import { SellerReviewsSection } from '@/components/seller/seller-reviews-section';
import { SeoJsonLd } from '@/components/seo-json-ld';
import { buildSellerProfileAboutText } from '@/lib/seller-profile';
import { formatMileage, formatPrice } from '@/lib/marketplace-data';
import { getPublicSellerProfileById } from '@/lib/server/marketplace';
import type { SaleListing } from '@/lib/types';
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata, sanitizeSeoText } from '@/lib/seo';

interface SellerPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export const revalidate = 600;

const SELLER_TABS: Array<{ key: SellerProfileTabKey; label: string }> = [
  { key: 'overview', label: 'Обзор' },
  { key: 'listing', label: 'Объявления' },
  { key: 'reviews', label: 'Отзывы' },
  { key: 'logbook', label: 'Бортжурнал' },
];

function getSellerTypeLabel(type: 'person' | 'company') {
  return type === 'company' ? 'Компания' : 'Частный продавец';
}

function getListingWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'объявление';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'объявления';
  }

  return 'объявлений';
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

function normalizeSellerTab(value: string | string[] | undefined): SellerProfileTabKey {
  const tab = Array.isArray(value) ? value[0] : value;

  if (tab === 'listing' || tab === 'reviews' || tab === 'logbook') {
    return tab;
  }

  return 'overview';
}

function buildSellerTabHref(sellerPath: string, tab: SellerProfileTabKey) {
  return tab === 'overview' ? sellerPath : `${sellerPath}?tab=${tab}`;
}

function getGalleryImages(sellerCoverUrl: string | undefined, listings: SaleListing[]) {
  return [
    sellerCoverUrl,
    ...listings.flatMap((listing) => listing.images.slice(0, 1)),
  ].filter((src): src is string => Boolean(src)).slice(0, 3);
}

function SellerListingTile({ listing, priority = false }: { listing: SaleListing; priority?: boolean }) {
  const image = listing.images[0];
  const title = `${listing.make} ${listing.model}`;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            priority={priority}
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Нет фото</div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-lg font-bold leading-tight tracking-[-0.02em] text-foreground tabular-nums">
          {formatPrice(listing.price)}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
          {listing.year}, {formatMileage(listing.mileage)}
        </p>
      </div>
    </Link>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-sm leading-6 text-muted-foreground">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-2xl">{text}</p>
    </div>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border py-2.5">
      <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-foreground sm:text-base">{value}</p>
    </div>
  );
}

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicSellerProfileById(id);

  if (!result) {
    return createPageMetadata({
      title: 'Продавец не найден',
      description: 'Профиль продавца недоступен.',
      path: `/seller/${id}`,
      noIndex: true,
    });
  }

  const title = `${sanitizeSeoText(result.seller.name, 'Продавец', 80)} - продавец на vin2win`;
  const about = buildSellerProfileAboutText({
    about: result.seller.about,
    name: result.seller.name,
  });
  const description = sanitizeSeoText(
    `Профиль продавца ${result.seller.name} на vin2win: объявления, рейтинг, отзывы и информация для участников авторынка. ${about}`,
    'Профиль продавца на vin2win.',
    180
  );

  return createPageMetadata({
    title,
    description,
    path: `/seller/${result.seller.id}`,
    image: result.seller.avatarUrl ?? undefined,
  });
}

export default async function SellerPage({ params, searchParams }: SellerPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeTab = normalizeSellerTab(resolvedSearchParams?.tab);
  const result = await getPublicSellerProfileById(id);

  if (!result) {
    notFound();
  }

  const sellerPath = `/seller/${result.seller.id}`;
  const loginHref = `/login?next=${encodeURIComponent(`${sellerPath}?tab=reviews`)}`;
  const cities = [...new Set(result.listings.map((listing) => listing.city))];
  const makes = [...new Set(result.listings.map((listing) => listing.make))];
  const priceRange = formatPriceRange(result.listings.map((listing) => listing.price));
  const latestListing = result.listings[0];
  const about = buildSellerProfileAboutText({
    about: result.seller.about,
    name: result.seller.name,
  });
  const tabs: SellerProfileTab[] = SELLER_TABS.map((tab) => ({
    ...tab,
    href: buildSellerTabHref(sellerPath, tab.key),
    count:
      tab.key === 'listing'
        ? result.listings.length
        : tab.key === 'reviews'
          ? result.reviewSummary.count
          : undefined,
  }));
  const galleryImages = getGalleryImages(result.seller.coverUrl, result.listings);
  const sellerJsonLd = {
    '@context': 'https://schema.org',
    '@type': result.seller.type === 'company' ? 'Organization' : 'Person',
    name: result.seller.name,
    url: absoluteUrl(sellerPath),
    image: result.seller.avatarUrl ?? undefined,
    description: about,
    aggregateRating:
      result.reviewSummary.averageRating && result.reviewSummary.count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: result.reviewSummary.averageRating.toFixed(1),
            reviewCount: result.reviewSummary.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review:
      result.reviews.length > 0
        ? result.reviews.slice(0, 5).map((review) => ({
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: {
              '@type': 'Person',
              name: review.authorName,
            },
            reviewBody: sanitizeSeoText(review.text, '', 240),
            datePublished: review.createdAt,
          }))
        : undefined,
  };
  const breadcrumbsJsonLd = breadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Продавцы', path: '/sale' },
    { name: result.seller.name, path: sellerPath },
  ]);

  return (
    <div className="min-h-full bg-background">
      <SeoJsonLd data={sellerJsonLd} />
      <SeoJsonLd data={breadcrumbsJsonLd} />
      <MarketplaceHeader />

      <main className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
        <SellerProfileHero
          seller={result.seller}
          cities={cities}
          reviewCount={result.reviewSummary.count}
          averageRating={result.reviewSummary.averageRating}
          galleryImages={galleryImages}
          sellerPath={sellerPath}
          tabs={tabs}
          activeTab={activeTab}
        />

        <div className="mx-auto mt-8 max-w-[1090px]">
          {activeTab === 'overview' ? (
            <div className="space-y-12">
              <section aria-labelledby="seller-overview-listings">
                <div className="flex items-center justify-between gap-4">
                  <Link href={`${sellerPath}?tab=listing`} className="group inline-flex items-center gap-2">
                    <h2 id="seller-overview-listings" className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[28px]">
                      В продаже {result.listings.length}
                    </h2>
                    <ArrowRight className="mt-0.5 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                </div>

                {result.listings.length > 0 ? (
                  <>
                    <div className="mt-4 grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
                      {result.listings.slice(0, 4).map((listing, index) => (
                        <SellerListingTile key={listing.id} listing={listing} priority={index < 2} />
                      ))}
                    </div>

                    {result.listings.length > 4 ? (
                      <Link
                        href={`${sellerPath}?tab=listing`}
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                      >
                        Показать все
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <div className="mt-5">
                    <EmptyState
                      title="Объявлений пока нет"
                      text="Когда продавец опубликует активные автомобили, они появятся в этом блоке."
                    />
                  </div>
                )}
              </section>

              <section className="grid gap-7 border-t border-border pt-7 md:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">О продавце</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{about}</p>
                </div>

                <div>
                  <ProfileFact label="Тип профиля" value={getSellerTypeLabel(result.seller.type)} />
                  <ProfileFact label="География" value={cities.length > 0 ? cities.join(', ') : 'Не указана'} />
                  <ProfileFact label="Марки" value={makes.length > 0 ? makes.join(', ') : 'Не указаны'} />
                  <ProfileFact label="Цены" value={priceRange} />
                  <ProfileFact
                    label="Последняя активность"
                    value={formatHumanDate(latestListing?.publishedAt ?? latestListing?.createdAt)}
                  />
                </div>
              </section>

              {result.reviews.length > 0 ? (
                <section className="border-t border-border pt-8">
                  <div className="flex items-center justify-between gap-4">
                    <Link href={`${sellerPath}?tab=reviews`} className="group inline-flex items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Отзывы</h2>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {result.reviews.slice(0, 2).map((review) => (
                      <article key={review.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{review.authorName}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{formatHumanDate(review.createdAt)}</p>
                          </div>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-semibold text-foreground">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{review.text}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'listing' ? (
            <section aria-labelledby="seller-listings-heading">
              <h2 id="seller-listings-heading" className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[28px]">
                {result.listings.length} {getListingWord(result.listings.length)}
              </h2>

              {result.listings.length > 0 ? (
                <div className="mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                  {result.listings.map((listing, index) => (
                    <SellerListingTile key={listing.id} listing={listing} priority={index < 4} />
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    title="Нет активных объявлений"
                    text="Публичная витрина продавца сейчас пуста."
                  />
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'reviews' ? (
            <SellerReviewsSection
              sellerId={result.seller.id}
              sellerName={result.seller.name}
              initialReviews={result.reviews}
              reviewSummary={result.reviewSummary}
              viewerReviewStatus={result.viewerReviewStatus}
              isAuthenticated={false}
              loginHref={loginHref}
            />
          ) : null}

          {activeTab === 'logbook' ? (
            <section className="rounded-xl border border-dashed border-border p-8">
              <div className="flex items-center gap-3 text-foreground">
                <MessageSquare className="h-5 w-5 text-teal-accent" />
                <h2 className="text-2xl font-semibold tracking-[-0.02em]">Бортжурнал</h2>
              </div>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Записей пока нет. Когда продавец начнёт публиковать новости, обзоры или заметки по автомобилям,
                они появятся здесь.
              </p>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
