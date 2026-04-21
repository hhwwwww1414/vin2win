import regionDirectory from '@/lib/ru-regions.generated.json';

type RegionDirectoryItem = {
  type: string;
  name: string;
  cities: string[];
};

type RegionDirectoryJson = {
  items: RegionDirectoryItem[];
  cityToRegionKey: Record<string, string>;
};

const DIRECTORY = regionDirectory as RegionDirectoryJson;
const MOSCOW_REGION_KEY = 'обл|Московская';

type RegionPresentationOverride = {
  label: string;
  aliases?: string[];
  extraCities?: string[];
};

// Keep the Moscow label stable even if the generated directory falls back to
// the raw oblast name after a rebuild or data refresh.
const REGION_PRESENTATION_OVERRIDES: Record<string, RegionPresentationOverride> = {
  [MOSCOW_REGION_KEY]: {
    label: 'Москва и Московская область',
    aliases: ['Московская область', 'Москва и МО'],
    extraCities: ['Москва'],
  },
};

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

function formatRegionLabel(type: string, name: string) {
  switch (type) {
    case 'Респ':
      return `Республика ${name}`;
    case 'обл':
      return `${name} область`;
    case 'край':
      return `${name} край`;
    case 'АО':
      return name.includes('автоном') ? name : `${name} автономный округ`;
    case 'Аобл':
      return name.includes('автоном') ? name : `${name} автономная область`;
    case 'г':
    case 'гфз':
      return name;
    default:
      return [name, type].filter(Boolean).join(' ').trim();
  }
}

function buildRegionKey(type: string, name: string) {
  return `${type}|${name}`;
}

const regionItems = DIRECTORY.items.map((item) => {
  const key = buildRegionKey(item.type, item.name);
  const presentation = REGION_PRESENTATION_OVERRIDES[key];

  return {
    key,
    label: presentation?.label ?? formatRegionLabel(item.type, item.name),
    aliases: presentation?.aliases ?? [],
    cities: [...new Set([...(item.cities ?? []), ...(presentation?.extraCities ?? [])])],
  };
});

const regions = regionItems.map((item) => item.label).sort((left, right) => left.localeCompare(right, 'ru'));
const regionByNormalizedLookup = new Map<string, (typeof regionItems)[number]>();

for (const item of regionItems) {
  for (const lookupValue of [item.label, item.key, ...item.aliases]) {
    const normalizedLookupValue = normalizeLookupValue(lookupValue);
    if (!regionByNormalizedLookup.has(normalizedLookupValue)) {
      regionByNormalizedLookup.set(normalizedLookupValue, item);
    }
  }
}

const cityToRegion = new Map<string, string>();
const normalizedCityToRegion = new Map<string, string>();
const citiesByRegion = new Map<string, string[]>();

for (const item of regionItems) {
  const sortedCities = [...item.cities].sort((left, right) => left.localeCompare(right, 'ru'));
  citiesByRegion.set(item.label, sortedCities);

  for (const city of sortedCities) {
    if (!cityToRegion.has(city)) {
      cityToRegion.set(city, item.label);
    }

    const normalizedCity = normalizeLookupValue(city);
    if (!normalizedCityToRegion.has(normalizedCity)) {
      normalizedCityToRegion.set(normalizedCity, item.label);
    }
  }
}

export const RU_REGION_OPTIONS = regions;

export function getRuRegionOptions() {
  return RU_REGION_OPTIONS;
}

export function resolveRuRegion(region: string | undefined) {
  if (!region) {
    return undefined;
  }

  const normalized = normalizeLookupValue(region);
  return regionByNormalizedLookup.get(normalized)?.label;
}

export function getCitiesForRegion(region: string | undefined) {
  const resolvedRegion = resolveRuRegion(region);
  return resolvedRegion ? citiesByRegion.get(resolvedRegion) ?? [] : [];
}

export function getRegionForCity(city: string | undefined) {
  if (!city) {
    return undefined;
  }

  return cityToRegion.get(city) ?? normalizedCityToRegion.get(normalizeLookupValue(city));
}

export function getRegionsForCities(cities: string[]) {
  const matchedRegions = [...new Set(cities.map((city) => getRegionForCity(city)).filter((region): region is string => Boolean(region)))];
  return matchedRegions.sort((left, right) => left.localeCompare(right, 'ru'));
}

export function resolveRegionCitySelection(region: string | undefined, cities: string[]) {
  const resolvedRegion = resolveRuRegion(region);
  const requestedCities = [...new Set(cities.map((city) => city.trim()).filter(Boolean))];

  if (!resolvedRegion) {
    return {
      region: undefined,
      cities: requestedCities,
      exact: false,
      hasConflict: false,
    };
  }

  const regionCities = getCitiesForRegion(resolvedRegion);

  if (requestedCities.length === 0) {
    return {
      region: resolvedRegion,
      cities: regionCities,
      exact: true,
      hasConflict: false,
    };
  }

  const normalizedRegionCities = new Map(
    regionCities.map((city) => [normalizeLookupValue(city), city] as const),
  );
  const intersectedCities = requestedCities
    .map((city) => normalizedRegionCities.get(normalizeLookupValue(city)))
    .filter((city): city is string => Boolean(city));

  return {
    region: resolvedRegion,
    cities: [...new Set(intersectedCities)],
    exact: true,
    hasConflict: intersectedCities.length === 0,
  };
}
