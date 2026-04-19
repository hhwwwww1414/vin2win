import {
  AvtotekaStatus as PrismaAvtotekaStatus,
  ListingMediaKind,
  SellerReviewStatus as PrismaSellerReviewStatus,
  ListingStatus,
  ProfileType,
  PtsType as PrismaPtsType,
  ResourceStatus as PrismaResourceStatus,
  SellerType as PrismaSellerType,
  UserRole,
  type PriceHistory,
  type ListingMedia,
  Prisma,
} from '@prisma/client';
import { prisma } from './prisma';
import { getRegionForCity, getRegionsForCities, getRuRegionOptions, resolveRegionCitySelection } from '@/lib/ru-regions';
import { createDefaultSaleSearchFilters } from '@/lib/sale-search';
import type { EditableSaleListingPayload, SaleListingEditMediaPlan } from '@/lib/sale-form';
import { saleListings as saleListingFixtures, wantedListings as wantedListingFixtures } from '@/lib/marketplace-data';
import { calculatePotentialBenefit, extractEngineDisplacement } from '@/lib/listing-utils';
import type {
  SaleListing,
  SaleSearchFacets,
  SaleSearchFilters,
  SaleSearchResult,
  SellerProfile,
  SellerReview,
  WantedListing,
} from '@/lib/types';
import { notifyUsersAboutSavedSearchMatch } from './saved-searches';

type SaleListingRecord = Prisma.SaleListingGetPayload<{
  include: {
    seller: true;
    media: {
      orderBy: {
        sortOrder: 'asc';
      };
    };
  };
}> & {
  favorites?: Array<{
    userId: string;
  }>;
  priceHistory?: PriceHistory[];
};

type WantedListingRecord = Prisma.WantedListingGetPayload<{
  include: {
    author: true;
  };
}>;

