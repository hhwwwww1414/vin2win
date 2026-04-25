import type {
  VehicleDocumentOcrFields,
  VehicleDocumentOcrResult,
  VehicleDocumentOcrWarning,
} from '@/lib/ocr/vehicle-document';

type UnknownRecord = Record<string, unknown>;

const VIN_PATTERN = /\b[A-HJ-NPR-Z0-9]{17}\b/i;
const VIN_SCAN_PATTERN = /(?:[A-ZА-Я0-9][\s.-]*){17}/gi;
const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/;

const FIELD_LABELS = [
  /регистрационный знак/i,
  /идентификационный номер/i,
  /\bvin\b/i,
  /марка[, ]+модель/i,
  /наименование.*тип\s*тс/i,
  /тип\s*тс/i,
  /год выпуска/i,
  /год изготовления/i,
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

function stripLeadingFieldNoise(value: string): string {
  return cleanText(
    value
      .replace(/^\s*\d{1,2}\s*[).:-]\s*/, '')
      .replace(/^\s*\d{1,2}\s+(?=\D|$)/, '')
      .replace(/^[):№.\-\s]+/, '')
      .replace(/^[()]+|[()]+$/g, '')
  );
}

function isUsableFieldValue(value: string): boolean {
  const cleaned = stripLeadingFieldNoise(value);
  if (!cleaned) {
    return false;
  }

  return !/^(?:\d{1,2}|тс|т\.?\s*с\.?|наименование(?:\s*\(\s*\))?)$/i.test(cleaned);
}

function valueAfterLabel(line: string, label: RegExp): string {
  return stripLeadingFieldNoise(line.replace(label, ''));
}

function findValueAfterLabel(lines: string[], labels: RegExp[]): string | undefined {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((candidate) => candidate.test(line));
    if (!label) {
      continue;
    }

    const inlineValue = valueAfterLabel(line, label);
    if (isUsableFieldValue(inlineValue) && !isLabelLine(inlineValue)) {
      return inlineValue;
    }

    for (let offset = 1; offset <= 3; offset += 1) {
      const nextLine = lines[index + offset];
      if (!nextLine) {
        break;
      }
      if (isLabelLine(nextLine)) {
        break;
      }
      return nextLine;
    }
  }

  return undefined;
}

function normalizeVinAlphabet(value: string): string {
  const replacements: Record<string, string> = {
    А: 'A',
    В: 'B',
    Е: 'E',
    К: 'K',
    М: 'M',
    Н: 'H',
    Р: 'P',
    С: 'C',
    Т: 'T',
    У: 'Y',
    Х: 'X',
    О: '0',
    З: '3',
  };

  return value
    .toUpperCase()
    .replace(/[АВЕКМНОРСТУХОЗ]/g, (letter) => replacements[letter] ?? letter)
    .replace(/O/g, '0');
}

function normalizeVin(value: string): string | undefined {
  const source = normalizeVinAlphabet(value);
  const candidates = source.match(VIN_SCAN_PATTERN) ?? [];

  for (const candidate of candidates) {
    const normalized = candidate.replace(/[^A-Z0-9]/g, '');
    const match = normalized.match(VIN_PATTERN)?.[0];
    if (match && /\d/.test(match)) {
      return match.toUpperCase();
    }
  }

  const compact = source.replace(/[^A-Z0-9]/g, '');
  for (let index = 0; index <= compact.length - 17; index += 1) {
    const candidate = compact.slice(index, index + 17);
    if (VIN_PATTERN.test(candidate) && /\d/.test(candidate)) {
      return candidate.toUpperCase();
    }
  }

  return undefined;
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

  const repeatedBrandIndex = parts.findIndex(
    (part, index) => index > 0 && part.toUpperCase() === parts[0].toUpperCase()
  );
  if (repeatedBrandIndex > 1 && repeatedBrandIndex < parts.length - 1) {
    return {
      brand: parts[0],
      model: parts.slice(repeatedBrandIndex + 1).join(' '),
    };
  }

  return {
    brand: parts[0],
    model: parts.slice(1).join(' '),
  };
}

function findBrandModelValue(lines: string[]): string | undefined {
  const labels = [/марка[, ]+модель(?:\s*тс)?/i];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = labels.find((candidate) => candidate.test(line));
    if (!label) {
      continue;
    }

    const values: string[] = [];
    const inlineValue = valueAfterLabel(line, label);
    if (isUsableFieldValue(inlineValue) && !isLabelLine(inlineValue)) {
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
  const power = slashParts.length > 1 ? matches.at(-1)?.[0] : matches[0]?.[0];

  if (!power) {
    return undefined;
  }

  const parsed = Number(power);
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
  const vinSource = findValueAfterLabel(lines, [/идентификационный номер.*vin/i, /идентификационный номер/i, /\bvin\b/i]);
  const vin = vinSource ? normalizeVin(vinSource) : undefined;
  const fallbackVin = vin ?? normalizeVin(normalizedText);
  if (fallbackVin) {
    fields.vin = fallbackVin;
  }

  const brandModel = findBrandModelValue(lines);
  if (brandModel) {
    Object.assign(fields, splitBrandModel(brandModel));
  }

  const vehicleType = findValueAfterLabel(lines, [/наименование\s*\(?\s*тип\s*тс\)?/i, /тип\s*тс/i]);
  const normalizedType = vehicleType ? normalizeVehicleType(vehicleType) : undefined;
  if (normalizedType) {
    fields.vehicleType = normalizedType;
  }

  const year =
    findValueAfterLabel(lines, [/год (?:выпуска|изготовления)(?:\s*тс)?/i]) ??
    normalizedText.match(YEAR_PATTERN)?.[0];
  const normalizedYear = year ? normalizeYear(year) : undefined;
  if (normalizedYear) {
    fields.year = normalizedYear;
  }

  const power = findValueAfterLabel(lines, [
    /мощность двигателя.*?(?:квт\s*\/\s*л\.?\s*с\.?|л\.?\s*с\.?\s*\(?\s*квт\s*\)?|л\.?\s*с\.?)/i,
    /мощность двигателя/i,
  ]);
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
