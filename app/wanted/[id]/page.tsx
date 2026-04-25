import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CarFront,
  CheckCircle2,
  Gauge,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { OpenChatButton } from '@/components/messages/open-chat-button';
import { ListingStatusBadge } from '@/components/listing/listing-status-badge';
import { SeoJsonLd } from '@/components/seo-json-ld';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace-data';
import { LISTING_STATUS_PANEL_CLASSES, getListingStatusLabel } from '@/lib/listing-status';
import { getSessionUser } from '@/lib/server/auth';
import { getWantedListingById } from '@/lib/server/marketplace';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  formatRubPrice,
  sanitizeSeoText,
} from '@/lib/seo';
import { cn } from '@/lib/utils';

interface WantedPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

function formatHumanDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function getTelegramUsername(contact: string) {
  const normalized = contact
    .trim()
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^tg\/@/i, '')
    .replace(/^@/i, '');

  return /^[a-z0-9_]{4,}$/i.test(normalized) ? normalized : null;
}

function getPhoneHref(contact: string) {
  const digits = contact.replace(/\D/g, '');
  if (digits.length < 10) {
    return null;
  }

  const normalized = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
  return `tel:+${normalized}`;
}

export async function generateMetadata({ params }: WantedPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getWantedListingById(id);

  if (!listing) {
    return {
      title: 'Запрос не найден',
      description: 'Запрошенный запрос на подбор недоступен на vin2win.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const models = sanitizeSeoText(listing.models.join(', '), 'Автомобиль', 80);
  const title = `${models} — запрос в подбор`;
  const description = sanitizeSeoText(
    `${models} — запрос в подбор на vin2win. Бюджет: до ${formatRubPrice(
      listing.budgetMax
    )} ₽. B2B авторынок для профессионалов.`,
    DEFAULT_DESCRIPTION,
    170
  );
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/wanted/${listing.id}`),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/wanted/${listing.id}`),
      type: 'website',
      locale: 'ru_RU',
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — запросы в подбор`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function WantedDetailPage({ params }: WantedPageProps) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  const w = await getWantedListingById(id, sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined);

  if (!w) {
    notFound();
  }

  if (id !== w.id) {
    permanentRedirect(`/wanted/${w.id}`);
  }

  const budgetLabel = w.budgetMin
    ? `${formatPrice(w.budgetMin)} — ${formatPrice(w.budgetMax)}`
    : `до ${formatPrice(w.budgetMax)}`;
  const createdAtLabel = formatHumanDate(w.createdAt);
  const restrictions = w.restrictions ?? [];
  const telegramUsername = getTelegramUsername(w.contact);
  const telegramHref = telegramUsername ? `https://t.me/${telegramUsername}` : null;
  const phoneHref = getPhoneHref(w.contact);
  const primaryActionHref = telegramHref ?? phoneHref;
  const primaryActionLabel = telegramHref ? 'Написать в Telegram' : phoneHref ? 'Позвонить' : null;
  const primaryActionIcon = telegramHref ? MessageCircle : Phone;
  const briefItems = [
    {
      label: 'Бюджет',
      value: budgetLabel,
      icon: Wallet,
    },
    {
      label: 'Год от',
      value: w.yearFrom ? String(w.yearFrom) : 'Без нижней границы',
      icon: Calendar,
    },
    {
      label: 'Пробег',
      value: w.mileageMax ? `до ${w.mileageMax.toLocaleString('ru-RU')} км` : 'Без ограничения',
      icon: Gauge,
    },
    {
      label: 'Владельцы',
      value: w.ownersMax ? `до ${w.ownersMax}` : 'Без ограничения',
      icon: Users,
    },
    {
      label: 'Техника',
      value: [w.engine, w.transmission, w.drive].filter(Boolean).join(' • ') || 'Гибкий подбор',
      icon: CarFront,
    },
    {
      label: 'Регион',
      value: w.region ?? 'Любой регион',
      icon: MapPin,
    },
  ];
  const heroStats = [
    {
      label: 'Моделей в брифе',
      value: String(w.models.length),
      note: w.models.length > 1 ? 'альтернативы уже заданы заранее' : 'запрос сфокусирован на одной модели',
    },
    {
      label: 'Ограничений',
      value: String(restrictions.length + 1),
      note: 'история, окрасы и допуски собраны в одном месте',
    },
    {
      label: 'Автор запроса',
      value: w.author.name,
      note: `на платформе с ${w.author.onPlatformSince}`,
    },
    {
      label: 'Контакт',
      value: telegramUsername ? `@${telegramUsername}` : w.contact,
      note: primaryActionLabel ? 'канал ответа уже готов' : 'контакт указан в описании запроса',
    },
  ];
  const contactFacts = [
    { label: 'Бюджет', value: budgetLabel },
    { label: 'Год от', value: w.yearFrom ? String(w.yearFrom) : 'Без ограничения' },
    { label: 'Пробег', value: w.mileageMax ? `до ${w.mileageMax.toLocaleString('ru-RU')} км` : 'Без ограничения' },
    { label: 'Регион', value: w.region ?? 'Любой регион' },
  ];
  const responseChecklist = [
    'Отвечайте сразу реальным состоянием, а не общими обещаниями.',
    'Если есть история или отчеты, лучше приложить их в первом сообщении.',
    'Чем точнее лот совпадает с брифом, тем выше шанс быстрого ответа.',
  ];
  const PrimaryActionIcon = primaryActionIcon;
  const modelsTitle = sanitizeSeoText(w.models.join(', '), 'Автомобиль', 80);
  const breadcrumbsJsonLd = breadcrumbJsonLd([
    { name: 'Главная', path: '/' },
    { name: 'Запросы в подбор', path: '/wanted' },
    { name: modelsTitle, path: `/wanted/${w.id}` },
  ]);
  const wantedPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${modelsTitle} — запрос в подбор`,
    url: absoluteUrl(`/wanted/${w.id}`),
    inLanguage: 'ru-RU',
    description: `${modelsTitle} — запрос в подбор на vin2win. Бюджет: до ${formatRubPrice(
      w.budgetMax
    )} ₽. B2B авторынок для профессионалов.`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
    about: {
      '@type': 'Thing',
      name: modelsTitle,
    },
  };

  return (
    <div className="relative isolate min-h-full">
      <SeoJsonLd data={breadcrumbsJsonLd} />
      <SeoJsonLd data={wantedPageJsonLd} />
      <MarketplaceHeader />
      <main id="page-main" className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/wanted" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            В подбор
          </Link>
          <span>/</span>
          <span className="line-clamp-1 font-medium text-foreground">{w.models.join(', ')}</span>
        </nav>

        {w.status && w.status !== 'PUBLISHED' ? (
          <div className={cn('mb-4 rounded-2xl border px-4 py-3', LISTING_STATUS_PANEL_CLASSES[w.status])}>
            <div className="flex flex-wrap items-center gap-3">
              <ListingStatusBadge status={w.status} />
              <p className="text-sm">
                Запрос доступен только владельцу и модераторам до публикации. Текущий статус: {getListingStatusLabel(w.status)}.
              </p>
            </div>
            {w.moderationNote ? <p className="mt-2 text-sm text-muted-foreground">{w.moderationNote}</p> : null}
          </div>
        ) : null}

        <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />

          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  Wanted detail
                </span>
                {w.status ? <ListingStatusBadge status={w.status} /> : null}
                {w.author.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Верифицированный автор
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
                {w.models.join(', ')}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Бриф сформирован под быстрый отклик: бюджет, ограничения по истории и ключевые
                технические рамки уже собраны в одном месте, чтобы продавец сразу понимал,
                подходит ли его автомобиль под запрос.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Бюджет: {budgetLabel}
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Регион: {w.region ?? 'Любой'}
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Создан: {createdAtLabel}
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Автор: {w.author.name}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <OpenChatButton
                  contextType="WANTED_LISTING"
                  listingId={w.id}
                  currentUserId={sessionUser?.id}
                  ownerUserId={w.ownerUserId}
                  nextPath={`/wanted/${w.id}`}
                  className="border-border/80 bg-background/70 dark:bg-background/10"
                />
                {primaryActionHref && primaryActionLabel ? (
                  <Button
                    asChild
                    className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                  >
                    <a href={primaryActionHref} id="wanted-primary-action">
                      <PrimaryActionIcon className="h-4 w-4" />
                      {primaryActionLabel}
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="border-border/80 bg-background/70 dark:bg-background/10">
                  <Link href="#wanted-contact">Перейти к контактам</Link>
                </Button>
                <Button asChild variant="outline" className="border-border/80 bg-background/70 dark:bg-background/10">
                  <Link href="/wanted">Вернуться к ленте</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {heroStats.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur dark:bg-background/10"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold text-foreground">{card.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                Ключевые параметры
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Технический бриф</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Здесь собраны жесткие рамки по бюджету, возрасту, пробегу и технике, чтобы
                поставщик мог быстро сверить свой лот с условиями запроса.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {briefItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <Icon className="h-3.5 w-3.5 text-teal-accent" />
                        {item.label}
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Целевые модели
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {w.models.map((model) => (
                    <span
                      key={model}
                      className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground dark:bg-background/10"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                Quality gates
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Ограничения и допуски</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Блок формулирует требования к истории автомобиля и помогает быстро понять,
                допустимы ли компромиссы по окрасам и эксплуатации.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {restrictions.map((restriction) => (
                  <div
                    key={restriction}
                    className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-4 text-sm font-medium text-foreground"
                  >
                    <div className="flex items-start gap-3">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <span>{restriction}</span>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-4 text-sm font-medium text-foreground">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{w.paintAllowed ? 'Окрасы допустимы, если остальная история прозрачна.' : 'Без окрасов: кузовная история должна быть чистой.'}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 text-sm font-medium text-foreground dark:bg-background/10">
                  <div className="flex items-start gap-3">
                    <Palette className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
                    <span>Фокус на реальных совпадениях с брифом, а не на широком предварительном отборе.</span>
                  </div>
                </div>
              </div>
            </section>

            {w.comment ? (
              <section className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                  Контекст
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Комментарий к запросу</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{w.comment}</p>
              </section>
            ) : null}
          </div>

          <aside id="wanted-contact" className="lg:sticky lg:top-20 lg:self-start">
            <section className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                Response rail
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Ответить на запрос</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Канал связи и краткий snapshot вынесены в отдельный rail, чтобы отвечать на запрос
                было проще и с десктопа, и с мобильного.
              </p>

              <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{w.author.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      На платформе с {w.author.onPlatformSince}
                    </p>
                  </div>
                  {w.author.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Проверен
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  {primaryActionHref && primaryActionLabel ? (
                    <a
                      href={primaryActionHref}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-dark px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95 dark:bg-teal-accent dark:text-[#09090B]"
                    >
                      <PrimaryActionIcon className="h-4 w-4" />
                      {primaryActionLabel}
                    </a>
                  ) : null}
                  {telegramHref && phoneHref ? (
                    <a
                      href={phoneHref}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
                    >
                      <Phone className="h-4 w-4" />
                      Позвонить
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm font-medium text-foreground dark:bg-background/10">
                  {telegramUsername ? `@${telegramUsername}` : w.contact}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {contactFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 dark:bg-background/10"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {fact.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{fact.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Как отвечать эффективнее
                </p>
                <div className="mt-4 space-y-3">
                  {responseChecklist.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
