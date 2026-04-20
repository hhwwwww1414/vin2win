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
import {
  getEditableSaleListingForOwner,
  updateSaleListingByOwner,
  type OwnerSaleListingUploadedMediaInput,
  type OwnerSaleListingUpdateInput,
} from '@/lib/server/marketplace';
import { buildS3PublicUrl, deleteS3Objects, uploadToS3 } from '@/lib/server/s3';
import type { SaleListingEditMediaPlan } from '@/lib/sale-form';

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
    return value.map((item) => parseString(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeSellerType(value: string): 'owner' | 'flip' | 'broker' | 'commission' {
  if (value === 'commission' || value === 'owner' || value === 'flip') {
    return value;
  }

  return 'broker';
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

function normalizeTargetStatus(value: unknown): 'DRAFT' | 'PENDING' | null {
  return value === ListingStatus.DRAFT || value === ListingStatus.PENDING
    ? (value as 'DRAFT' | 'PENDING')
    : null;
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
    uploadId: string;
  }
): Promise<OwnerSaleListingUploadedMediaInput> {
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
    uploadId: params.uploadId,
    kind: params.kind,
    storageKey: objectKey,
    publicUrl: buildS3PublicUrl(objectKey),
    originalName: file.name,
    mimeType: file.type || undefined,
    sizeBytes: file.size,
  };
}

function parseOwnerSaleListingPayload(payload: Record<string, unknown>): OwnerSaleListingUpdateInput {
  return {
    sellerName: parseString(payload.sellerName),
    contact: parseString(payload.contact),
    make: parseString(payload.make),
    catalogBrandId: parseOptionalString(payload.catalogBrandId),
    model: parseString(payload.model),
    catalogModelId: parseOptionalString(payload.catalogModelId),
    generation: parseOptionalString(payload.generation),
    catalogGenerationId: parseOptionalString(payload.catalogGenerationId),
    year: parseNumber(payload.year),
    vin: parseOptionalString(payload.vin),
    city: parseString(payload.city),
    plateNumber: buildRegistrationPlateValue(splitRegistrationPlateValue(parseOptionalString(payload.plateNumber))),
    plateRegion: normalizeRegistrationPlateRegion(parseOptionalString(payload.plateRegion)),
    plateUnregistered: parseBoolean(payload.plateUnregistered),
    price: parseNumber(payload.price),
    priceInHand: parseOptionalNumber(payload.priceInHand),
    priceOnResources: parseOptionalNumber(payload.priceOnResources),
    bodyType: parseString(payload.bodyType),
    catalogBodyTypeId: parseOptionalString(payload.catalogBodyTypeId),
    engine: parseString(payload.engine),
    catalogFuelTypeId: parseOptionalString(payload.catalogFuelTypeId),
    engineDisplacementL: parseOptionalNumber(payload.engineDisplacementL),
    catalogEngineId: parseOptionalString(payload.catalogEngineId),
    power: parseNumber(payload.power),
    transmission: parseString(payload.transmission),
    catalogTransmissionId: parseOptionalString(payload.catalogTransmissionId),
    drive: parseString(payload.drive),
    catalogDriveTypeId: parseOptionalString(payload.catalogDriveTypeId),
    catalogModificationId: parseOptionalString(payload.catalogModificationId),
    mileage: parseNumber(payload.mileage),
    steering: parseString(payload.steering),
    color: parseString(payload.color),
    trim: parseOptionalString(payload.trim),
    catalogTrimId: parseOptionalString(payload.catalogTrimId),
    owners: parseNumber(payload.owners),
    registrations: parseOptionalNumber(payload.registrations),
    keysCount: parseOptionalNumber(payload.keysCount),
    ptsType: normalizePtsType(parseOptionalString(payload.ptsType)),
    paintCount: parseNumber(payload.paintCount),
    paintedElements: parseStringArray(payload.paintedElements),
    taxi: parseBoolean(payload.taxi),
    carsharing: parseBoolean(payload.carsharing),
    avtotekaStatus: parseBoolean(payload.avtotekaGreen) ? 'green' : undefined,
    wheelSet: parseBoolean(payload.wheelSet),
    extraTires: parseBoolean(payload.extraTires),
    glassOriginal: parseBoolean(payload.glassOriginal),
    noInvestment: parseBoolean(payload.noInvestment, true),
    investmentNote: parseOptionalString(payload.investmentNote),
    sellerType: normalizeSellerType(parseString(payload.sellerType)),
    resourceStatus: normalizeResourceStatus(parseString(payload.resourceStatus)),
    description: parseString(payload.description),
    videoUrlExternal: parseOptionalString(payload.videoUrl),
  };
}

function validateOwnerSaleListing(
  values: OwnerSaleListingUpdateInput,
  targetStatus: 'DRAFT' | 'PENDING',
  region: string
) {
  if (
    !values.sellerName ||
    !values.contact ||
    !values.make ||
    !values.model ||
    !values.city ||
    !values.bodyType ||
    !values.engine ||
    !values.transmission ||
    !values.drive ||
    !values.description
  ) {
    throw new Error('Не заполнены обязательные поля.');
  }

  const availableCities = getCitiesForRegion(region);
  if (!region || availableCities.length === 0 || !availableCities.includes(values.city)) {
    throw new Error('Выберите город из выбранного региона.');
  }

  if (values.price <= 0 || values.year <= 0 || values.mileage < 0 || values.owners <= 0 || values.paintCount < 0) {
    throw new Error('Некорректные числовые значения объявления.');
  }

  if (
    !values.plateUnregistered &&
    (values.plateNumber || values.plateRegion) &&
    !isRegistrationPlateComplete(values.plateNumber, values.plateRegion)
  ) {
    throw new Error('Заполните госномер полностью или отметьте, что машина не стоит на учёте в ГАИ.');
  }

  if (targetStatus === 'PENDING' && !values.description.trim()) {
    throw new Error('Добавьте описание объявления.');
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const payload = await getEditableSaleListingForOwner({
      listingId: id,
      currentUserId: currentUser.id,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch listing.';
    if (message === 'Listing not found.') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === 'Access denied.') {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uploadedKeys: string[] = [];

  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await parseMultipartRequest(request);
    const payloadRaw = formData.get('payload');
    const mediaPlanRaw = formData.get('mediaPlan');

    if (typeof payloadRaw !== 'string') {
      return NextResponse.json({ error: 'Не переданы данные объявления.' }, { status: 400 });
    }

    if (typeof mediaPlanRaw !== 'string') {
      return NextResponse.json({ error: 'Не передан план медиа.' }, { status: 400 });
    }

    const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    const mediaPlan = JSON.parse(mediaPlanRaw) as SaleListingEditMediaPlan;
    const targetStatus = normalizeTargetStatus(payload.initialStatus);

    if (!targetStatus) {
      return NextResponse.json({ error: 'Invalid target status.' }, { status: 400 });
    }

    const values = parseOwnerSaleListingPayload(payload);
    const region = parseString(payload.region);
    validateOwnerSaleListing(values, targetStatus, region);

    const uploadedMedia: OwnerSaleListingUploadedMediaInput[] = [];

    for (const [index, item] of mediaPlan.gallery.entries()) {
      if (item.source !== 'new') {
        continue;
      }

      const file = ensureFile(formData.get(`galleryFile:${item.uploadId}`));
      if (!file) {
        return NextResponse.json({ error: 'Не найден новый файл галереи.' }, { status: 400 });
      }

      const uploaded = await uploadIncomingFile(ensureFileSizeWithinLimit(file, 'photo'), {
        listingKey: id,
        kind: 'gallery',
        sortOrder: index,
        uploadId: item.uploadId,
      });
      uploadedKeys.push(uploaded.storageKey);
      uploadedMedia.push(uploaded);
    }

    if (mediaPlan.video?.source === 'new') {
      const file = ensureFile(formData.get(`videoFile:${mediaPlan.video.uploadId}`));
      if (!file) {
        return NextResponse.json({ error: 'Не найден новый видеофайл.' }, { status: 400 });
      }

      const uploaded = await uploadIncomingFile(ensureFileSizeWithinLimit(file, 'video'), {
        listingKey: id,
        kind: 'video',
        sortOrder: 0,
        uploadId: mediaPlan.video.uploadId,
      });
      uploadedKeys.push(uploaded.storageKey);
      uploadedMedia.push(uploaded);
    }

    const result = await updateSaleListingByOwner({
      listingId: id,
      currentUserId: currentUser.id,
      targetStatus,
      values,
      mediaPlan,
      uploadedMedia,
    });

    if (result.removedStorageKeys.length > 0) {
      deleteS3Objects(result.removedStorageKeys).catch((error) => {
        console.error('Failed to delete removed sale listing media from S3.', error);
      });
    }

    return NextResponse.json(
      {
        id: result.listing.id,
        status: result.listing.status,
      },
      { status: 200 }
    );
  } catch (error) {
    if (uploadedKeys.length > 0) {
      await deleteS3Objects(uploadedKeys).catch(() => undefined);
    }

    const message = error instanceof Error ? error.message : 'Unable to update listing.';
    if (message === 'Listing not found.') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === 'Access denied.') {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
