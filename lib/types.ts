import type { ListingStatusValue } from '@/lib/listing-status';

export type SellerType = 'owner' | 'flip' | 'broker' | 'commission';
export type ResourceStatus = 'not_listed' | 'on_resources' | 'pre_resources';
export type PtsType = 'original' | 'duplicate' | 'epts';
export type AvtotekaStatus = 'green' | 'yellow' | 'red' | 'unknown';
export type SaleSearchSortKey = 'date' | 'price_asc' | 'price_desc' | 'mileage' | 'year_desc' | 'year_asc' | 'views';
export type SellerReviewStatus = 'pending' | 'published' | 'rejected';

export interface SalePriceHistoryPoint {
  price: number;
  createdAt: string;
}

export interface SavedSearchRecord {
  id: string;
  name?: string;
  filters: SaleSearchFilters;
  notifyEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleSearchFacets {
  makes: string[];
  modelsByMake: Record<string, string[]>;
  regions: string[];
  cities: string[];
  bodyTypes: string[];
  transmissions: string[];
  drives: string[];
  colors: string[];
}

export interface SaleSearchFilters {
  make: string[];
  model: string[];
  region?: string;
  yearFrom?: number;
  yearTo?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  engineDisplacementMin?: number;
  engineDisplacementMax?: number;
  powerMin?: number;
  powerMax?: number;
  paintCountMax?: number;
  bodyType: string[];
  transmission: string[];
  drive: string[];
  color: string[];
  city: string[];
  ownersMax?: number;
  ptsOriginal?: boolean;
  avtotekaStatus?: 'green' | 'any';
  noAccident?: boolean;
  noTaxi?: boolean;
  noCarsharing?: boolean;
  resourceStatus: ResourceStatus[];
  sellerType: SellerType[];
  hasPhoto?: boolean;
  priceInHand?: boolean;
  noInvestment?: boolean;
  filters: string[];
  sort: SaleSearchSortKey;
  page: number;
  limit: number;
}

export interface SaleSearchResult {
  items: SaleListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: SaleSearchFilters;
}

export interface SaleListing {
  id: string;
  type: 'sale';
  make: string;
  model: string;
  generation?: string;
  year: number;
  price: number;
  priceInHand?: number;
  priceOnResources?: number;
  city: string;
  images: string[];
  videoUrl?: string;
  interiorImages?: string[];
  reportUrl?: string;
  vin?: string;
  engine: string;
  engineDisplacementL?: number;
  power: number;
  transmission: string;
  drive: string;
  bodyType: string;
  mileage: number;
  owners: number;
  registrations?: number;
  ptsType?: PtsType;
  ptsOriginal: boolean;
  avtotekaStatus?: AvtotekaStatus;
  paintedElements?: string[];
  paintCount: number;
  accident?: boolean;
  taxi?: boolean;
  carsharing?: boolean;
  keysCount?: number;
  wheelSet?: boolean;
  extraTires?: boolean;
  conditionNote?: string;
  needsInvestment?: boolean;
  glassOriginal?: boolean;
  trade: boolean;
  kickback?: boolean;
  resourceStatus: ResourceStatus;
  sellerType: SellerType;
  inspectionCity?: string;
  color: string;
  steering: string;
  trim?: string;
  description: string;
  viewCount: number;
  isFavorite?: boolean;
  seller: SellerProfile;
  priceHistory?: SalePriceHistoryPoint[];
  status?: ListingStatusValue;
  moderationNote?: string;
  publishedAt?: string;
  ownerUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WantedListing {
  id: string;
  type: 'wanted';
  models: string[];
  budgetMin?: number;
  budgetMax: number;
  yearFrom?: number;
  mileageMax?: number;
  engine?: string;
  transmission?: string;
  drive?: string;
  ownersMax?: number;
  paintAllowed: boolean;
  restrictions?: string[];
  region?: string;
  comment?: string;
  contact: string;
  author: SellerProfile;
  status?: ListingStatusValue;
  moderationNote?: string;
  publishedAt?: string;
  ownerUserId?: string;
  createdAt: string;
}

export interface SellerProfile {
  id: string;
  legacyId?: string;
  name: string;
  type: 'person' | 'company';
  verified: boolean;
  onPlatformSince: string;
  phone?: string;
  completedDealsCount?: number;
  reviewCount?: number;
  averageRating?: number;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  authorUserId: string;
  authorName: string;
  rating: number;
  text: string;
  status: SellerReviewStatus;
  createdAt: string;
}

export interface VehicleReport {
  vin: string;
  avtotekaStatus?: AvtotekaStatus;
  accidentCount?: number;
  restrictions?: boolean;
  theft?: boolean;
  ptsMatch?: boolean;
}

export interface DealMeta {
  price: number;
  priceInHand?: number;
  priceOnResources?: number;
  trade: boolean;
  kickback?: boolean;
  resourceStatus: ResourceStatus;
  sellerType: SellerType;
  legalClean: boolean;
}
