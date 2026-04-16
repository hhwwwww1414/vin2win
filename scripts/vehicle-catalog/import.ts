import fs from 'node:fs';
import path from 'node:path';
import type {
  Prisma,
  PrismaClient,
  VehicleCatalogEntityType,
  VehicleConfidence,
  VehicleSourceCode,
} from '@prisma/client';
import { VehicleImportStatus } from '@prisma/client';
import {
  createVehicleModificationLabel,
  normalizeVehicleBodyType,
  normalizeVehicleDriveType,
  normalizeVehicleFuelType,
  normalizeVehicleTransmission,
  parseSourceYearRange,
} from '@/lib/vehicle-catalog/normalization';
import {
  carApiPath,
  checksumPayload,
  chunkItems,
  createCatalogPrismaClient,
  createDeterministicCatalogId,
  decodeHtmlEntities,
  hasCliFlag,
  normalizeCatalogText,
  openVehicleDbMakesPath,
  openVehicleDbStylesRoot,
  parseDisplacementLiters,
  parseInteger,
  parsePowerHp,
  readJsonFile,
  readZippedJsonFiles,
  simpleRuTransliteration,
  slugifyCatalogValue,
  automobileModelsSpecsZipPath,
} from './common';

type RawRecordSeed = {
  recordType: string;
  externalId: string;
  checksum: string;
  brandName?: string;
  modelName?: string;
  productionStartYear?: number;
  productionEndYear?: number;
  payload: unknown;
};

type SourceMappingSeed = {
  sourceCode: VehicleSourceCode;
  entityType: VehicleCatalogEntityType;
  entityId: string;
  externalId: string;
  externalParentId?: string;
  sourceLabel?: string;
  confidence?: VehicleConfidence;
  payload?: unknown;
};

type BrandSeed = {
  id: string;
  slug: string;
  normalizedName: string;
  name: string;
  nameRu?: string;
  nameOriginal?: string;
  market: string;
  lowConfidence: boolean;
  aliases: Set<string>;
};

type ModelSeed = {
  id: string;
  brandId: string;
  brandSlug: string;
  slug: string;
  normalizedName: string;
  name: string;
  nameRu?: string;
  nameOriginal?: string;
  productionStartYear?: number;
  productionEndYear?: number;
  market: string;
  lowConfidence: boolean;
  aliases: Set<string>;
};

type GenerationSeed = {
  id: string;
  modelId: string;
  slug: string;
  label: string;
  labelRu: string;
  generationName?: string;
  generationCode?: string;
  restylingLabel?: string;
  isRestyling: boolean;
  bodyTypeId?: string;
  productionStartYear?: number;
  productionEndYear?: number;
  market: string;
  lowConfidence: boolean;
};

type EngineSeed = {
  id: string;
  fuelTypeId: string;
  slug: string;
  label: string;
  displacementCc?: number;
  displacementL?: number;
  powerHp?: number;
  cylinders?: string;
  engineCode?: string;
  aspiration?: string;
  layout?: string;
  evMotor?: string;
  market: string;
  lowConfidence: boolean;
};

type TrimSeed = {
  id: string;
  modelId?: string;
  slug: string;
  name: string;
  nameRu?: string;
  market: string;
  lowConfidence: boolean;
};

type ModificationSeed = {
  id: string;
  generationId: string;
  bodyTypeId: string;
  engineId?: string;
  transmissionId?: string;
  driveTypeId?: string;
  trimId?: string;
  slug: string;
  name: string;
  label: string;
  productionStartYear?: number;
  productionEndYear?: number;
  doors?: number;
  seats?: number;
  powerHp?: number;
  engineVolumeL?: number;
  market: string;
  lowConfidence: boolean;
};

type BodyRangeHint = {
  bodyTypeId: string;
  startYear?: number;
  endYear?: number;
};

type AutoMeta = {
  autoId: number;
  brandSeed: BrandSeed;
  modelSeed: ModelSeed;
  generationSeed: GenerationSeed;
  bodyTypeId: string;
  startYear?: number;
  endYear?: number;
  trimName?: string;
  title: string;
  lowConfidence: boolean;
};

type CarApiBrand = {
  brand: string;
  models: Array<{
    name: string;
    generations: Array<{
      name: string;
      yearFrom: number | null;
      yearTo: number | null;
    }>;
  }>;
};

type OpenVehicleDbMake = {
  make_name: string;
  make_slug: string;
  models: Record<
    string,
    {
      model_name: string;
      vehicle_type?: string;
      years?: number[];
    }
  >;
};

type AutomobileBrand = {
  id: number;
  name: string;
};

type AutomobileEntry = {
  id: number;
  brand_id: number;
  name: string;
  description: string;
};

type AutomobileEngineEntry = {
  id: number;
  other_id?: number;
  automobile_id: number;
  name: string;
  specs: Record<string, Record<string, string>>;
};

const MARKET = 'RU';
const SOURCE_IDS: Record<VehicleSourceCode, string> = {
  OPEN_VEHICLE_DB: 'source_open_vehicle_db',
  AUTOMOBILE_MODELS_SPECS: 'source_automobile_models_specs',
  CAR_API: 'source_car_api',
  EPA_VEHICLES: 'source_epa_vehicles',
  MANUAL: 'source_manual',
};

const BODY_TYPES = [
  { id: 'body_unknown', code: 'unknown', slug: 'unknown', label: 'Unknown', labelRu: 'Не указан', sortOrder: 0 },
  { id: 'body_sedan', code: 'sedan', slug: 'sedan', label: 'Sedan', labelRu: 'Седан', sortOrder: 10 },
  { id: 'body_hatchback', code: 'hatchback', slug: 'hatchback', label: 'Hatchback', labelRu: 'Хэтчбек', sortOrder: 20 },
  { id: 'body_liftback', code: 'liftback', slug: 'liftback', label: 'Liftback', labelRu: 'Лифтбек', sortOrder: 30 },
  { id: 'body_wagon', code: 'wagon', slug: 'wagon', label: 'Wagon', labelRu: 'Универсал', sortOrder: 40 },
  { id: 'body_coupe', code: 'coupe', slug: 'coupe', label: 'Coupe', labelRu: 'Купе', sortOrder: 50 },
  { id: 'body_convertible', code: 'convertible', slug: 'convertible', label: 'Convertible', labelRu: 'Кабриолет', sortOrder: 60 },
  { id: 'body_crossover', code: 'crossover', slug: 'crossover', label: 'Crossover', labelRu: 'Кроссовер', sortOrder: 70 },
  { id: 'body_suv', code: 'suv', slug: 'suv', label: 'SUV', labelRu: 'Внедорожник', sortOrder: 80 },
  { id: 'body_minivan', code: 'minivan', slug: 'minivan', label: 'Minivan', labelRu: 'Минивэн', sortOrder: 90 },
  { id: 'body_pickup', code: 'pickup', slug: 'pickup', label: 'Pickup', labelRu: 'Пикап', sortOrder: 100 },
];