type SellerReviewRecord = Prisma.SellerReviewGetPayload<{
  include: {
    authorUser: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export interface UploadedListingMediaInput {
  kind: 'gallery' | 'interior' | 'video' | 'report';
  storageKey: string;
  publicUrl: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  sortOrder: number;
}

export interface CreateSaleListingInput {
  createdByUserId?: string;
  initialStatus?: ListingStatus;
  sellerName: string;
  contact: string;
  make: string;
  catalogBrandId?: string;
  model: string;
  catalogModelId?: string;
  generation?: string;
  catalogGenerationId?: string;
  year: number;
  vin?: string;
  city: string;
  plateNumber?: string;
  plateRegion?: string;
  plateUnregistered?: boolean;
  price: number;
  priceInHand?: number;
  priceOnResources?: number;
  bodyType: string;
  catalogBodyTypeId?: string;
  engine: string;
  catalogFuelTypeId?: string;
  engineDisplacementL?: number;
  catalogEngineId?: string;
  power: number;
  transmission: string;
  catalogTransmissionId?: string;
  drive: string;
  catalogDriveTypeId?: string;
  catalogModificationId?: string;
  mileage: number;
  steering: string;
  color: string;
  trim?: string;
  catalogTrimId?: string;
  owners: number;
  registrations?: number;
  keysCount?: number;
  ptsType?: 'original' | 'duplicate' | 'epts';
  paintCount: number;
  paintedElements: string[];
  taxi: boolean;
  carsharing: boolean;
  avtotekaStatus?: 'green' | 'yellow' | 'red' | 'unknown';
  wheelSet: boolean;
  extraTires: boolean;
  glassOriginal?: boolean;
  noInvestment?: boolean;
  investmentNote?: string;
  sellerType: 'owner' | 'flip' | 'broker' | 'commission';
  resourceStatus: 'not_listed' | 'pre_resources' | 'on_resources';
  description: string;
  videoUrlExternal?: string;
  media: UploadedListingMediaInput[];
}

export interface CreateWantedListingInput {
  createdByUserId?: string;
  initialStatus?: ListingStatus;
  authorName: string;
  contact: string;
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
  restrictions: string[];
  region?: string;
  comment?: string;
}

export type OwnerSaleListingUpdateInput = Omit<CreateSaleListingInput, 'createdByUserId' | 'initialStatus' | 'media'>;

export interface OwnerSaleListingUploadedMediaInput {
  uploadId: string;
  kind: 'gallery' | 'video';
  storageKey: string;
  publicUrl: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface UpdateSaleListingByOwnerInput {
  listingId: string;
  currentUserId: string;
  targetStatus: 'DRAFT' | 'PENDING';
  values: OwnerSaleListingUpdateInput;
  mediaPlan: SaleListingEditMediaPlan;
  uploadedMedia: OwnerSaleListingUploadedMediaInput[];
}

export interface UpdateSaleListingByOwnerResult {
  listing: {
    id: string;
    status: ListingStatus;
    moderationNote: string | null;
    publishedAt: Date | null;
  };
  removedStorageKeys: string[];
}

export interface CreateSellerReviewInput {
  sellerId: string;
  authorUserId: string;
  rating: number;
  text: string;
}

const wantedListingInclude = {
  author: true,
} satisfies Prisma.WantedListingInclude;

const sellerTypeToPrisma: Record<SaleListing['sellerType'], PrismaSellerType> = {
  owner: PrismaSellerType.OWNER,
  flip: PrismaSellerType.FLIP,
  broker: PrismaSellerType.BROKER,
  commission: PrismaSellerType.COMMISSION,
};

const sellerTypeFromPrisma: Record<PrismaSellerType, SaleListing['sellerType']> = {
  OWNER: 'owner',
  FLIP: 'flip',
  BROKER: 'broker',
  COMMISSION: 'commission',
};

const resourceStatusToPrisma: Record<SaleListing['resourceStatus'], PrismaResourceStatus> = {
  not_listed: PrismaResourceStatus.NOT_LISTED,
  on_resources: PrismaResourceStatus.ON_RESOURCES,
  pre_resources: PrismaResourceStatus.PRE_RESOURCES,
};

const resourceStatusFromPrisma: Record<PrismaResourceStatus, SaleListing['resourceStatus']> = {
  NOT_LISTED: 'not_listed',
  ON_RESOURCES: 'on_resources',
  PRE_RESOURCES: 'pre_resources',
};

const ptsTypeToPrisma: Record<NonNullable<SaleListing['ptsType']>, PrismaPtsType> = {
  original: PrismaPtsType.ORIGINAL,
  duplicate: PrismaPtsType.DUPLICATE,
  epts: PrismaPtsType.EPTS,
};

const ptsTypeFromPrisma: Record<PrismaPtsType, NonNullable<SaleListing['ptsType']>> = {
  ORIGINAL: 'original',
  DUPLICATE: 'duplicate',
  EPTS: 'epts',
};

const avtotekaToPrisma: Record<NonNullable<SaleListing['avtotekaStatus']>, PrismaAvtotekaStatus> = {
  green: PrismaAvtotekaStatus.GREEN,
  yellow: PrismaAvtotekaStatus.YELLOW,
  red: PrismaAvtotekaStatus.RED,
  unknown: PrismaAvtotekaStatus.UNKNOWN,
};

const avtotekaFromPrisma: Record<PrismaAvtotekaStatus, NonNullable<SaleListing['avtotekaStatus']>> = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  UNKNOWN: 'unknown',
};

interface ListingViewer {
  userId?: string;
  role?: UserRole;
}

function buildSaleListingInclude(viewer?: ListingViewer, options?: { includePriceHistory?: boolean }) {
  return {
    seller: true,
    media: {
      orderBy: {
        sortOrder: 'asc',
      },
    },
    favorites: viewer?.userId
      ? {
          where: {
            userId: viewer.userId,
          },
          select: {
            userId: true,
          },
        }
      : false,
    priceHistory: options?.includePriceHistory
      ? {
          orderBy: {
            createdAt: 'asc',
          },
        }
      : false,
  } satisfies Prisma.SaleListingInclude;
}

function mapResourceStatusToPrisma(values: SaleSearchFilters['resourceStatus']) {
  return values.map((value) => {
    switch (value) {
      case 'not_listed':
        return PrismaResourceStatus.NOT_LISTED;
      case 'on_resources':
        return PrismaResourceStatus.ON_RESOURCES;
      case 'pre_resources':
        return PrismaResourceStatus.PRE_RESOURCES;
      default:
        return PrismaResourceStatus.NOT_LISTED;
    }
  });
}

function mapSellerTypeToPrisma(values: SaleSearchFilters['sellerType']) {
  return values.map((value) => {
    switch (value) {
      case 'owner':
        return PrismaSellerType.OWNER;
      case 'flip':
        return PrismaSellerType.FLIP;
      case 'broker':
        return PrismaSellerType.BROKER;
      case 'commission':
        return PrismaSellerType.COMMISSION;
      default:
        return PrismaSellerType.OWNER;
    }
  });
}

function canViewListing(status: ListingStatus, ownerUserId: string | null, viewer?: ListingViewer): boolean {
  if (status === ListingStatus.PUBLISHED) {
    return true;
  }

  if (!viewer?.userId) {
    return false;
  }

  if (viewer.role === UserRole.ADMIN || viewer.role === UserRole.MODERATOR) {
    return true;
  }

  return ownerUserId === viewer.userId;
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapSellerProfile(profile: {
  id: string;
  legacyId: string | null;
  name: string;
  profileType: ProfileType;
  verified: boolean;
  onPlatformSince: string;
  phone: string | null;
  about: string | null;
  avatarUrl: string | null;
  avatarStorageKey: string | null;
  coverUrl: string | null;
  coverStorageKey: string | null;
  avatarCropX: number | null;
  avatarCropY: number | null;
  avatarZoom: number | null;
  coverCropX: number | null;
  coverCropY: number | null;
}): SellerProfile {
  return {
    id: profile.id,
    legacyId: profile.legacyId ?? undefined,
    name: profile.name,
    type: profile.profileType === ProfileType.COMPANY ? 'company' : 'person',
    verified: profile.verified,
    onPlatformSince: profile.onPlatformSince,
    phone: profile.phone ?? undefined,
    about: profile.about ?? undefined,
    avatarUrl: profile.avatarUrl ?? undefined,
    avatarStorageKey: profile.avatarStorageKey ?? undefined,
    coverUrl: profile.coverUrl ?? undefined,
    coverStorageKey: profile.coverStorageKey ?? undefined,
    avatarCropX: profile.avatarCropX ?? undefined,
    avatarCropY: profile.avatarCropY ?? undefined,
    avatarZoom: profile.avatarZoom ?? undefined,
    coverCropX: profile.coverCropX ?? undefined,
    coverCropY: profile.coverCropY ?? undefined,
  };
}

function withSellerMetrics(
  profile: Parameters<typeof mapSellerProfile>[0],
  metrics: {
    completedDealsCount?: number;
    reviewCount?: number;
    averageRating?: number;
  },
): SellerProfile {
  return {
    ...mapSellerProfile(profile),
    completedDealsCount: metrics.completedDealsCount,
    reviewCount: metrics.reviewCount,
    averageRating: metrics.averageRating,
  };
}

function pickMediaUrls(media: ListingMedia[], kind: ListingMediaKind): string[] {
  return media.filter((item) => item.kind === kind).map((item) => item.publicUrl);
}

function pickSingleMediaUrl(media: ListingMedia[], kind: ListingMediaKind): string | undefined {
  return media.find((item) => item.kind === kind)?.publicUrl;
}

function isEditableListingMedia(
  item: ListingMedia
): item is ListingMedia & { kind: 'GALLERY' | 'VIDEO' } {
  return item.kind === ListingMediaKind.GALLERY || item.kind === ListingMediaKind.VIDEO;
}

function mapEditableSaleListingPayload(record: SaleListingRecord): EditableSaleListingPayload {
  return {
    status: record.status,
    moderationNote: record.moderationNote ?? null,
    media: record.media
      .filter(isEditableListingMedia)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        publicUrl: item.publicUrl,
        originalName: item.originalName ?? undefined,
        sortOrder: item.sortOrder,
      })),
    make: record.make,
    catalogBrandId: record.catalogBrandId ?? '',
    model: record.model,
    catalogModelId: record.catalogModelId ?? '',
    generation: record.generation ?? '',
    catalogGenerationId: record.catalogGenerationId ?? '',
    year: record.year,
    region: getRegionForCity(record.city) ?? '',
    city: record.city,
    price: record.price,
    priceInHand: record.priceInHand ?? '',
    priceOnResources: record.priceOnResources ?? '',
    bodyType: record.bodyType,
    catalogBodyTypeId: record.catalogBodyTypeId ?? '',
    engine: record.engine,
    catalogFuelTypeId: record.catalogFuelTypeId ?? '',
    engineDisplacementL: record.engineDisplacementL ?? '',
    catalogEngineId: record.catalogEngineId ?? '',
    power: record.power,
    transmission: record.transmission,
    catalogTransmissionId: record.catalogTransmissionId ?? '',
    drive: record.drive,
    catalogDriveTypeId: record.catalogDriveTypeId ?? '',
    mileage: record.mileage,
    steering: record.steering,
    color: record.color,
    trim: record.trim ?? '',
    catalogModificationId: record.catalogModificationId ?? '',
    catalogTrimId: record.catalogTrimId ?? '',
    owners: record.owners,
    registrations: record.registrations ?? '',
    keysCount: record.keysCount ?? '',
    ptsType: record.ptsType?.toLowerCase() ?? 'original',
    paintCount: record.paintCount,
    paintedElements: (record.paintedElements ?? []).join(', '),
    taxi: record.taxi ?? false,
    carsharing: record.carsharing ?? false,
    avtotekaStatus: record.avtotekaStatus?.toLowerCase() ?? '',
    needsInvestment: record.needsInvestment ?? false,
    conditionNote: record.conditionNote ?? '',
    wheelSet: record.wheelSet,
    extraTires: record.extraTires,
    glassOriginal: record.glassOriginal ?? false,
    sellerType: record.sellerType.toLowerCase(),
    resourceStatus: record.resourceStatus.toLowerCase().replace(/_/g, '_'),
    description: record.description,
    sellerName: record.seller?.name ?? '',
    contact: record.seller?.phone ?? '',
    vin: record.vin ?? '',
    plateNumber: record.plateNumber ?? '',
    plateRegion: record.plateRegion ?? '',
    plateUnregistered: record.plateUnregistered,
    videoUrl: record.videoUrlExternal ?? '',
  };
}

function isSaleListingOwner(record: Pick<SaleListingRecord, 'createdByUserId' | 'seller'>, currentUserId: string) {
  return record.createdByUserId === currentUserId || record.seller?.userId === currentUserId;
}

function normalizeOwnerTargetStatus(value: UpdateSaleListingByOwnerInput['targetStatus']) {
  return value === 'DRAFT' ? ListingStatus.DRAFT : ListingStatus.PENDING;
}

function mapSellerReview(record: SellerReviewRecord): SellerReview {
  return {
    id: record.id,
    sellerId: record.sellerProfileId,
    authorUserId: record.authorUserId,
    authorName: record.authorUser.name,
    rating: record.rating,
    text: record.text,
    status: record.status.toLowerCase() as SellerReview['status'],
    createdAt: record.createdAt.toISOString(),
  };
}

