import type { SaleListing } from './types';

export const SELLER_LABELS: Record<string, string> = {
  owner: 'Собственник',
  flip: 'Перепродажа',
  broker: 'Подбор',
  commission: 'Комиссия',
};

export function getListingTitle(listing: SaleListing): string {
  const base = `${listing.make} ${listing.model} ${listing.year}`;
  return listing.generation ? `${base} · ${listing.generation}` : base;
}

export function formatEngineDisplacement(value: number) {
  return `${value.toLocaleString('ru-RU', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} л`;
}

export function extractEngineDisplacement(
  listing: Pick<SaleListing, 'engine' | 'engineDisplacementL'>
) {
  if (listing.engineDisplacementL) {
    return listing.engineDisplacementL;
  }

  const match = listing.engine.match(/(\d+(?:[.,]\d+)?)\s*л/i);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatEngineSpec(
  listing: Pick<SaleListing, 'engine' | 'engineDisplacementL'>,
) {
  const engineDisplacement = extractEngineDisplacement(listing);

  if (!engineDisplacement) {
    return listing.engine;
  }

  if (/\d+(?:[.,]\d+)?\s*л/i.test(listing.engine)) {
    return listing.engine;
  }

  return `${listing.engine} · ${formatEngineDisplacement(engineDisplacement)}`;
}

export function formatPaintCountValue(count: number) {
  if (count === 0) {
    return 'Без окрасов';
  }

  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} элементов`;
  }

  if (mod10 === 1) {
    return `${count} элемент`;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} элемента`;
  }

  return `${count} элементов`;
}

export function getAvtotekaStatusLabel(status: SaleListing['avtotekaStatus']) {
  switch (status) {
    case 'green':
      return 'Зелёная';
    case 'yellow':
      return 'Есть замечания';
    case 'red':
      return 'Есть риски';
    case 'unknown':
      return 'Неизвестно';
    default:
      return 'Не указана';
  }
}

export function getPtsTypeLabel(listing: Pick<SaleListing, 'ptsType' | 'ptsOriginal'>) {
  if (listing.ptsType === 'epts') {
    return 'ЭПТС';
  }

  if (listing.ptsType === 'duplicate') {
    return 'Дубликат';
  }

  if (listing.ptsType === 'original') {
    return 'Оригинал';
  }

  return listing.ptsOriginal ? 'Оригинал' : 'Дубликат';
}

export function getPtsTypeToneClassName(listing: Pick<SaleListing, 'ptsType' | 'ptsOriginal'>) {
  if (listing.ptsType === 'epts') {
    return 'text-teal-accent';
  }

  return listing.ptsOriginal ? 'text-success' : 'text-warning';
}

export function getListingBadges(listing: SaleListing): string[] {
  const badges: string[] = [];
  if (listing.paintCount === 0) badges.push('без окрасов');
  if (listing.owners === 1) badges.push('1 хоз');
  if (!listing.taxi) badges.push('не такси');
  if (listing.ptsOriginal) badges.push('ориг. ПТС');
  if (!listing.needsInvestment) badges.push('без вложений');
  if (listing.avtotekaStatus === 'green') badges.push('автотека зелёная');
  if (listing.wheelSet) badges.push('комплект колёс');
  if (listing.extraTires) badges.push('доп. резина');
  return badges;
}

export function getListingAgeLabel(listing: Pick<SaleListing, 'publishedAt' | 'createdAt'>): string {
  const baseDate = new Date(listing.publishedAt ?? listing.createdAt);
  const diffDays = Math.max(0, Math.floor((Date.now() - baseDate.getTime()) / 86_400_000));

  if (diffDays <= 0) {
    return 'сегодня';
  }

  if (diffDays === 1) {
    return '1 день';
  }

  if (diffDays < 30) {
    return `${diffDays} дн.`;
  }

  const months = Math.max(1, Math.floor(diffDays / 30));
  if (months === 1) {
    return '1 месяц';
  }

  if (months < 5) {
    return `${months} месяца`;
  }

  return `${months} месяцев`;
}
