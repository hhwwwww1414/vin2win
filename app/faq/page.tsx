import { HomepageFAQ, homepageFaqItems } from '@/components/landing/homepage-seo-sections';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { SeoJsonLd } from '@/components/seo-json-ld';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'FAQ vin2win',
  description: 'Ответы на частые вопросы о vin2win, B2B-авторынке, модерации объявлений и запросах в подбор.',
  path: '/faq',
});

export default function FAQPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homepageFaqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="min-h-full">
      <SeoJsonLd data={faqJsonLd} />
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <HomepageFAQ />
      </main>
    </div>
  );
}
