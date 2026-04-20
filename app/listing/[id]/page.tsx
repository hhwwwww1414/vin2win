import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { CarbonFiberBackground } from '@/components/layout/carbon-fiber-background';
import { DealBlock } from '@/components/listing/deal-block';
import { InteriorGallery } from '@/components/listing/interior-gallery';
import { ListingStatusBadge } from '@/components/listing/listing-status-badge';
import { PriceHistoryChart } from '@/components/listing/price-history-chart';
import { SimilarListings } from '@/components/listing/similar-listings';
import { VehicleGallery } from '@/components/listing/vehicle-gallery';
import { ViewCountBadge } from '@/components/listing/view-count-badge';
import { VinReport } from '@/components/listing/vin-report';
import { MarketplaceHeader } from '@/components/marketplace/header';
import {
  LISTING_STATUS_PANEL_CLASSES,
  getListingStatusLabel,
} from '@/lib/listing-status';
import { saleListingToVehicle } from '@/lib/marketplace-data';
import {
  formatEngineSpec,
  formatPaintCountValue,
  getAvtotekaStatusLabel,
  getPtsTypeLabel,
  getPtsTypeToneClassName,
} from '@/lib/listing-utils';
import { formatPrice } from '@/lib/price-formatting';
import { getSessionUser } from '@/lib/server/auth';
import { getSaleListingById, getSimilarSaleListings } from '@/lib/server/marketplace';
import { SALE_ROUTE } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

type SaleListingPageRecord = NonNullable<Awaited<ReturnType<typeof getSaleListingById>>>;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'https://vin2win.ru';


function buildListingTitle(listing: Awaited<ReturnType<typeof getSaleListingById>>) {
  if (!listing) {
    return 'Объявление';
  }

  return `${listing.make} ${listing.model} ${listing.year} — ${formatPrice(listing.price)}`;
}

function buildListingDescription(listing: Awaited<ReturnType<typeof getSaleListingById>>) {
  if (!listing) {
    return 'Карточка автомобиля на vin2win.';
  }

  return `${listing.city} • ${listing.mileage.toLocaleString('ru-RU')} км • ${formatEngineSpec(listing)} • ${listing.transmission}. ${listing.description}`.slice(
    0,
    190
  );
}

