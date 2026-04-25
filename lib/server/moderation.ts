import {
  AdminActionType,
  AdminEntityType,
  ListingStatus,
  UserRole,
  UserNotificationType,
  type Prisma,
} from '@prisma/client';
import { LISTING_STATUS_VALUES, getListingStatusLabel, type ListingStatusValue } from '@/lib/listing-status';
import { createAdminActionLog, createUserNotification } from './admin-activity';
import { prisma } from './prisma';
import { deleteS3Objects } from './s3';
import { notifyUsersAboutSavedSearchMatch } from './saved-searches';
import { getSaleListingById } from './marketplace';
import { pingIndexNow } from '@/lib/indexnow';

type SaleModerationRecord = Prisma.SaleListingGetPayload<{
  include: {
    seller: true;
    createdByUser: true;
    media: {
      orderBy: {
        sortOrder: 'asc';
      };
    };
  };
}>;

type WantedModerationRecord = Prisma.WantedListingGetPayload<{
  include: {
    author: true;
    createdByUser: true;
  };
}>;

export interface UpdateSaleListingByAdminInput {
  actorUserId?: string;
  id: string;
  status?: ListingStatus;
  moderationNote?: string | null;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  city?: string;
  mileage?: number;
  description?: string;
}

export interface UpdateWantedListingByAdminInput {
  actorUserId?: string;
  id: string;
  status?: ListingStatus;
  moderationNote?: string | null;
  models?: string[];
  budgetMin?: number | null;
  budgetMax?: number;
  region?: string | null;
  comment?: string | null;
}

const saleModerationInclude = {
  seller: true,
  createdByUser: true,
  media: {
    orderBy: {
      sortOrder: 'asc',
    },
  },
} satisfies Prisma.SaleListingInclude;

const wantedModerationInclude = {
  author: true,
  createdByUser: true,
} satisfies Prisma.WantedListingInclude;

const statusPriority: Record<ListingStatusValue, number> = {
  PENDING: 0,
  REJECTED: 1,
  DRAFT: 2,
  PUBLISHED: 3,
  ARCHIVED: 4,
};

function sortByModerationPriority<T extends { status: ListingStatusValue; statusUpdatedAt: Date; createdAt: Date }>(items: T[]) {
  return [...items].sort((left, right) => {
    const priorityDelta = statusPriority[left.status] - statusPriority[right.status];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return right.statusUpdatedAt.getTime() - left.statusUpdatedAt.getTime() || right.createdAt.getTime() - left.createdAt.getTime();
  });
}

function emptyStatusCounts() {
  return Object.fromEntries(LISTING_STATUS_VALUES.map((status) => [status, 0])) as Record<ListingStatusValue, number>;
}

function countStatuses<T extends { status: ListingStatusValue }>(items: T[]) {
  const counts = emptyStatusCounts();
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}

