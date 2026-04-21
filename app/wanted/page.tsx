import type { Metadata } from 'next';
import { WantedPageClient } from '@/components/wanted/wanted-page-client';
import { getPublishedWantedListings } from '@/lib/server/marketplace';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Запросы в подбор',
  description: 'Публичная лента заявок на подбор автомобилей с бюджетом, ограничениями и контактами.',
  alternates: {
    canonical: '/wanted',
  },
  openGraph: {
    title: 'Запросы в подбор',
    description: 'Публичная лента заявок на подбор автомобилей с бюджетом, ограничениями и контактами.',
    url: '/wanted',
    type: 'website',
    siteName: 'vin2win',
  },
};

export default async function WantedPage() {
  const listings = await getPublishedWantedListings();
  return <WantedPageClient initialListings={listings} />;
}
