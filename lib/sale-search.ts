import { formatPrice } from '@/lib/price-formatting';
import type { ResourceStatus, SaleSearchFilters, SaleSearchSortKey, SellerType } from '@/lib/types';

type SearchParamSource = URLSearchParams | Record<string, string | string[] | undefined>;
interface ParseSaleSearchParamsOptions {
  applyQuickFilterAliases?: boolean;
  dedupeQuickFilterAliases?: boolean;
}

export const SALE_SEARCH_DEFAULT_LIMIT = 20;
export const SALE_SEARCH_MAX_LIMIT = 60;
export const SALE_SEARCH_FILTER_PARAM = 'filter';

export const SALE_SEARCH_SORT_OPTIONS: Array<{ value: SaleSearchSortKey; label: string }> = [
  { value: 'date', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
  { value: 'mileage', label: 'Меньше пробег' },
  { value: 'year_desc', label: 'По году: новее' },
  { value: 'year_asc', label: 'По году: старше' },
  { value: 'views', label: 'По просмотрам' },
  { value: 'benefit_desc', label: 'По выгоде' },
];

const VALID_SORTS = new Set<SaleSearchSortKey>(SALE_SEARCH_SORT_OPTIONS.map((option) => option.value));
const ARRAY_KEYS = new Set([
  'make',
  'model',
  'bodyType',
  'transmission',
  'drive',
  'color',
  'city',
  'resourceStatus',
  'sellerType',
  SALE_SEARCH_FILTER_PARAM,
]);

const RESOURCE_STATUS_VALUES = new Set<ResourceStatus>(['not_listed', 'on_resources', 'pre_resources']);
const SELLER_TYPE_VALUES = new Set<SellerType>(['owner', 'flip', 'broker', 'commission']);

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeArray(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getParamValues(source: SearchParamSource, key: string): string[] {
  if (source instanceof URLSearchParams) {
    return source.getAll(key).map((value) => value.trim()).filter(Boolean);
  }

  const raw = source[key];
  if (Array.isArray(raw)) {
    return raw.map((value) => value.trim()).filter(Boolean);
  }

  if (typeof raw === 'string') {
    if (ARRAY_KEYS.has(key)) {
      return raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    }

    const value = raw.trim();
    return value ? [value] : [];
  }

  return [];
}

function getSingleParam(source: SearchParamSource, key: string): string | undefined {
  return getParamValues(source, key)[0];
}

function parseOptionalNumber(source: SearchParamSource, key: string): number | undefined {
  const raw = getSingleParam(source, key);
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function parseOptionalPositiveInt(source: SearchParamSource, key: string): number | undefined {
  const parsed = parseOptionalNumber(source, key);
  if (!parsed) {
    return undefined;
  }

  const rounded = Math.round(parsed);
  return rounded > 0 ? rounded : undefined;
}

function parseOptionalPositiveFloat(source: SearchParamSource, key: string): number | undefined {
  const parsed = parseOptionalNumber(source, key);
  if (!parsed || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function parseBooleanParam(source: SearchParamSource, key: string): boolean | undefined {
  const raw = getSingleParam(source, key)?.toLowerCase();
  if (!raw) {
    return undefined;
  }

  if (raw === '1' || raw === 'true' || raw === 'yes') {
    return true;
  }

  if (raw === '0' || raw === 'false' || raw === 'no') {
    return false;
  }

  return undefined;
}

export function createDefaultSaleSearchFilters(): SaleSearchFilters {
  return {
    make: [],
    model: [],
    region: undefined,
    bodyType: [],
    transmission: [],
    drive: [],
    color: [],
    city: [],
    resourceStatus: [],
    sellerType: [],
    filters: [],
    sort: 'date',
    page: 1,
    limit: SALE_SEARCH_DEFAULT_LIMIT,
  };
}

export function parseSaleSearchParams(
  source: SearchParamSource,
  { applyQuickFilterAliases: shouldApplyQuickFilterAliases = true, dedupeQuickFilterAliases = false }: ParseSaleSearchParamsOptions = {}
): SaleSearchFilters {
  const filters = createDefaultSaleSearchFilters();

  filters.make = normalizeArray(getParamValues(source, 'make'));
  filters.model = normalizeArray(getParamValues(source, 'model'));
  filters.region = getSingleParam(source, 'region');
  filters.bodyType = normalizeArray(getParamValues(source, 'bodyType'));
  filters.transmission = normalizeArray(getParamValues(source, 'transmission'));
  filters.drive = normalizeArray(getParamValues(source, 'drive'));
  filters.color = normalizeArray(getParamValues(source, 'color'));
  filters.city = normalizeArray(getParamValues(source, 'city'));
  filters.resourceStatus = normalizeArray(getParamValues(source, 'resourceStatus')).filter((value): value is ResourceStatus =>
    RESOURCE_STATUS_VALUES.has(value as ResourceStatus)
  );
  filters.sellerType = normalizeArray(getParamValues(source, 'sellerType')).filter((value): value is SellerType =>
    SELLER_TYPE_VALUES.has(value as SellerType)
  );
  filters.filters = normalizeArray(getParamValues(source, SALE_SEARCH_FILTER_PARAM));

  filters.yearFrom = parseOptionalPositiveInt(source, 'yearFrom');
  filters.yearTo = parseOptionalPositiveInt(source, 'yearTo');
  filters.priceMin = parseOptionalPositiveInt(source, 'priceMin');
  filters.priceMax = parseOptionalPositiveInt(source, 'priceMax');
  filters.mileageMin = parseOptionalPositiveInt(source, 'mileageMin');
  filters.mileageMax = parseOptionalPositiveInt(source, 'mileageMax');
  filters.engineDisplacementMin = parseOptionalPositiveFloat(source, 'engineDisplacementMin');
  filters.engineDisplacementMax = parseOptionalPositiveFloat(source, 'engineDisplacementMax');
  filters.powerMin = parseOptionalPositiveInt(source, 'powerMin');
  filters.powerMax = parseOptionalPositiveInt(source, 'powerMax');
  filters.paintCountMax = parseOptionalPositiveInt(source, 'paintCountMax');
  filters.ownersMax = parseOptionalPositiveInt(source, 'ownersMax');

  filters.ptsOriginal = parseBooleanParam(source, 'ptsOriginal');
  const avtotekaStatus = getSingleParam(source, 'avtotekaStatus');
  filters.avtotekaStatus = avtotekaStatus === 'green' ? 'green' : avtotekaStatus === 'any' ? 'any' : undefined;
  filters.noAccident = parseBooleanParam(source, 'noAccident');
  filters.noTaxi = parseBooleanParam(source, 'noTaxi');
  filters.noCarsharing = parseBooleanParam(source, 'noCarsharing');
  filters.hasPhoto = parseBooleanParam(source, 'hasPhoto');
  filters.priceInHand = parseBooleanParam(source, 'priceInHand');
  filters.hasBenefit = parseBooleanParam(source, 'hasBenefit');
  filters.benefitMin = parseOptionalPositiveInt(source, 'benefitMin');
  filters.benefitMax = parseOptionalPositiveInt(source, 'benefitMax');
  filters.noInvestment = parseBooleanParam(source, 'noInvestment');

  const sort = getSingleParam(source, 'sort');
  filters.sort = sort && VALID_SORTS.has(sort as SaleSearchSortKey) ? (sort as SaleSearchSortKey) : 'date';

  const page = parseOptionalPositiveInt(source, 'page');
  const limit = parseOptionalPositiveInt(source, 'limit');
  filters.page = page ?? 1;
  filters.limit = limit ? Math.min(limit, SALE_SEARCH_MAX_LIMIT) : SALE_SEARCH_DEFAULT_LIMIT;

  if (dedupeQuickFilterAliases) {
    removeQuickFilterAliasDuplicates(filters);
  }

  if (shouldApplyQuickFilterAliases) {
    applyQuickFilterAliases(filters);
  }

  return filters;
}

function applyQuickFilterAliases(filters: SaleSearchFilters) {
  if (filters.filters.includes('pre_resources') && !filters.resourceStatus.includes('pre_resources')) {
    filters.resourceStatus = [...filters.resourceStatus, 'pre_resources'];
  }

  if (filters.filters.includes('on_resources') && !filters.resourceStatus.includes('on_resources')) {
    filters.resourceStatus = [...filters.resourceStatus, 'on_resources'];
  }

  if (filters.filters.includes('no_paint')) {
    filters.paintCountMax = 0;
  }

  if (filters.filters.includes('owners_12')) {
    filters.ownersMax = filters.ownersMax ? Math.min(filters.ownersMax, 2) : 2;
  }

  if (filters.filters.includes('pts_original')) {
    filters.ptsOriginal = true;
  }

  if (filters.filters.includes('avtoteka_green')) {
    filters.avtotekaStatus = 'green';
  }

  if (filters.filters.includes('no_taxi')) {
    filters.noTaxi = true;
  }

  if (filters.filters.includes('price_in_hand')) {
    filters.priceInHand = true;
  }

  if (filters.filters.includes('no_invest')) {
    filters.noInvestment = true;
  }
}

function removeQuickFilterAliasDuplicates(filters: SaleSearchFilters) {
  if (filters.filters.includes('pre_resources')) {
    filters.resourceStatus = filters.resourceStatus.filter((value) => value !== 'pre_resources');
  }

  if (filters.filters.includes('on_resources')) {
    filters.resourceStatus = filters.resourceStatus.filter((value) => value !== 'on_resources');
  }

  if (filters.filters.includes('no_paint') && filters.paintCountMax === 0) {
    filters.paintCountMax = undefined;
  }

  if (filters.filters.includes('owners_12') && filters.ownersMax !== undefined && filters.ownersMax <= 2) {
    filters.ownersMax = undefined;
  }

  if (filters.filters.includes('pts_original') && filters.ptsOriginal) {
    filters.ptsOriginal = undefined;
  }

  if (filters.filters.includes('avtoteka_green') && filters.avtotekaStatus === 'green') {
    filters.avtotekaStatus = undefined;
  }

  if (filters.filters.includes('no_taxi') && filters.noTaxi) {
    filters.noTaxi = undefined;
  }

  if (filters.filters.includes('price_in_hand') && filters.priceInHand) {
    filters.priceInHand = undefined;
  }

  if (filters.filters.includes('no_invest') && filters.noInvestment) {
    filters.noInvestment = undefined;
  }
}

function appendArray(params: URLSearchParams, key: string, values: string[]) {
  values.forEach((value) => params.append(key, value));
}

export function buildSaleSearchParams(filters: Partial<SaleSearchFilters>): URLSearchParams {
  const params = new URLSearchParams();

  appendArray(params, 'make', normalizeArray(filters.make ?? []));
  appendArray(params, 'model', normalizeArray(filters.model ?? []));
  if (filters.region?.trim()) params.set('region', filters.region.trim());
  appendArray(params, 'bodyType', normalizeArray(filters.bodyType ?? []));
  appendArray(params, 'transmission', normalizeArray(filters.transmission ?? []));
  appendArray(params, 'drive', normalizeArray(filters.drive ?? []));
  appendArray(params, 'color', normalizeArray(filters.color ?? []));
  appendArray(params, 'city', normalizeArray(filters.city ?? []));
  appendArray(params, 'resourceStatus', normalizeArray(filters.resourceStatus ?? []));
  appendArray(params, 'sellerType', normalizeArray(filters.sellerType ?? []));
  appendArray(params, SALE_SEARCH_FILTER_PARAM, normalizeArray(filters.filters ?? []));

  if (filters.yearFrom) params.set('yearFrom', String(filters.yearFrom));
  if (filters.yearTo) params.set('yearTo', String(filters.yearTo));
  if (filters.priceMin) params.set('priceMin', String(filters.priceMin));
  if (filters.priceMax) params.set('priceMax', String(filters.priceMax));
  if (filters.mileageMin) params.set('mileageMin', String(filters.mileageMin));
  if (filters.mileageMax) params.set('mileageMax', String(filters.mileageMax));
  if (filters.engineDisplacementMin) params.set('engineDisplacementMin', String(filters.engineDisplacementMin));
  if (filters.engineDisplacementMax) params.set('engineDisplacementMax', String(filters.engineDisplacementMax));
  if (filters.powerMin) params.set('powerMin', String(filters.powerMin));
  if (filters.powerMax) params.set('powerMax', String(filters.powerMax));
  if (filters.paintCountMax !== undefined) params.set('paintCountMax', String(filters.paintCountMax));
  if (filters.ownersMax) params.set('ownersMax', String(filters.ownersMax));
  if (filters.ptsOriginal) params.set('ptsOriginal', 'true');
  if (filters.avtotekaStatus) params.set('avtotekaStatus', filters.avtotekaStatus);
  if (filters.noAccident) params.set('noAccident', 'true');
  if (filters.noTaxi) params.set('noTaxi', 'true');
  if (filters.noCarsharing) params.set('noCarsharing', 'true');
  if (filters.hasPhoto) params.set('hasPhoto', 'true');
  if (filters.priceInHand) params.set('priceInHand', 'true');
  if (filters.hasBenefit) params.set('hasBenefit', 'true');
  if (filters.benefitMin) params.set('benefitMin', String(filters.benefitMin));
  if (filters.benefitMax) params.set('benefitMax', String(filters.benefitMax));
  if (filters.noInvestment) params.set('noInvestment', 'true');

  if (filters.sort && filters.sort !== 'date') params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.limit && filters.limit !== SALE_SEARCH_DEFAULT_LIMIT) params.set('limit', String(filters.limit));

  return params;
}

export function getSaleSearchQueryString(filters: Partial<SaleSearchFilters>): string {
  return buildSaleSearchParams(filters).toString();
}

export function hasActiveSaleSearchFilters(filters: Partial<SaleSearchFilters>): boolean {
  const params = buildSaleSearchParams({
    ...filters,
    sort: 'date',
    page: 1,
    limit: SALE_SEARCH_DEFAULT_LIMIT,
  });

  return [...params.keys()].some((key) => key !== 'sort' && key !== 'page' && key !== 'limit');
}

export function describeSaleSearch(filters: Partial<SaleSearchFilters>): string {
  const parts: string[] = [];

  if (filters.make?.length) {
    parts.push(filters.make.join(', '));
  }

  if (filters.model?.length) {
    parts.push(`модель: ${filters.model.join(', ')}`);
  }

  if (filters.region) {
    parts.push(`регион: ${filters.region}`);
  }

  if (filters.priceMin || filters.priceMax) {
    parts.push(
      `цена ${filters.priceMin ? `от ${formatPrice(filters.priceMin)}` : ''}${filters.priceMin && filters.priceMax ? ' ' : ''}${filters.priceMax ? `до ${formatPrice(filters.priceMax)}` : ''}`.trim()
    );
  }

  if (filters.yearFrom || filters.yearTo) {
    parts.push(`год ${filters.yearFrom ?? '...'}-${filters.yearTo ?? '...'}`);
  }

  if (filters.mileageMin || filters.mileageMax) {
    parts.push(
      `пробег ${filters.mileageMin ? `от ${filters.mileageMin.toLocaleString('ru-RU')} км` : ''}${filters.mileageMin && filters.mileageMax ? ' ' : ''}${filters.mileageMax ? `до ${filters.mileageMax.toLocaleString('ru-RU')} км` : ''}`.trim(),
    );
  }

  if (filters.engineDisplacementMin || filters.engineDisplacementMax) {
    parts.push(
      `объем ${filters.engineDisplacementMin ? `от ${filters.engineDisplacementMin.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} л` : ''}${filters.engineDisplacementMin && filters.engineDisplacementMax ? ' ' : ''}${filters.engineDisplacementMax ? `до ${filters.engineDisplacementMax.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} л` : ''}`.trim(),
    );
  }

  if (filters.city?.length) {
    parts.push(filters.city.join(', '));
  }

  return parts.filter(Boolean).join(' · ') || 'Все опубликованные объявления';
}

export function cleanSaleSearchFiltersForPersistence(filters: Partial<SaleSearchFilters>): SaleSearchFilters {
  return parseSaleSearchParams(buildSaleSearchParams(filters));
}

export function getSaleSearchRequestParams(searchParams: URLSearchParams): URLSearchParams {
  return buildSaleSearchParams(parseSaleSearchParams(searchParams));
}

export function getSaleSearchCurrentStepLabel(sort: SaleSearchSortKey) {
  return SALE_SEARCH_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? SALE_SEARCH_SORT_OPTIONS[0].label;
}

export function normalizeSaleSearchName(name: string | undefined, fallback: string) {
  const trimmed = normalizeString(name);
  return trimmed || fallback;
}