function getAvtotekaTone(status: SaleListingPageRecord['avtotekaStatus']) {
  switch (status) {
    case 'green':
      return 'text-success';
    case 'yellow':
      return 'text-warning';
    case 'red':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-card)] border border-border/50 bg-card/90 p-4 dark:bg-surface-elevated/90 sm:p-5',
        className
      )}
    >
      <h3 className="mb-4 border-b border-border/40 pb-3 text-sm font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-right text-sm font-medium text-foreground', valueClassName)}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
      )}
      <span className={cn(ok ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
    </div>
  );
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getSaleListingById(id);

  if (!listing) {
    return {
      title: 'Объявление не найдено',
      description: 'Запрошенная карточка автомобиля недоступна.',
    };
  }

  const title = buildListingTitle(listing);
  const description = buildListingDescription(listing);
  const image = listing.images[0];

  return {
    title,
    description,
    alternates: {
      canonical: `/listing/${listing.id}`,
    },
    openGraph: {
      title,
      description,
      url: `/listing/${listing.id}`,
      type: 'article',
      images: image ? [{ url: image, alt: `${listing.make} ${listing.model} ${listing.year}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  const listing = await getSaleListingById(
    id,
    sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined
  );

  if (!listing) {
    notFound();
  }

  const vehicle = saleListingToVehicle(listing);
  const similarListings = await getSimilarSaleListings(
    listing,
    sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined
  );
  const loginHref = `/login?next=${encodeURIComponent(`/listing/${listing.id}`)}`;
  const paintLabel = formatPaintCountValue(listing.paintCount);
  const avtotekaLabel = getAvtotekaStatusLabel(listing.avtotekaStatus);
  const avtotekaTone = getAvtotekaTone(listing.avtotekaStatus);
  const ptsLabel = getPtsTypeLabel(listing);
  const ptsTone = getPtsTypeToneClassName(listing);

  const heroSummaryRows: Array<{ label: string; value: string; tone?: string }> = [
    { label: 'Осмотр', value: listing.city },
    { label: 'Пробег', value: `${listing.mileage.toLocaleString('ru-RU')} км` },
    { label: 'Двигатель', value: formatEngineSpec(listing) },
    { label: 'Владельцы', value: `${listing.owners} хоз.` },
    { label: 'Коробка', value: listing.transmission },
    { label: 'Окрашено', value: paintLabel, tone: listing.paintCount === 0 ? 'text-success' : 'text-warning' },
    { label: 'Привод', value: listing.drive },
    { label: 'Автотека', value: avtotekaLabel, tone: avtotekaTone },
  ];

  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${listing.make} ${listing.model}`,
    brand: listing.make,
    model: listing.model,
    vehicleModelDate: String(listing.year),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: listing.mileage,
      unitCode: 'KMT',
    },
    bodyType: listing.bodyType,
    color: listing.color,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/listing/${listing.id}`,
    },
    image: listing.images.slice(0, 5),
    description: buildListingDescription(listing),
  };

  return (
    <div className="relative isolate min-h-full bg-background">
      <CarbonFiberBackground variant="listing" className="inset-x-0 bottom-0 top-14" />
      <MarketplaceHeader />

      <main
        id="page-main"
        className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:py-8 lg:px-8 lg:pb-8"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
        />

        {listing.status && listing.status !== 'PUBLISHED' ? (
          <div
            className={cn(
              'mb-4 rounded-2xl border px-4 py-3',
              LISTING_STATUS_PANEL_CLASSES[listing.status]
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <ListingStatusBadge status={listing.status} />
              <p className="text-sm">
                Карточка доступна только владельцу и модераторам до публикации. Текущий статус:{' '}
                {getListingStatusLabel(listing.status)}.
              </p>
            </div>
            {listing.moderationNote ? (
              <p className="mt-2 text-sm text-muted-foreground">{listing.moderationNote}</p>
            ) : null}
          </div>
        ) : null}

        {/* ── Hero ── */}
        <section className="relative mb-6 overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />
          <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.9fr)]">
            <div>
              <nav
                className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-muted-foreground"
                aria-label="Хлебные крошки"
              >
                <Link href={SALE_ROUTE} className="transition-colors hover:text-foreground">
                  В продаже
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">
                  {listing.make} {listing.model}
                </span>
                <ViewCountBadge
                  listingId={listing.id}
                  initialCount={listing.viewCount}
                  shouldTrack={
                    listing.status === 'PUBLISHED' && listing.ownerUserId !== sessionUser?.id
                  }
                />
              </nav>

              <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                Карточка сделки
              </div>

              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
                {listing.make} {listing.model}, {listing.year}
              </h1>
              {listing.generation ? (
                <p className="mt-2 text-base text-muted-foreground sm:text-lg">{listing.generation}</p>
              ) : null}
            </div>

            {/* Hero summary — single composed surface */}
            <div className="rounded-2xl bg-background/50 p-4 dark:bg-background/10">
              <div className="grid gap-x-8 sm:grid-cols-2">
                {heroSummaryRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-border/30 py-2 text-sm last:border-0 sm:[&:nth-last-child(2)]:border-0"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={cn('text-right font-medium text-foreground', row.tone)}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Main content + sidebar ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {/* Gallery */}
            <div className="overflow-hidden rounded-[28px] border border-border/50 bg-card/92 p-4 dark:bg-surface-elevated/92">
              <VehicleGallery vehicle={vehicle} />
            </div>

            {listing.interiorImages && listing.interiorImages.length > 0 ? (
              <div className="overflow-hidden rounded-[28px] border border-border/50 bg-card/92 p-4 dark:bg-surface-elevated/92">
                <InteriorGallery images={listing.interiorImages} />
              </div>
            ) : null}

            {/* Technique — first per constraint */}
            <SectionCard title="Техника">
              <InfoRow label="Двигатель" value={formatEngineSpec(listing)} />
              <InfoRow label="Мощность" value={`${listing.power} л.с.`} />
              <InfoRow label="Коробка" value={listing.transmission} />
              <InfoRow label="Привод" value={listing.drive} />
              <InfoRow label="Руль" value={listing.steering} />
            </SectionCard>

            {/* Body/paint — second per constraint */}
            <SectionCard title="Кузов и история">
              <InfoRow label="Пробег" value={`${listing.mileage.toLocaleString('ru-RU')} км`} />
              <InfoRow label="Кузов" value={listing.bodyType} />
              <InfoRow label="Цвет" value={listing.color} />
              <InfoRow
                label="Окрашено"
                value={paintLabel}
                valueClassName={listing.paintCount === 0 ? 'text-success' : 'text-warning'}
              />
              <InfoRow
                label="Автотека"
                value={avtotekaLabel}
                valueClassName={avtotekaTone}
              />
              {listing.paintedElements && listing.paintedElements.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {listing.paintedElements.map((element) => (
                    <span
                      key={element}
                      className="rounded-md bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning"
                    >
                      {element}
                    </span>
                  ))}
                </div>
              ) : null}
            </SectionCard>

            {/* Documents + Condition — merged */}
            <SectionCard title="Документы и состояние">
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <InfoRow
                  label="ПТС"
                  value={ptsLabel}
                  valueClassName={ptsTone}
                />
                <InfoRow label="Владельцев" value={String(listing.owners)} />
                {listing.registrations ? (
                  <InfoRow label="Регистраций" value={String(listing.registrations)} />
                ) : null}
                {listing.vin ? <InfoRow label="VIN" value={listing.vin} /> : null}
              </div>
              <div className="mt-4 space-y-1.5">
                <StatusBadge ok={!listing.taxi} label={listing.taxi ? 'Был в такси' : 'Не такси'} />
                <StatusBadge
                  ok={!listing.carsharing}
                  label={listing.carsharing ? 'Был в каршеринге' : 'Не каршеринг'}
                />
                {listing.accident != null ? (
                  <StatusBadge
                    ok={!listing.accident}
                    label={listing.accident ? 'Есть ДТП по отчёту' : 'ДТП не зафиксированы'}
                  />
                ) : null}
                <StatusBadge
                  ok={!listing.needsInvestment}
                  label={listing.needsInvestment ? 'Нужны вложения' : 'Без вложений'}
                />
                {listing.glassOriginal != null ? (
                  <StatusBadge
                    ok={Boolean(listing.glassOriginal)}
                    label={listing.glassOriginal ? 'Оригинальные стёкла' : 'Есть заменённые стёкла'}
                  />
                ) : null}
              </div>

              {listing.wheelSet || listing.extraTires ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/30 pt-4">
                  {listing.wheelSet ? (
                    <span className="rounded-full bg-[var(--accent-bg-soft)] px-3 py-1 text-xs font-medium text-teal-accent">
                      Комплект колёс
                    </span>
                  ) : null}
                  {listing.extraTires ? (
                    <span className="rounded-full bg-[var(--accent-bg-soft)] px-3 py-1 text-xs font-medium text-teal-accent">
                      Дополнительная резина
                    </span>
                  ) : null}
                </div>
              ) : null}

              {listing.conditionNote ? (
                <p className="mt-4 border-t border-border/30 pt-4 text-sm leading-relaxed text-muted-foreground">
                  {listing.conditionNote}
                </p>
              ) : null}
            </SectionCard>

            <VinReport vehicle={vehicle} />

            {listing.priceHistory && listing.priceHistory.length > 0 ? (
              <PriceHistoryChart items={listing.priceHistory} />
            ) : null}

            {/* Seller notes */}
            <SectionCard title="Комментарий продавца">
              <p className="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
            </SectionCard>
          </div>

          <div className="lg:col-span-4">
            <DealBlock listing={listing} currentUserId={sessionUser?.id} />
          </div>
        </div>

        <SimilarListings
          listings={similarListings}
          isAuthenticated={Boolean(sessionUser)}
          loginHref={loginHref}
        />
      </main>

      <footer className="relative z-10 mt-12 border-t border-border pt-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <span className="text-sm font-semibold">vin2win</span>
          <span className="text-xs text-muted-foreground">© 2025–2026</span>
        </div>
      </footer>
    </div>
  );
}
