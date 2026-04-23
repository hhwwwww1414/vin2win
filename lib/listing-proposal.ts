import {
  formatEngineSpec,
  formatPaintCountValue,
  getAvtotekaStatusLabel,
  getPtsTypeLabel,
} from './listing-utils';
import { formatGroupedNumber } from './price-formatting';
import type { SaleListing } from './types';

export type ListingProposalTone = 'neutral' | 'positive' | 'warning';

export interface ListingProposalFact {
  label: string;
  value: string;
  tone?: ListingProposalTone;
}

export interface ListingProposalGalleryImage {
  label: string;
  url: string;
}

export interface ListingProposalMediaResources {
  galleryImages: ListingProposalGalleryImage[];
  reportUrl?: string;
  videoUrl?: string;
}

export interface ListingProposalSummary {
  title: string;
  subtitle: string;
  priceLabel: string;
  locationLabel: string;
  generatedAtLabel: string;
  lead: string;
  description: string;
  footerNote: string;
  highlights: string[];
  facts: ListingProposalFact[];
}

const PROPOSAL_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const MAX_HIGHLIGHTS = 4;
const MAX_DESCRIPTION_LENGTH = 180;

function sanitizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function getAvtotekaTone(status: SaleListing['avtotekaStatus']): ListingProposalTone {
  switch (status) {
    case 'green':
      return 'positive';
    case 'yellow':
    case 'red':
      return 'warning';
    default:
      return 'neutral';
  }
}

function getPaintTone(paintCount: number): ListingProposalTone {
  return paintCount === 0 ? 'positive' : 'warning';
}

function buildLead(listing: SaleListing) {
  if (listing.paintCount === 0 && listing.avtotekaStatus === 'green' && !listing.accident) {
    return 'Автомобиль в аккуратном состоянии, с прозрачной историей и понятной эксплуатацией.';
  }

  if (listing.paintCount === 0) {
    return 'По кузову без заявленных окрасов.';
  }

  if (listing.needsInvestment) {
    return 'Перед сделкой стоит отдельно проверить возможные вложения и технические нюансы.';
  }

  return 'В предложении указаны ключевые данные по состоянию и комплектации автомобиля.';
}

function buildHighlights(listing: SaleListing) {
  const highlights: string[] = [];

  if (listing.paintCount === 0) {
    highlights.push('Без окрасов');
  }

  if (listing.avtotekaStatus === 'green') {
    highlights.push('Зелёная автотека');
  }

  if (!listing.accident) {
    highlights.push('Без ДТП');
  }

  if (listing.keysCount && listing.keysCount >= 2) {
    highlights.push(`${listing.keysCount} ключа`);
  }

  if (!listing.taxi) {
    highlights.push('Не использовался в такси');
  }

  if (!listing.carsharing) {
    highlights.push('Без каршеринга');
  }

  if (listing.glassOriginal) {
    highlights.push('Оригинальные стёкла');
  }

  if (listing.wheelSet) {
    highlights.push('Комплект колёс');
  }

  if (listing.extraTires) {
    highlights.push('Дополнительная резина');
  }

  if (!listing.needsInvestment) {
    highlights.push('Без заявленных вложений');
  }

  return [...new Set(highlights)].slice(0, MAX_HIGHLIGHTS);
}

function pushUniqueGalleryImage(
  items: ListingProposalGalleryImage[],
  seenUrls: Set<string>,
  url: string | undefined,
  label: string
) {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl || seenUrls.has(normalizedUrl)) {
    return;
  }

  seenUrls.add(normalizedUrl);
  items.push({ label, url: normalizedUrl });
}

export function collectListingProposalGalleryImages(listing: SaleListing) {
  const images: ListingProposalGalleryImage[] = [];
  const seenUrls = new Set<string>();

  listing.images.forEach((url, index) => {
    pushUniqueGalleryImage(images, seenUrls, url, `Фото ${index + 1}`);
  });

  (listing.interiorImages ?? []).forEach((url, index) => {
    pushUniqueGalleryImage(images, seenUrls, url, `Салон ${index + 1}`);
  });

  return images;
}

export function getListingProposalMediaResources(listing: SaleListing): ListingProposalMediaResources {
  return {
    galleryImages: collectListingProposalGalleryImages(listing),
    reportUrl: listing.reportUrl,
    videoUrl: listing.videoUrl,
  };
}

export function getListingProposalTitle(listing: Pick<SaleListing, 'make' | 'model' | 'year'>) {
  return `${listing.make} ${listing.model}, ${listing.year}`;
}

export function getListingProposalDownloadFilename(
  listing: Pick<SaleListing, 'id' | 'year'>
) {
  return `commercial-proposal-${listing.year}-${listing.id}.pdf`;
}

export function buildListingProposalSummary(
  listing: SaleListing,
  now: Date = new Date()
): ListingProposalSummary {
  const description = truncateText(sanitizeText(listing.description), MAX_DESCRIPTION_LENGTH);

  return {
    title: getListingProposalTitle(listing),
    subtitle: 'Коммерческое предложение',
    priceLabel: `${formatGroupedNumber(listing.price)} руб.`,
    locationLabel: listing.inspectionCity ?? listing.city,
    generatedAtLabel: PROPOSAL_DATE_FORMATTER.format(now),
    lead: buildLead(listing),
    description:
      description ||
      'Подробное описание, фотографии и история проверок доступны в приложенных материалах.',
    footerNote: 'Фотографии, видео и отчёт приложены к предложению.',
    highlights: buildHighlights(listing),
    facts: [
      { label: 'Год выпуска', value: String(listing.year) },
      { label: 'Пробег', value: `${formatGroupedNumber(listing.mileage)} км` },
      { label: 'Двигатель', value: formatEngineSpec(listing) },
      { label: 'Мощность', value: `${formatGroupedNumber(listing.power)} л.с.` },
      { label: 'Коробка', value: listing.transmission },
      { label: 'Привод', value: listing.drive },
      { label: 'Кузов', value: listing.bodyType },
      { label: 'Цвет', value: listing.color },
      { label: 'Владельцы', value: `${formatGroupedNumber(listing.owners)}` },
      { label: 'ПТС', value: getPtsTypeLabel(listing) },
      {
        label: 'Окрасы',
        value: formatPaintCountValue(listing.paintCount),
        tone: getPaintTone(listing.paintCount),
      },
      {
        label: 'Автотека',
        value: getAvtotekaStatusLabel(listing.avtotekaStatus),
        tone: getAvtotekaTone(listing.avtotekaStatus),
      },
    ],
  };
}
