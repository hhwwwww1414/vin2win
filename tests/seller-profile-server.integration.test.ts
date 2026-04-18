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

test('updateAccountSellerProfile updates seller profile fields and syncs user identity', async (t) => {
  if (!hasDatabaseEnv()) {
    t.skip('Database environment is not configured.');
    return;
  }

  ensureServerEnv();

  const [{ prisma }, { updateAccountSellerProfile }] = await Promise.all([
    import('@/lib/server/prisma'),
    import('@/lib/server/auth'),
  ]);

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const user = await prisma.user.create({
    data: {
      email: `seller-profile-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Old Name',
      phone: '+7 900 000-00-00',
      sellerProfile: {
        create: {
          name: 'Old Name',
          profileType: 'PERSON',
          verified: false,
          onPlatformSince: '2026',
          phone: '+7 900 000-00-00',
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });

  assert.ok(user.sellerProfile, 'expected seller profile for integration test setup');

  try {
    const updated = await updateAccountSellerProfile(user.id, {
      name: 'UnextAuto',
      phone: '+7 999 123-45-67',
      about: 'Честные сделки и точное описание каждого автомобиля.',
      avatarUrl: 'https://cdn.example.com/seller/avatar.jpg',
      avatarStorageKey: 'uploads/seller-profiles/test/avatar.jpg',
      coverUrl: 'https://cdn.example.com/seller/cover.jpg',
      coverStorageKey: 'uploads/seller-profiles/test/cover.jpg',
      avatarCropX: 62,
      avatarCropY: 38,
      avatarZoom: 1.4,
      coverCropX: 49,
      coverCropY: 31,
    });

    assert.equal(updated.sellerProfile.name, 'UnextAuto');
    assert.equal(updated.sellerProfile.phone, '+7 999 123-45-67');
    assert.equal(updated.sellerProfile.about, 'Честные сделки и точное описание каждого автомобиля.');
    assert.equal(updated.sellerProfile.avatarUrl, 'https://cdn.example.com/seller/avatar.jpg');
    assert.equal(updated.sellerProfile.coverUrl, 'https://cdn.example.com/seller/cover.jpg');
    assert.equal(updated.sellerProfile.avatarCropX, 62);
    assert.equal(updated.sellerProfile.avatarCropY, 38);
    assert.equal(updated.sellerProfile.avatarZoom, 1.4);
    assert.equal(updated.sellerProfile.coverCropX, 49);
    assert.equal(updated.sellerProfile.coverCropY, 31);

    const persistedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        sellerProfile: true,
      },
    });

    assert.ok(persistedUser?.sellerProfile);
    assert.equal(persistedUser.name, 'UnextAuto');
    assert.equal(persistedUser.phone, '+7 999 123-45-67');
    assert.equal(persistedUser.sellerProfile.name, 'UnextAuto');
    assert.equal(persistedUser.sellerProfile.phone, '+7 999 123-45-67');
    assert.equal(persistedUser.sellerProfile.about, 'Честные сделки и точное описание каждого автомобиля.');
  } finally {
    await prisma.sellerProfile.deleteMany({
      where: {
        userId: user.id,
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: user.id,
      },
    });
  }
});
