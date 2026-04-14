import type { Metadata } from 'next';
import { HomePageClient } from '@/components/marketplace/home-page-client';
import { getSessionUser } from '@/lib/server/auth';
import { buildSaleSearchParams, parseSaleSearchParams } from '@/lib/sale-search';
import { getPublishedSaleSearchFacets, searchPublishedSaleListings } from '@/lib/server/marketplace';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Автомобили в продаже',
  description: 'Профессиональная лента объявлений с фильтрацией, сравнением и сохранением поисков.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Автомобили в продаже',
    description: 'Профессиональная лента объявлений с фильтрацией, сравнением и сохранением поисков.',
    url: '/',
    type: 'website',
    siteName: 'vin2win',
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const filters = parseSaleSearchParams(params ?? {});
  const sessionUser = await getSessionUser();
  const [initialResult, facets] = await Promise.all([
    searchPublishedSaleListings(filters, sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined),
    getPublishedSaleSearchFacets(),
  ]);
  const initialQueryString = buildSaleSearchParams(filters).toString();

  return (
    <HomePageClient
      initialResult={initialResult}
      initialQueryString={initialQueryString}
      facets={facets}
      isAuthenticated={Boolean(sessionUser)}
    />
  );
}