const FUEL_TYPES = [
  { id: 'fuel_unknown', code: 'unknown', slug: 'unknown', label: 'Unknown', labelRu: 'Не указан', sortOrder: 0 },
  { id: 'fuel_gasoline', code: 'gasoline', slug: 'gasoline', label: 'Gasoline', labelRu: 'Бензин', sortOrder: 10 },
  { id: 'fuel_diesel', code: 'diesel', slug: 'diesel', label: 'Diesel', labelRu: 'Дизель', sortOrder: 20 },
  { id: 'fuel_hybrid', code: 'hybrid', slug: 'hybrid', label: 'Hybrid', labelRu: 'Гибрид', sortOrder: 30 },
  { id: 'fuel_electric', code: 'electric', slug: 'electric', label: 'Electric', labelRu: 'Электро', sortOrder: 40 },
  { id: 'fuel_lpg', code: 'lpg', slug: 'lpg', label: 'LPG/CNG', labelRu: 'ГБО', sortOrder: 50 },
];

const TRANSMISSIONS = [
  { id: 'transmission_automatic', code: 'automatic', slug: 'automatic', label: 'Automatic', labelRu: 'АКПП', sortOrder: 10 },
  { id: 'transmission_manual', code: 'manual', slug: 'manual', label: 'Manual', labelRu: 'МКПП', sortOrder: 20 },
  { id: 'transmission_robot', code: 'robot', slug: 'robot', label: 'Robot', labelRu: 'Робот', sortOrder: 30 },
  { id: 'transmission_cvt', code: 'cvt', slug: 'cvt', label: 'CVT', labelRu: 'Вариатор', sortOrder: 40 },
];

const DRIVE_TYPES = [
  { id: 'drive_fwd', code: 'fwd', slug: 'fwd', label: 'Front Wheel Drive', labelRu: 'Передний', sortOrder: 10 },
  { id: 'drive_rwd', code: 'rwd', slug: 'rwd', label: 'Rear Wheel Drive', labelRu: 'Задний', sortOrder: 20 },
  { id: 'drive_awd', code: 'awd', slug: 'awd', label: 'All Wheel Drive', labelRu: 'Полный', sortOrder: 30 },
];

const BRAND_OVERRIDES: Record<string, { name: string; nameRu?: string; aliases?: string[] }> = {
  'mercedes benz': {
    name: 'Mercedes-Benz',
    aliases: ['Mercedes Benz', 'Mercedes-Benz', 'Mercedes', 'Мерседес', 'Мерседес-Бенц'],
  },
  'land rover': {
    name: 'Land Rover',
    aliases: ['Land-Rover', 'Ленд Ровер'],
  },
  lada: {
    name: 'Lada',
    nameRu: 'Lada (ВАЗ)',
    aliases: ['ВАЗ', 'VAZ', 'Лада'],
  },
  vaz: {
    name: 'Lada',
    nameRu: 'Lada (ВАЗ)',
    aliases: ['ВАЗ', 'VAZ', 'Лада'],
  },
  gaz: {
    name: 'GAZ',
    nameRu: 'ГАЗ',
    aliases: ['ГАЗ'],
  },
  moskvich: {
    name: 'Moskvich',
    nameRu: 'Москвич',
    aliases: ['Москвич'],
  },
};

function appendAlias(target: Set<string>, ...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      target.add(normalized);
    }
  }
}

function toRomanNumeral(value: number) {
  const numerals: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remainder = value;
  let result = '';

  for (const [numericValue, symbol] of numerals) {
    while (remainder >= numericValue) {
      result += symbol;
      remainder -= numericValue;
    }
  }

  return result || String(value);
}

function detectBodyType(value: string | undefined) {
  const source = value?.toLowerCase() ?? '';
  if (!source) {
    return undefined;
  }

  if (!/(suv|sport utility|wagon|estate|liftback|hatchback|sedan|coupe|pickup|minivan|van|mpv|crossover|convertible|cabrio|roadster|внедорожник|универсал|седан|хэтчбек|лифтбек|кроссовер|купе|пикап|минивэн|кабриолет)/i.test(source)) {
    return undefined;
  }

  if (/(convertible|cabrio|roadster)/i.test(source)) {
    return { code: 'convertible', label: 'Кабриолет' };
  }

  return normalizeVehicleBodyType(source);
}

function detectFuelType(value: string | undefined) {
  const source = value?.toLowerCase() ?? '';
  if (!source || !/(diesel|tdi|cdi|dci|hybrid|phev|mhev|electric|bev|ev|lpg|cng|gasoline|petrol|бензин|дизель|гибрид|электро|гбо)/i.test(source)) {
    return undefined;
  }

  return normalizeVehicleFuelType(source);
}

function detectTransmission(value: string | undefined) {
  const source = value?.toLowerCase() ?? '';
  if (!source || !/(manual|automatic|cvt|variator|robot|dct|dual clutch|акпп|мкпп|вариатор|робот)/i.test(source)) {
    return undefined;
  }

  return normalizeVehicleTransmission(source);
}

function detectDriveType(value: string | undefined) {
  const source = value?.toLowerCase() ?? '';
  if (!source || !/(rear|rwd|front|fwd|all wheel|awd|4wd|4x4|задний|передний|полный)/i.test(source)) {
    return undefined;
  }

  return normalizeVehicleDriveType(source);
}

function mergeStartYear(current?: number, next?: number) {
  if (!next) {
    return current;
  }

  if (!current) {
    return next;
  }

  return Math.min(current, next);
}

function mergeEndYear(current?: number, next?: number) {
  if (!next) {
    return current;
  }

  if (!current) {
    return next;
  }

  return Math.max(current, next);
}

function rangesOverlap(leftStart?: number, leftEnd?: number, rightStart?: number, rightEnd?: number) {
  const normalizedLeftStart = leftStart ?? 1900;
  const normalizedLeftEnd = leftEnd ?? new Date().getFullYear() + 1;
  const normalizedRightStart = rightStart ?? 1900;
  const normalizedRightEnd = rightEnd ?? new Date().getFullYear() + 1;

  return normalizedLeftStart <= normalizedRightEnd && normalizedRightStart <= normalizedLeftEnd;
}

