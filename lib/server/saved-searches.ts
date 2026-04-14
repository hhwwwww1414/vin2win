import { AdminEntityType, UserNotificationType, type Prisma } from '@prisma/client';
import { resolveRegionCitySelection } from '@/lib/ru-regions';
import { cleanSaleSearchFiltersForPersistence, describeSaleSearch, normalizeSaleSearchName } from '@/lib/sale-search';
import type { SaleListing, SaleSearchFilters, SavedSearchRecord } from '@/lib/types';
import { createUserNotification } from '@/lib/server/admin-activity';
import { prisma } from '@/lib/server/prisma';

function mapSavedSearch(record: Prisma.SavedSearchGetPayload<Prisma.SavedSearchDefaultArgs>): SavedSearchRecord {
  const filters = cleanSaleSearchFiltersForPersistence((record.filters ?? {}) as Partial<SaleSearchFilters>);

  return {
    id: record.id,
    name: record.name ?? undefined,
    filters,
    notifyEnabled: record.notifyEnabled,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function includesIgnoreCase(pool: string[], candidate: string) {
  return pool.some((value) => value.toLowerCase() === candidate.toLowerCase());
}

function containsIgnoreCase(pool: string[], candidate: string) {
  const normalizedCandidate = candidate.toLowerCase();
  return pool.some((value) => normalizedCandidate.includes(value.toLowerCase()));
}

export function doesSaleListingMatchSavedSearch(listing: SaleListing, filters: SaleSearchFilters) {
  if (filters.make.length > 0 && !includesIgnoreCase(filters.make, listing.make)) {
    return false;
  }

  if (filters.model.length > 0 && !filters.model.some((value) => listing.model.toLowerCase().includes(value.toLowerCase()))) {
    return false;
  }

  if (filters.yearFrom && listing.year < filters.yearFrom) {
    return false;
  }

  if (filters.yearTo && listing.year > filters.yearTo) {
    return false;
  }

  if (filters.priceMin && listing.price < filters.priceMin) {
    return false;
  }

  if (filters.priceMax && listing.price > filters.priceMax) {
    return false;
  }

  if (filters.mileageMin && listing.mileage < filters.mileageMin) {
    return false;
  }

  if (filters.mileageMax && listing.mileage > filters.mileageMax) {
    return false;
  }

  if (filters.powerMin && listing.power < filters.powerMin) {
    return false;
  }

  if (filters.powerMax && listing.power > filters.powerMax) {
    return false;
  }

  if (filters.paintCountMax !== undefined && listing.paintCount > filters.paintCountMax) {
    return false;
  }

  if (filters.bodyType.length > 0 && !includesIgnoreCase(filters.bodyType, listing.bodyType)) {
    return false;
  }

  if (filters.transmission.length > 0 && !includesIgnoreCase(filters.transmission, listing.transmission)) {
    return false;
  }

  if (filters.drive.length > 0 && !includesIgnoreCase(filters.drive, listing.drive)) {
    return false;
  }

  if (filters.color.length > 0 && !includesIgnoreCase(filters.color, listing.color)) {
    return false;
  }

  const resolvedRegionSelection = resolveRegionCitySelection(filters.region, filters.city);
  if (resolvedRegionSelection.region) {
    if (resolvedRegionSelection.hasConflict) {
      return false;
    }

    if (resolvedRegionSelection.cities.length > 0 && !containsIgnoreCase(resolvedRegionSelection.cities, listing.city)) {
      return false;
    }
  } else if (filters.city.length > 0 && !filters.city.some((value) => listing.city.toLowerCase().includes(value.toLowerCase()))) {
    return false;
  }

  if (filters.ownersMax && listing.owners > filters.ownersMax) {
    return false;
  }

  if (filters.ptsOriginal && !listing.ptsOriginal) {
    return false;
  }

  if (filters.avtotekaStatus === 'green' && listing.avtotekaStatus !== 'green') {
    return false;
  }

  if (filters.avtotekaStatus === 'any' && !listing.avtotekaStatus) {
    return false;
  }

  if (filters.noAccident && listing.accident) {
    return false;
  }

  if (filters.noTaxi && listing.taxi) {
    return false;
  }

  if (filters.noCarsharing && listing.carsharing) {
    return false;
  }

  if (filters.resourceStatus.length > 0 && !filters.resourceStatus.includes(listing.resourceStatus)) {
    return false;
  }

  if (filters.sellerType.length > 0 && !filters.sellerType.includes(listing.sellerType)) {
    return false;
  }

  if (filters.hasPhoto && listing.images.length === 0) {
    return false;
  }

  if (filters.priceInHand && listing.priceInHand == null) {
    return false;
  }

  if (filters.noInvestment && listing.needsInvestment) {
    return false;
  }

  return true;
}

export async function listSavedSearches(userId: string) {
  const records = await prisma.savedSearch.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return records.map(mapSavedSearch);
}

export async function countSavedSearches(userId: string) {
  return prisma.savedSearch.count({
    where: {
      userId,
    },
  });
}

export async function createSavedSearch(input: {
  userId: string;
  name?: string;
  filters: Partial<SaleSearchFilters>;
  notifyEnabled?: boolean;
}) {
  const filters = cleanSaleSearchFiltersForPersistence(input.filters);
  const record = await prisma.savedSearch.create({
    data: {
      userId: input.userId,
      name: normalizeSaleSearchName(input.name, describeSaleSearch(filters)),
      filters: filters as unknown as Prisma.InputJsonValue,
      notifyEnabled: input.notifyEnabled ?? true,
    },
  });

  return mapSavedSearch(record);
}

export async function updateSavedSearch(input: {
  userId: string;
  id: string;
  name?: string;
  notifyEnabled?: boolean;
}) {
  const current = await prisma.savedSearch.findFirst({
    where: {
      id: input.id,
      userId: input.userId,
    },
  });

  if (!current) {
    throw new Error('Сохранённый поиск не найден.');
  }

  const nextName = input.name === undefined ? current.name : normalizeSaleSearchName(input.name, current.name ?? 'Поиск');
  const record = await prisma.savedSearch.update({
    where: {
      id: current.id,
    },
    data: {
      name: nextName,
      notifyEnabled: input.notifyEnabled ?? current.notifyEnabled,
    },
  });

  return mapSavedSearch(record);
}

export async function deleteSavedSearch(userId: string, id: string) {
  await prisma.savedSearch.deleteMany({
    where: {
      id,
      userId,
    },
  });
}

export async function notifyUsersAboutSavedSearchMatch(listing: SaleListing) {
  const savedSearches = await prisma.savedSearch.findMany({
    where: {
      notifyEnabled: true,
    },
  });

  const listingTitle = `${listing.make} ${listing.model}, ${listing.year}`;

  for (const savedSearch of savedSearches) {
    if (savedSearch.userId === listing.ownerUserId) {
      continue;
    }

    const filters = cleanSaleSearchFiltersForPersistence((savedSearch.filters ?? {}) as Partial<SaleSearchFilters>);
    if (!doesSaleListingMatchSavedSearch(listing, filters)) {
      continue;
    }

    await createUserNotification({
      userId: savedSearch.userId,
      type: UserNotificationType.NEW_LISTING_MATCH,
      entityType: AdminEntityType.SALE_LISTING,
      entityId: listing.id,
      href: `/listing/${listing.id}`,
      title: `Новое совпадение: ${savedSearch.name ?? 'сохранённый поиск'}`,
      message: `${listingTitle} соответствует вашему поиску "${savedSearch.name ?? describeSaleSearch(filters)}".`,
    });
  }
}