function mapSaleListing(record: SaleListingRecord): SaleListing {
  const images = pickMediaUrls(record.media, ListingMediaKind.GALLERY);
  const interiorImages = pickMediaUrls(record.media, ListingMediaKind.INTERIOR);
  const visibleDate = record.publishedAt ?? record.createdAt;

  return {
    id: record.id,
    type: 'sale',
    make: record.make,
    catalogBrandId: record.catalogBrandId ?? undefined,
    model: record.model,
    catalogModelId: record.catalogModelId ?? undefined,
    generation: record.generation ?? undefined,
    catalogGenerationId: record.catalogGenerationId ?? undefined,
    year: record.year,
    price: record.price,
    priceInHand: record.priceInHand ?? undefined,
    priceOnResources: record.priceOnResources ?? undefined,
    potentialBenefit: record.potentialBenefit ?? undefined,
    region: getRegionForCity(record.city) ?? undefined,
    city: record.city,
    images,
    videoUrl: pickSingleMediaUrl(record.media, ListingMediaKind.VIDEO) ?? record.videoUrlExternal ?? undefined,
    interiorImages: interiorImages.length > 0 ? interiorImages : undefined,
    reportUrl: pickSingleMediaUrl(record.media, ListingMediaKind.REPORT) ?? record.reportUrlExternal ?? undefined,
    vin: record.vin ?? undefined,
    plateNumber: record.plateNumber ?? undefined,
    plateRegion: record.plateRegion ?? undefined,
    plateUnregistered: record.plateUnregistered ? true : undefined,
    engine: record.engine,
    catalogFuelTypeId: record.catalogFuelTypeId ?? undefined,
    engineDisplacementL: extractEngineDisplacement({
      engine: record.engine,
      engineDisplacementL: record.engineDisplacementL ?? undefined,
    }),
    catalogEngineId: record.catalogEngineId ?? undefined,
    power: record.power,
    transmission: record.transmission,
    catalogTransmissionId: record.catalogTransmissionId ?? undefined,
    drive: record.drive,
    catalogDriveTypeId: record.catalogDriveTypeId ?? undefined,
    bodyType: record.bodyType,
    catalogBodyTypeId: record.catalogBodyTypeId ?? undefined,
    catalogModificationId: record.catalogModificationId ?? undefined,
    mileage: record.mileage,
    owners: record.owners,
    registrations: record.registrations ?? undefined,
    ptsType: record.ptsType ? ptsTypeFromPrisma[record.ptsType] : undefined,
    ptsOriginal: record.ptsOriginal,
    avtotekaStatus: record.avtotekaStatus ? avtotekaFromPrisma[record.avtotekaStatus] : undefined,
    paintedElements: record.paintedElements.length > 0 ? record.paintedElements : undefined,
    paintCount: record.paintCount,
    accident: record.accident ?? undefined,
    taxi: record.taxi ?? undefined,
    carsharing: record.carsharing ?? undefined,
    keysCount: record.keysCount ?? undefined,
    wheelSet: record.wheelSet,
    extraTires: record.extraTires,
    conditionNote: record.conditionNote ?? undefined,
    needsInvestment: record.needsInvestment ?? undefined,
    glassOriginal: record.glassOriginal ?? undefined,
    resourceStatus: resourceStatusFromPrisma[record.resourceStatus],
    sellerType: sellerTypeFromPrisma[record.sellerType],
    inspectionCity: record.inspectionCity ?? undefined,
    color: record.color,
    steering: record.steering,
    trim: record.trim ?? undefined,
    catalogTrimId: record.catalogTrimId ?? undefined,
    description: record.description,
    viewCount: record.viewCount,
    isFavorite: record.favorites ? record.favorites.length > 0 : undefined,
    seller: mapSellerProfile(record.seller),
    priceHistory: record.priceHistory?.map((item) => ({
      price: item.price,
      createdAt: toDateOnlyString(item.createdAt),
    })),
    status: record.status,
    moderationNote: record.moderationNote ?? undefined,
    publishedAt: record.publishedAt ? toDateOnlyString(record.publishedAt) : undefined,
    ownerUserId: record.createdByUserId ?? undefined,
    createdAt: toDateOnlyString(visibleDate),
    updatedAt: toDateOnlyString(record.updatedAt),
  };
}

function mapWantedListing(record: WantedListingRecord): WantedListing {
  const visibleDate = record.publishedAt ?? record.createdAt;

  return {
    id: record.id,
    type: 'wanted',
    models: record.models,
    budgetMin: record.budgetMin ?? undefined,
    budgetMax: record.budgetMax,
    yearFrom: record.yearFrom ?? undefined,
    mileageMax: record.mileageMax ?? undefined,
    engine: record.engine ?? undefined,
    transmission: record.transmission ?? undefined,
    drive: record.drive ?? undefined,
    ownersMax: record.ownersMax ?? undefined,
    paintAllowed: record.paintAllowed,
    restrictions: record.restrictions.length > 0 ? record.restrictions : undefined,
    region: record.region ?? undefined,
    comment: record.comment ?? undefined,
    contact: record.contact,
    author: mapSellerProfile(record.author),
    status: record.status,
    moderationNote: record.moderationNote ?? undefined,
    publishedAt: record.publishedAt ? toDateOnlyString(record.publishedAt) : undefined,
    ownerUserId: record.createdByUserId ?? undefined,
    createdAt: toDateOnlyString(visibleDate),
  };
}

async function findOrCreateSellerProfile(input: {
  userId?: string;
  legacyId?: string;
  name: string;
  type: 'person' | 'company';
  verified?: boolean;
  onPlatformSince?: string;
  phone?: string;
}) {
  if (input.userId) {
    const existingForUser = await prisma.sellerProfile.findUnique({
      where: {
        userId: input.userId,
      },
    });

    if (existingForUser) {
      return prisma.sellerProfile.update({
        where: {
          id: existingForUser.id,
        },
        data: {
          legacyId: existingForUser.legacyId ?? input.legacyId,
          name: input.name,
          profileType: input.type === 'company' ? ProfileType.COMPANY : ProfileType.PERSON,
          verified: input.verified ?? existingForUser.verified,
          onPlatformSince: existingForUser.onPlatformSince || input.onPlatformSince || String(new Date().getFullYear()),
          phone: input.phone,
        },
      });
    }
  }

  if (input.legacyId) {
    const existing = await prisma.sellerProfile.findUnique({
      where: {
        legacyId: input.legacyId,
      },
    });

    if (existing) {
      return existing;
    }
  }

  const existingByIdentity = await prisma.sellerProfile.findFirst({
    where: {
      name: input.name,
      phone: input.phone ?? null,
    },
  });

  if (existingByIdentity) {
    return existingByIdentity;
  }

  return prisma.sellerProfile.create({
    data: {
      userId: input.userId,
      legacyId: input.legacyId,
      name: input.name,
      profileType: input.type === 'company' ? ProfileType.COMPANY : ProfileType.PERSON,
      verified: input.verified ?? false,
      onPlatformSince: input.onPlatformSince ?? String(new Date().getFullYear()),
      phone: input.phone,
    },
  });
}

function requiresPotentialBenefit(filters: SaleSearchFilters) {
  return Boolean(
    filters.hasBenefit ||
    filters.benefitMin ||
    filters.benefitMax ||
    filters.sort === 'benefit_desc',
  );
}

