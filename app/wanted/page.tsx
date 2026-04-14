import type { Metadata } from 'next';
import { WantedPageClient } from '@/components/wanted/wanted-page-client';
import { getPublishedWantedListings } from '@/lib/server/marketplace';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Запросы в подбор',
  description: 'Публичная лента заявок на подбор автомобилей с бюджетом, ограничениями и контактами.',
  alternates: {
    canonical: '/wanted',
  },
  openGraph: {
    title: 'Р—Р°РїСЂРѕСЃС‹ РІ РїРѕРґР±РѕСЂ',
    description: 'РџСѓР±Р»РёС‡РЅР°СЏ Р»РµРЅС‚Р° Р·Р°СЏРІРѕРє РЅР° РїРѕРґР±РѕСЂ Р°РІС‚РѕРјРѕР±РёР»РµР№ СЃ Р±СЋРґР¶РµС‚РѕРј, РѕРіСЂР°РЅРёС‡РµРЅРёСЏРјРё Рё РєРѕРЅС‚Р°РєС‚Р°РјРё.',
    url: '/wanted',
    type: 'website',
    siteName: 'vin2win',
  },
};

export default async function WantedPage() {
  const listings = await getPublishedWantedListings();
  return <WantedPageClient initialListings={listings} />;
}
