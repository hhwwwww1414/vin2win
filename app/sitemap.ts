import type { MetadataRoute } from 'next';
import { ListingMediaKind, ListingStatus, ResourceStatus } from '@prisma/client';
import { saleSeoPresets } from '@/lib/sale-seo-presets';
import { SALE_ROUTE } from '@/lib/routes';
import { SEO_STATIC_LAST_MODIFIED, absoluteUrl } from '@/lib/seo';
import { prisma } from '@/lib/server/prisma';

const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: SALE_ROUTE, priority: 0.9, changeFrequency: 'daily' },
  { path: '/wanted', priority: 0.8, changeFrequency: 'daily' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contacts', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
] as const;

export const revalidate = 3600;

function getPresetWhere(filter: string) {
  switch (filter) {
    case 'pre_resources':
      return {
        status: ListingStatus.PUBLISHED,
        resourceStatus: ResourceStatus.PRE_RESOURCES,
      };
    case 'no_paint':
      return {
        status: ListingStatus.PUBLISHED,
        paintCount: {
          lte: 0,
        },
      };
    case 'pts_original':
      return {
        status: ListingStatus.PUBLISHED,
        ptsOriginal: true,
      };
    case 'no_taxi':
      return {
        status: ListingStatus.PUBLISHED,
        NOT: {
          taxi: true,
        },
      };
    case 'no_invest':
      return {
        status: ListingStatus.PUBLISHED,
        NOT: {
          needsInvestment: true,
        },
      };
    default:
      return {
        status: ListingStatus.PUBLISHED,
      };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = [
    ...STATIC_ROUTES.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: SEO_STATIC_LAST_MODIFIED,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
  ];

  try {
    const [saleListings, wantedListings, sellers, presetCounts] = await Promise.all([
      prisma.saleListing.findMany({
        where: {
          status: ListingStatus.PUBLISHED,
        },
        select: {
          id: true,
          updatedAt: true,
          media: {
            where: {
              kind: ListingMediaKind.GALLERY,
            },
            select: {
              publicUrl: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
            take: 10,
          },
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
          slug: true,
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
      Promise.all(
        saleSeoPresets.map(async (preset) => ({
          preset,
          count: await prisma.saleListing.count({
            where: getPresetWhere(preset.filter),
          }),
        }))
      ),
    ]);

    const presetRoutes = presetCounts
      .filter((entry) => entry.count >= 5)
      .map(({ preset }) => ({
        url: absoluteUrl(`/sale/${preset.slug}`),
        lastModified: SEO_STATIC_LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));

    return [
      ...staticEntries,
      ...presetRoutes,
      ...saleListings.map((listing) => ({
        url: absoluteUrl(`/listing/${listing.id}`),
        lastModified: listing.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        images: listing.media.map((media) => absoluteUrl(media.publicUrl)),
      })),
      ...wantedListings.map((listing) => ({
        url: absoluteUrl(`/wanted/${listing.slug ?? listing.id}`),
        lastModified: listing.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
      ...sellers.map((seller) => ({
        url: absoluteUrl(`/seller/${seller.id}`),
        lastModified: seller.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