function buildGenerationLabel(rawName: string | undefined, startYear?: number, endYear?: number) {
  const cleanName = rawName?.trim();
  const yearLabel = startYear ? `${startYear}-${endYear ?? 'н.в.'}` : undefined;

  if (!cleanName) {
    return yearLabel ?? 'Не указано';
  }

  const generationCodeMatch = cleanName.match(/\(([^)]+)\)/);
  const generationCode = generationCodeMatch?.[1];
  const mkMatch = cleanName.match(/\bmk\s*(\d+)\b/i);
  const phaseMatch = cleanName.match(/\bphase\s*(\d+)\b/i);
  const isRestyling = /(facelift|restyling|рестайл|lci)\b/i.test(cleanName);

  let title = cleanName
    .replace(/\bmk\s*(\d+)\b/gi, (_, value: string) => toRomanNumeral(Number(value)))
    .replace(/\bphase\s*(\d+)\b/gi, (_, value: string) => `${toRomanNumeral(Number(value))} этап`)
    .replace(/\bfacelift\b/gi, 'рестайлинг')
    .replace(/\brestyling\b/gi, 'рестайлинг')
    .replace(/\s+/g, ' ')
    .trim();

  if (mkMatch && isRestyling) {
    title = `${toRomanNumeral(Number(mkMatch[1]))} рестайлинг`;
  }

  if (!mkMatch && phaseMatch && isRestyling) {
    title = `${toRomanNumeral(Number(phaseMatch[1]))} рестайлинг`;
  }

  if (generationCode && !title.includes(generationCode) && /[A-Za-z0-9]/.test(generationCode)) {
    title = `${title} (${generationCode})`.trim();
  }

  return [yearLabel, title].filter(Boolean).join(', ');
}

