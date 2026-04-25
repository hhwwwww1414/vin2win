const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildWantedListingSlug(input: {
  id: string;
  models: string[];
  region?: string | null;
  budgetMax?: number | null;
}) {
  const modelPart = slugify(input.models.join(' ').split(/\s+/).slice(0, 5).join(' '));
  const regionPart = input.region ? slugify(input.region) : '';
  const budgetPart = input.budgetMax ? `do-${Math.round(input.budgetMax / 1000)}k` : '';
  const shortId = input.id.slice(0, 6).toLowerCase();

  return [modelPart || 'zapros', regionPart, budgetPart, shortId].filter(Boolean).join('-');
}
