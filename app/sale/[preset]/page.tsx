import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { HomePageClient } from '@/components/marketplace/home-page-client';
import { SeoJsonLd } from '@/components/seo-json-ld';
import { getSaleSeoPreset } from '@/lib/sale-seo-presets';
import { buildSaleSearchParams, parseSaleSearchParams } from '@/lib/sale-search';
import { getPublishedSaleSearchFacets, searchPublishedSaleListings } from '@/lib/server/marketplace';
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata, formatRubPrice } from '@/lib/seo';

interface SalePresetPageProps {
  params: Promise<{ preset: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: SalePresetPageProps): Promise<Metadata> {
  const { preset: slug } = await params;
  const preset = getSaleSeoPreset(slug);

  if (!preset) {
    return createPageMetadata({
      title: 'Каталог не найден',
      description: 'Запрошенная подборка автомобилей недоступна.',
      path: `/sale/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: preset.title,
    description: preset.description,
    path: `/sale/${preset.slug}`,
  });
}

export default async function SalePresetPage({ params }: SalePresetPageProps) {
  const { preset: slug } = await params;
  const preset = getSaleSeoPreset(slug);

  if (!preset) {
    notFound();
  }

  const filters = parseSaleSearchParams({ filter: preset.filter });
  const [initialResult, facets] = await Promise.all([
    searchPublishedSaleListings(filters),
    getPublishedSaleSearchFacets(),
  ]);
  const initialQueryString = buildSaleSearchParams(filters).toString();
  const pagePath = `/sale/${preset.slug}`;
  const breadcrumbsJsonLd = breadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'В продаже', path: '/sale' },
    { name: preset.h1, path: pagePath },
  ]);
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: preset.h1,
    itemListElement: initialResult.items.slice(0, 30).map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/listing/${listing.id}`),
      name: `${listing.make} ${listing.model} ${listing.year}`,
      item: {
        '@type': 'Car',
        name: `${listing.make} ${listing.model} ${listing.year}`,
        brand: {
          '@type': 'Brand',
          name: listing.make,
        },
        model: listing.model,
        vehicleModelDate: String(listing.year),
        image: listing.images[0],
        url: absoluteUrl(`/listing/${listing.id}`),
        offers: {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/UsedCondition',
        },
        description: `${listing.city}, ${listing.mileage.toLocaleString('ru-RU')} км, ${formatRubPrice(listing.price)} ₽`,
      },
    })),
  };

  return (
    <>
      <h1 className="sr-only">{preset.h1}</h1>
      <SeoJsonLd data={breadcrumbsJsonLd} />
      <SeoJsonLd data={itemListJsonLd} />
      <HomePageClient
        initialResult={initialResult}
        initialQueryString={initialQueryString}
        facets={facets}
        isAuthenticated={false}
      />
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-border/70 bg-card/92 p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:bg-surface-elevated/92">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
            SEO-подборка
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{preset.h1}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{preset.intro}</p>
        </div>
      </section>
    </>
  );
}
