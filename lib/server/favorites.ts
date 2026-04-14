import { prisma } from '@/lib/server/prisma';
import { getSaleListingsByIds } from '@/lib/server/marketplace';

export async function getFavoriteListingIds(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      saleListingId: true,
    },
  });

  return favorites.map((favorite) => favorite.saleListingId);
}

export async function countFavorites(userId: string) {
  return prisma.favorite.count({
    where: {
      userId,
    },
  });
}

export async function listFavoriteListings(userId: string) {
  const favoriteIds = await getFavoriteListingIds(userId);
  return getSaleListingsByIds(favoriteIds, { userId });
}

export async function addFavorite(userId: string, saleListingId: string) {
  await prisma.favorite.upsert({
    where: {
      userId_saleListingId: {
        userId,
        saleListingId,
      },
    },
    create: {
      userId,
      saleListingId,
    },
    update: {},
  });
}

export async function removeFavorite(userId: string, saleListingId: string) {
  await prisma.favorite.deleteMany({
    where: {
      userId,
      saleListingId,
    },
  });
}

export async function toggleFavorite(userId: string, saleListingId: string) {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_saleListingId: {
        userId,
        saleListingId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        id: existing.id,
      },
    });
    return { active: false };
  }

  await prisma.favorite.create({
    data: {
      userId,
      saleListingId,
    },
  });

  return { active: true };
}
