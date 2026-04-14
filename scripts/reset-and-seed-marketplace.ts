import './load-env';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  AvtotekaStatus,
  ListingMediaKind,
  ListingStatus,
  ProfileType,
  PtsType,
  ResourceStatus,
  SellerType,
} from '@prisma/client';
import { saleListings, wantedListings } from '../lib/marketplace-data';
import { prisma } from '../lib/server/prisma';
import { buildS3PublicUrl, clearS3Bucket, uploadToS3 } from '../lib/server/s3';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'application/pdf': '.pdf',
};

function sanitizePathSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function guessMimeTypeFromName(name: string): string {
  const extension = path.extname(name).toLowerCase();

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

function guessExtension(name: string, contentType?: string | null): string {
  const cleanName = name.split('?')[0];
  const extension = path.extname(cleanName).toLowerCase();
  if (extension) {
    return extension;
  }

  if (contentType) {
    const normalizedType = contentType.split(';')[0].trim().toLowerCase();
    return extensionByMimeType[normalizedType] ?? '';
  }

  return '';
}

async function loadAsset(source: string) {
  if (source.startsWith('/')) {
    const localPath = path.join(PUBLIC_DIR, source.slice(1));
    const buffer = await fs.readFile(localPath);
    const originalName = path.basename(localPath);

    return {
      buffer,
      originalName,
      contentType: guessMimeTypeFromName(originalName),
    };
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote asset: ${source} (${response.status})`);
  }

  const contentType = response.headers.get('content-type');
  const url = new URL(source);
  const originalName = path.basename(url.pathname) || 'asset';
  const arrayBuffer = await response.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    originalName,
    contentType: contentType ?? guessMimeTypeFromName(originalName),
  };
}

async function uploadSeedAsset(params: {
  listingId: string;
  kind: ListingMediaKind;
  source: string;
  sortOrder: number;
}) {
  const asset = await loadAsset(params.source);
  const extension = guessExtension(asset.originalName, asset.contentType) || '.bin';
  const objectKey = [
    'seed',
    'sale',
    sanitizePathSegment(params.listingId),
    params.kind.toLowerCase(),
    `${String(params.sortOrder).padStart(2, '0')}${extension}`,
  ].join('/');

  await uploadToS3({
    key: objectKey,
    body: asset.buffer,
    contentType: asset.contentType,
    cacheControl: 'public, max-age=31536000, immutable',
  });

  return {
    kind: params.kind,
    storageKey: objectKey,
    publicUrl: buildS3PublicUrl(objectKey),
    originalName: asset.originalName,
    mimeType: asset.contentType,
    sizeBytes: asset.buffer.length,
    sortOrder: params.sortOrder,
  };
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function mapSellerType(value: string): SellerType {
  switch (value) {
    case 'owner':
      return SellerType.OWNER;
    case 'flip':
      return SellerType.FLIP;
    case 'broker':
      return SellerType.BROKER;
    case 'commission':
      return SellerType.COMMISSION;
    default:
      return SellerType.OWNER;
  }
}

function mapResourceStatus(value: string): ResourceStatus {
  switch (value) {
    case 'on_resources':
      return ResourceStatus.ON_RESOURCES;
    case 'pre_resources':
      return ResourceStatus.PRE_RESOURCES;
    case 'not_listed':
    default:
      return ResourceStatus.NOT_LISTED;
  }
}

function mapPtsType(value?: string): PtsType | undefined {
  switch (value) {
    case 'original':
      return PtsType.ORIGINAL;
    case 'duplicate':
      return PtsType.DUPLICATE;
    case 'epts':
      return PtsType.EPTS;
    default:
      return undefined;
  }
}

function mapAvtotekaStatus(value?: string): AvtotekaStatus | undefined {
  switch (value) {
    case 'green':
      return AvtotekaStatus.GREEN;
    case 'yellow':
      return AvtotekaStatus.YELLOW;
    case 'red':
      return AvtotekaStatus.RED;
    case 'unknown':
      return AvtotekaStatus.UNKNOWN;
    default:
      return undefined;
  }
}

async function upsertSellerProfile(input: {
  legacyId: string;
  name: string;
  type: 'person' | 'company';
  verified: boolean;
  onPlatformSince: string;
  phone?: string;
}) {
  const existing = await prisma.sellerProfile.findUnique({
    where: {
      legacyId: input.legacyId,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.sellerProfile.create({
    data: {
      legacyId: input.legacyId,
      name: input.name,
      profileType: input.type === 'company' ? ProfileType.COMPANY : ProfileType.PERSON,
      verified: input.verified,
      onPlatformSince: input.onPlatformSince,
      phone: input.phone,
    },
  });
}

async function seedSaleListings() {
  for (const listing of saleListings) {
    const seller = await upsertSellerProfile({
      legacyId: listing.seller.id,
      name: listing.seller.name,
      type: listing.seller.type,
      verified: listing.seller.verified,
      onPlatformSince: listing.seller.onPlatformSince,
      phone: listing.seller.phone,
    });

    const galleryMedia = await Promise.all(
      listing.images.map((source, index) =>
        uploadSeedAsset({
          listingId: listing.id,
          kind: ListingMediaKind.GALLERY,
          source,
          sortOrder: index,
        })
      )
    );

    const interiorMedia = await Promise.all(
      (listing.interiorImages ?? []).map((source, index) =>
        uploadSeedAsset({
          listingId: listing.id,
          kind: ListingMediaKind.INTERIOR,
          source,
          sortOrder: index,
        })
      )
    );

    const videoMedia = listing.videoUrl
      ? [
          await uploadSeedAsset({
            listingId: listing.id,
            kind: ListingMediaKind.VIDEO,
            source: listing.videoUrl,
            sortOrder: 0,
          }),
        ]
      : [];

    const reportMedia = listing.reportUrl
      ? [
          await uploadSeedAsset({
            listingId: listing.id,
            kind: ListingMediaKind.REPORT,
            source: listing.reportUrl,
            sortOrder: 0,
          }),
        ]
      : [];

    await prisma.saleListing.create({
      data: {
        id: listing.id,
        legacyId: listing.id,
        status: ListingStatus.PUBLISHED,
        moderationNote: null,
        make: listing.make,
        model: listing.model,
        generation: listing.generation,
        year: listing.year,
        price: listing.price,
        priceInHand: listing.priceInHand,
        priceOnResources: listing.priceOnResources,
        city: listing.city,
        vin: listing.vin,
        engine: listing.engine,
        power: listing.power,
        transmission: listing.transmission,
        drive: listing.drive,
        bodyType: listing.bodyType,
        mileage: listing.mileage,
        owners: listing.owners,
        registrations: listing.registrations,
        ptsType: mapPtsType(listing.ptsType),
        ptsOriginal: listing.ptsOriginal,
        avtotekaStatus: mapAvtotekaStatus(listing.avtotekaStatus),
        paintedElements: listing.paintedElements ?? [],
        paintCount: listing.paintCount,
        accident: listing.accident,
        taxi: listing.taxi,
        carsharing: listing.carsharing,
        keysCount: listing.keysCount,
        conditionNote: listing.conditionNote,
        needsInvestment: listing.needsInvestment,
        glassOriginal: listing.glassOriginal,
        trade: listing.trade,
        kickback: listing.kickback,
        resourceStatus: mapResourceStatus(listing.resourceStatus),
        sellerType: mapSellerType(listing.sellerType),
        inspectionCity: listing.inspectionCity,
        color: listing.color,
        steering: listing.steering,
        trim: listing.trim,
        description: listing.description,
        viewCount: listing.viewCount,
        sellerId: seller.id,
        publishedAt: toDate(listing.createdAt),
        statusUpdatedAt: listing.updatedAt ? toDate(listing.updatedAt) : toDate(listing.createdAt),
        createdAt: toDate(listing.createdAt),
        updatedAt: listing.updatedAt ? toDate(listing.updatedAt) : toDate(listing.createdAt),
        media: {
          create: [...galleryMedia, ...interiorMedia, ...videoMedia, ...reportMedia].map((media) => ({
            kind: media.kind,
            storageKey: media.storageKey,
            publicUrl: media.publicUrl,
            originalName: media.originalName,
            mimeType: media.mimeType,
            sizeBytes: media.sizeBytes,
            sortOrder: media.sortOrder,
          })),
        },
      },
    });

    console.log(`Seeded sale listing ${listing.id}`);
  }
}

async function seedWantedListings() {
  for (const listing of wantedListings) {
    const author = await upsertSellerProfile({
      legacyId: listing.author.id,
      name: listing.author.name,
      type: listing.author.type,
      verified: listing.author.verified,
      onPlatformSince: listing.author.onPlatformSince,
      phone: listing.author.phone,
    });

    await prisma.wantedListing.create({
      data: {
        id: listing.id,
        legacyId: listing.id,
        status: ListingStatus.PUBLISHED,
        moderationNote: null,
        models: listing.models,
        budgetMin: listing.budgetMin,
        budgetMax: listing.budgetMax,
        yearFrom: listing.yearFrom,
        mileageMax: listing.mileageMax,
        engine: listing.engine,
        transmission: listing.transmission,
        drive: listing.drive,
        ownersMax: listing.ownersMax,
        paintAllowed: listing.paintAllowed,
        restrictions: listing.restrictions ?? [],
        region: listing.region,
        comment: listing.comment,
        contact: listing.contact,
        authorId: author.id,
        publishedAt: toDate(listing.createdAt),
        statusUpdatedAt: toDate(listing.createdAt),
        createdAt: toDate(listing.createdAt),
        updatedAt: toDate(listing.createdAt),
      },
    });

    console.log(`Seeded wanted listing ${listing.id}`);
  }
}

async function main() {
  console.log('Clearing S3 bucket...');
  const deletedObjects = await clearS3Bucket();
  console.log(`Deleted ${deletedObjects} object(s) from S3.`);

  console.log('Seeding marketplace data...');
  await seedSaleListings();
  await seedWantedListings();

  console.log('Seed complete.');
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
