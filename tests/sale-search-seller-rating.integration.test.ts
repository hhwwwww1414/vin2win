import test from 'node:test';
import assert from 'node:assert/strict';

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

function ensureServerEnv() {
  process.env.S3_ENDPOINT ??= 'https://example.com';
  process.env.S3_BUCKET ??= 'test-bucket';
  process.env.S3_ACCESS_KEY ??= 'test-access-key';
  process.env.S3_SECRET_KEY ??= 'test-secret-key';
  process.env.S3_PUBLIC_URL ??= 'https://cdn.example.com';
}

test('sale search includes seller review metrics for listing cards', async (t) => {
  if (!hasDatabaseEnv()) {
    t.skip('Database environment is not configured.');
    return;
  }

  ensureServerEnv();

  const [{ prisma }, { searchPublishedSaleListings }] = await Promise.all([
    import('@/lib/server/prisma'),
    import('@/lib/server/marketplace'),
  ]);

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const make = `Rating Test ${stamp}`;

  const sellerUser = await prisma.user.create({
    data: {
      email: `sale-search-seller-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Rated Seller',
      phone: '+7 900 000-20-01',
      sellerProfile: {
        create: {
          name: 'Rated Seller',
          profileType: 'PERSON',
          verified: true,
          onPlatformSince: '2026',
          phone: '+7 900 000-20-01',
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });

  assert.ok(sellerUser.sellerProfile);

  const authorUser = await prisma.user.create({
    data: {
      email: `sale-search-author-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Review Author',
    },
  });

  const now = new Date();

  const listing = await prisma.saleListing.create({
    data: {
      make,
      model: 'Signal Coupe',
      year: 2024,
      price: 3200000,
      city: 'Москва',
      bodyType: 'Купе',
      engine: 'Бензин',
      power: 320,
      transmission: 'АКПП',
      drive: 'Полный',
      mileage: 12000,
      steering: 'Левый',
      color: 'Зеленый',
      owners: 1,
      paintedElements: [],
      paintCount: 0,
      taxi: false,
      carsharing: false,
      wheelSet: false,
      extraTires: false,
      sellerType: 'OWNER',
      resourceStatus: 'ON_RESOURCES',
      description: 'Search metrics listing',
      sellerId: sellerUser.sellerProfile.id,
      createdByUserId: sellerUser.id,
      status: 'PUBLISHED',
      statusUpdatedAt: now,
      publishedAt: now,
      createdAt: now,
      priceHistory: {
        create: {
          price: 3200000,
          createdAt: now,
        },
      },
      media: {
        create: {
          kind: 'GALLERY',
          storageKey: `uploads/tests/${stamp}/gallery.jpg`,
          publicUrl: `https://cdn.example.com/${stamp}/gallery.jpg`,
          originalName: 'gallery.jpg',
          sortOrder: 0,
        },
      },
    },
  });

  const review = await prisma.sellerReview.create({
    data: {
      sellerProfileId: sellerUser.sellerProfile.id,
      authorUserId: authorUser.id,
      rating: 5,
      text: 'Очень аккуратная коммуникация и честное описание автомобиля.',
      status: 'PUBLISHED',
    },
  });

  try {
    const result = await searchPublishedSaleListings({
      make: [make],
      page: 1,
      limit: 12,
    });
    const item = result.items.find((candidate) => candidate.id === listing.id);

    assert.ok(item, 'expected the created listing to be present in the search result');
    assert.equal(item?.seller.averageRating, 5);
    assert.equal(item?.seller.reviewCount, 1);
  } finally {
    await prisma.sellerReview.deleteMany({ where: { id: review.id } });
    await prisma.priceHistory.deleteMany({ where: { saleListingId: listing.id } });
    await prisma.listingMedia.deleteMany({ where: { saleListingId: listing.id } });
    await prisma.saleListing.deleteMany({ where: { id: listing.id } });
    await prisma.sellerProfile.deleteMany({ where: { id: sellerUser.sellerProfile.id } });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [sellerUser.id, authorUser.id],
        },
      },
    });
  }
});
