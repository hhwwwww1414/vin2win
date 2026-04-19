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

test('notification settings persist chat sound and chat push flags', async (t) => {
  if (!hasDatabaseEnv()) {
    t.skip('Database environment is not configured.');
    return;
  }

  ensureServerEnv();

  const [{ prisma }, notificationsModule] = await Promise.all([
    import('../lib/server/prisma'),
    import('../lib/server/account-notifications'),
  ]);

  const { updateNotificationSettings } = notificationsModule;
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const user = await prisma.user.create({
    data: {
      email: `settings-chat-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Settings Chat User',
    },
  });

  try {
    const updated = await updateNotificationSettings(user.id, {
      chatSoundEnabled: false,
      chatPushEnabled: false,
    });

    assert.equal(updated.chatSoundEnabled, false);
    assert.equal(updated.chatPushEnabled, false);

    const persisted = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        chatSoundEnabled: true,
        chatPushEnabled: true,
      },
    });

    assert.equal(persisted?.chatSoundEnabled, false);
    assert.equal(persisted?.chatPushEnabled, false);
  } finally {
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });
  }
});

test('sending a chat message creates an in-app notification for the recipient', async (t) => {
  if (!hasDatabaseEnv()) {
    t.skip('Database environment is not configured.');
    return;
  }

  ensureServerEnv();

  const [{ prisma }, chatsModule] = await Promise.all([
    import('../lib/server/prisma'),
    import('../lib/server/chats'),
  ]);

  const { openOrCreateListingChat, sendChatMessage } = chatsModule;
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const seller = await prisma.user.create({
    data: {
      email: `notify-seller-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Notify Seller',
      browserPushEnabled: false,
      sellerProfile: {
        create: {
          name: 'Notify Seller',
          profileType: 'PERSON',
          verified: true,
          onPlatformSince: '2026',
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: `notify-buyer-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Notify Buyer',
      sellerProfile: {
        create: {
          name: 'Notify Buyer',
          profileType: 'PERSON',
          verified: false,
          onPlatformSince: '2026',
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });

  assert.ok(seller.sellerProfile);

  const listing = await prisma.saleListing.create({
    data: {
      make: 'Honda',
      model: 'CR-V',
      year: 2023,
      price: 3100000,
      city: 'Москва',
      bodyType: 'SUV',
      engine: 'Бензин',
      power: 193,
      transmission: 'АКПП',
      drive: 'Полный',
      mileage: 25000,
      owners: 1,
      paintedElements: [],
      paintCount: 0,
      wheelSet: false,
      extraTires: false,
      sellerType: 'OWNER',
      resourceStatus: 'NOT_LISTED',
      color: 'Серый',
      steering: 'Левый',
      description: 'Chat notification listing',
      sellerId: seller.sellerProfile.id,
      createdByUserId: seller.id,
      status: 'PUBLISHED',
      statusUpdatedAt: new Date(),
      publishedAt: new Date(),
      createdAt: new Date(),
    },
  });

  try {
    const chat = await openOrCreateListingChat({
      currentUserId: buyer.id,
      contextType: 'SALE_LISTING',
      listingId: listing.id,
    });

    await sendChatMessage({
      chatId: chat.id,
      senderId: buyer.id,
      text: 'Можно VIN и историю обслуживания?',
    });

    const notifications = await prisma.userNotification.findMany({
      where: {
        userId: seller.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    });

    assert.equal(notifications.length > 0, true);
    assert.equal(notifications[0]?.type, 'CHAT_MESSAGE');
    assert.equal(notifications[0]?.href, `/messages/${chat.id}`);
    assert.match(notifications[0]?.message ?? '', /VIN|истори/i);

    const buyerNotifications = await prisma.userNotification.count({
      where: {
        userId: buyer.id,
        type: 'CHAT_MESSAGE',
      },
    });

    assert.equal(buyerNotifications, 0);
  } finally {
    await prisma.userNotification.deleteMany({
      where: {
        userId: {
          in: [seller.id, buyer.id],
        },
        type: 'CHAT_MESSAGE',
      },
    });
    await prisma.chat.deleteMany({
      where: {
        saleListingId: listing.id,
      },
    });
    await prisma.saleListing.delete({
      where: {
        id: listing.id,
      },
    });
    await prisma.sellerProfile.deleteMany({
      where: {
        userId: {
          in: [seller.id, buyer.id],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [seller.id, buyer.id],
        },
      },
    });
  }
});