function buildPublishedSaleListingWhere(filters: SaleSearchFilters): Prisma.SaleListingWhereInput {
  const resolvedRegionSelection = resolveRegionCitySelection(filters.region, filters.city);
  const andConditions: Prisma.SaleListingWhereInput[] = [
    {
      status: ListingStatus.PUBLISHED,
    },
  ];

  if (filters.make.length > 0) {
    andConditions.push({
      OR: filters.make.map((value) => ({
        make: {
          equals: value,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (filters.model.length > 0) {
    andConditions.push({
      OR: filters.model.map((value) => ({
        model: {
          contains: value,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (filters.yearFrom || filters.yearTo) {
    andConditions.push({
      year: {
        gte: filters.yearFrom,
        lte: filters.yearTo,
      },
    });
  }

  if (filters.priceMin || filters.priceMax) {
    andConditions.push({
      price: {
        gte: filters.priceMin,
        lte: filters.priceMax,
      },
    });
  }

  if (filters.mileageMin || filters.mileageMax) {
    andConditions.push({
      mileage: {
        gte: filters.mileageMin,
        lte: filters.mileageMax,
      },
    });
  }

  if (filters.engineDisplacementMin || filters.engineDisplacementMax) {
    andConditions.push({
      engineDisplacementL: {
        gte: filters.engineDisplacementMin,
        lte: filters.engineDisplacementMax,
      },
    });
  }

  if (filters.powerMin || filters.powerMax) {
    andConditions.push({
      power: {
        gte: filters.powerMin,
        lte: filters.powerMax,
      },
    });
  }

  if (filters.paintCountMax !== undefined) {
    andConditions.push({
      paintCount: {
        lte: filters.paintCountMax,
      },
    });
  }

  if (filters.bodyType.length > 0) {
    andConditions.push({
      OR: filters.bodyType.map((value) => ({
        bodyType: {
          equals: value,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (filters.transmission.length > 0) {
    andConditions.push({
      OR: filters.transmission.map((value) => ({
        transmission: {
          equals: value,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (filters.drive.length > 0) {
    andConditions.push({
      OR: filters.drive.map((value) => ({
        drive: {
          equals: value,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (filters.color.length > 0) {
    andConditions.push({
      OR: filters.color.map((value) => ({
        color: {
          equals: value,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (resolvedRegionSelection.region) {
    if (resolvedRegionSelection.hasConflict || resolvedRegionSelection.cities.length === 0) {
      andConditions.push({
        id: '__no-match__',
      });
    } else {
      andConditions.push({
        OR: resolvedRegionSelection.cities.map((value) => ({
          city: {
            contains: value,
            mode: 'insensitive',
          },
        })),
      });
    }
  } else if (filters.city.length > 0) {
    andConditions.push({
      OR: filters.city.map((value) => ({
        city: {
          contains: value,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (filters.ownersMax) {
    andConditions.push({
      owners: {
        lte: filters.ownersMax,
      },
    });
  }

  if (filters.ptsOriginal) {
    andConditions.push({
      ptsOriginal: true,
    });
  }

  if (filters.avtotekaStatus === 'green') {
    andConditions.push({
      avtotekaStatus: PrismaAvtotekaStatus.GREEN,
    });
  } else if (filters.avtotekaStatus === 'any') {
    andConditions.push({
      avtotekaStatus: {
        not: null,
      },
    });
  }

  if (filters.noAccident) {
    andConditions.push({
      NOT: {
        accident: true,
      },
    });
  }

  if (filters.noTaxi) {
    andConditions.push({
      NOT: {
        taxi: true,
      },
    });
  }

  if (filters.noCarsharing) {
    andConditions.push({
      NOT: {
        carsharing: true,
      },
    });
  }

  if (filters.resourceStatus.length > 0) {
    andConditions.push({
      resourceStatus: {
        in: mapResourceStatusToPrisma(filters.resourceStatus),
      },
    });
  }

  if (filters.sellerType.length > 0) {
    andConditions.push({
      sellerType: {
        in: mapSellerTypeToPrisma(filters.sellerType),
      },
    });
  }

  if (filters.hasPhoto) {
    andConditions.push({
      media: {
        some: {
          kind: ListingMediaKind.GALLERY,
        },
      },
    });
  }

  if (filters.priceInHand) {
    andConditions.push({
      priceInHand: {
        not: null,
      },
    });
  }

  if (requiresPotentialBenefit(filters)) {
    andConditions.push({
      potentialBenefit: {
        not: null,
        gte: filters.benefitMin,
        lte: filters.benefitMax,
      },
    });
  }

  if (filters.noInvestment) {
    andConditions.push({
      NOT: {
        needsInvestment: true,
      },
    });
  }

  return {
    AND: andConditions,
  };
}

function getSaleListingOrderBy(sort: SaleSearchFilters['sort']): Prisma.SaleListingOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
    case 'price_desc':
      return [{ price: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
    case 'mileage':
      return [{ mileage: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
    case 'year_desc':
      return [{ year: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
    case 'year_asc':
      return [{ year: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
    case 'views':
      return [{ viewCount: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
    case 'benefit_desc':
      return [{ potentialBenefit: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
    case 'date':
    default:
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
  }
}

const canUseFixtureMarketplaceFallback = process.env.NODE_ENV !== 'production';

function isMarketplaceDbUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code =
    'code' in error && typeof error.code === 'string'
      ? error.code
      : 'errorCode' in error && typeof error.errorCode === 'string'
      ? error.errorCode
      : '';
  const message = [error.name, error.message].filter(Boolean).join(' ');

  if (code === 'P1000' || code === 'P1001') {
    return true;
  }

  return /Can't reach database server|PrismaClientInitializationError|Authentication failed against database server|database credentials .* not valid|ECONNREFUSED|timed out/i.test(
    message
  );
}

function cloneFixtureSaleListing(listing: SaleListing): SaleListing {
  return {
    ...listing,
    potentialBenefit: listing.potentialBenefit ?? calculatePotentialBenefit(listing),
    seller: { ...listing.seller },
    images: [...listing.images],
    interiorImages: listing.interiorImages ? [...listing.interiorImages] : undefined,
    paintedElements: listing.paintedElements ? [...listing.paintedElements] : undefined,
    priceHistory: listing.priceHistory ? [...listing.priceHistory] : undefined,
  };
}

function cloneFixtureWantedListing(listing: WantedListing): WantedListing {
  return {
    ...listing,
    models: [...listing.models],
    restrictions: listing.restrictions ? [...listing.restrictions] : undefined,
    author: { ...listing.author },
  };
}

function buildFixtureSellerProfileResult(id: string) {
  const listings = saleListingFixtures
    .filter((listing) => listing.seller.id === id)
    .map(cloneFixtureSaleListing);

  if (listings.length === 0) {
    return null;
  }

  const [firstListing] = listings;

  return {
    seller: { ...firstListing.seller, completedDealsCount: 0, reviewCount: 0, averageRating: undefined },
    listings,
    completedDealsCount: 0,
    reviewSummary: {
      count: 0,
      averageRating: undefined,
    },
    reviews: [] as SellerReview[],
    viewerReviewStatus: undefined,
  };
}

function filterFixtureSaleListings(filters: SaleSearchFilters) {
  const resolvedRegionSelection = resolveRegionCitySelection(filters.region, filters.city);
  return saleListingFixtures.filter((listing) => {
    const potentialBenefit = listing.potentialBenefit ?? calculatePotentialBenefit(listing);

    if (filters.make.length > 0 && !filters.make.includes(listing.make)) return false;
    if (filters.model.length > 0 && !filters.model.includes(listing.model)) return false;
    if (filters.bodyType.length > 0 && !filters.bodyType.includes(listing.bodyType)) return false;
    if (filters.transmission.length > 0 && !filters.transmission.includes(listing.transmission)) return false;
    if (filters.drive.length > 0 && !filters.drive.includes(listing.drive)) return false;
    if (filters.color.length > 0 && !filters.color.includes(listing.color)) return false;
    if (resolvedRegionSelection.region) {
      if (resolvedRegionSelection.hasConflict || !resolvedRegionSelection.cities.includes(listing.city)) return false;
    } else if (filters.city.length > 0 && !filters.city.includes(listing.city)) return false;
    if (filters.resourceStatus.length > 0 && !filters.resourceStatus.includes(listing.resourceStatus)) return false;
    if (filters.sellerType.length > 0 && !filters.sellerType.includes(listing.sellerType)) return false;

    if (filters.yearFrom && listing.year < filters.yearFrom) return false;
    if (filters.yearTo && listing.year > filters.yearTo) return false;
    if (filters.priceMin && listing.price < filters.priceMin) return false;
    if (filters.priceMax && listing.price > filters.priceMax) return false;
    if (filters.mileageMin && listing.mileage < filters.mileageMin) return false;
    if (filters.mileageMax && listing.mileage > filters.mileageMax) return false;
    const engineDisplacement = extractEngineDisplacement(listing);
    if (filters.engineDisplacementMin && (!engineDisplacement || engineDisplacement < filters.engineDisplacementMin)) return false;
    if (filters.engineDisplacementMax && (!engineDisplacement || engineDisplacement > filters.engineDisplacementMax)) return false;
    if (filters.powerMin && listing.power < filters.powerMin) return false;
    if (filters.powerMax && listing.power > filters.powerMax) return false;
    if (filters.paintCountMax !== undefined && listing.paintCount > filters.paintCountMax) return false;
    if (filters.ownersMax && listing.owners > filters.ownersMax) return false;

    if (filters.ptsOriginal && !listing.ptsOriginal) return false;
    if (filters.avtotekaStatus === 'green' && listing.avtotekaStatus !== 'green') return false;
    if (filters.avtotekaStatus === 'any' && !listing.avtotekaStatus) return false;
    if (filters.noAccident && listing.accident) return false;
    if (filters.noTaxi && listing.taxi) return false;
    if (filters.noCarsharing && listing.carsharing) return false;
    if (filters.hasPhoto && listing.images.length === 0) return false;
    if (filters.priceInHand && !listing.priceInHand) return false;
    if (requiresPotentialBenefit(filters) && !potentialBenefit) return false;
    if (filters.benefitMin && (!potentialBenefit || potentialBenefit < filters.benefitMin)) return false;
    if (filters.benefitMax && (!potentialBenefit || potentialBenefit > filters.benefitMax)) return false;
    if (filters.noInvestment && listing.needsInvestment) return false;

    return true;
  });
}

function sortFixtureSaleListings(items: SaleListing[], sort: SaleSearchFilters['sort']) {
  const sorted = [...items];
  const createdAtValue = (value: string | undefined) => new Date(value ?? 0).getTime();

  sorted.sort((left, right) => {
    switch (sort) {
      case 'price_asc':
        return left.price - right.price || createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
      case 'price_desc':
        return right.price - left.price || createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
      case 'mileage':
        return left.mileage - right.mileage || createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
      case 'year_desc':
        return right.year - left.year || createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
      case 'year_asc':
        return left.year - right.year || createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
      case 'views':
        return right.viewCount - left.viewCount || createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
      case 'benefit_desc': {
        const leftBenefit = left.potentialBenefit ?? calculatePotentialBenefit(left) ?? 0;
        const rightBenefit = right.potentialBenefit ?? calculatePotentialBenefit(right) ?? 0;
        return rightBenefit - leftBenefit || createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
      }
      case 'date':
      default:
        return createdAtValue(right.publishedAt ?? right.createdAt) - createdAtValue(left.publishedAt ?? left.createdAt);
    }
  });

  return sorted;
}

function buildFixtureSaleSearchResult(filters: SaleSearchFilters): SaleSearchResult {
  const page = Math.max(1, filters.page);
  const limit = Math.max(1, filters.limit);
  const filtered = sortFixtureSaleListings(filterFixtureSaleListings(filters), filters.sort);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * limit, safePage * limit).map(cloneFixtureSaleListing);

  return {
    items,
    total,
    page: safePage,
    limit,
    totalPages,
    filters: {
      ...filters,
      page: safePage,
      limit,
    },
  };
}

function buildFixtureSaleFacets(): SaleSearchFacets {
  const makes = new Set<string>();
  const cities = new Set<string>();
  const bodyTypes = new Set<string>();
  const transmissions = new Set<string>();
  const drives = new Set<string>();
  const colors = new Set<string>();
  const modelsByMake = new Map<string, Set<string>>();

  for (const listing of saleListingFixtures) {
    makes.add(listing.make);
    cities.add(listing.city);
    bodyTypes.add(listing.bodyType);
    transmissions.add(listing.transmission);
    drives.add(listing.drive);
    colors.add(listing.color);

    if (!modelsByMake.has(listing.make)) {
      modelsByMake.set(listing.make, new Set<string>());
    }
    modelsByMake.get(listing.make)?.add(listing.model);
  }

  return {
    makes: [...makes].sort((left, right) => left.localeCompare(right, 'ru')),
    modelsByMake: Object.fromEntries(
      [...modelsByMake.entries()]
        .sort(([left], [right]) => left.localeCompare(right, 'ru'))
        .map(([make, models]) => [make, [...models].sort((left, right) => left.localeCompare(right, 'ru'))])
    ),
    regions: getRegionsForCities([...cities]),
    cities: [...cities].sort((left, right) => left.localeCompare(right, 'ru')),
    bodyTypes: [...bodyTypes].sort((left, right) => left.localeCompare(right, 'ru')),
    transmissions: [...transmissions].sort((left, right) => left.localeCompare(right, 'ru')),
    drives: [...drives].sort((left, right) => left.localeCompare(right, 'ru')),
    colors: [...colors].sort((left, right) => left.localeCompare(right, 'ru')),
  };
}

export async function searchPublishedSaleListings(filtersInput: Partial<SaleSearchFilters>, viewer?: ListingViewer): Promise<SaleSearchResult> {
  const filters = {
    ...createDefaultSaleSearchFilters(),
    ...filtersInput,
  } satisfies SaleSearchFilters;
  try {
    const page = Math.max(1, filters.page);
    const limit = Math.max(1, filters.limit);
    const where = buildPublishedSaleListingWhere(filters);
    const total = await prisma.saleListing.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const records = await prisma.saleListing.findMany({
      where,
      include: buildSaleListingInclude(viewer),
      orderBy: getSaleListingOrderBy(filters.sort),
      skip: (safePage - 1) * limit,
      take: limit,
    });

    return {
      items: records.map((record) => mapSaleListing(record as SaleListingRecord)),
      total,
      page: safePage,
      limit,
      totalPages,
      filters: {
        ...filters,
        page: safePage,
        limit,
      },
    };
  } catch (error) {
    if (canUseFixtureMarketplaceFallback && isMarketplaceDbUnavailable(error)) {
      return buildFixtureSaleSearchResult(filters);
    }

    throw error;
  }
}

export async function getPublishedSaleSearchFacets(): Promise<SaleSearchFacets> {
  try {
    const records = await prisma.saleListing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
      },
      select: {
        make: true,
        model: true,
        city: true,
        bodyType: true,
        transmission: true,
        drive: true,
        color: true,
      },
    });

    const makes = new Set<string>();
    const cities = new Set<string>();
    const bodyTypes = new Set<string>();
    const transmissions = new Set<string>();
    const drives = new Set<string>();
    const colors = new Set<string>();
    const modelsByMake = new Map<string, Set<string>>();

    for (const record of records) {
      if (record.make) {
        makes.add(record.make);
        if (!modelsByMake.has(record.make)) {
          modelsByMake.set(record.make, new Set<string>());
        }
        if (record.model) {
          modelsByMake.get(record.make)?.add(record.model);
        }
      }

      if (record.city) cities.add(record.city);
      if (record.bodyType) bodyTypes.add(record.bodyType);
      if (record.transmission) transmissions.add(record.transmission);
      if (record.drive) drives.add(record.drive);
      if (record.color) colors.add(record.color);
    }

    return {
      makes: [...makes].sort((left, right) => left.localeCompare(right, 'ru')),
      modelsByMake: Object.fromEntries(
        [...modelsByMake.entries()]
          .sort(([left], [right]) => left.localeCompare(right, 'ru'))
          .map(([make, models]) => [make, [...models].sort((left, right) => left.localeCompare(right, 'ru'))])
      ),
      regions: [...cities].length > 0 ? getRegionsForCities([...cities]) : getRuRegionOptions(),
      cities: [...cities].sort((left, right) => left.localeCompare(right, 'ru')),
      bodyTypes: [...bodyTypes].sort((left, right) => left.localeCompare(right, 'ru')),
      transmissions: [...transmissions].sort((left, right) => left.localeCompare(right, 'ru')),
      drives: [...drives].sort((left, right) => left.localeCompare(right, 'ru')),
      colors: [...colors].sort((left, right) => left.localeCompare(right, 'ru')),
    };
  } catch (error) {
    if (canUseFixtureMarketplaceFallback && isMarketplaceDbUnavailable(error)) {
      return buildFixtureSaleFacets();
    }

    throw error;
  }
}

export async function getPublishedSaleListings(): Promise<SaleListing[]> {
  const result = await searchPublishedSaleListings(createDefaultSaleSearchFilters());
  return result.items;
}

export async function getSaleListingById(id: string, viewer?: ListingViewer): Promise<SaleListing | null> {
  try {
    const record = await prisma.saleListing.findUnique({
      where: {
        id,
      },
      include: buildSaleListingInclude(viewer, { includePriceHistory: true }),
    });

    if (!record || !canViewListing(record.status, record.createdByUserId, viewer)) {
      return null;
    }

    return record ? mapSaleListing(record as SaleListingRecord) : null;
  } catch (error) {
    if (canUseFixtureMarketplaceFallback && isMarketplaceDbUnavailable(error)) {
      const fallback = saleListingFixtures.find((listing) => listing.id === id);
      return fallback ? cloneFixtureSaleListing(fallback) : null;
    }

    throw error;
  }
}

export async function incrementSaleListingViewCount(id: string): Promise<number | null> {
  const rows = await prisma.$queryRaw<Array<{ viewCount: number }>>`
    UPDATE "SaleListing"
    SET "viewCount" = "viewCount" + 1
    WHERE "id" = ${id}
      AND "status" = CAST('PUBLISHED' AS "ListingStatus")
    RETURNING "viewCount"
  `;

  return rows[0]?.viewCount ?? null;
}

export async function getSimilarSaleListings(currentListing: SaleListing, viewer?: ListingViewer): Promise<SaleListing[]> {
  try {
    const records = await prisma.saleListing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
        id: {
          not: currentListing.id,
        },
        OR: [
          {
            make: currentListing.make,
          },
          {
            price: {
              gte: Math.floor(currentListing.price * 0.7),
              lte: Math.ceil(currentListing.price * 1.3),
            },
          },
        ],
      },
      include: buildSaleListingInclude(viewer),
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    });

    return records.map((record) => mapSaleListing(record as SaleListingRecord));
  } catch (error) {
    if (canUseFixtureMarketplaceFallback && isMarketplaceDbUnavailable(error)) {
      return saleListingFixtures
        .filter((listing) => listing.id !== currentListing.id && (listing.make === currentListing.make || (listing.price >= Math.floor(currentListing.price * 0.7) && listing.price <= Math.ceil(currentListing.price * 1.3))))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 6)
        .map(cloneFixtureSaleListing);
    }

    throw error;
  }
}

export async function getSaleListingsByIds(ids: string[], viewer?: ListingViewer): Promise<SaleListing[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return [];
  }

  const records = await prisma.saleListing.findMany({
    where: {
      id: {
        in: uniqueIds,
      },
      status: ListingStatus.PUBLISHED,
    },
    include: buildSaleListingInclude(viewer),
  });

  const mapped = records.map((record) => mapSaleListing(record as SaleListingRecord));
  return uniqueIds.map((id) => mapped.find((listing) => listing.id === id)).filter((listing): listing is SaleListing => Boolean(listing));
}

export async function getPublicSellerProfileById(id: string, viewer?: ListingViewer) {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: {
        id,
      },
      include: {
        saleListings: {
          where: {
            status: ListingStatus.PUBLISHED,
          },
          include: buildSaleListingInclude(viewer),
          orderBy: {
            publishedAt: 'desc',
          },
        },
        reviews: {
          where: {
            status: PrismaSellerReviewStatus.PUBLISHED,
          },
          include: {
            authorUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!seller) {
      if (canUseFixtureMarketplaceFallback) {
        return buildFixtureSellerProfileResult(id);
      }

      return null;
    }

    const [completedDealsCount, reviewAggregate, viewerReview] = await Promise.all([
      prisma.saleListing.count({
        where: {
          sellerId: id,
          status: ListingStatus.ARCHIVED,
        },
      }),
      prisma.sellerReview.aggregate({
        where: {
          sellerProfileId: id,
          status: PrismaSellerReviewStatus.PUBLISHED,
        },
        _avg: {
          rating: true,
        },
        _count: {
          _all: true,
        },
      }),
      viewer?.userId
        ? prisma.sellerReview.findUnique({
            where: {
              sellerProfileId_authorUserId: {
                sellerProfileId: id,
                authorUserId: viewer.userId,
              },
            },
            select: {
              status: true,
            },
          })
        : Promise.resolve(null),
    ]);

    return {
      seller: withSellerMetrics(seller, {
        completedDealsCount,
        reviewCount: reviewAggregate._count._all,
        averageRating: reviewAggregate._avg.rating ?? undefined,
      }),
      listings: seller.saleListings.map((listing) => mapSaleListing(listing as SaleListingRecord)),
      completedDealsCount,
      reviewSummary: {
        count: reviewAggregate._count._all,
        averageRating: reviewAggregate._avg.rating ?? undefined,
      },
      reviews: seller.reviews.map((review) => mapSellerReview(review as SellerReviewRecord)),
      viewerReviewStatus: viewerReview?.status?.toLowerCase() as SellerReview['status'] | undefined,
    };
  } catch (error) {
    if (canUseFixtureMarketplaceFallback && isMarketplaceDbUnavailable(error)) {
      return buildFixtureSellerProfileResult(id);
    }

    throw error;
  }
}

export async function getPublicSellerReviews(sellerId: string) {
  const [reviews, aggregate] = await prisma.$transaction([
    prisma.sellerReview.findMany({
      where: {
        sellerProfileId: sellerId,
        status: PrismaSellerReviewStatus.PUBLISHED,
      },
      include: {
        authorUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.sellerReview.aggregate({
      where: {
        sellerProfileId: sellerId,
        status: PrismaSellerReviewStatus.PUBLISHED,
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  return {
    reviews: reviews.map((review) => mapSellerReview(review as SellerReviewRecord)),
    summary: {
      count: aggregate._count._all,
      averageRating: aggregate._avg.rating ?? undefined,
    },
  };
}

export async function createSellerReview(input: CreateSellerReviewInput) {
  const text = input.text.trim();

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('Оценка должна быть от 1 до 5.');
  }

  if (text.length < 20) {
    throw new Error('Отзыв должен содержать минимум 20 символов.');
  }

  if (text.length > 1500) {
    throw new Error('Отзыв не должен превышать 1500 символов.');
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: {
      id: input.sellerId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!seller) {
    throw new Error('Продавец не найден.');
  }

  if (seller.userId && seller.userId === input.authorUserId) {
    throw new Error('Нельзя оставить отзыв самому себе.');
  }

  try {
    const review = await prisma.sellerReview.create({
      data: {
        sellerProfileId: input.sellerId,
        authorUserId: input.authorUserId,
        rating: input.rating,
        text,
        status: PrismaSellerReviewStatus.PENDING,
      },
      include: {
        authorUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return mapSellerReview(review as SellerReviewRecord);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('Вы уже оставляли отзыв этому продавцу.');
    }

    throw error;
  }
}

export async function getPublishedWantedListings(): Promise<WantedListing[]> {
  try {
    const records = await prisma.wantedListing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
      },
      include: wantedListingInclude,
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return records.map(mapWantedListing);
  } catch (error) {
    if (canUseFixtureMarketplaceFallback && isMarketplaceDbUnavailable(error)) {
      return wantedListingFixtures.map(cloneFixtureWantedListing);
    }

    throw error;
  }
}

export async function getWantedListingById(id: string, viewer?: ListingViewer): Promise<WantedListing | null> {
  try {
    const record = await prisma.wantedListing.findUnique({
      where: {
        id,
      },
      include: wantedListingInclude,
    });

    if (!record) {
      if (canUseFixtureMarketplaceFallback) {
        const fallback = wantedListingFixtures.find((listing) => listing.id === id);
        return fallback ? cloneFixtureWantedListing(fallback) : null;
      }

      return null;
    }

    if (!canViewListing(record.status, record.createdByUserId, viewer)) {
      return null;
    }

    return mapWantedListing(record);
  } catch (error) {
    if (canUseFixtureMarketplaceFallback && isMarketplaceDbUnavailable(error)) {
      const fallback = wantedListingFixtures.find((listing) => listing.id === id);
      return fallback ? cloneFixtureWantedListing(fallback) : null;
    }

    throw error;
  }
}

export async function getEditableSaleListingForOwner(input: {
  listingId: string;
  currentUserId: string;
}): Promise<EditableSaleListingPayload> {
  const record = await prisma.saleListing.findUnique({
    where: {
      id: input.listingId,
    },
    include: {
      seller: true,
      media: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  if (!record) {
    throw new Error('Listing not found.');
  }

  if (!isSaleListingOwner(record as SaleListingRecord, input.currentUserId)) {
    throw new Error('Access denied.');
  }

  return mapEditableSaleListingPayload(record as SaleListingRecord);
}

export async function updateSaleListingByOwner(
  input: UpdateSaleListingByOwnerInput
): Promise<UpdateSaleListingByOwnerResult> {
  const current = await prisma.saleListing.findUnique({
    where: {
      id: input.listingId,
    },
    include: {
      seller: true,
      media: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  if (!current) {
    throw new Error('Listing not found.');
  }

  if (!isSaleListingOwner(current as SaleListingRecord, input.currentUserId)) {
    throw new Error('Access denied.');
  }

  const galleryById = new Map(
    current.media
      .filter((item) => item.kind === ListingMediaKind.GALLERY)
      .map((item) => [item.id, item] as const)
  );
  const videoById = new Map(
    current.media
      .filter((item) => item.kind === ListingMediaKind.VIDEO)
      .map((item) => [item.id, item] as const)
  );
  const uploadedById = new Map(input.uploadedMedia.map((item) => [item.uploadId, item] as const));

  const nextGallery = input.mediaPlan.gallery.map((item, sortOrder) => {
    if (item.source === 'existing') {
      const existing = galleryById.get(item.mediaId);
      if (!existing) {
        throw new Error('Invalid gallery media reference.');
      }

      return {
        source: 'existing' as const,
        mediaId: existing.id,
        sortOrder,
      };
    }

    const uploaded = uploadedById.get(item.uploadId);
    if (!uploaded || uploaded.kind !== 'gallery') {
      throw new Error('Missing uploaded gallery media.');
    }

    return {
      source: 'new' as const,
      upload: uploaded,
      sortOrder,
    };
  });

  const nextVideo =
    input.mediaPlan.video == null
      ? null
      : input.mediaPlan.video.source === 'existing'
      ? (() => {
          const existing = videoById.get(input.mediaPlan.video.mediaId);
          if (!existing) {
            throw new Error('Invalid video media reference.');
          }

          return {
            source: 'existing' as const,
            mediaId: existing.id,
          };
        })()
      : (() => {
          const uploaded = uploadedById.get(input.mediaPlan.video.uploadId);
          if (!uploaded || uploaded.kind !== 'video') {
            throw new Error('Missing uploaded video media.');
          }

          return {
            source: 'new' as const,
            upload: uploaded,
          };
        })();

  if (normalizeOwnerTargetStatus(input.targetStatus) === ListingStatus.PENDING && nextGallery.length === 0) {
    throw new Error('Добавьте хотя бы одну фотографию.');
  }

  const retainedExistingIds = new Set<string>([
    ...nextGallery.filter((item) => item.source === 'existing').map((item) => item.mediaId),
    ...(nextVideo && nextVideo.source === 'existing' ? [nextVideo.mediaId] : []),
  ]);
  const removedMedia = current.media.filter(
    (item) =>
      (item.kind === ListingMediaKind.GALLERY || item.kind === ListingMediaKind.VIDEO) &&
      !retainedExistingIds.has(item.id)
  );

  const nextStatus = normalizeOwnerTargetStatus(input.targetStatus);
  const now = new Date();
  const ownerUserId = current.createdByUserId ?? current.seller.userId ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    if (ownerUserId) {
      await tx.user.update({
        where: {
          id: ownerUserId,
        },
        data: {
          name: input.values.sellerName,
          phone: input.values.contact,
        },
      });
    }

    await tx.sellerProfile.update({
      where: {
        id: current.sellerId,
      },
      data: {
        name: input.values.sellerName,
        phone: input.values.contact,
        profileType: input.values.sellerType === 'commission' ? ProfileType.COMPANY : ProfileType.PERSON,
      },
    });

    const listing = await tx.saleListing.update({
      where: {
        id: current.id,
      },
      data: {
        make: input.values.make,
        catalogBrandId: input.values.catalogBrandId ?? null,
        model: input.values.model,
        catalogModelId: input.values.catalogModelId ?? null,
        generation: input.values.generation || null,
        catalogGenerationId: input.values.catalogGenerationId ?? null,
        year: input.values.year,
        price: input.values.price,
        priceInHand: input.values.priceInHand ?? null,
        priceOnResources: input.values.priceOnResources ?? null,
        city: input.values.city,
        vin: input.values.vin || null,
        plateNumber: input.values.plateNumber || null,
        plateRegion: input.values.plateRegion || null,
        plateUnregistered: input.values.plateUnregistered ?? false,
        bodyType: input.values.bodyType,
        catalogBodyTypeId: input.values.catalogBodyTypeId ?? null,
        engine: input.values.engine,
        catalogFuelTypeId: input.values.catalogFuelTypeId ?? null,
        engineDisplacementL: input.values.engineDisplacementL ?? null,
        catalogEngineId: input.values.catalogEngineId ?? null,
        power: input.values.power,
        transmission: input.values.transmission,
        catalogTransmissionId: input.values.catalogTransmissionId ?? null,
        drive: input.values.drive,
        catalogDriveTypeId: input.values.catalogDriveTypeId ?? null,
        catalogModificationId: input.values.catalogModificationId ?? null,
        mileage: input.values.mileage,
        owners: input.values.owners,
        registrations: input.values.registrations ?? null,
        keysCount: input.values.keysCount ?? null,
        ptsType: input.values.ptsType ? ptsTypeToPrisma[input.values.ptsType] : null,
        ptsOriginal: input.values.ptsType ? input.values.ptsType === 'original' : true,
        avtotekaStatus: input.values.avtotekaStatus ? avtotekaToPrisma[input.values.avtotekaStatus] : null,
        paintedElements: input.values.paintedElements,
        paintCount: input.values.paintCount,
        taxi: input.values.taxi,
        carsharing: input.values.carsharing,
        wheelSet: input.values.wheelSet,
        extraTires: input.values.extraTires,
        conditionNote: input.values.investmentNote || null,
        needsInvestment: input.values.noInvestment === undefined ? null : !input.values.noInvestment,
        glassOriginal: input.values.glassOriginal ?? null,
        resourceStatus: resourceStatusToPrisma[input.values.resourceStatus],
        sellerType: sellerTypeToPrisma[input.values.sellerType],
        inspectionCity: input.values.city,
        color: input.values.color,
        steering: input.values.steering,
        trim: input.values.trim || null,
        catalogTrimId: input.values.catalogTrimId ?? null,
        description: input.values.description,
        videoUrlExternal: input.values.videoUrlExternal || null,
        status: nextStatus,
        moderationNote: null,
        publishedAt: null,
        statusUpdatedAt: now,
      },
      select: {
        id: true,
        status: true,
        moderationNote: true,
        publishedAt: true,
      },
    });

    if (current.price !== input.values.price) {
      await tx.priceHistory.create({
        data: {
          saleListingId: current.id,
          price: input.values.price,
          createdAt: now,
        },
      });
    }

    if (removedMedia.length > 0) {
      await tx.listingMedia.deleteMany({
        where: {
          id: {
            in: removedMedia.map((item) => item.id),
          },
        },
      });
    }

    for (const item of nextGallery) {
      if (item.source === 'existing') {
        await tx.listingMedia.update({
          where: {
            id: item.mediaId,
          },
          data: {
            sortOrder: item.sortOrder,
          },
        });
        continue;
      }

      await tx.listingMedia.create({
        data: {
          saleListingId: current.id,
          kind: ListingMediaKind.GALLERY,
          storageKey: item.upload.storageKey,
          publicUrl: item.upload.publicUrl,
          originalName: item.upload.originalName,
          mimeType: item.upload.mimeType,
          sizeBytes: item.upload.sizeBytes,
          sortOrder: item.sortOrder,
        },
      });
    }

    if (nextVideo?.source === 'existing') {
      await tx.listingMedia.update({
        where: {
          id: nextVideo.mediaId,
        },
        data: {
          sortOrder: 0,
        },
      });
    } else if (nextVideo?.source === 'new') {
      await tx.listingMedia.create({
        data: {
          saleListingId: current.id,
          kind: ListingMediaKind.VIDEO,
          storageKey: nextVideo.upload.storageKey,
          publicUrl: nextVideo.upload.publicUrl,
          originalName: nextVideo.upload.originalName,
          mimeType: nextVideo.upload.mimeType,
          sizeBytes: nextVideo.upload.sizeBytes,
          sortOrder: 0,
        },
      });
    }

    return listing;
  });

  return {
    listing: updated,
    removedStorageKeys: removedMedia.map((item) => item.storageKey),
  };
}

export async function createSaleListing(input: CreateSaleListingInput): Promise<SaleListing> {
  const status = input.initialStatus ?? ListingStatus.PENDING;
  const now = new Date();

  if (input.createdByUserId) {
    await prisma.user.update({
      where: {
        id: input.createdByUserId,
      },
      data: {
        name: input.sellerName,
        phone: input.contact,
      },
    });
  }

  const seller = await findOrCreateSellerProfile({
    userId: input.createdByUserId,
    name: input.sellerName,
    type: input.sellerType === 'commission' ? 'company' : 'person',
    phone: input.contact,
  });

  const created = await prisma.saleListing.create({
    data: {
      make: input.make,
      catalogBrandId: input.catalogBrandId,
      model: input.model,
      catalogModelId: input.catalogModelId,
      generation: input.generation,
      catalogGenerationId: input.catalogGenerationId,
      year: input.year,
      price: input.price,
      priceInHand: input.priceInHand,
      priceOnResources: input.priceOnResources,
      city: input.city,
      vin: input.vin,
      plateNumber: input.plateNumber,
      plateRegion: input.plateRegion,
      plateUnregistered: input.plateUnregistered ?? false,
      bodyType: input.bodyType,
      catalogBodyTypeId: input.catalogBodyTypeId,
      engine: input.engine,
      catalogFuelTypeId: input.catalogFuelTypeId,
      engineDisplacementL: input.engineDisplacementL,
      catalogEngineId: input.catalogEngineId,
      power: input.power,
      transmission: input.transmission,
      catalogTransmissionId: input.catalogTransmissionId,
      drive: input.drive,
      catalogDriveTypeId: input.catalogDriveTypeId,
      catalogModificationId: input.catalogModificationId,
      mileage: input.mileage,
      owners: input.owners,
      registrations: input.registrations,
      keysCount: input.keysCount,
      ptsType: input.ptsType ? ptsTypeToPrisma[input.ptsType] : undefined,
      ptsOriginal: input.ptsType ? input.ptsType === 'original' : true,
      avtotekaStatus: input.avtotekaStatus ? avtotekaToPrisma[input.avtotekaStatus] : undefined,
      paintedElements: input.paintedElements,
      paintCount: input.paintCount,
      taxi: input.taxi,
      carsharing: input.carsharing,
      wheelSet: input.wheelSet,
      extraTires: input.extraTires,
      conditionNote: input.investmentNote,
      needsInvestment: input.noInvestment === undefined ? undefined : !input.noInvestment,
      glassOriginal: input.glassOriginal,
      resourceStatus: resourceStatusToPrisma[input.resourceStatus],
      sellerType: sellerTypeToPrisma[input.sellerType],
      inspectionCity: input.city,
      color: input.color,
      steering: input.steering,
      trim: input.trim,
      catalogTrimId: input.catalogTrimId,
      description: input.description,
      videoUrlExternal: input.videoUrlExternal,
      sellerId: seller.id,
      createdByUserId: input.createdByUserId,
      status,
      moderationNote: undefined,
      publishedAt: status === ListingStatus.PUBLISHED ? now : null,
      statusUpdatedAt: now,
      createdAt: now,
      priceHistory: {
        create: {
          price: input.price,
          createdAt: now,
        },
      },
      media: input.media.length
        ? {
            create: input.media.map((item) => ({
              kind:
                item.kind === 'gallery'
                  ? ListingMediaKind.GALLERY
                  : item.kind === 'interior'
                  ? ListingMediaKind.INTERIOR
                  : item.kind === 'video'
                  ? ListingMediaKind.VIDEO
                  : ListingMediaKind.REPORT,
              storageKey: item.storageKey,
              publicUrl: item.publicUrl,
              originalName: item.originalName,
              mimeType: item.mimeType,
              sizeBytes: item.sizeBytes,
              sortOrder: item.sortOrder,
            })),
          }
        : undefined,
    },
    include: buildSaleListingInclude(undefined, { includePriceHistory: true }),
  });

  const listing = mapSaleListing(created as SaleListingRecord);

  if (listing.status === 'PUBLISHED') {
    await notifyUsersAboutSavedSearchMatch(listing);
  }

  return listing;
}

export async function createWantedListing(input: CreateWantedListingInput): Promise<WantedListing> {
  const status = input.initialStatus ?? ListingStatus.PENDING;
  const now = new Date();

  if (input.createdByUserId) {
    await prisma.user.update({
      where: {
        id: input.createdByUserId,
      },
      data: {
        name: input.authorName,
        phone: input.contact,
      },
    });
  }

  const author = await findOrCreateSellerProfile({
    userId: input.createdByUserId,
    name: input.authorName,
    type: 'person',
    phone: input.contact,
  });

  const created = await prisma.wantedListing.create({
    data: {
      models: input.models,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      yearFrom: input.yearFrom,
      mileageMax: input.mileageMax,
      engine: input.engine,
      transmission: input.transmission,
      drive: input.drive,
      ownersMax: input.ownersMax,
      paintAllowed: input.paintAllowed,
      restrictions: input.restrictions,
      region: input.region,
      comment: input.comment,
      contact: input.contact,
      authorId: author.id,
      createdByUserId: input.createdByUserId,
      status,
      moderationNote: undefined,
      publishedAt: status === ListingStatus.PUBLISHED ? now : null,
      statusUpdatedAt: now,
      createdAt: now,
    },
    include: wantedListingInclude,
  });

  return mapWantedListing(created);
}

export async function createSeedSellerProfile(input: {
  legacyId: string;
  name: string;
  type: 'person' | 'company';
  verified: boolean;
  onPlatformSince: string;
  phone?: string;
}) {
  return findOrCreateSellerProfile(input);
}
