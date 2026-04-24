import type { Metadata } from 'next';
import { HomeHero } from '@/components/landing/home-hero';
import { BrandIntro } from '@/components/landing/brand-intro';
import { AudienceSection } from '@/components/landing/audience-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FeaturesShowcase } from '@/components/landing/features-showcase';
import { DifferentiatorSection } from '@/components/landing/differentiator-section';
import { TrustSection } from '@/components/landing/trust-section';
import { UseCasesSection } from '@/components/landing/use-cases-section';
import { PremiumFAQ } from '@/components/landing/premium-faq';
import { FinalCTA } from '@/components/landing/final-cta';
import { MarketplaceHeader } from '@/components/marketplace/header';

export const metadata: Metadata = {
  title: 'vin2win - профессиональный авторынок',
  description:
    'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: публикация объявлений, фильтры, сравнение и модерация без B2C-шума.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'vin2win - профессиональный авторынок',
    description:
      'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: публикация объявлений, фильтры, сравнение и модерация без B2C-шума.',
    url: '/',
    type: 'website',
    siteName: 'vin2win',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-full">
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
        <PremiumFAQ />
        <FinalCTA />
      </main>
    </div>
  );
}
