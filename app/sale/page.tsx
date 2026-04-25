import { HomePageClient } from '@/components/marketplace/home-page-client';
import { SeoJsonLd } from '@/components/seo-json-ld';
import { buildSaleSearchParams, parseSaleSearchParams } from '@/lib/sale-search';
import { getPublishedSaleSearchFacets, searchPublishedSaleListings } from '@/lib/server/marketplace';
import { SALE_ROUTE } from '@/lib/routes';
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata, formatRubPrice } from '@/lib/seo';

export const revalidate = 60;

export const metadata = createPageMetadata({
  title: 'Автомобили в продаже для профессионалов',
  description:
    'Каталог автомобилей для профессионалов: фильтры по марке, году, пробегу, сравнение объявлений и сохранение поиска. Без B2C-шума.',
  path: SALE_ROUTE,
});

export default async function SalePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const filters = parseSaleSearchParams(params ?? {});
  const [initialResult, facets] = await Promise.all([
    searchPublishedSaleListings(filters),
    getPublishedSaleSearchFacets(),
  ]);
  const initialQueryString = buildSaleSearchParams(filters).toString();
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Автомобили в продаже для профессионалов',
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
        url: absoluteUrl(`/listing/${listing.id}`),
        image: listing.images[0],
        offers: {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/UsedCondition',
          seller: {
            '@type': 'Organization',
            name: 'vin2win',
          },
        },
        description: `${listing.city}, ${listing.mileage.toLocaleString('ru-RU')} км, ${formatRubPrice(listing.price)} ₽`,
      },
    })),
  };
  const breadcrumbsJsonLd = breadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'В продаже', path: SALE_ROUTE },
  ]);

  return (
    <>
      <h1 className="sr-only">Автомобили в продаже для профессионалов</h1>
      <SeoJsonLd data={breadcrumbsJsonLd} />
      <SeoJsonLd data={itemListJsonLd} />
      <HomePageClient
        initialResult={initialResult}
        initialQueryString={initialQueryString}
        facets={facets}
        isAuthenticated={false}
      />
    </>
  );
}
