import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { ListingStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import {
  buildRegistrationPlateValue,
  isRegistrationPlateComplete,
  normalizeRegistrationPlateRegion,
  splitRegistrationPlateValue,
} from '@/lib/registration-plate';
import { getCitiesForRegion } from '@/lib/ru-regions';
import { getSessionUser } from '@/lib/server/auth';
import { parseMultipartRequest } from '@/lib/server/multipart-form-data';
import { createSaleListing } from '@/lib/server/marketplace';
import { buildS3PublicUrl, uploadToS3 } from '@/lib/server/s3';

export const runtime = 'nodejs';

const MAX_LISTING_MEDIA_FILE_SIZE_BYTES = 300 * 1024 * 1024;
const MAX_LISTING_MEDIA_FILE_SIZE_LABEL = '300 MB';

function parseString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalString(value: unknown): string | undefined {
  const normalized = parseString(value);
  return normalized ? normalized : undefined;
}

function parseNumber(value: unknown, fallback = 0): number {
  const normalized = typeof value === 'string' ? value.trim() : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumber(value: unknown): number | undefined {
  const normalized = parseString(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSellerType(value: string): 'owner' | 'flip' | 'broker' | 'commission' {
  return value === 'commission' ? 'commission' : 'broker';
}

function normalizeResourceStatus(value: string): 'not_listed' | 'pre_resources' | 'on_resources' {
  return value === 'pre_resources' || value === 'on_resources' ? value : 'not_listed';
}

function normalizePtsType(value: string | undefined): 'original' | 'duplicate' | 'epts' | undefined {
  if (value === 'duplicate' || value === 'epts') {
    return value;
  }

  return value === 'original' ? 'original' : undefined;
}

function normalizeInitialStatus(value: unknown): ListingStatus {
  return value === ListingStatus.DRAFT ? ListingStatus.DRAFT : ListingStatus.PENDING;
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true' || value === '1';
  }

  return fallback;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => parseString(item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function ensureFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

function ensureFileSizeWithinLimit(file: File, kind: 'photo' | 'video') {
  if (file.size <= MAX_LISTING_MEDIA_FILE_SIZE_BYTES) {
    return file;
  }

  throw new Error(
    kind === 'photo'
      ? `Размер фотографии не должен превышать ${MAX_LISTING_MEDIA_FILE_SIZE_LABEL}.`
      : `Размер видео не должен превышать ${MAX_LISTING_MEDIA_FILE_SIZE_LABEL}.`
  );
}

function normalizeExtension(file: File): string {
  const extension = path.extname(file.name).toLowerCase();
  if (extension) {
    return extension;
  }

  switch (file.type) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'video/mp4':
      return '.mp4';
    case 'video/quicktime':
      return '.mov';
    default:
      return '.bin';
  }
}

async function uploadIncomingFile(
  file: File,
  params: {
    listingKey: string;
    kind: 'gallery' | 'video';
    sortOrder: number;
  }
) {
  const extension = normalizeExtension(file);
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const objectKey = [
    'uploads',
    'sale',
    params.listingKey,
    params.kind,
    `${String(params.sortOrder).padStart(2, '0')}-${randomUUID()}${extension}`,
  ].join('/');

  await uploadToS3({
    key: objectKey,
    body: fileBytes,
    contentType: file.type || undefined,
    cacheControl: 'public, max-age=31536000, immutable',
    contentLength: file.size,
  });

  return {
    kind: params.kind,
    storageKey: objectKey,
    publicUrl: buildS3PublicUrl(objectKey),
    originalName: file.name,
    mimeType: file.type || undefined,
    sizeBytes: file.size,
    sortOrder: params.sortOrder,
  } as const;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const formData = await parseMultipartRequest(request);
    const payloadRaw = formData.get('payload');

    if (typeof payloadRaw !== 'string') {
      return NextResponse.json({ error: 'Не переданы данные объявления.' }, { status: 400 });
    }

    const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    const initialStatus = normalizeInitialStatus(payload.initialStatus);
    const sellerName = parseString(payload.sellerName);
    const contact = parseString(payload.contact);
    const make = parseString(payload.make);
    const model = parseString(payload.model);
    const region = parseString(payload.region);
    const city = parseString(payload.city);
    const plateNumber = buildRegistrationPlateValue(splitRegistrationPlateValue(parseOptionalString(payload.plateNumber)));
    const plateRegion = normalizeRegistrationPlateRegion(parseOptionalString(payload.plateRegion));
    const plateUnregistered = parseBoolean(payload.plateUnregistered);
    const bodyType = parseString(payload.bodyType);
    const engine = parseString(payload.engine);
    const transmission = parseString(payload.transmission);
    const drive = parseString(payload.drive);
    const description = parseString(payload.description);

    if (!sellerName || !contact || !make || !model || !region || !city || !bodyType || !engine || !transmission || !drive || !description) {
      return NextResponse.json({ error: 'Не заполнены обязательные поля.' }, { status: 400 });
    }

    const availableCities = getCitiesForRegion(region);
    if (availableCities.length === 0 || !availableCities.includes(city)) {
      return NextResponse.json({ error: 'Выберите город из выбранного региона.' }, { status: 400 });
    }

    if (!plateUnregistered && (plateNumber || plateRegion) && !isRegistrationPlateComplete(plateNumber, plateRegion)) {
      return NextResponse.json({ error: 'Заполните госномер полностью или отметьте, что машина не стоит на учёте в ГАИ.' }, { status: 400 });
    }

    const galleryFiles = formData
      .getAll('photos')
      .map((entry) => ensureFile(entry))
      .filter((file): file is File => Boolean(file))
      .map((file) => ensureFileSizeWithinLimit(file, 'photo'));

    if (galleryFiles.length === 0 && initialStatus !== ListingStatus.DRAFT) {
      return NextResponse.json({ error: 'Добавьте хотя бы одну фотографию.' }, { status: 400 });
    }

    const listingKey = randomUUID();
    const galleryMedia = await Promise.all(
      galleryFiles.map((file, index) =>
        uploadIncomingFile(file, {
          listingKey,
          kind: 'gallery',
          sortOrder: index,
        })
      )
    );

    const videoFile = ensureFile(formData.get('video'));
    const validatedVideoFile = videoFile ? ensureFileSizeWithinLimit(videoFile, 'video') : null;
    const videoMedia = validatedVideoFile
      ? [
          await uploadIncomingFile(validatedVideoFile, {
            listingKey,
            kind: 'video',
            sortOrder: 0,
          }),
        ]
      : [];

    const listing = await createSaleListing({
      createdByUserId: currentUser.id,
      initialStatus,
      sellerName,
      contact,
      make,
      catalogBrandId: parseOptionalString(payload.catalogBrandId),
      model,
      catalogModelId: parseOptionalString(payload.catalogModelId),
      generation: parseOptionalString(payload.generation),
      catalogGenerationId: parseOptionalString(payload.catalogGenerationId),
      year: parseNumber(payload.year),
      vin: parseOptionalString(payload.vin),
      city,
      plateNumber: plateNumber || undefined,
      plateRegion: plateRegion || undefined,
      plateUnregistered,
      price: parseNumber(payload.price),
      priceInHand: parseOptionalNumber(payload.priceInHand),
      priceOnResources: parseOptionalNumber(payload.priceOnResources),
      bodyType,
      catalogBodyTypeId: parseOptionalString(payload.catalogBodyTypeId),
      engine,
      catalogFuelTypeId: parseOptionalString(payload.catalogFuelTypeId),
      engineDisplacementL: parseOptionalNumber(payload.engineDisplacementL),
      catalogEngineId: parseOptionalString(payload.catalogEngineId),
      power: parseNumber(payload.power),
      transmission,
      catalogTransmissionId: parseOptionalString(payload.catalogTransmissionId),
      drive,
      catalogDriveTypeId: parseOptionalString(payload.catalogDriveTypeId),
      catalogModificationId: parseOptionalString(payload.catalogModificationId),
      mileage: parseNumber(payload.mileage),
      steering: parseString(payload.steering) || 'Левый',
      color: parseString(payload.color),
      trim: parseOptionalString(payload.trim),
      catalogTrimId: parseOptionalString(payload.catalogTrimId),
      owners: parseNumber(payload.owners),
      registrations: parseOptionalNumber(payload.registrations),
      keysCount: parseOptionalNumber(payload.keysCount),
      ptsType: normalizePtsType(parseOptionalString(payload.ptsType)),
      paintCount: parseNumber(payload.paintCount),
      paintedElements: parseStringArray(payload.paintedElements),
      taxi: !parseBoolean(payload.notTaxi, true),
      carsharing: !parseBoolean(payload.notCarsharing, true),
      avtotekaStatus: parseBoolean(payload.avtotekaGreen) ? 'green' : undefined,
      wheelSet: parseBoolean(payload.wheelSet),
      extraTires: parseBoolean(payload.extraTires),
      glassOriginal: parseBoolean(payload.glassOriginal),
      noInvestment: parseBoolean(payload.noInvestment, true),
      investmentNote: parseOptionalString(payload.investmentNote),
      sellerType: normalizeSellerType(parseString(payload.sellerType)),
      resourceStatus: normalizeResourceStatus(parseString(payload.resourceStatus)),
      description,
      videoUrlExternal: validatedVideoFile ? undefined : parseOptionalString(payload.videoUrl),
      media: [...galleryMedia, ...videoMedia],
    });

    return NextResponse.json({ id: listing.id, status: listing.status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось создать объявление.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