export function cleanAutoTitle(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\s+photos,\s*engines.*$/i, '')
    .replace(/^([12])((?:19|20|21)\d{2})(?=\s*[A-ZА-Я])/u, (_match, duplicatedDigit, year) =>
      String(year).startsWith(String(duplicatedDigit)) ? String(year) : `${duplicatedDigit}${year}`
    )
    .replace(/^((?:19|20|21)\d{2})(?=[A-ZА-Я])/u, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeAutomobileModelTitle(title: string, brandName: string) {
  return title
    .replace(/\b(19\d{2}|20\d{2}|21\d{2})\s*[-–]\s*(19\d{2}|20\d{2}|21\d{2}|present|null)\b/i, ' ')
    .replace(/^\s*(19\d{2}|20\d{2}|21\d{2})\b/, ' ')
    .replace(/\s+/g, ' ')
    .replace(new RegExp(`^\\s*${escapeRegex(brandName)}\\s+`, 'i'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanupVariantRemainder(value: string) {
  return value
    .replace(/^(sedan|wagon|estate|suv|convertible|cabrio|roadster|coupe|hatchback|liftback|crossover)\b/i, '')
    .replace(/\b(sedan|wagon|estate|suv|convertible|cabrio|roadster|coupe|hatchback|liftback|crossover)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeRows<TItem>(items: TItem[], getKey: (item: TItem) => string) {
  const unique = new Map<string, TItem>();
  for (const item of items) {
    unique.set(getKey(item), item);
  }
  return Array.from(unique.values());
}

function normalizeSelectionYearRange(startYear?: number, endYear?: number) {
  return {
    startYear: startYear ?? 1900,
    endYear: endYear ?? new Date().getFullYear() + 1,
  };
}

function getGenerationOverlapYears(
  leftStartYear?: number,
  leftEndYear?: number,
  rightStartYear?: number,
  rightEndYear?: number
) {
  const left = normalizeSelectionYearRange(leftStartYear, leftEndYear);
  const right = normalizeSelectionYearRange(rightStartYear, rightEndYear);
  const overlapStartYear = Math.max(left.startYear, right.startYear);
  const overlapEndYear = Math.min(left.endYear, right.endYear);

  return overlapEndYear >= overlapStartYear ? overlapEndYear - overlapStartYear + 1 : 0;
}

function getGenerationRangeDistance(
  leftStartYear?: number,
  leftEndYear?: number,
  rightStartYear?: number,
  rightEndYear?: number
) {
  const left = normalizeSelectionYearRange(leftStartYear, leftEndYear);
  const right = normalizeSelectionYearRange(rightStartYear, rightEndYear);
  return Math.abs(left.startYear - right.startYear) + Math.abs(left.endYear - right.endYear);
}

export function selectBestGeneration(
  generations: GenerationSeed[],
  input: { startYear?: number; endYear?: number; bodyTypeId?: string }
) {
  const exactBodyMatches = generations.filter(
    (generation) => !input.bodyTypeId || !generation.bodyTypeId || generation.bodyTypeId === input.bodyTypeId
  );
  const candidates = exactBodyMatches.length > 0 ? exactBodyMatches : generations;

  return [...candidates].sort((left, right) => {
    const leftOverlapYears = getGenerationOverlapYears(
      left.productionStartYear,
      left.productionEndYear,
      input.startYear,
      input.endYear
    );
    const rightOverlapYears = getGenerationOverlapYears(
      right.productionStartYear,
      right.productionEndYear,
      input.startYear,
      input.endYear
    );

    if (leftOverlapYears !== rightOverlapYears) {
      return rightOverlapYears - leftOverlapYears;
    }

    const leftRangeDistance = getGenerationRangeDistance(
      left.productionStartYear,
      left.productionEndYear,
      input.startYear,
      input.endYear
    );
    const rightRangeDistance = getGenerationRangeDistance(
      right.productionStartYear,
      right.productionEndYear,
      input.startYear,
      input.endYear
    );

    if (leftRangeDistance !== rightRangeDistance) {
      return leftRangeDistance - rightRangeDistance;
    }

    return (right.productionStartYear ?? 0) - (left.productionStartYear ?? 0);
  })[0];
}

async function seedSources(prisma: PrismaClient) {
  const sourceConfigs = [
    { id: SOURCE_IDS.CAR_API, code: 'CAR_API' as const, name: 'car-api', priority: 10 },
    { id: SOURCE_IDS.OPEN_VEHICLE_DB, code: 'OPEN_VEHICLE_DB' as const, name: 'open-vehicle-db', priority: 20 },
    {
      id: SOURCE_IDS.AUTOMOBILE_MODELS_SPECS,
      code: 'AUTOMOBILE_MODELS_SPECS' as const,
      name: 'automobile-models-and-specs',
      priority: 30,
    },
  ];

  for (const source of sourceConfigs) {
    await prisma.vehicleCatalogSource.upsert({
      where: { code: source.code },
      create: {
        id: source.id,
        code: source.code,
        name: source.name,
        market: MARKET,
        priority: source.priority,
      },
      update: {
        name: source.name,
        market: MARKET,
        priority: source.priority,
      },
    });
  }
}

async function seedDictionaries(prisma: PrismaClient) {
  for (const bodyType of BODY_TYPES) {
    await prisma.vehicleBodyType.upsert({
      where: { code: bodyType.code },
      create: bodyType,
      update: {
        slug: bodyType.slug,
        label: bodyType.label,
        labelRu: bodyType.labelRu,
        sortOrder: bodyType.sortOrder,
      },
    });
  }

  for (const fuelType of FUEL_TYPES) {
    await prisma.vehicleFuelType.upsert({
      where: { code: fuelType.code },
      create: fuelType,
      update: {
        slug: fuelType.slug,
        label: fuelType.label,
        labelRu: fuelType.labelRu,
        sortOrder: fuelType.sortOrder,
      },
    });
  }

  for (const transmission of TRANSMISSIONS) {
    await prisma.vehicleTransmission.upsert({
      where: { code: transmission.code },
      create: transmission,
      update: {
        slug: transmission.slug,
        label: transmission.label,
        labelRu: transmission.labelRu,
        sortOrder: transmission.sortOrder,
      },
    });
  }

  for (const driveType of DRIVE_TYPES) {
    await prisma.vehicleDriveType.upsert({
      where: { code: driveType.code },
      create: driveType,
      update: {
        slug: driveType.slug,
        label: driveType.label,
        labelRu: driveType.labelRu,
        sortOrder: driveType.sortOrder,
      },
    });
  }
}

export async function run() {
  const dryRun = hasCliFlag('--dry-run');
  const withBackfill = hasCliFlag('--backfill-listings');
  const prisma = createCatalogPrismaClient();

  const brands = new Map<string, BrandSeed>();
  const models = new Map<string, ModelSeed>();
  const generations = new Map<string, GenerationSeed>();
  const engines = new Map<string, EngineSeed>();
  const trims = new Map<string, TrimSeed>();
  const modifications = new Map<string, ModificationSeed>();
  const modelBodyRanges = new Map<string, BodyRangeHint[]>();
  const modelGenerations = new Map<string, GenerationSeed[]>();
  const sourceMappings = new Map<string, SourceMappingSeed>();
  const rawRecords = new Map<VehicleSourceCode, RawRecordSeed[]>([
    ['CAR_API', []],
    ['OPEN_VEHICLE_DB', []],
    ['AUTOMOBILE_MODELS_SPECS', []],
  ]);

  function addRawRecord(sourceCode: VehicleSourceCode, record: Omit<RawRecordSeed, 'checksum'>) {
    const records = rawRecords.get(sourceCode);
    if (!records) {
      return;
    }

    records.push({
      ...record,
      checksum: checksumPayload(record.payload),
    });
  }

  function addSourceMapping(mapping: SourceMappingSeed) {
    const key = [mapping.sourceCode, mapping.entityType, mapping.externalId].join(':');
    sourceMappings.set(key, mapping);
  }

  function ensureBrand(name: string, options?: { lowConfidence?: boolean; alias?: string }) {
    const normalizedInput = normalizeCatalogText(name);
    const override = BRAND_OVERRIDES[normalizedInput];
    const canonicalName = override?.name ?? name.trim();
    const normalizedName = normalizeCatalogText(canonicalName);
    const slug = slugifyCatalogValue(canonicalName);
    const id = `brand_${slug}`;

    const existing = brands.get(normalizedName);
    if (existing) {
      existing.lowConfidence = existing.lowConfidence || Boolean(options?.lowConfidence);
      appendAlias(
        existing.aliases,
        name,
        options?.alias,
        override?.nameRu,
        simpleRuTransliteration(canonicalName)
      );
      for (const alias of override?.aliases ?? []) {
        appendAlias(existing.aliases, alias);
      }
      if (!existing.nameRu && override?.nameRu) {
        existing.nameRu = override.nameRu;
      }

      return existing;
    }

    const aliases = new Set<string>();
    appendAlias(
      aliases,
      canonicalName,
      name,
      options?.alias,
      override?.nameRu,
      simpleRuTransliteration(canonicalName)
    );
    for (const alias of override?.aliases ?? []) {
      appendAlias(aliases, alias);
    }

    const seed: BrandSeed = {
      id,
      slug,
      normalizedName,
      name: canonicalName,
      nameRu: override?.nameRu,
      nameOriginal: canonicalName,
      market: MARKET,
      lowConfidence: Boolean(options?.lowConfidence),
      aliases,
    };

    brands.set(normalizedName, seed);
    return seed;
  }

  function ensureModel(
    brand: BrandSeed,
    name: string,
    options?: { startYear?: number; endYear?: number; lowConfidence?: boolean; alias?: string }
  ) {
    const normalizedName = normalizeCatalogText(name);
    const key = `${brand.id}:${normalizedName}`;
    const existing = models.get(key);
    if (existing) {
      existing.productionStartYear = mergeStartYear(existing.productionStartYear, options?.startYear);
      existing.productionEndYear = mergeEndYear(existing.productionEndYear, options?.endYear);
      existing.lowConfidence = existing.lowConfidence || Boolean(options?.lowConfidence);
      appendAlias(existing.aliases, name, options?.alias, simpleRuTransliteration(name));
      return existing;
    }

    const slug = slugifyCatalogValue(name);
    const aliases = new Set<string>();
    appendAlias(aliases, name, options?.alias, simpleRuTransliteration(name));

    const seed: ModelSeed = {
      id: createDeterministicCatalogId('model', `${brand.id}:${slug}`),
      brandId: brand.id,
      brandSlug: brand.slug,
      slug,
      normalizedName,
      name: name.trim(),
      nameOriginal: name.trim(),
      productionStartYear: options?.startYear,
      productionEndYear: options?.endYear,
      market: MARKET,
      lowConfidence: Boolean(options?.lowConfidence),
      aliases,
    };

    models.set(key, seed);
    return seed;
  }

  function addModelBodyRange(modelId: string, bodyTypeId: string, startYear?: number, endYear?: number) {
    const current = modelBodyRanges.get(modelId) ?? [];
    current.push({ bodyTypeId, startYear, endYear });
    modelBodyRanges.set(modelId, current);
  }

  function ensureGeneration(
    model: ModelSeed,
    input: { name?: string; startYear?: number; endYear?: number; bodyTypeId?: string; lowConfidence?: boolean }
  ) {
    const baseSlugSource = input.name?.trim() || `${input.startYear ?? 'unknown'}-${input.endYear ?? 'present'}`;
    const slug = slugifyCatalogValue(baseSlugSource);
    const key = `${model.id}:${slug}`;
    const existing = generations.get(key);
    if (existing) {
      existing.productionStartYear = mergeStartYear(existing.productionStartYear, input.startYear);
      existing.productionEndYear = mergeEndYear(existing.productionEndYear, input.endYear);
      existing.lowConfidence = existing.lowConfidence || Boolean(input.lowConfidence);
      if (!existing.bodyTypeId && input.bodyTypeId) {
        existing.bodyTypeId = input.bodyTypeId;
      }
      return existing;
    }

    const generationCodeMatch = input.name?.match(/\(([^)]+)\)/);
    const isRestyling = /(facelift|restyling|рестайл|lci)\b/i.test(input.name ?? '');
    const seed: GenerationSeed = {
      id: createDeterministicCatalogId('generation', `${model.id}:${slug}`),
      modelId: model.id,
      slug,
      label: buildGenerationLabel(input.name, input.startYear, input.endYear),
      labelRu: buildGenerationLabel(input.name, input.startYear, input.endYear),
      generationName: input.name?.trim(),
      generationCode: generationCodeMatch?.[1],
      restylingLabel: isRestyling ? 'рестайлинг' : undefined,
      isRestyling,
      bodyTypeId: input.bodyTypeId,
      productionStartYear: input.startYear,
      productionEndYear: input.endYear,
      market: MARKET,
      lowConfidence: Boolean(input.lowConfidence),
    };

    generations.set(key, seed);
    const currentModelGenerations = modelGenerations.get(model.id) ?? [];
    currentModelGenerations.push(seed);
    modelGenerations.set(model.id, currentModelGenerations);
    return seed;
  }

  const carApiBrands = readJsonFile<CarApiBrand[]>(carApiPath);
  for (const brandEntry of carApiBrands) {
    const brand = ensureBrand(brandEntry.brand);
    addRawRecord('CAR_API', {
      recordType: 'brand',
      externalId: `brand:${brandEntry.brand}`,
      brandName: brandEntry.brand,
      payload: brandEntry,
    });
    addSourceMapping({
      sourceCode: 'CAR_API',
      entityType: 'BRAND',
      entityId: brand.id,
      externalId: `brand:${brandEntry.brand}`,
      sourceLabel: brandEntry.brand,
    });

    for (const modelEntry of brandEntry.models) {
      const startYear = modelEntry.generations.reduce<number | undefined>(
        (current, generation) => mergeStartYear(current, generation.yearFrom ?? undefined),
        undefined
      );
      const endYear = modelEntry.generations.reduce<number | undefined>(
        (current, generation) => mergeEndYear(current, generation.yearTo ?? undefined),
        undefined
      );
      const model = ensureModel(brand, modelEntry.name, { startYear, endYear });

      addRawRecord('CAR_API', {
        recordType: 'model',
        externalId: `model:${brandEntry.brand}:${modelEntry.name}`,
        brandName: brandEntry.brand,
        modelName: modelEntry.name,
        productionStartYear: startYear,
        productionEndYear: endYear,
        payload: modelEntry,
      });
      addSourceMapping({
        sourceCode: 'CAR_API',
        entityType: 'MODEL',
        entityId: model.id,
        externalId: `model:${brandEntry.brand}:${modelEntry.name}`,
        externalParentId: `brand:${brandEntry.brand}`,
        sourceLabel: modelEntry.name,
      });

      for (const generationEntry of modelEntry.generations) {
        const generation = ensureGeneration(model, {
          name: generationEntry.name,
          startYear: generationEntry.yearFrom ?? undefined,
          endYear: generationEntry.yearTo ?? undefined,
        });

        addRawRecord('CAR_API', {
          recordType: 'generation',
          externalId: `generation:${brandEntry.brand}:${modelEntry.name}:${generationEntry.name}`,
          brandName: brandEntry.brand,
          modelName: modelEntry.name,
          productionStartYear: generationEntry.yearFrom ?? undefined,
          productionEndYear: generationEntry.yearTo ?? undefined,
          payload: generationEntry,
        });
        addSourceMapping({
          sourceCode: 'CAR_API',
          entityType: 'GENERATION',
          entityId: generation.id,
          externalId: `generation:${brandEntry.brand}:${modelEntry.name}:${generationEntry.name}`,
          externalParentId: `model:${brandEntry.brand}:${modelEntry.name}`,
          sourceLabel: generationEntry.name,
        });
      }
    }
  }

  const openVehicleDbMakes = readJsonFile<OpenVehicleDbMake[]>(openVehicleDbMakesPath);
  for (const makeEntry of openVehicleDbMakes) {
    const brand = ensureBrand(makeEntry.make_name, { alias: makeEntry.make_slug });

    addRawRecord('OPEN_VEHICLE_DB', {
      recordType: 'brand',
      externalId: `brand:${makeEntry.make_slug}`,
      brandName: makeEntry.make_name,
      payload: makeEntry,
    });
    addSourceMapping({
      sourceCode: 'OPEN_VEHICLE_DB',
      entityType: 'BRAND',
      entityId: brand.id,
      externalId: `brand:${makeEntry.make_slug}`,
      sourceLabel: makeEntry.make_name,
    });

    for (const modelEntry of Object.values(makeEntry.models)) {
      const years = modelEntry.years ?? [];
      const model = ensureModel(brand, modelEntry.model_name, {
        startYear: years.length ? Math.min(...years) : undefined,
        endYear: years.length ? Math.max(...years) : undefined,
      });

      addRawRecord('OPEN_VEHICLE_DB', {
        recordType: 'model',
        externalId: `model:${makeEntry.make_slug}:${modelEntry.model_name}`,
        brandName: makeEntry.make_name,
        modelName: modelEntry.model_name,
        productionStartYear: years.length ? Math.min(...years) : undefined,
        productionEndYear: years.length ? Math.max(...years) : undefined,
        payload: modelEntry,
      });
      addSourceMapping({
        sourceCode: 'OPEN_VEHICLE_DB',
        entityType: 'MODEL',
        entityId: model.id,
        externalId: `model:${makeEntry.make_slug}:${modelEntry.model_name}`,
        externalParentId: `brand:${makeEntry.make_slug}`,
        sourceLabel: modelEntry.model_name,
      });

      const detectedBody = detectBodyType(modelEntry.vehicle_type);
      if (detectedBody) {
        addModelBodyRange(
          model.id,
          BODY_TYPES.find((item) => item.code === detectedBody.code)?.id ?? 'body_unknown',
          years.length ? Math.min(...years) : undefined,
          years.length ? Math.max(...years) : undefined
        );
      }
    }

    const stylesPath = path.join(openVehicleDbStylesRoot, `${makeEntry.make_slug}.json`);
    if (!fs.existsSync(stylesPath)) {
      continue;
    }

    const styleGroups = readJsonFile<Record<string, Record<string, { years?: number[] }>>>(stylesPath);
    for (const [modelName, styles] of Object.entries(styleGroups)) {
      const model = ensureModel(brand, modelName);

      for (const [styleName, styleData] of Object.entries(styles)) {
        const years = styleData.years ?? [];
        const detectedBody = detectBodyType(styleName);
        if (!detectedBody) {
          continue;
        }

        const bodyTypeId = BODY_TYPES.find((item) => item.code === detectedBody.code)?.id ?? 'body_unknown';
        addModelBodyRange(
          model.id,
          bodyTypeId,
          years.length ? Math.min(...years) : undefined,
          years.length ? Math.max(...years) : undefined
        );

        addRawRecord('OPEN_VEHICLE_DB', {
          recordType: 'style',
          externalId: `style:${makeEntry.make_slug}:${modelName}:${styleName}`,
          brandName: makeEntry.make_name,
          modelName,
          productionStartYear: years.length ? Math.min(...years) : undefined,
          productionEndYear: years.length ? Math.max(...years) : undefined,
          payload: { styleName, ...styleData },
        });
      }
    }
  }

  for (const generation of generations.values()) {
    if (generation.bodyTypeId) {
      continue;
    }

    const bodyRanges = modelBodyRanges.get(generation.modelId) ?? [];
    const overlappingBodyIds = new Set(
      bodyRanges
        .filter((bodyRange) =>
          rangesOverlap(
            generation.productionStartYear,
            generation.productionEndYear,
            bodyRange.startYear,
            bodyRange.endYear
          )
        )
        .map((bodyRange) => bodyRange.bodyTypeId)
    );

    if (overlappingBodyIds.size === 1) {
      generation.bodyTypeId = Array.from(overlappingBodyIds)[0];
    }
  }

  function ensureEngine(
    input: Omit<EngineSeed, 'id' | 'slug' | 'market'> & { signature: string }
  ) {
    const slug = slugifyCatalogValue(input.signature);
    const id = createDeterministicCatalogId('engine', slug);
    const existing = engines.get(id);
    if (existing) {
      existing.lowConfidence = existing.lowConfidence || input.lowConfidence;
      return existing;
    }

    const seed: EngineSeed = {
      id,
      fuelTypeId: input.fuelTypeId,
      slug,
      label: input.label,
      displacementCc: input.displacementCc,
      displacementL: input.displacementL,
      powerHp: input.powerHp,
      cylinders: input.cylinders,
      engineCode: input.engineCode,
      aspiration: input.aspiration,
      layout: input.layout,
      evMotor: input.evMotor,
      market: MARKET,
      lowConfidence: input.lowConfidence,
    };

    engines.set(id, seed);
    return seed;
  }

  function ensureTrim(model: ModelSeed | undefined, name: string, lowConfidence = false) {
    const slug = slugifyCatalogValue(name);
    const id = createDeterministicCatalogId('trim', slug);
    const existing = trims.get(id);
    if (existing) {
      existing.lowConfidence = existing.lowConfidence || lowConfidence;
      if (!existing.modelId && model?.id) {
        existing.modelId = model.id;
      }
      return existing;
    }

    const seed: TrimSeed = {
      id,
      modelId: model?.id,
      slug,
      name: name.trim(),
      market: MARKET,
      lowConfidence,
    };

    trims.set(id, seed);
    return seed;
  }

  function ensureModification(input: Omit<ModificationSeed, 'id' | 'slug' | 'market'> & { signature: string }) {
    const slug = slugifyCatalogValue(input.signature);
    const id = createDeterministicCatalogId('modification', slug);
    const existing = modifications.get(id);
    if (existing) {
      existing.lowConfidence = existing.lowConfidence || input.lowConfidence;
      return existing;
    }

    const seed: ModificationSeed = {
      id,
      generationId: input.generationId,
      bodyTypeId: input.bodyTypeId,
      engineId: input.engineId,
      transmissionId: input.transmissionId,
      driveTypeId: input.driveTypeId,
      trimId: input.trimId,
      slug,
      name: input.name,
      label: input.label,
      productionStartYear: input.productionStartYear,
      productionEndYear: input.productionEndYear,
      doors: input.doors,
      seats: input.seats,
      powerHp: input.powerHp,
      engineVolumeL: input.engineVolumeL,
      market: MARKET,
      lowConfidence: input.lowConfidence,
    };

    modifications.set(id, seed);
    return seed;
  }

  const automobileJson = readZippedJsonFiles(automobileModelsSpecsZipPath) as {
    'brands.json': AutomobileBrand[];
    'automobiles.json': AutomobileEntry[];
    'engines.json': AutomobileEngineEntry[];
  };
  const automobileBrands = automobileJson['brands.json'];
  const automobiles = automobileJson['automobiles.json'];
  const automobileEngines = automobileJson['engines.json'];
  const automobileBrandById = new Map(automobileBrands.map((brand) => [brand.id, brand]));
  const automobileById = new Map(automobiles.map((auto) => [auto.id, auto]));
  const autoMetaById = new Map<number, AutoMeta>();

  function findBrandModels(brandId: string) {
    return Array.from(models.values())
      .filter((model) => model.brandId === brandId)
      .sort((left, right) => right.normalizedName.length - left.normalizedName.length);
  }

  for (const automobile of automobiles) {
    const automobileBrand = automobileBrandById.get(automobile.brand_id);
    if (!automobileBrand) {
      continue;
    }

    const brand = ensureBrand(automobileBrand.name);
    const titleSource = cleanAutoTitle(automobile.name);
    const yearRange = parseSourceYearRange(titleSource);
    let title = normalizeAutomobileModelTitle(titleSource, automobileBrand.name);
    title = title.replace(/\b(19\d{2}|20\d{2}|21\d{2})\s*[-–]\s*(19\d{2}|20\d{2}|21\d{2}|present|null)\b/i, ' ');
    title = title.replace(/^\s*(19\d{2}|20\d{2}|21\d{2})\b/, ' ');
    title = title.replace(new RegExp(`^${escapeRegex(automobileBrand.name)}\\s+`, 'i'), ' ');
    title = title.replace(/\s+/g, ' ').trim();

    const brandModels = findBrandModels(brand.id);
    const normalizedTitle = normalizeCatalogText(title);
    let model = brandModels.find(
      (candidate) =>
        normalizedTitle === candidate.normalizedName ||
        normalizedTitle.startsWith(`${candidate.normalizedName} `)
    );

    if (!model) {
      model = ensureModel(brand, title, {
        startYear: yearRange.startYear,
        endYear: yearRange.endYear,
        lowConfidence: true,
      });
    }

    const rawVariant = title.replace(new RegExp(`^${escapeRegex(model.name)}\\s*`, 'i'), '').trim();
    const trimName = cleanupVariantRemainder(rawVariant) || undefined;
    const detectedBodyFromText = detectBodyType(`${title} ${automobile.description}`);
    const bodyTypeId =
      (detectedBodyFromText
        ? BODY_TYPES.find((item) => item.code === detectedBodyFromText.code)?.id
        : undefined) ??
      (modelBodyRanges.get(model.id)?.find((bodyRange) =>
        rangesOverlap(yearRange.startYear, yearRange.endYear, bodyRange.startYear, bodyRange.endYear)
      )?.bodyTypeId ?? 'body_unknown');

    const generation =
      selectBestGeneration(modelGenerations.get(model.id) ?? [], {
        startYear: yearRange.startYear,
        endYear: yearRange.endYear,
        bodyTypeId,
      }) ??
      ensureGeneration(model, {
        startYear: yearRange.startYear,
        endYear: yearRange.endYear,
        bodyTypeId: bodyTypeId === 'body_unknown' ? undefined : bodyTypeId,
        lowConfidence: true,
      });

    const meta: AutoMeta = {
      autoId: automobile.id,
      brandSeed: brand,
      modelSeed: model,
      generationSeed: generation,
      bodyTypeId,
      startYear: yearRange.startYear,
      endYear: yearRange.endYear,
      trimName,
      title,
      lowConfidence: !brandModels.some((candidate) => candidate.id === model.id) || bodyTypeId === 'body_unknown',
    };

    autoMetaById.set(automobile.id, meta);
    addRawRecord('AUTOMOBILE_MODELS_SPECS', {
      recordType: 'automobile',
      externalId: `automobile:${automobile.id}`,
      brandName: automobileBrand.name,
      modelName: model.name,
      productionStartYear: yearRange.startYear,
      productionEndYear: yearRange.endYear,
      payload: automobile,
    });
  }

  for (const engineEntry of automobileEngines) {
    const meta = autoMetaById.get(engineEntry.automobile_id);
    if (!meta) {
      continue;
    }

    const engineSpecs = engineEntry.specs['Engine Specs'] ?? {};
    const transmissionSpecs = engineEntry.specs['Transmission Specs'] ?? {};
    const dimensionSpecs = engineEntry.specs.Dimensions ?? {};

    const fuel = detectFuelType(engineSpecs['Fuel:']) ?? { code: 'unknown', label: 'Не указан' };
    const transmission = detectTransmission(transmissionSpecs['Gearbox:']) ?? detectTransmission(engineEntry.name);
    const drive = detectDriveType(transmissionSpecs['Drive Type:']);

    const fuelTypeId = FUEL_TYPES.find((item) => item.code === fuel.code)?.id ?? 'fuel_unknown';
    const transmissionId = transmission ? TRANSMISSIONS.find((item) => item.code === transmission.code)?.id : undefined;
    const driveTypeId = drive ? DRIVE_TYPES.find((item) => item.code === drive.code)?.id : undefined;
    const displacementL =
      parseDisplacementLiters(engineSpecs['Displacement:']) ?? parseDisplacementLiters(engineEntry.name);
    const displacementCc = engineSpecs['Displacement:']
      ? parseInteger(engineSpecs['Displacement:'])
      : displacementL
      ? Math.round(displacementL * 1000)
      : undefined;
    const powerHp = parsePowerHp(engineSpecs['Power:']) ?? parsePowerHp(engineEntry.name);
    const cylinders = engineSpecs['Cylinders:']?.trim() || undefined;
    const doors = parseInteger(dimensionSpecs['Doors:']);
    const seats = parseInteger(dimensionSpecs['Seats:']);
    const aspiration =
      /turbo/i.test(engineEntry.name) || /turbo/i.test(engineSpecs['Fuel System:'] ?? '')
        ? 'turbo'
        : /supercharged/i.test(engineEntry.name)
        ? 'supercharged'
        : undefined;

    const engine = ensureEngine({
      signature: [fuel.code, displacementL ?? displacementCc ?? 'na', powerHp ?? 'na', cylinders ?? 'na', aspiration ?? 'na'].join(':'),
      fuelTypeId,
      label: engineEntry.name.trim(),
      displacementCc,
      displacementL,
      powerHp,
      cylinders,
      aspiration,
      layout: undefined,
      evMotor: undefined,
      lowConfidence: fuel.code === 'unknown' || !powerHp || !displacementL,
    });

    const trim = meta.trimName ? ensureTrim(meta.modelSeed, meta.trimName, meta.lowConfidence) : undefined;
    const modification = ensureModification({
      signature: [meta.generationSeed.id, meta.bodyTypeId, engine.id, transmissionId ?? 'na', driveTypeId ?? 'na', trim?.id ?? 'na', engineEntry.name].join(':'),
      generationId: meta.generationSeed.id,
      bodyTypeId: meta.bodyTypeId,
      engineId: engine.id,
      transmissionId,
      driveTypeId,
      trimId: trim?.id,
      name: engineEntry.name.trim(),
      label:
        createVehicleModificationLabel({
          powerHp,
          engineVolumeL: displacementL,
          fuelLabel: fuel.label,
          driveLabel: drive?.label,
          transmissionLabel: transmission?.label,
        }) || engineEntry.name.trim(),
      productionStartYear: meta.startYear,
      productionEndYear: meta.endYear,
      doors,
      seats,
      powerHp,
      engineVolumeL: displacementL,
      lowConfidence: meta.lowConfidence || meta.bodyTypeId === 'body_unknown' || !transmissionId || !driveTypeId,
    });

    addRawRecord('AUTOMOBILE_MODELS_SPECS', {
      recordType: 'engine',
      externalId: `engine:${engineEntry.id}`,
      brandName: meta.brandSeed.name,
      modelName: meta.modelSeed.name,
      productionStartYear: meta.startYear,
      productionEndYear: meta.endYear,
      payload: engineEntry,
    });
    addSourceMapping({
      sourceCode: 'AUTOMOBILE_MODELS_SPECS',
      entityType: 'ENGINE',
      entityId: engine.id,
      externalId: `engine:${engineEntry.id}`,
      externalParentId: `automobile:${engineEntry.automobile_id}`,
      sourceLabel: engineEntry.name,
      confidence: engine.lowConfidence ? 'LOW' : 'HIGH',
      payload: { automobileId: engineEntry.automobile_id },
    });
    addSourceMapping({
      sourceCode: 'AUTOMOBILE_MODELS_SPECS',
      entityType: 'MODIFICATION',
      entityId: modification.id,
      externalId: `modification:${engineEntry.id}`,
      externalParentId: `engine:${engineEntry.id}`,
      sourceLabel: modification.label,
      confidence: modification.lowConfidence ? 'LOW' : 'HIGH',
    });
    addSourceMapping({
      sourceCode: 'AUTOMOBILE_MODELS_SPECS',
      entityType: 'GENERATION',
      entityId: meta.generationSeed.id,
      externalId: `automobile-generation:${engineEntry.automobile_id}`,
      externalParentId: `automobile:${engineEntry.automobile_id}`,
      sourceLabel: meta.generationSeed.label,
      confidence: meta.generationSeed.lowConfidence ? 'LOW' : 'HIGH',
    });
  }

  const stats = {
    brands: brands.size,
    models: models.size,
    generations: generations.size,
    engines: engines.size,
    trims: trims.size,
    modifications: modifications.size,
    rawCarApi: rawRecords.get('CAR_API')?.length ?? 0,
    rawOpenVehicleDb: rawRecords.get('OPEN_VEHICLE_DB')?.length ?? 0,
    rawAutomobileModels: rawRecords.get('AUTOMOBILE_MODELS_SPECS')?.length ?? 0,
    lowConfidenceGenerations: Array.from(generations.values()).filter((item) => item.lowConfidence).length,
    lowConfidenceModifications: Array.from(modifications.values()).filter((item) => item.lowConfidence).length,
  };

  console.log(JSON.stringify({ mode: dryRun ? 'dry-run' : 'load', stats }, null, 2));

  if (dryRun) {
    await prisma.$disconnect();
    return;
  }

  await seedSources(prisma);
  await seedDictionaries(prisma);
  await prisma.$transaction([
    prisma.vehicleSourceMapping.deleteMany(),
    prisma.vehicleCatalogRawRecord.deleteMany(),
    prisma.vehicleCatalogImportRun.deleteMany(),
    prisma.vehicleModification.deleteMany(),
    prisma.vehicleTrim.deleteMany(),
    prisma.vehicleEngine.deleteMany(),
    prisma.vehicleGeneration.deleteMany(),
    prisma.vehicleModelAlias.deleteMany(),
    prisma.vehicleModel.deleteMany(),
    prisma.vehicleBrandAlias.deleteMany(),
    prisma.vehicleBrand.deleteMany(),
  ]);

  const brandRows = Array.from(brands.values()).map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    normalizedName: brand.normalizedName,
    name: brand.name,
    nameRu: brand.nameRu,
    nameOriginal: brand.nameOriginal,
    market: brand.market,
    lowConfidence: brand.lowConfidence,
  }));
  const brandAliasRows = dedupeRows(
    Array.from(brands.values()).flatMap((brand) =>
      Array.from(brand.aliases).map((alias) => ({
        brandId: brand.id,
        alias,
        normalizedAlias: normalizeCatalogText(alias),
        language: /[а-яё]/i.test(alias) ? 'ru' : 'en',
        market: MARKET,
      }))
    ),
    (item) => `${item.brandId}:${item.normalizedAlias}`
  );
  const modelRows = Array.from(models.values()).map((model) => ({
    id: model.id,
    brandId: model.brandId,
    slug: model.slug,
    normalizedName: model.normalizedName,
    name: model.name,
    nameRu: model.nameRu,
    nameOriginal: model.nameOriginal,
    productionStartYear: model.productionStartYear,
    productionEndYear: model.productionEndYear,
    market: model.market,
    lowConfidence: model.lowConfidence,
  }));
  const modelAliasRows = dedupeRows(
    Array.from(models.values()).flatMap((model) =>
      Array.from(model.aliases).map((alias) => ({
        modelId: model.id,
        alias,
        normalizedAlias: normalizeCatalogText(alias),
        language: /[а-яё]/i.test(alias) ? 'ru' : 'en',
        market: MARKET,
      }))
    ),
    (item) => `${item.modelId}:${item.normalizedAlias}`
  );
  const generationRows = Array.from(generations.values());
  const engineRows = Array.from(engines.values());
  const trimRows = Array.from(trims.values());
  const modificationRows = Array.from(modifications.values());
  const mappingRows = Array.from(sourceMappings.values()).map((mapping) => ({
    sourceId: SOURCE_IDS[mapping.sourceCode],
    entityType: mapping.entityType,
    entityId: mapping.entityId,
    externalId: mapping.externalId,
    externalParentId: mapping.externalParentId,
    sourceLabel: mapping.sourceLabel,
    confidence: mapping.confidence ?? 'HIGH',
    payload: (mapping.payload ?? undefined) as Prisma.InputJsonValue | undefined,
  }));

  for (const chunk of chunkItems(brandRows, 500)) {
    await prisma.vehicleBrand.createMany({ data: chunk });
  }
  for (const chunk of chunkItems(brandAliasRows, 1000)) {
    await prisma.vehicleBrandAlias.createMany({ data: chunk });
  }
  for (const chunk of chunkItems(modelRows, 1000)) {
    await prisma.vehicleModel.createMany({ data: chunk });
  }
  for (const chunk of chunkItems(modelAliasRows, 2000)) {
    await prisma.vehicleModelAlias.createMany({ data: chunk });
  }
  for (const chunk of chunkItems(generationRows, 1000)) {
    await prisma.vehicleGeneration.createMany({ data: chunk });
  }
  for (const chunk of chunkItems(engineRows, 1000)) {
    await prisma.vehicleEngine.createMany({ data: chunk });
  }
  for (const chunk of chunkItems(trimRows, 1000)) {
    await prisma.vehicleTrim.createMany({ data: chunk });
  }
  for (const chunk of chunkItems(modificationRows, 1000)) {
    await prisma.vehicleModification.createMany({ data: chunk });
  }
  for (const chunk of chunkItems(mappingRows, 1000)) {
    await prisma.vehicleSourceMapping.createMany({ data: chunk });
  }

  for (const [sourceCode, records] of rawRecords.entries()) {
    const sourceId = SOURCE_IDS[sourceCode];
    const run = await prisma.vehicleCatalogImportRun.create({
      data: {
        sourceId,
        mode: withBackfill ? 'load+backfill' : 'load',
        status: VehicleImportStatus.RUNNING,
      },
    });

    for (const chunk of chunkItems(records, 500)) {
      await prisma.vehicleCatalogRawRecord.createMany({
        data: chunk.map((record) => ({
          importRunId: run.id,
          sourceId,
          recordType: record.recordType,
          externalId: record.externalId,
          checksum: record.checksum,
          brandName: record.brandName,
          modelName: record.modelName,
          productionStartYear: record.productionStartYear,
          productionEndYear: record.productionEndYear,
          payload: record.payload as Prisma.InputJsonValue,
        })),
      });
    }

    await prisma.vehicleCatalogImportRun.update({
      where: { id: run.id },
      data: {
        status: VehicleImportStatus.COMPLETED,
        stats: { records: records.length },
        finishedAt: new Date(),
      },
    });
  }

  console.log('Vehicle catalog import completed.');
  console.log(JSON.stringify(stats, null, 2));
  await prisma.$disconnect();
}

if (require.main === module) {
  void run().catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
