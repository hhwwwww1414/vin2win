import type { ListingStatusValue } from '@/lib/listing-status';

export type SaleData = {
  sellerName: string;
  contact: string;
  make: string;
  model: string;
  generation: string;
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
  engine: string;
  engineDisplacementL: string;
  power: string;
  transmission: string;
  drive: string;
  mileage: string;
  steering: string;
  color: string;
  trim: string;
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
  make?: string;
  model?: string;
  generation?: string;
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
  engine?: string;
  engineDisplacementL?: number | string;
  power?: number | string;
  transmission?: string;
  drive?: string;
  mileage?: number | string;
  steering?: string;
  color?: string;
  trim?: string;
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

export const saleDefaults: SaleData = {
  sellerName: '',
  contact: '',
  make: '',
  model: '',
  generation: '',
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
  engine: '',
  engineDisplacementL: '',
  power: '',
  transmission: 'АКПП',
  drive: 'Передний',
  mileage: '',
  steering: 'Левый',
  color: '',
  trim: '',
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

export function mergeSaleFormWithEditableListing(
  current: SaleData,
  data: EditableSaleListingPayload
): SaleData {
  return {
    ...current,
    make: String(data.make ?? current.make),
    model: String(data.model ?? current.model),
    generation: String(data.generation ?? current.generation),
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
    engine: String(data.engine ?? current.engine),
    engineDisplacementL: String(data.engineDisplacementL ?? ''),
    power: String(data.power ?? current.power),
    transmission: String(data.transmission ?? current.transmission),
    drive: String(data.drive ?? current.drive),
    mileage: String(data.mileage ?? current.mileage),
    steering: String(data.steering ?? current.steering),
    color: String(data.color ?? current.color),
    trim: String(data.trim ?? ''),
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
