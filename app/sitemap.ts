import type { MetadataRoute } from 'next';
import { ListingStatus } from '@prisma/client';
import { SALE_ROUTE } from '@/lib/routes';
import { SEO_STATIC_LAST_MODIFIED, absoluteUrl } from '@/lib/seo';
import { prisma } from '@/lib/server/prisma';

const STATIC_ROUTES = ['/', SALE_ROUTE, '/wanted', '/about', '/contacts', '/privacy', '/terms', '/faq'] as const;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [saleListings, wantedListings, sellers] = await Promise.all([
    prisma.saleListing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    prisma.wantedListing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    prisma.sellerProfile.findMany({
      where: {
        OR: [
          {
            saleListings: {
              some: {
                status: ListingStatus.PUBLISHED,
              },
            },
          },
          {
            wantedListings: {
              some: {
                status: ListingStatus.PUBLISHED,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
  ]);

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: absoluteUrl(path),
      lastModified: SEO_STATIC_LAST_MODIFIED,
    })),
    ...saleListings.map((listing) => ({
      url: absoluteUrl(`/listing/${listing.id}`),
      lastModified: listing.updatedAt,
    })),
    ...wantedListings.map((listing) => ({
      url: absoluteUrl(`/wanted/${listing.id}`),
      lastModified: listing.updatedAt,
    })),
    ...sellers.map((seller) => ({
      url: absoluteUrl(`/seller/${seller.id}`),
      lastModified: seller.updatedAt,
    })),
  ];
}
