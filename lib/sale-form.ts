import type { ListingStatusValue } from '@/lib/listing-status';
import type { VehicleDocumentOcrFields } from '@/lib/ocr/vehicle-document';

export type SaleData = {
  sellerName: string;
  contact: string;
  make: string;
  model: string;
  catalogBrandId: string;
  catalogModelId: string;
  generation: string;
  catalogGenerationId: string;
  year: string;
  vin: string;
  region: string;
  city: string;
  plateNumber: string;
  plateRegion: string;
  plateUnregistered: boolean;
  price: string;
  priceInHand: string;
  priceOnResources: string;
  bodyType: string;
  catalogBodyTypeId: string;
  engine: string;
  catalogFuelTypeId: string;
  engineDisplacementL: string;
  catalogEngineId: string;
  power: string;
  transmission: string;
  catalogTransmissionId: string;
  drive: string;
  catalogDriveTypeId: string;
  mileage: string;
  steering: string;
  color: string;
  trim: string;
  catalogModificationId: string;
  catalogTrimId: string;
  owners: string;
  registrations: string;
  keysCount: string;
  ptsType: string;
  paintCount: string;
  paintedElements: string;
  notTaxi: boolean;
  notCarsharing: boolean;
  avtotekaGreen: boolean;
  wheelSet: boolean;
  extraTires: boolean;
  glassOriginal: boolean;
  noInvestment: boolean;
  investmentNote: string;
  sellerType: string;
  resourceStatus: string;
  videoUrl: string;
  description: string;
};

export type EditableSaleListingPayload = {
  status?: ListingStatusValue;
  moderationNote?: string | null;
  media?: EditableSaleListingMediaPayload[];
  make?: string;
  model?: string;
  catalogBrandId?: string;
  catalogModelId?: string;
  generation?: string;
  catalogGenerationId?: string;
  year?: number | string;
  region?: string;
  city?: string;
  plateNumber?: string;
  plateRegion?: string;
  plateUnregistered?: boolean;
  price?: number | string;
  priceInHand?: number | string;
  priceOnResources?: number | string;
  bodyType?: string;
  catalogBodyTypeId?: string;
  engine?: string;
  catalogFuelTypeId?: string;
  engineDisplacementL?: number | string;
  catalogEngineId?: string;
  power?: number | string;
  transmission?: string;
  catalogTransmissionId?: string;
  drive?: string;
  catalogDriveTypeId?: string;
  mileage?: number | string;
  steering?: string;
  color?: string;
  trim?: string;
  catalogModificationId?: string;
  catalogTrimId?: string;
  owners?: number | string;
  registrations?: number | string;
  keysCount?: number | string;
  ptsType?: string;
  paintCount?: number | string;
  paintedElements?: string;
  taxi?: boolean;
  carsharing?: boolean;
  avtotekaStatus?: string;
  needsInvestment?: boolean;
  conditionNote?: string;
  wheelSet?: boolean;
  extraTires?: boolean;
  glassOriginal?: boolean;
  sellerType?: string;
  resourceStatus?: string;
  description?: string;
  sellerName?: string;
  contact?: string;
  vin?: string;
  videoUrl?: string;
};

export type EditableSaleListingMediaPayload = {
  id: string;
  kind: 'GALLERY' | 'VIDEO';
  publicUrl: string;
  originalName?: string;
  sortOrder: number;
};

export type SaleListingEditMediaDraftItem =
  | {
      clientId: string;
      source: 'existing';
      kind: 'GALLERY' | 'VIDEO';
      mediaId: string;
    }
  | {
      clientId: string;
      source: 'new';
      kind: 'GALLERY' | 'VIDEO';
    };

export type SaleListingEditMediaPlanItem =
  | {
      clientId: string;
      source: 'existing';
      kind: 'GALLERY' | 'VIDEO';
      mediaId: string;
    }
  | {
      clientId: string;
      source: 'new';
      kind: 'GALLERY' | 'VIDEO';
      uploadId: string;
    };

export type SaleListingEditMediaPlan = {
  gallery: SaleListingEditMediaPlanItem[];
  video: SaleListingEditMediaPlanItem | null;
};

export type SaleListingFormModeCopy = {
  heading: string;
  description: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  successTitle: string;
  successDescription: string;
};

