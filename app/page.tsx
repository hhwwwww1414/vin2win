import type { Metadata } from 'next';
import { HomeHero } from '@/components/landing/home-hero';
import { HomeStats } from '@/components/landing/home-stats';
import { HomeAbout } from '@/components/landing/home-about';
import { HomeAudiences } from '@/components/landing/home-audiences';
import { HomeHowItWorks } from '@/components/landing/home-how-it-works';
import { HomeFeatures } from '@/components/landing/home-features';
import { HomeWhyChoose } from '@/components/landing/home-why-choose';
import { HomeTrust } from '@/components/landing/home-trust';
import { HomeUseCases } from '@/components/landing/home-use-cases';
import { HomeFaq } from '@/components/landing/home-faq';
import { HomeFinalCta } from '@/components/landing/home-final-cta';
import { MarketplaceHeader } from '@/components/marketplace/header';

export const metadata: Metadata = {
  title: 'vin2win — профессиональный авторынок',
  description:
    'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: публикация объявлений, глубокие фильтры, сравнение, чат сделки и модерация без B2C-шума.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'vin2win — профессиональный авторынок',
    description:
      'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: публикация объявлений, глубокие фильтры, сравнение, чат сделки и модерация без B2C-шума.',
    url: '/',
    type: 'website',
    siteName: 'vin2win',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <HomeHero />
        <HomeStats />
        <HomeAbout />
        <HomeAudiences />
        <HomeHowItWorks />
        <HomeFeatures />
        <HomeWhyChoose />
        <HomeTrust />
        <HomeUseCases />
        <HomeFaq />
        <HomeFinalCta />
      </main>
    </div>
  );
}
