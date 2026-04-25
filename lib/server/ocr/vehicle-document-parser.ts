import type {
  VehicleDocumentOcrFields,
  VehicleDocumentOcrResult,
  VehicleDocumentOcrWarning,
} from '@/lib/ocr/vehicle-document';

type UnknownRecord = Record<string, unknown>;

const VIN_PATTERN = /\b[A-HJ-NPR-Z0-9]{17}\b/i;
const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/;

const FIELD_LABELS = [
  /регистрационный знак/i,
  /идентификационный номер/i,
  /\bvin\b/i,
  /марка[, ]+модель/i,
  /тип\s*тс/i,
  /год выпуска/i,
  /мощность двигателя/i,
  /экологический класс/i,
  /паспорт\s*тс/i,
  /разрешенная/i,
  /масса/i,
  /шасси/i,
  /кузов/i,
  /цвет/i,
];

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function cleanMultilineText(value: string): string {
  return value
    .replace(/\r/g, '\n')
    .split('\n')
    .map(cleanText)
    .filter(Boolean)
    .join('\n');
}

function getNestedRecord(root: unknown, path: string[]): UnknownRecord | null {
  let current: unknown = root;

  for (const key of path) {
    const record = asRecord(current);
    if (!record) {
      return null;
    }
    current = record[key];
  }

  return asRecord(current);
}

function textFromLine(line: unknown): string {
  const record = asRecord(line);
  if (!record) {
    return '';
  }

  if (typeof record.text === 'string') {
    return cleanText(record.text);
  }

  const words = Array.isArray(record.words) ? record.words : [];
  return cleanText(
    words
      .map((word) => {
        const wordRecord = asRecord(word);
        return typeof wordRecord?.text === 'string' ? wordRecord.text : '';
      })
      .filter(Boolean)
      .join(' ')
  );
}

export function extractYandexOcrText(response: unknown): string {
  const annotation =
    getNestedRecord(response, ['result', 'textAnnotation']) ??
    getNestedRecord(response, ['result', 'text_annotation']) ??
    getNestedRecord(response, ['textAnnotation']) ??
    getNestedRecord(response, ['text_annotation']);

  if (!annotation) {
    return '';
  }

  if (typeof annotation.fullText === 'string') {
    return cleanMultilineText(annotation.fullText);
  }

  if (typeof annotation.full_text === 'string') {
    return cleanMultilineText(annotation.full_text);
  }

  const blocks = Array.isArray(annotation.blocks) ? annotation.blocks : [];
  const lines: string[] = [];

  for (const block of blocks) {
    const blockRecord = asRecord(block);
    const blockLines = Array.isArray(blockRecord?.lines) ? blockRecord.lines : [];

    for (const line of blockLines) {
      const value = textFromLine(line);
      if (value) {
        lines.push(value);
      }
    }
  }

  return lines.join('\n');
}

function isLabelLine(value: string): boolean {
  return FIELD_LABELS.some((label) => label.test(value));
}

function valueAfterLabel(line: string, label: RegExp): string {
  return cleanText(line.replace(label, '').replace(/^[):№.\-\s]+/, ''));
}

function findValueAfterLabel(lines: string[], labels: RegExp[]): string | undefined {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((candidate) => candidate.test(line));
    if (!label) {
      continue;
    }

    const inlineValue = valueAfterLabel(line, label);
    if (inlineValue && !isLabelLine(inlineValue)) {
      return inlineValue;
    }

    for (let offset = 1; offset <= 3; offset += 1) {
      const nextLine = lines[index + offset];
      if (!nextLine) {
        break;
      }
      if (isLabelLine(nextLine)) {
        continue;
      }
      return nextLine;
    }
  }

  return undefined;
}

function normalizeVin(value: string): string | undefined {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return VIN_PATTERN.test(normalized) ? normalized.match(VIN_PATTERN)?.[0].toUpperCase() : undefined;
}

function splitBrandModel(value: string): Pick<VehicleDocumentOcrFields, 'brand' | 'model'> {
  const cleaned = cleanText(value.replace(/[;,]+$/g, ''));
  const parts = cleaned.split(' ').filter(Boolean);

  if (parts.length === 0) {
    return {};
  }

  if (parts.length === 1) {
    return { brand: parts[0] };
  }

  return {
    brand: parts[0],
    model: parts.slice(1).join(' '),
  };
}

function findBrandModelValue(lines: string[]): string | undefined {
  const labels = [/марка[, ]+модель/i];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((candidate) => candidate.test(line));
    if (!label) {
      continue;
    }

    const values: string[] = [];
    const inlineValue = valueAfterLabel(line, label);
    if (inlineValue && !isLabelLine(inlineValue)) {
      values.push(inlineValue);
    }

    for (let offset = 1; offset <= 3; offset += 1) {
      const nextLine = lines[index + offset];
      if (!nextLine || isLabelLine(nextLine)) {
        break;
      }

      const firstValueParts = values[0]?.split(' ').filter(Boolean) ?? [];
      if (values.length > 0 && firstValueParts.length > 1) {
        break;
      }

      values.push(nextLine);
      if (values.length >= 2) {
        break;
      }
    }

    if (values.length > 0) {
      return values.join(' ');
    }
  }

  return undefined;
}

