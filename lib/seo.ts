import type { Metadata } from 'next';

export const SITE_URL = 'https://vin2win.ru';
export const SITE_NAME = 'vin2win';
export const DEFAULT_OG_IMAGE = 'https://vin2win.ru/og-default.png';
export const DEFAULT_TITLE = 'vin2win — профессиональный авторынок России';
export const DEFAULT_DESCRIPTION =
  'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: объявления, запросы в подбор, фильтры, сравнение и сохранение поисков.';
export const SEO_STATIC_LAST_MODIFIED = new Date('2026-04-25T00:00:00.000Z');

export function normalizeSiteUrl(url = SITE_URL) {
  return url.replace(/\/+$/, '').replace('://www.', '://');
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizeSiteUrl()}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function buildLanguageAlternates(path = '/') {
  const url = absoluteUrl(path);

  return {
    ru: url,
    'x-default': url,
  };
}

export function safeJsonLd(data: unknown) {
  return JSON.stringify(data, (_key, value) => (value === undefined ? undefined : value)).replace(
    /</g,
    '\\u003c'
  );
}

export function sanitizeSeoText(value: unknown, fallback = '', maxLength = 160) {
  const text = String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const safeText = text || fallback;

  if (safeText.length <= maxLength) {
    return safeText;
  }

  const trimmed = safeText.slice(0, maxLength - 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  return `${trimmed.slice(0, lastSpace > 80 ? lastSpace : trimmed.length).trim()}…`;
}

export function buildSeoTitle(parts: Array<string | number | null | undefined>, fallback = DEFAULT_TITLE) {
  const title = parts
    .map((part) => sanitizeSeoText(part, '', 80))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return title || fallback;
}

function isValidPublicHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getPublicContactEmail() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

export function getPublicSocialUrls() {
  return [
    process.env.NEXT_PUBLIC_TELEGRAM_URL,
    process.env.NEXT_PUBLIC_VK_URL,
    process.env.NEXT_PUBLIC_YOUTUBE_URL,
    process.env.NEXT_PUBLIC_DZEN_URL,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => isValidPublicHttpUrl(value));
}

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const cleanTitle = sanitizeSeoText(title, DEFAULT_TITLE, 90);
  const cleanDescription = sanitizeSeoText(description, DEFAULT_DESCRIPTION, 180);
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title: cleanTitle,
    description: cleanDescription,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title: cleanTitle,
      description: cleanDescription,
      url,
      type: 'website',
      locale: 'ru_RU',
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — профессиональный авторынок России`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description: cleanDescription,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: sanitizeSeoText(item.name, SITE_NAME, 80),
      item: absoluteUrl(item.path),
    })),
  };
}

export function formatRubPrice(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return '';
  }

  return new Intl.NumberFormat('ru-RU').format(Number(value));
}
