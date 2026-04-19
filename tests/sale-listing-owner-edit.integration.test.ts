import test from 'node:test';
import assert from 'node:assert/strict';
import { ListingStatus } from '@prisma/client';

function hasDatabaseEnv() {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.POSTGRESQL_HOST &&
        process.env.POSTGRESQL_PORT &&
        process.env.POSTGRESQL_USER &&
        process.env.POSTGRESQL_PASSWORD &&
        process.env.POSTGRESQL_DBNAME)
  );
}

test('owner sale listing loader exposes moderation context and update flow returns listing to moderation with media sync', async (t) => {
  if (!hasDatabaseEnv()) {
    t.skip('Database environment is not configured.');
    return;
  }

  const [{ prisma }, marketplaceModule] = await Promise.all([
    import('../lib/server/prisma'),
    import('../lib/server/marketplace'),
  ]);

  const { getEditableSaleListingForOwner, updateSaleListingByOwner } = marketplaceModule;

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const owner = await prisma.user.create({
    data: {
      email: `sale-edit-owner-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Owner Edit',
      phone: '+7 900 000-10-01',
      sellerProfile: {
        create: {
          name: 'Owner Edit',
          profileType: 'PERSON',
          verified: true,
          onPlatformSince: '2026',
          phone: '+7 900 000-10-01',
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });

  assert.ok(owner.sellerProfile);

  const now = new Date();

  const listing = await prisma.saleListing.create({
    data: {
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      price: 2100000,
      city: 'Москва',
      bodyType: 'Седан',
      engine: 'Бензин',
      power: 181,
      transmission: 'АКПП',
      drive: 'Передний',
      mileage: 47000,
      steering: 'Левый',
      color: 'Белый',
      owners: 1,
      paintedElements: ['Капот'],
      paintCount: 1,
      taxi: false,
      carsharing: false,
      wheelSet: true,
      extraTires: false,
      sellerType: 'BROKER',
      resourceStatus: 'NOT_LISTED',
      description: 'Original description',
      sellerId: owner.sellerProfile.id,
      createdByUserId: owner.id,
      status: 'PUBLISHED',
      moderationNote: 'Need clearer photos',
      statusUpdatedAt: now,
      publishedAt: now,
      createdAt: now,
      priceHistory: {
        create: {
          price: 2100000,
          createdAt: now,
        },
      },
      media: {
        create: [
          {
            kind: 'GALLERY',
            storageKey: `uploads/tests/${stamp}/gallery-1.jpg`,
            publicUrl: `https://cdn.example.com/${stamp}/gallery-1.jpg`,
            originalName: 'gallery-1.jpg',
            sortOrder: 0,
          },
          {
            kind: 'GALLERY',
            storageKey: `uploads/tests/${stamp}/gallery-2.jpg`,
            publicUrl: `https://cdn.example.com/${stamp}/gallery-2.jpg`,
            originalName: 'gallery-2.jpg',
            sortOrder: 1,
          },
          {
            kind: 'VIDEO',
            storageKey: `uploads/tests/${stamp}/video-1.mp4`,
            publicUrl: `https://cdn.example.com/${stamp}/video-1.mp4`,
            originalName: 'video-1.mp4',
            sortOrder: 0,
          },
        ],
      },
    },
    include: {
      media: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  try {
    const editable = await getEditableSaleListingForOwner({
      listingId: listing.id,
      currentUserId: owner.id,
    });
    const editableMedia = editable.media ?? [];

    assert.equal(editable.status, 'PUBLISHED');
    assert.equal(editable.moderationNote, 'Need clearer photos');
    assert.equal(editableMedia.length, 3);
    assert.equal(editableMedia[0]?.kind, 'GALLERY');
    assert.equal(editableMedia[2]?.kind, 'VIDEO');

    const firstGallery = listing.media.find((item) => item.kind === 'GALLERY' && item.sortOrder === 0);
    const secondGallery = listing.media.find((item) => item.kind === 'GALLERY' && item.sortOrder === 1);
    const existingVideo = listing.media.find((item) => item.kind === 'VIDEO');

    assert.ok(firstGallery);
    assert.ok(secondGallery);
    assert.ok(existingVideo);

    const firstUpdate = await updateSaleListingByOwner({
      listingId: listing.id,
      currentUserId: owner.id,
      targetStatus: 'PENDING',
      values: {
        sellerName: 'Owner Edit Updated',
        contact: '+7 900 000-10-02',
        make: 'Toyota',
        catalogBrandId: undefined,
        model: 'Camry',
        catalogModelId: undefined,
        generation: '',
        catalogGenerationId: undefined,
        year: 2022,
        vin: 'JTNB11HK902000001',
        city: 'Москва',
        plateNumber: 'А123АА',
        plateRegion: '777',
        plateUnregistered: false,
        price: 2200000,
        priceInHand: undefined,
        priceOnResources: undefined,
        bodyType: 'Седан',
        catalogBodyTypeId: undefined,
        engine: 'Бензин',
        catalogFuelTypeId: undefined,
        engineDisplacementL: 2.5,
        catalogEngineId: undefined,
        power: 181,
        transmission: 'АКПП',
        catalogTransmissionId: undefined,
        drive: 'Передний',
        catalogDriveTypeId: undefined,
        catalogModificationId: undefined,
        mileage: 48000,
        steering: 'Левый',
        color: 'Черный',
        trim: 'Prestige',
        catalogTrimId: undefined,
        owners: 1,
        registrations: 1,
        keysCount: 2,
        ptsType: 'original',
        paintCount: 1,
        paintedElements: ['Капот'],
        taxi: false,
        carsharing: false,
        avtotekaStatus: 'green',
        wheelSet: true,
        extraTires: false,
        glassOriginal: true,
        noInvestment: true,
        investmentNote: '',
        sellerType: 'broker',
        resourceStatus: 'not_listed',
        description: 'Updated description',
        videoUrlExternal: 'https://example.com/walkaround',
      },
      mediaPlan: {
        gallery: [
          {
            source: 'existing',
            kind: 'GALLERY',
            mediaId: secondGallery.id,
            clientId: 'existing-2',
          },
          {
            source: 'new',
            kind: 'GALLERY',
            uploadId: 'new-gallery-1',
            clientId: 'new-gallery-1',
          },
        ],
        video: null,
      },
      uploadedMedia: [
        {
          uploadId: 'new-gallery-1',
          kind: 'gallery',
          storageKey: `uploads/tests/${stamp}/gallery-new.jpg`,
          publicUrl: `https://cdn.example.com/${stamp}/gallery-new.jpg`,
          originalName: 'gallery-new.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 12345,
        },
      ],
    });

    assert.equal(firstUpdate.listing.status, ListingStatus.PENDING);
    assert.equal(firstUpdate.listing.moderationNote, null);
    assert.equal(firstUpdate.listing.publishedAt, null);
    assert.deepEqual(
      [...firstUpdate.removedStorageKeys].sort(),
      [
        `uploads/tests/${stamp}/gallery-1.jpg`,
        `uploads/tests/${stamp}/video-1.mp4`,
      ],
    );

    const updatedListing = await prisma.saleListing.findUnique({
      where: { id: listing.id },
      include: {
        media: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        priceHistory: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    assert.ok(updatedListing);
    assert.equal(updatedListing.status, 'PENDING');
    assert.equal(updatedListing.moderationNote, null);
    assert.equal(updatedListing.publishedAt, null);
    assert.equal(updatedListing.description, 'Updated description');
    assert.equal(updatedListing.price, 2200000);
    assert.equal(updatedListing.media.length, 2);
    assert.equal(updatedListing.media[0]?.id, secondGallery.id);
    assert.equal(updatedListing.media[0]?.sortOrder, 0);
    assert.equal(updatedListing.media[1]?.storageKey, `uploads/tests/${stamp}/gallery-new.jpg`);
    assert.equal(updatedListing.priceHistory.length, 2);
    assert.equal(updatedListing.priceHistory.at(-1)?.price, 2200000);

    const secondUpdate = await updateSaleListingByOwner({
      listingId: listing.id,
      currentUserId: owner.id,
      targetStatus: 'DRAFT',
      values: {
        sellerName: 'Owner Edit Updated',
        contact: '+7 900 000-10-02',
        make: 'Toyota',
        catalogBrandId: undefined,
        model: 'Camry',
        catalogModelId: undefined,
        generation: '',
        catalogGenerationId: undefined,
        year: 2022,
        vin: 'JTNB11HK902000001',
        city: 'Москва',
        plateNumber: 'А123АА',
        plateRegion: '777',
        plateUnregistered: false,
        price: 2200000,
        priceInHand: undefined,
        priceOnResources: undefined,
        bodyType: 'Седан',
        catalogBodyTypeId: undefined,
        engine: 'Бензин',
        catalogFuelTypeId: undefined,
        engineDisplacementL: 2.5,
        catalogEngineId: undefined,
        power: 181,
        transmission: 'АКПП',
        catalogTransmissionId: undefined,
        drive: 'Передний',
        catalogDriveTypeId: undefined,
        catalogModificationId: undefined,
        mileage: 48000,
        steering: 'Левый',
        color: 'Черный',
        trim: 'Prestige',
        catalogTrimId: undefined,
        owners: 1,
        registrations: 1,
        keysCount: 2,
        ptsType: 'original',
        paintCount: 1,
        paintedElements: ['Капот'],
        taxi: false,
        carsharing: false,
        avtotekaStatus: 'green',
        wheelSet: true,
        extraTires: false,
        glassOriginal: true,
        noInvestment: true,
        investmentNote: '',
        sellerType: 'broker',
        resourceStatus: 'not_listed',
        description: 'Draft description',
        videoUrlExternal: 'https://example.com/walkaround',
      },
      mediaPlan: {
        gallery: updatedListing.media.map((item, index) => ({
          source: 'existing' as const,
          kind: 'GALLERY' as const,
          mediaId: item.id,
          clientId: `existing-after-${index}`,
        })),
        video: null,
      },
      uploadedMedia: [],
    });

    assert.equal(secondUpdate.listing.status, ListingStatus.DRAFT);
    assert.deepEqual(secondUpdate.removedStorageKeys, []);

    const priceHistoryAfterSecondUpdate = await prisma.priceHistory.findMany({
      where: {
        saleListingId: listing.id,
      },
    });

    assert.equal(priceHistoryAfterSecondUpdate.length, 2);
  } finally {
    await prisma.priceHistory.deleteMany({ where: { saleListingId: listing.id } });
    await prisma.listingMedia.deleteMany({ where: { saleListingId: listing.id } });
    await prisma.saleListing.delete({ where: { id: listing.id } });
    await prisma.sellerProfile.delete({ where: { id: owner.sellerProfile.id } });
    await prisma.user.delete({ where: { id: owner.id } });
  }
});