function toTitleCaseRu(value: string): string {
  const lower = value.trim().toLowerCase();
  return lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : '';
}

function normalizeVehicleType(value: string): string | undefined {
  const normalized = cleanText(value).toUpperCase();
  if (!normalized) {
    return undefined;
  }

  const aliases: Array<[RegExp, string]> = [
    [/СЕДАН|SEDAN/, 'Седан'],
    [/УНИВЕРСАЛ|WAGON/, 'Универсал'],
    [/ХЭТЧБЕК|ХЕТЧБЕК|HATCHBACK/, 'Хэтчбек'],
    [/ЛИФТБЕК|LIFTBACK/, 'Лифтбек'],
    [/ВНЕДОРОЖ|КРОССОВЕР|SUV/, 'Внедорожник'],
    [/КУПЕ|COUPE/, 'Купе'],
    [/КАБРИОЛЕТ|CABRIO/, 'Кабриолет'],
    [/ПИКАП|PICKUP/, 'Пикап'],
    [/МИНИВЭН|MINIVAN/, 'Минивэн'],
  ];

  return aliases.find(([pattern]) => pattern.test(normalized))?.[1] ?? toTitleCaseRu(value);
}

function normalizeYear(value: string): string | undefined {
  return value.match(YEAR_PATTERN)?.[0];
}

function normalizePowerHp(value: string): string | undefined {
  const normalized = value.replace(',', '.');
  const slashParts = normalized.split('/').map((part) => part.trim()).filter(Boolean);
  const source = slashParts.length > 1 ? slashParts[slashParts.length - 1] : normalized;
  const matches = [...source.matchAll(/\d+(?:\.\d+)?/g)];
  const last = matches.at(-1)?.[0];

  if (!last) {
    return undefined;
  }

  const parsed = Number(last);
  return Number.isFinite(parsed) && parsed > 0 ? String(Math.round(parsed)) : undefined;
}

function confidenceFor(field: keyof VehicleDocumentOcrFields, value: string): number {
  if (field === 'vin') {
    return value.length === 17 ? 0.92 : 0.65;
  }

  return 0.78;
}

function buildWarnings(fields: VehicleDocumentOcrFields): VehicleDocumentOcrWarning[] {
  const warnings: VehicleDocumentOcrWarning[] = [];

  if (fields.vin && fields.vin.length !== 17) {
    warnings.push({
      field: 'vin',
      code: 'VIN_LENGTH',
      message: 'VIN должен содержать 17 символов. Проверьте значение вручную.',
    });
  }

  return warnings;
}

export function parseVehicleDocumentOcrText(text: string): VehicleDocumentOcrResult {
  const normalizedText = text.replace(/\r/g, '\n');
  const lines = normalizedText
    .split('\n')
    .map(cleanText)
    .filter(Boolean);

  const fields: VehicleDocumentOcrFields = {};
  const vinSource =
    findValueAfterLabel(lines, [/идентификационный номер.*vin/i, /идентификационный номер/i, /\bvin\b/i]) ??
    normalizedText.match(VIN_PATTERN)?.[0];
  const vin = vinSource ? normalizeVin(vinSource) : undefined;
  if (vin) {
    fields.vin = vin;
  }

  const brandModel = findBrandModelValue(lines);
  if (brandModel) {
    Object.assign(fields, splitBrandModel(brandModel));
  }

  const vehicleType = findValueAfterLabel(lines, [/тип\s*тс/i]);
  const normalizedType = vehicleType ? normalizeVehicleType(vehicleType) : undefined;
  if (normalizedType) {
    fields.vehicleType = normalizedType;
  }

  const year = findValueAfterLabel(lines, [/год выпуска(?:\s*тс)?/i]) ?? normalizedText.match(YEAR_PATTERN)?.[0];
  const normalizedYear = year ? normalizeYear(year) : undefined;
  if (normalizedYear) {
    fields.year = normalizedYear;
  }

  const power = findValueAfterLabel(lines, [/мощность двигателя(?:.*л\.?\s*с\.?)?/i]);
  const normalizedPower = power ? normalizePowerHp(power) : undefined;
  if (normalizedPower) {
    fields.enginePowerHp = normalizedPower;
  }

  const confidence = Object.fromEntries(
    Object.entries(fields).map(([field, value]) => [
      field,
      confidenceFor(field as keyof VehicleDocumentOcrFields, value),
    ])
  ) as VehicleDocumentOcrResult['confidence'];

  return {
    documentType: 'vehicle-document',
    fields,
    confidence,
    warnings: buildWarnings(fields),
    rawText: normalizedText,
  };
}