function normalizeModerationNote(note: string | null | undefined) {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function describeStatusChange(previous: ListingStatus, next: ListingStatus) {
  return `${getListingStatusLabel(previous)} -> ${getListingStatusLabel(next)}`;
}

function getEntityLabel(entityType: AdminEntityType) {
  return entityType === AdminEntityType.WANTED_LISTING ? 'запроса' : 'объявления';
}

function buildActionTitle(title: string, prefix: string) {
  return `${prefix}: ${title}`;
}

function buildStatusMessage(entityType: AdminEntityType, nextStatus: ListingStatus) {
  const entityName = entityType === AdminEntityType.WANTED_LISTING ? 'Запрос' : 'Объявление';

  switch (nextStatus) {
    case ListingStatus.PUBLISHED:
      return `${entityName} прошло проверку и опубликовано в рабочей ленте.`;
    case ListingStatus.PENDING:
      return `${entityName} принято в работу и ожидает решения модератора.`;
    case ListingStatus.REJECTED:
      return `${entityName} требует доработки перед публикацией.`;
    case ListingStatus.ARCHIVED:
      return `${entityName} переведено в архив и снято с активного показа.`;
    case ListingStatus.DRAFT:
    default:
      return `${entityName} сохранено как черновик.`;
  }
}

function buildDetailsUpdatedTitle(entityType: AdminEntityType, title: string) {
  return buildActionTitle(title, entityType === AdminEntityType.WANTED_LISTING ? 'Параметры запроса обновлены' : 'Карточка объявления обновлена');
}

async function logListingStatusChange(input: {
  actorUserId?: string;
  ownerUserId?: string | null;
  entityType: AdminEntityType;
  entityId: string;
  href: string;
  title: string;
  previousStatus: ListingStatus;
  nextStatus: ListingStatus;
}) {
  await createAdminActionLog({
    actorUserId: input.actorUserId,
    targetUserId: input.ownerUserId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    actionType: AdminActionType.STATUS_CHANGED,
    title: buildActionTitle(input.title, `Статус ${getEntityLabel(input.entityType)} обновлён`),
    description: describeStatusChange(input.previousStatus, input.nextStatus),
  });

  if (input.ownerUserId) {
    await createUserNotification({
      userId: input.ownerUserId,
      type: UserNotificationType.LISTING_STATUS_CHANGED,
      entityType: input.entityType,
      entityId: input.entityId,
      href: input.href,
      title: buildActionTitle(input.title, `Статус ${getEntityLabel(input.entityType)} обновлён`),
      message: buildStatusMessage(input.entityType, input.nextStatus),
    });
  }
}

async function logListingNoteChange(input: {
  actorUserId?: string;
  ownerUserId?: string | null;
  entityType: AdminEntityType;
  entityId: string;
  href: string;
  title: string;
  moderationNote: string | null;
}) {
  await createAdminActionLog({
    actorUserId: input.actorUserId,
    targetUserId: input.ownerUserId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    actionType: AdminActionType.NOTE_UPDATED,
    title: buildActionTitle(input.title, `Комментарий модератора по ${getEntityLabel(input.entityType)} обновлён`),
    description: input.moderationNote ?? 'Комментарий модератора удалён.',
  });

  if (input.ownerUserId) {
    await createUserNotification({
      userId: input.ownerUserId,
      type: UserNotificationType.MODERATION_NOTE_UPDATED,
      entityType: input.entityType,
      entityId: input.entityId,
      href: input.href,
      title: buildActionTitle(input.title, `Комментарий модератора по ${getEntityLabel(input.entityType)} обновлён`),
      message: input.moderationNote ?? 'Комментарий модератора был удалён.',
    });
  }
}

async function logListingDetailChange(input: {
  actorUserId?: string;
  ownerUserId?: string | null;
  entityType: AdminEntityType;
  entityId: string;
  href: string;
  title: string;
  changes: string[];
}) {
  if (input.changes.length === 0) {
    return;
  }

  const description = input.changes.join('; ');

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    targetUserId: input.ownerUserId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    actionType: AdminActionType.LISTING_DETAILS_UPDATED,
    title: buildDetailsUpdatedTitle(input.entityType, input.title),
    description,
  });

  if (input.ownerUserId) {
    await createUserNotification({
      userId: input.ownerUserId,
      type: UserNotificationType.LISTING_CONTENT_UPDATED,
      entityType: input.entityType,
      entityId: input.entityId,
      href: input.href,
      title: buildDetailsUpdatedTitle(input.entityType, input.title),
      message:
        input.entityType === AdminEntityType.WANTED_LISTING
          ? 'Параметры запроса были скорректированы модератором.'
          : 'Карточка объявления была скорректирована модератором.',
    });
  }
}