export const saleDefaults: SaleData = {
  sellerName: '',
  contact: '',
  make: '',
  model: '',
  catalogBrandId: '',
  catalogModelId: '',
  generation: '',
  catalogGenerationId: '',
  year: '',
  vin: '',
  region: '',
  city: '',
  plateNumber: '',
  plateRegion: '',
  plateUnregistered: false,
  price: '',
  priceInHand: '',
  priceOnResources: '',
  bodyType: '',
  catalogBodyTypeId: '',
  engine: '',
  catalogFuelTypeId: '',
  engineDisplacementL: '',
  catalogEngineId: '',
  power: '',
  transmission: '',
  catalogTransmissionId: '',
  drive: '',
  catalogDriveTypeId: '',
  mileage: '',
  steering: 'Левый',
  color: '',
  trim: '',
  catalogModificationId: '',
  catalogTrimId: '',
  owners: '',
  registrations: '',
  keysCount: '2',
  ptsType: 'original',
  paintCount: '0',
  paintedElements: '',
  notTaxi: true,
  notCarsharing: true,
  avtotekaGreen: false,
  wheelSet: false,
  extraTires: false,
  glassOriginal: false,
  noInvestment: true,
  investmentNote: '',
  sellerType: 'broker',
  resourceStatus: 'not_listed',
  videoUrl: '',
  description: '',
};

export function buildSaleSubmissionPayload(sale: SaleData, initialStatus: ListingStatusValue) {
  return {
    ...sale,
    initialStatus,
  };
}

