/**
 * Маппинг марок на локальные SVG логотипы.
 * Файлы: /public/brands/{slug}.svg
 */
export const BRAND_LOGOS: Record<string, string> = {
  Лада: '/brands/lada.svg',
  Toyota: '/brands/toyota.svg',
  Hyundai: '/brands/hyundai.svg',
  Kia: '/brands/kia.svg',
  'Mercedes-Benz': '/brands/mercedes-benz.svg',
  Volkswagen: '/brands/volkswagen.svg',
  BMW: '/brands/bmw.svg',
  Nissan: '/brands/nissan.svg',
  Audi: '/brands/audi.svg',
  Skoda: '/brands/skoda.svg',
  Mazda: '/brands/mazda.svg',
  Chevrolet: '/brands/chevrolet.svg',
  Ford: '/brands/ford.svg',
  Mitsubishi: '/brands/mitsubishi.svg',
  Honda: '/brands/honda.svg',
  Subaru: '/brands/subaru.svg',
  Haval: '/brands/haval.svg',
};

export function getBrandLogoUrl(brandName: string): string | null {
  return BRAND_LOGOS[brandName] ?? null;
}
