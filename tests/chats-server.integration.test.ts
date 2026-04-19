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

test('chat service keeps one chat per buyer seller and listing while separating different listings', async (t) => {
  if (!hasDatabaseEnv()) {
    t.skip('Database environment is not configured.');
    return;
  }

  ensureServerEnv();

  const [{ prisma }, chatsModule] = await Promise.all([
    import('../lib/server/prisma'),
    import('../lib/server/chats'),
  ]);

  const {
    openOrCreateListingChat,
    sendChatMessage,
    listChatsForUser,
    markChatRead,
    getChatMessages,
  } = chatsModule;

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const seller = await prisma.user.create({
    data: {
      email: `seller-chat-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Seller Chat',
      phone: '+7 900 000-00-01',
      sellerProfile: {
        create: {
          name: 'Seller Chat',
          profileType: 'PERSON',
          verified: true,
          onPlatformSince: '2026',
          phone: '+7 900 000-00-01',
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: `buyer-chat-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Buyer Chat',
      phone: '+7 900 000-00-02',
      sellerProfile: {
        create: {
          name: 'Buyer Chat',
          profileType: 'PERSON',
          verified: false,
          onPlatformSince: '2026',
          phone: '+7 900 000-00-02',
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });

  const intruder = await prisma.user.create({
    data: {
      email: `intruder-chat-${stamp}@example.com`,
      passwordHash: 'test-password-hash',
      name: 'Intruder Chat',
      phone: '+7 900 000-00-03',
      sellerProfile: {
        create: {
          name: 'Intruder Chat',
          profileType: 'PERSON',
          verified: false,
          onPlatformSince: '2026',
          phone: '+7 900 000-00-03',
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });

  assert.ok(seller.sellerProfile);

  const now = new Date();

  const listingA = await prisma.saleListing.create({
    data: {
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      price: 2500000,
      city: 'Москва',
      bodyType: 'Седан',
      engine: 'Бензин',
      power: 200,
      transmission: 'АКПП',
      drive: 'Передний',
      mileage: 50000,
      owners: 1,
      paintedElements: [],
      paintCount: 0,
      wheelSet: false,
      extraTires: false,
      sellerType: 'OWNER',
      resourceStatus: 'NOT_LISTED',
      color: 'Белый',
      steering: 'Левый',
      description: 'Chat listing A',
      sellerId: seller.sellerProfile.id,
      createdByUserId: seller.id,
      status: 'PUBLISHED',
      statusUpdatedAt: now,
      publishedAt: now,
      createdAt: now,
    },
  });

  const listingB = await prisma.saleListing.create({
    data: {
      make: 'BMW',
      model: 'X5',
      year: 2021,
      price: 5200000,
      city: 'Москва',
      bodyType: 'SUV',
      engine: 'Бензин',
      power: 340,
      transmission: 'АКПП',
      drive: 'Полный',
      mileage: 60000,
      owners: 2,
      paintedElements: [],
      paintCount: 1,
      wheelSet: false,
      extraTires: false,
      sellerType: 'OWNER',
      resourceStatus: 'NOT_LISTED',
      color: 'Черный',
      steering: 'Левый',
      description: 'Chat listing B',
      sellerId: seller.sellerProfile.id,
      createdByUserId: seller.id,
      status: 'PUBLISHED',
      statusUpdatedAt: now,
      publishedAt: now,
      createdAt: now,
    },
  });

  try {
    const firstOpen = await openOrCreateListingChat({
      currentUserId: buyer.id,
      contextType: 'SALE_LISTING',
      listingId: listingA.id,
    });

    const secondOpen = await openOrCreateListingChat({
      currentUserId: buyer.id,
      contextType: 'SALE_LISTING',
      listingId: listingA.id,
    });

    const thirdOpen = await openOrCreateListingChat({
      currentUserId: buyer.id,
      contextType: 'SALE_LISTING',
      listingId: listingB.id,
    });

    assert.equal(firstOpen.id, secondOpen.id);
    assert.notEqual(firstOpen.id, thirdOpen.id);
    assert.equal(firstOpen.listing.id, listingA.id);
    assert.equal(firstOpen.listing.title, 'Toyota Camry 2022');

    const firstMessage = await sendChatMessage({
      chatId: firstOpen.id,
      senderId: buyer.id,
      text: 'Здравствуйте, актуально?',
    });

    assert.equal(firstMessage.text, 'Здравствуйте, актуально?');

    const sellerChats = await listChatsForUser(seller.id);
    assert.equal(sellerChats.length, 2);
    assert.equal(sellerChats[0]?.id, firstOpen.id);
    assert.equal(sellerChats[0]?.unreadCount, 1);
    assert.equal(sellerChats[0]?.lastMessage?.text, 'Здравствуйте, актуально?');

    const sellerMessages = await getChatMessages({
      chatId: firstOpen.id,
      userId: seller.id,
      limit: 20,
    });

    assert.equal(sellerMessages.items.length, 1);
    assert.equal(sellerMessages.items[0]?.id, firstMessage.id);

    const readState = await markChatRead({
      chatId: firstOpen.id,
      userId: seller.id,
    });

    assert.equal(readState.unreadCount, 0);

    const sellerChatsAfterRead = await listChatsForUser(seller.id);
    assert.equal(sellerChatsAfterRead[0]?.unreadCount, 0);

    await assert.rejects(
      () =>
        getChatMessages({
          chatId: firstOpen.id,
          userId: intruder.id,
          limit: 20,
        }),
      /доступ|access|participant/i,
    );
  } finally {
    await prisma.chat.deleteMany({
      where: {
        saleListingId: {
          in: [listingA.id, listingB.id],
        },
      },
    });
    await prisma.saleListing.deleteMany({
      where: {
        id: {
          in: [listingA.id, listingB.id],
        },
      },
    });
    await prisma.sellerProfile.deleteMany({
      where: {
        userId: {
          in: [seller.id, buyer.id, intruder.id],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [seller.id, buyer.id, intruder.id],
        },
      },
    });
  }
});
