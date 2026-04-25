import { WantedPageClient } from '@/components/wanted/wanted-page-client';
import { SeoJsonLd } from '@/components/seo-json-ld';
import { getPublishedWantedListings } from '@/lib/server/marketplace';
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata, formatRubPrice } from '@/lib/seo';

export const revalidate = 300;

export const metadata = createPageMetadata({
  title: 'Запросы в подбор автомобилей',
  description:
    'Лента B2B-запросов на подбор автомобилей от проверенных покупателей. Фильтры по марке, бюджету и региону для профессионалов.',
  path: '/wanted',
});

export default async function WantedPage() {
  const listings = await getPublishedWantedListings().catch(() => []);
  const breadcrumbsJsonLd = breadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Запросы в подбор', path: '/wanted' },
  ]);
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Запросы в подбор автомобилей',
    itemListElement: listings.slice(0, 20).map((listing, index) => {
      const path = `/wanted/${listing.slug ?? listing.id}`;

      return {
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(path),
        name: listing.models.join(', '),
        item: {
          '@type': 'WebPage',
          name: `${listing.models.join(', ')} — запрос в подбор`,
          url: absoluteUrl(path),
          description: `Бюджет до ${formatRubPrice(listing.budgetMax)} ₽. ${
            listing.region ? `Регион: ${listing.region}. ` : ''
          }B2B-запрос на подбор автомобиля.`,
        },
      };
    }),
  };

  return (
    <>
      <SeoJsonLd data={breadcrumbsJsonLd} />
      <SeoJsonLd data={itemListJsonLd} />
      <WantedPageClient initialListings={listings} />
    </>
  );
}