function normalizeOcrVinForSale(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function clearCatalogVehicleSelection(current: SaleData, level: 'brand' | 'model' | 'year' | 'bodyType'): SaleData {
  const next = { ...current };

  if (level === 'brand') {
    next.catalogBrandId = '';
    next.model = '';
    next.catalogModelId = '';
  }

  if (level === 'brand' || level === 'model') {
    next.catalogModelId = '';
  }

  if (level === 'brand' || level === 'model' || level === 'year') {
    next.generation = '';
    next.catalogGenerationId = '';
    next.bodyType = level === 'year' ? next.bodyType : '';
    next.catalogBodyTypeId = '';
  }

  if (level === 'brand' || level === 'model' || level === 'year' || level === 'bodyType') {
    next.catalogGenerationId = '';
    next.catalogFuelTypeId = '';
    next.engineDisplacementL = '';
    next.catalogEngineId = '';
    next.transmission = '';
    next.catalogTransmissionId = '';
    next.drive = '';
    next.catalogDriveTypeId = '';
    next.trim = '';
    next.catalogModificationId = '';
    next.catalogTrimId = '';
  }

  return next;
}

export function applyVehicleDocumentOcrToSaleData(current: SaleData, fields: VehicleDocumentOcrFields): SaleData {
  let next = { ...current };

  if (fields.vin) {
    next.vin = normalizeOcrVinForSale(fields.vin);
  }

  if (fields.brand && fields.brand !== next.make) {
    next = clearCatalogVehicleSelection(next, 'brand');
    next.make = fields.brand;
  }

  if (fields.model && fields.model !== next.model) {
    next = clearCatalogVehicleSelection(next, 'model');
    next.model = fields.model;
  }

  if (fields.year && fields.year !== next.year) {
    next = clearCatalogVehicleSelection(next, 'year');
    next.year = fields.year;
  }

  if (fields.vehicleType && fields.vehicleType !== next.bodyType) {
    next = clearCatalogVehicleSelection(next, 'bodyType');
    next.bodyType = fields.vehicleType;
  }

  if (fields.enginePowerHp) {
    next.power = fields.enginePowerHp;
  }

  return next;
}

export function buildSaleListingEditMediaPlan(input: {
  gallery: SaleListingEditMediaDraftItem[];
  video: SaleListingEditMediaDraftItem | null;
}): SaleListingEditMediaPlan {
  return {
    gallery: input.gallery.map((item) =>
      item.source === 'existing'
        ? item
        : {
            ...item,
            uploadId: item.clientId,
          }
    ),
    video:
      input.video == null
        ? null
        : input.video.source === 'existing'
        ? input.video
        : {
            ...input.video,
            uploadId: input.video.clientId,
          },
  };
}

export function getSaleListingFormModeCopy(input: {
  isEditMode: boolean;
  submittedStatus: ListingStatusValue | null;
}): SaleListingFormModeCopy {
  if (!input.isEditMode) {
    const isDraft = input.submittedStatus === 'DRAFT';

    return {
      heading: 'Продажа автомобиля',
      description: 'Соберите объявление по шагам, добавьте медиа и отправьте карточку на модерацию или сохраните черновик.',
      primaryActionLabel: 'Отправить на модерацию',
      secondaryActionLabel: 'Сохранить как черновик',
      successTitle: isDraft ? 'Черновик сохранён' : 'Объявление отправлено на модерацию',
      successDescription: isDraft
        ? 'Объявление сохранено в личном кабинете. Вы сможете вернуться к нему и отправить на модерацию позже.'
        : 'Карточка сохранена и будет опубликована после проверки модератором.',
    };
  }

  const isDraft = input.submittedStatus === 'DRAFT';

  return {
    heading: 'Редактирование объявления',
    description: 'Обновите карточку продажи, проверьте медиа и отправьте объявление на повторную модерацию или сохраните как черновик.',
    primaryActionLabel: 'Сохранить изменения',
    secondaryActionLabel: 'Сохранить как черновик',
    successTitle: isDraft ? 'Изменения сохранены как черновик' : 'Объявление отправлено на повторную модерацию',
    successDescription: isDraft
      ? 'Изменения сохранены в черновике. Объявление не вернётся в каталог, пока вы не отправите его на модерацию.'
      : 'Обновлённое объявление снова пройдет проверку модератора и вернётся в каталог после публикации.',
  };
}

export function mergeSaleFormWithEditableListing(
  current: SaleData,
  data: EditableSaleListingPayload
): SaleData {
  return {
    ...current,
    make: String(data.make ?? current.make),
    model: String(data.model ?? current.model),
    catalogBrandId: String(data.catalogBrandId ?? current.catalogBrandId),
    catalogModelId: String(data.catalogModelId ?? current.catalogModelId),
    generation: String(data.generation ?? current.generation),
    catalogGenerationId: String(data.catalogGenerationId ?? current.catalogGenerationId),
    year: String(data.year ?? current.year),
    region: String(data.region ?? current.region),
    city: String(data.city ?? current.city),
    plateNumber: String(data.plateNumber ?? current.plateNumber),
    plateRegion: String(data.plateRegion ?? current.plateRegion),
    plateUnregistered: Boolean(data.plateUnregistered ?? current.plateUnregistered),
    price: String(data.price ?? current.price),
    priceInHand: String(data.priceInHand ?? ''),
    priceOnResources: String(data.priceOnResources ?? ''),
    bodyType: String(data.bodyType ?? current.bodyType),
    catalogBodyTypeId: String(data.catalogBodyTypeId ?? current.catalogBodyTypeId),
    engine: String(data.engine ?? current.engine),
    catalogFuelTypeId: String(data.catalogFuelTypeId ?? current.catalogFuelTypeId),
    engineDisplacementL: String(data.engineDisplacementL ?? ''),
    catalogEngineId: String(data.catalogEngineId ?? current.catalogEngineId),
    power: String(data.power ?? current.power),
    transmission: String(data.transmission ?? current.transmission),
    catalogTransmissionId: String(data.catalogTransmissionId ?? current.catalogTransmissionId),
    drive: String(data.drive ?? current.drive),
    catalogDriveTypeId: String(data.catalogDriveTypeId ?? current.catalogDriveTypeId),
    mileage: String(data.mileage ?? current.mileage),
    steering: String(data.steering ?? current.steering),
    color: String(data.color ?? current.color),
    trim: String(data.trim ?? ''),
    catalogModificationId: String(data.catalogModificationId ?? current.catalogModificationId),
    catalogTrimId: String(data.catalogTrimId ?? current.catalogTrimId),
    owners: String(data.owners ?? current.owners),
    registrations: String(data.registrations ?? ''),
    keysCount: String(data.keysCount ?? current.keysCount),
    ptsType: String(data.ptsType ?? current.ptsType),
    paintCount: String(data.paintCount ?? current.paintCount),
    paintedElements: String(data.paintedElements ?? ''),
    notTaxi: !data.taxi,
    notCarsharing: !data.carsharing,
    avtotekaGreen: data.avtotekaStatus === 'green',
    noInvestment: !data.needsInvestment,
    investmentNote: String(data.conditionNote ?? ''),
    wheelSet: Boolean(data.wheelSet),
    extraTires: Boolean(data.extraTires),
    glassOriginal: Boolean(data.glassOriginal),
    sellerType: String(data.sellerType ?? current.sellerType),
    resourceStatus: String(data.resourceStatus ?? current.resourceStatus),
    description: String(data.description ?? ''),
    sellerName: String(data.sellerName ?? current.sellerName),
    contact: String(data.contact ?? current.contact),
    vin: String(data.vin ?? ''),
    videoUrl: String(data.videoUrl ?? ''),
  };
}
