import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { strFromU8, unzipSync } from 'fflate';
import '../load-env';

export const projectRoot = process.cwd();
export const vehicleDataRoot = path.join(projectRoot, 'vendor', 'vehicle-data');
export const carApiPath = path.join(vehicleDataRoot, 'car-api', 'car-brands.json');
export const openVehicleDbMakesPath = path.join(
  vehicleDataRoot,
  'open-vehicle-db',
  'data',
  'makes_and_models.json'
);
export const openVehicleDbStylesRoot = path.join(
  vehicleDataRoot,
  'open-vehicle-db',
  'data',
  'styles'
);
export const automobileModelsSpecsZipPath = path.join(
  vehicleDataRoot,
  'automobile-models-and-specs',
  'automobiles.json.zip'
);
export const epaVehiclesZipPath = path.join(projectRoot, 'vehicles.csv.zip');

export function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRESQL_HOST;
  const port = process.env.POSTGRESQL_PORT;
  const user = process.env.POSTGRESQL_USER;
  const password = process.env.POSTGRESQL_PASSWORD;
  const dbName = process.env.POSTGRESQL_DBNAME;

  if (!host || !port || !user || !password || !dbName) {
    throw new Error(
      'Missing database credentials. Set DATABASE_URL or POSTGRESQL_HOST/PORT/USER/PASSWORD/DBNAME.'
    );
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(dbName)}?schema=public`;
}

export function createCatalogPrismaClient() {
  return new PrismaClient({
    datasourceUrl: buildDatabaseUrl(),
  });
}

export function readJsonFile<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function readZippedJsonFiles(filePath: string) {
  const archive = fs.readFileSync(filePath);
  const files = unzipSync(new Uint8Array(archive));

  const jsonFiles: Record<string, unknown> = {};
  for (const [name, content] of Object.entries(files)) {
    jsonFiles[name] = JSON.parse(strFromU8(content));
  }

  return jsonFiles;
}

export function normalizeCatalogText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ё/g, 'е')
    .trim();
}

export function slugifyCatalogValue(value: string) {
  return normalizeCatalogText(value).replace(/\s+/g, '-');
}

export function createDeterministicCatalogId(prefix: string, value: string) {
  const hash = createHash('sha1').update(value).digest('hex').slice(0, 16);
  return `${prefix}_${hash}`;
}

export function checksumPayload(payload: unknown) {
  return createHash('sha1').update(JSON.stringify(payload)).digest('hex');
}

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<');
}

export function parseYearFromValue(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function parsePowerHp(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(',', '.');
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hp|bhp)\b/i);
  if (match) {
    return Math.round(Number(match[1]));
  }

  const fallback = normalized.match(/\b(\d{2,4})\b/);
  if (!fallback) {
    return undefined;
  }

  const parsed = Number(fallback[1]);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
}

export function parseDisplacementLiters(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(',', '.');
  const liters = normalized.match(/(\d+(?:\.\d+)?)\s*l\b/i);
  if (liters) {
    return Number(liters[1]);
  }

  const cubicCm = normalized.match(/(\d{3,5})\s*cm3\b/i);
  if (cubicCm) {
    return Number(cubicCm[1]) / 1000;
  }

  return undefined;
}

export function parseInteger(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const match = value.match(/-?\d+/);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseOptionalCliFlag(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index < 0) {
    return undefined;
  }

  return process.argv[index + 1];
}

export function hasCliFlag(flag: string) {
  return process.argv.includes(flag);
}

export function chunkItems<TItem>(items: TItem[], size: number) {
  const chunks: TItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function uniq<TItem>(items: TItem[]) {
  return Array.from(new Set(items));
}

export function appendAlias(target: Set<string>, ...values: Array<string | undefined | null>) {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      target.add(normalized);
    }
  }
}

export function simpleRuTransliteration(value: string) {
  const pairs: Array<[RegExp, string]> = [
    [/sch/gi, 'щ'],
    [/sh/gi, 'ш'],
    [/ch/gi, 'ч'],
    [/yu/gi, 'ю'],
    [/ya/gi, 'я'],
    [/zh/gi, 'ж'],
    [/yo/gi, 'ё'],
    [/kh/gi, 'х'],
    [/ts/gi, 'ц'],
    [/a/gi, 'а'],
    [/b/gi, 'б'],
    [/c/gi, 'к'],
    [/d/gi, 'д'],
    [/e/gi, 'е'],
    [/f/gi, 'ф'],
    [/g/gi, 'г'],
    [/h/gi, 'х'],
    [/i/gi, 'и'],
    [/j/gi, 'й'],
    [/k/gi, 'к'],
    [/l/gi, 'л'],
    [/m/gi, 'м'],
    [/n/gi, 'н'],
    [/o/gi, 'о'],
    [/p/gi, 'п'],
    [/q/gi, 'к'],
    [/r/gi, 'р'],
    [/s/gi, 'с'],
    [/t/gi, 'т'],
    [/u/gi, 'у'],
    [/v/gi, 'в'],
    [/w/gi, 'в'],
    [/x/gi, 'кс'],
    [/y/gi, 'ы'],
    [/z/gi, 'з'],
  ];

  return pairs.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value);
}

export function ensureDirectory(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