export async function getModerationOverview() {
  const [saleListings, wantedListings] = await Promise.all([
    prisma.saleListing.findMany({
      include: saleModerationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.wantedListing.findMany({
      include: wantedModerationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  const sortedSale = sortByModerationPriority(saleListings);
  const sortedWanted = sortByModerationPriority(wantedListings);

  return {
    saleListings: sortedSale,
    wantedListings: sortedWanted,
    saleCounts: countStatuses(saleListings),
    wantedCounts: countStatuses(wantedListings),
  };
}

export async function updateSaleListingByAdmin(input: UpdateSaleListingByAdminInput) {
  const current = await prisma.saleListing.findUnique({
    where: {
      id: input.id,
    },
    include: {
      seller: true,
    },
  });

  if (!current) {
    throw new Error('Sale listing not found.');
  }

  const now = new Date();
  const data: Prisma.SaleListingUpdateInput = {};
  const detailChanges: string[] = [];

  if (input.make !== undefined && input.make !== current.make) {
    data.make = input.make;
    detailChanges.push(`make: ${current.make} -> ${input.make}`);
  }

  if (input.model !== undefined && input.model !== current.model) {
    data.model = input.model;
    detailChanges.push(`model: ${current.model} -> ${input.model}`);
  }

  if (input.year !== undefined && input.year !== current.year) {
    data.year = input.year;
    detailChanges.push(`year: ${current.year} -> ${input.year}`);
  }

  if (input.price !== undefined && input.price !== current.price) {
    data.price = input.price;
    detailChanges.push(`price: ${current.price} -> ${input.price}`);
  }

  if (input.city !== undefined && input.city !== current.city) {
    data.city = input.city;
    detailChanges.push(`city: ${current.city} -> ${input.city}`);
  }

  if (input.mileage !== undefined && input.mileage !== current.mileage) {
    data.mileage = input.mileage;
    detailChanges.push(`mileage: ${current.mileage} -> ${input.mileage}`);
  }

  if (input.description !== undefined && input.description !== current.description) {
    data.description = input.description;
    detailChanges.push('description updated');
  }

  const nextStatus = input.status ?? current.status;
  const nextNote = input.moderationNote !== undefined ? normalizeModerationNote(input.moderationNote) : current.moderationNote;

  if (input.status !== undefined && input.status !== current.status) {
    data.status = input.status;
    data.statusUpdatedAt = now;
    data.publishedAt =
      input.status === ListingStatus.PUBLISHED && current.status !== ListingStatus.PUBLISHED
        ? now
        : current.publishedAt;
  }

  if (input.moderationNote !== undefined && nextNote !== current.moderationNote) {
    data.moderationNote = nextNote;
    if (!data.statusUpdatedAt) {
      data.statusUpdatedAt = now;
    }
  }

  const listing = Object.keys(data).length
    ? await prisma.saleListing.update({
        where: {
          id: input.id,
        },
        data,
      })
    : current;

  const ownerUserId = current.createdByUserId ?? current.seller.userId ?? null;
  const nextTitle = `${listing.make} ${listing.model}, ${listing.year}`;

  if (input.status !== undefined && current.status !== nextStatus) {
    await logListingStatusChange({
      actorUserId: input.actorUserId,
      ownerUserId,
      entityType: AdminEntityType.SALE_LISTING,
      entityId: current.id,
      href: `/listing/${current.id}`,
      title: nextTitle,
      previousStatus: current.status,
      nextStatus,
    });
  }

  if (input.moderationNote !== undefined && (current.moderationNote ?? null) !== (nextNote ?? null)) {
    await logListingNoteChange({
      actorUserId: input.actorUserId,
      ownerUserId,
      entityType: AdminEntityType.SALE_LISTING,
      entityId: current.id,
      href: `/listing/${current.id}`,
      title: nextTitle,
      moderationNote: nextNote ?? null,
    });
  }

  await logListingDetailChange({
    actorUserId: input.actorUserId,
    ownerUserId,
    entityType: AdminEntityType.SALE_LISTING,
    entityId: current.id,
    href: `/listing/${current.id}`,
    title: nextTitle,
    changes: detailChanges,
  });

  if (input.price !== undefined && input.price !== current.price) {
    await prisma.priceHistory.create({
      data: {
        saleListingId: current.id,
        price: input.price,
      },
    });
  }

  if (input.status === ListingStatus.PUBLISHED && current.status !== ListingStatus.PUBLISHED) {
    const publishedListing = await getSaleListingById(current.id, { userId: ownerUserId ?? undefined, role: UserRole.ADMIN });
    if (publishedListing) {
      await notifyUsersAboutSavedSearchMatch(publishedListing);
    }
    void pingIndexNow([`/listing/${current.id}`, '/sale', '/sitemap.xml']);
  }

  return listing;
}

export async function updateWantedListingByAdmin(input: UpdateWantedListingByAdminInput) {
  const current = await prisma.wantedListing.findUnique({
    where: {
      id: input.id,
    },
    include: {
      author: true,
    },
  });

  if (!current) {
    throw new Error('Wanted listing not found.');
  }

  const now = new Date();
  const data: Prisma.WantedListingUpdateInput = {};
  const detailChanges: string[] = [];

  if (input.models !== undefined) {
    const nextModels = input.models.filter(Boolean);
    if (nextModels.join('|') !== current.models.join('|')) {
      data.models = nextModels;
      detailChanges.push(`models: ${current.models.join(', ')} -> ${nextModels.join(', ')}`);
    }
  }

  if (input.budgetMin !== undefined && input.budgetMin !== current.budgetMin) {
    data.budgetMin = input.budgetMin;
    detailChanges.push(`budgetMin: ${current.budgetMin ?? 'null'} -> ${input.budgetMin ?? 'null'}`);
  }

  if (input.budgetMax !== undefined && input.budgetMax !== current.budgetMax) {
    data.budgetMax = input.budgetMax;
    detailChanges.push(`budgetMax: ${current.budgetMax} -> ${input.budgetMax}`);
  }

  if (input.region !== undefined) {
    const nextRegion = normalizeOptionalText(input.region);
    if ((current.region ?? null) !== nextRegion) {
      data.region = nextRegion;
      detailChanges.push(`region: ${current.region ?? 'null'} -> ${nextRegion ?? 'null'}`);
    }
  }

  if (input.comment !== undefined) {
    const nextComment = normalizeOptionalText(input.comment);
    if ((current.comment ?? null) !== nextComment) {
      data.comment = nextComment;
      detailChanges.push('comment updated');
    }
  }

  const nextStatus = input.status ?? current.status;
  const nextNote = input.moderationNote !== undefined ? normalizeModerationNote(input.moderationNote) : current.moderationNote;

  if (input.status !== undefined && input.status !== current.status) {
    data.status = input.status;
    data.statusUpdatedAt = now;
    data.publishedAt =
      input.status === ListingStatus.PUBLISHED && current.status !== ListingStatus.PUBLISHED
        ? now
        : current.publishedAt;
  }

  if (input.moderationNote !== undefined && nextNote !== current.moderationNote) {
    data.moderationNote = nextNote;
    if (!data.statusUpdatedAt) {
      data.statusUpdatedAt = now;
    }
  }

  const listing = Object.keys(data).length
    ? await prisma.wantedListing.update({
        where: {
          id: input.id,
        },
        data,
      })
    : current;

  const ownerUserId = current.createdByUserId ?? current.author.userId ?? null;
  const nextTitle = input.models?.join(', ') || current.models.join(', ');

  if (input.status !== undefined && current.status !== nextStatus) {
    await logListingStatusChange({
      actorUserId: input.actorUserId,
      ownerUserId,
      entityType: AdminEntityType.WANTED_LISTING,
      entityId: current.id,
      href: `/wanted/${current.id}`,
      title: nextTitle,
      previousStatus: current.status,
      nextStatus,
    });
  }

  if (input.moderationNote !== undefined && (current.moderationNote ?? null) !== (nextNote ?? null)) {
    await logListingNoteChange({
      actorUserId: input.actorUserId,
      ownerUserId,
      entityType: AdminEntityType.WANTED_LISTING,
      entityId: current.id,
      href: `/wanted/${current.id}`,
      title: nextTitle,
      moderationNote: nextNote ?? null,
    });
  }

  await logListingDetailChange({
    actorUserId: input.actorUserId,
    ownerUserId,
    entityType: AdminEntityType.WANTED_LISTING,
    entityId: current.id,
    href: `/wanted/${current.id}`,
    title: nextTitle,
    changes: detailChanges,
  });

  if (input.status === ListingStatus.PUBLISHED && current.status !== ListingStatus.PUBLISHED) {
    void pingIndexNow([`/wanted/${current.id}`, '/wanted', '/sitemap.xml']);
  }

  return listing;
}

export async function updateSaleListingModeration(input: {
  actorUserId?: string;
  id: string;
  status: ListingStatus;
  moderationNote?: string | null;
}) {
  return updateSaleListingByAdmin(input);
}

export async function updateWantedListingModeration(input: {
  actorUserId?: string;
  id: string;
  status: ListingStatus;
  moderationNote?: string | null;
}) {
  return updateWantedListingByAdmin(input);
}

export async function deleteSaleListingByAdmin(input: {
  actorUserId?: string;
  id: string;
}) {
  const current = await prisma.saleListing.findUnique({
    where: {
      id: input.id,
    },
    include: {
      seller: true,
      media: true,
    },
  });

  if (!current) {
    throw new Error('Sale listing not found.');
  }

  await deleteS3Objects(current.media.map((item) => item.storageKey));
  await prisma.saleListing.delete({
    where: {
      id: input.id,
    },
  });

  const ownerUserId = current.createdByUserId ?? current.seller.userId ?? null;
  const listingTitle = `${current.make} ${current.model}, ${current.year}`;

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    targetUserId: ownerUserId,
    entityType: AdminEntityType.SALE_LISTING,
    entityId: current.id,
    actionType: AdminActionType.LISTING_DELETED,
    title: buildActionTitle(listingTitle, 'Объявление снято с публикации'),
    description: 'Карточка продажи и связанные материалы удалены администрацией.',
  });

  if (ownerUserId) {
    await createUserNotification({
      userId: ownerUserId,
      type: UserNotificationType.LISTING_STATUS_CHANGED,
      entityType: AdminEntityType.SALE_LISTING,
      entityId: current.id,
      title: buildActionTitle(listingTitle, 'Объявление снято с публикации'),
      message: 'Объявление о продаже снято с публикации администрацией.',
    });
  }

  return current;
}

export async function deleteWantedListingByAdmin(input: {
  actorUserId?: string;
  id: string;
}) {
  const current = await prisma.wantedListing.findUnique({
    where: {
      id: input.id,
    },
    include: {
      author: true,
    },
  });

  if (!current) {
    throw new Error('Wanted listing not found.');
  }

  await prisma.wantedListing.delete({
    where: {
      id: input.id,
    },
  });

  const ownerUserId = current.createdByUserId ?? current.author.userId ?? null;
  const listingTitle = current.models.join(', ');

  await createAdminActionLog({
    actorUserId: input.actorUserId,
    targetUserId: ownerUserId,
    entityType: AdminEntityType.WANTED_LISTING,
    entityId: current.id,
    actionType: AdminActionType.LISTING_DELETED,
    title: buildActionTitle(listingTitle, 'Запрос снят с публикации'),
    description: 'Запрос на подбор удалён администрацией.',
  });

  if (ownerUserId) {
    await createUserNotification({
      userId: ownerUserId,
      type: UserNotificationType.LISTING_STATUS_CHANGED,
      entityType: AdminEntityType.WANTED_LISTING,
      entityId: current.id,
      title: buildActionTitle(listingTitle, 'Запрос снят с публикации'),
      message: 'Запрос на подбор снят с публикации администрацией.',
    });
  }

  return current;
}

export async function bulkUpdateSaleListings(input: {
  actorUserId?: string;
  ids: string[];
  action: 'setStatus' | 'delete';
  status?: ListingStatus;
  moderationNote?: string | null;
}) {
  const uniqueIds = [...new Set(input.ids.filter(Boolean))];
  if (!uniqueIds.length) {
    throw new Error('No sale listings selected.');
  }

  if (input.action === 'delete') {
    for (const id of uniqueIds) {
      await deleteSaleListingByAdmin({
        actorUserId: input.actorUserId,
        id,
      });
    }

    return { count: uniqueIds.length };
  }

  if (!input.status) {
    throw new Error('Status is required for bulk status updates.');
  }

  for (const id of uniqueIds) {
    await updateSaleListingByAdmin({
      actorUserId: input.actorUserId,
      id,
      status: input.status,
      moderationNote: input.moderationNote,
    });
  }

  return { count: uniqueIds.length };
}

export async function bulkUpdateWantedListings(input: {
  actorUserId?: string;
  ids: string[];
  action: 'setStatus' | 'delete';
  status?: ListingStatus;
  moderationNote?: string | null;
}) {
  const uniqueIds = [...new Set(input.ids.filter(Boolean))];
  if (!uniqueIds.length) {
    throw new Error('No wanted listings selected.');
  }

  if (input.action === 'delete') {
    for (const id of uniqueIds) {
      await deleteWantedListingByAdmin({
        actorUserId: input.actorUserId,
        id,
      });
    }

    return { count: uniqueIds.length };
  }

  if (!input.status) {
    throw new Error('Status is required for bulk status updates.');
  }

  for (const id of uniqueIds) {
    await updateWantedListingByAdmin({
      actorUserId: input.actorUserId,
      id,
      status: input.status,
      moderationNote: input.moderationNote,
    });
  }

  return { count: uniqueIds.length };
}

export type AdminSaleModerationItem = SaleModerationRecord;
export type AdminWantedModerationItem = WantedModerationRecord;
