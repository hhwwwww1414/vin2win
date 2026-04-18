import type { CSSProperties } from 'react';

function normalizePercent(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, value as number));
}

function normalizeZoom(value: number | undefined) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(2.5, value as number));
}

export function buildSellerProfileInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'SP';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function buildSellerProfileAboutText(input: {
  about?: string | null;
  name?: string;
}) {
  const about = input.about?.trim();
  if (about) {
    return about;
  }

  return `${input.name ?? 'Продавец'} расскажет здесь, чем занимается, как работает и почему ему можно доверять.`;
}

export function buildSellerProfileImageStyles(input: {
  cropX?: number;
  cropY?: number;
  zoom?: number;
}): Pick<CSSProperties, 'objectPosition' | 'transform'> {
  const cropX = normalizePercent(input.cropX, 50);
  const cropY = normalizePercent(input.cropY, 50);
  const zoom = normalizeZoom(input.zoom);

  return {
    objectPosition: `${cropX}% ${cropY}%`,
    transform: `scale(${Number(zoom.toFixed(2))})`,
  };
}
