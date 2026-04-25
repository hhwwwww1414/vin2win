import { HomeHero } from '@/components/landing/home-hero';
import { BrandIntro } from '@/components/landing/brand-intro';
import { AudienceSection } from '@/components/landing/audience-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FeaturesShowcase } from '@/components/landing/features-showcase';
import { DifferentiatorSection } from '@/components/landing/differentiator-section';
import { TrustSection } from '@/components/landing/trust-section';
import { UseCasesSection } from '@/components/landing/use-cases-section';
import {
  HomepageFAQ,
  HomepageSeoSections,
  homepageFaqItems,
} from '@/components/landing/homepage-seo-sections';
import { FinalCTA } from '@/components/landing/final-cta';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { SeoJsonLd } from '@/components/seo-json-ld';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Профессиональный авторынок России',
  description:
    'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: объявления, запросы в подбор, фильтры, сравнение и сохранение поисков.',
  path: '/',
});

export default function LandingPage() {
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
      <main id="page-main" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero section - LOCKED, DO NOT MODIFY */}
        <div className="py-8">
          <HomeHero />
        </div>

        {/* Premium sections below the hero */}
        <BrandIntro />
        <AudienceSection />
        <HowItWorks />
        <FeaturesShowcase />
        <DifferentiatorSection />
        <TrustSection />
        <UseCasesSection />
        <HomepageSeoSections />
        <HomepageFAQ />
        <FinalCTA />
      </main>
    </div>
  );
}
