import {
  ChatContextType,
  ChatMessageType,
  ListingMediaKind,
  Prisma,
  type ListingStatus,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { createChatMessageNotification } from './chat-notifications';
import { publishChatEvent } from './chat-realtime';
import { prisma } from './prisma';

const MAX_CHAT_MESSAGE_LENGTH = 4_000;
const CHAT_FLOOD_LIMIT = 20;
const CHAT_FLOOD_WINDOW_MS = 60_000;

type SupportedChatContextType = 'SALE_LISTING' | 'WANTED_LISTING';

const chatSummaryInclude = {
  participants: {
    include: {
      user: {
        include: {
          sellerProfile: true,
        },
      },
    },
  },
  lastMessage: true,
} satisfies Prisma.ChatInclude;

type ChatSummaryRecord = Prisma.ChatGetPayload<{
  include: typeof chatSummaryInclude;
}>;

export interface ChatCounterparty {
  id: string;
  name: string;
  avatarUrl?: string;
  sellerProfileId?: string;
  verified: boolean;
}

export interface ChatListingSnapshot {
  id: string;
  type: SupportedChatContextType;
  title: string;
  price?: number;
  imageUrl?: string;
  status?: ListingStatus;
}

export interface ChatMessageItem {
  id: string;
  chatId: string;
  senderId: string;
  messageType: 'TEXT';
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSummary {
  id: string;
  contextType: SupportedChatContextType;
  listing: ChatListingSnapshot;
  counterparty: ChatCounterparty;
  unreadCount: number;
  counterpartyLastReadMessageId?: string;
  lastMessageAt: string;
  lastMessage?: ChatMessageItem;
}

export interface ChatMessagesPage {
  items: ChatMessageItem[];
  nextCursor?: string;
}

export interface OpenOrCreateListingChatInput {
  currentUserId: string;
  contextType: SupportedChatContextType;
  listingId: string;
}

export interface SendChatMessageInput {
  chatId: string;
  senderId: string;
  text: string;
}

export interface GetChatMessagesInput {
  chatId: string;
  userId: string;
  limit?: number;
  before?: string;
  after?: string;
}

export interface MarkChatReadInput {
  chatId: string;
  userId: string;
}

export interface ChatReadState {
  chatId: string;
  userId: string;
  unreadCount: number;
  lastReadAt?: string;
  lastReadMessageId?: string;
}

function buildContextKey(contextType: SupportedChatContextType, listingId: string) {
  return `${contextType}:${listingId}`;
}

function normalizeParticipantPair(leftUserId: string, rightUserId: string) {
  return leftUserId.localeCompare(rightUserId) <= 0
    ? {
        participantLowUserId: leftUserId,
        participantHighUserId: rightUserId,
      }
    : {
        participantLowUserId: rightUserId,
        participantHighUserId: leftUserId,
      };
}

function mapMessage(record: {
  id: string;
  chatId: string;
  senderId: string;
  messageType: ChatMessageType;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}): ChatMessageItem {
  return {
    id: record.id,
    chatId: record.chatId,
    senderId: record.senderId,
    messageType: 'TEXT',
    text: record.text,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapChatSummary(record: ChatSummaryRecord, currentUserId: string): ChatSummary {
  const currentParticipant = record.participants.find((participant) => participant.userId === currentUserId);
  const counterpartyParticipant =
    record.participants.find((participant) => participant.userId !== currentUserId) ?? currentParticipant;

  if (!currentParticipant || !counterpartyParticipant) {
    throw new Error('Chat participant state is invalid.');
  }

  const counterpartyUser = counterpartyParticipant.user;

  return {
    id: record.id,
    contextType: record.contextType,
    listing: {
      id: record.saleListingId ?? record.wantedListingId ?? '',
      type: record.contextType,
      title: record.titleSnapshot,
      price: record.priceSnapshot ?? undefined,
      imageUrl: record.imageSnapshot ?? undefined,
      status: record.statusSnapshot ?? undefined,
    },
    counterparty: {
      id: counterpartyUser.id,
      name: counterpartyUser.name,
      avatarUrl:
        counterpartyUser.sellerProfile?.avatarUrl ??
        counterpartyUser.telegramAvatarUrl ??
        undefined,
      sellerProfileId: counterpartyUser.sellerProfile?.id ?? undefined,
      verified: counterpartyUser.sellerProfile?.verified ?? false,
    },
    unreadCount: currentParticipant.unreadCount,
    counterpartyLastReadMessageId: counterpartyParticipant.lastReadMessageId ?? undefined,
    lastMessageAt: record.lastMessageAt.toISOString(),
    lastMessage: record.lastMessage ? mapMessage(record.lastMessage) : undefined,
  };
}

async function getChatRecordForUser(chatId: string, userId: string) {
  const record = await prisma.chat.findFirst({
    where: {
      id: chatId,
      participants: {
        some: {
          userId,
        },
      },
    },
    include: chatSummaryInclude,
  });

  if (!record) {
    throw new Error('Chat access denied.');
  }

  return record;
}

function getChatListingId(record: Pick<ChatSummaryRecord, 'saleListingId' | 'wantedListingId'>) {
  return record.saleListingId ?? record.wantedListingId ?? undefined;
}

async function ensureMessageFloodLimit(senderId: string) {
  const windowStart = new Date(Date.now() - CHAT_FLOOD_WINDOW_MS);
  const count = await prisma.chatMessage.count({
    where: {
      senderId,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  if (count >= CHAT_FLOOD_LIMIT) {
    throw new Error('Chat message rate limit exceeded.');
  }
}

async function findExistingChat(input: {
  contextKey: string;
  participantLowUserId: string;
  participantHighUserId: string;
}) {
  return prisma.chat.findUnique({
    where: {
      contextKey_participantLowUserId_participantHighUserId: {
        contextKey: input.contextKey,
        participantLowUserId: input.participantLowUserId,
        participantHighUserId: input.participantHighUserId,
      },
    },
    include: chatSummaryInclude,
  });
}

async function createSaleListingChat(input: OpenOrCreateListingChatInput) {
  const listing = await prisma.saleListing.findUnique({
    where: {
      id: input.listingId,
    },
    include: {
      seller: true,
      media: {
        where: {
          kind: ListingMediaKind.GALLERY,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        take: 1,
      },
    },
  });

  if (!listing || !listing.createdByUserId) {
    throw new Error('Listing not found.');
  }

  if (listing.createdByUserId === input.currentUserId) {
    throw new Error('You cannot open a chat with yourself.');
  }

  const participantPair = normalizeParticipantPair(input.currentUserId, listing.createdByUserId);
  const contextKey = buildContextKey(input.contextType, input.listingId);
  const existing = await findExistingChat({
    contextKey,
    ...participantPair,
  });

  if (existing) {
    return existing;
  }

  try {
    return await prisma.chat.create({
      data: {
        contextType: ChatContextType.SALE_LISTING,
        contextKey,
        saleListingId: listing.id,
        participantLowUserId: participantPair.participantLowUserId,
        participantHighUserId: participantPair.participantHighUserId,
        createdByUserId: input.currentUserId,
        titleSnapshot: `${listing.make} ${listing.model} ${listing.year}`.trim(),
        priceSnapshot: listing.price,
        imageSnapshot: listing.media[0]?.publicUrl ?? null,
        statusSnapshot: listing.status,
        participants: {
          create: [
            {
              userId: input.currentUserId,
            },
            {
              userId: listing.createdByUserId,
            },
          ],
        },
      },
      include: chatSummaryInclude,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      const collision = await findExistingChat({
        contextKey,
        ...participantPair,
      });
      if (collision) {
        return collision;
      }
    }

    throw error;
  }
}

async function createWantedListingChat(input: OpenOrCreateListingChatInput) {
  const listing = await prisma.wantedListing.findUnique({
    where: {
      id: input.listingId,
    },
  });

  if (!listing || !listing.createdByUserId) {
    throw new Error('Listing not found.');
  }

  if (listing.createdByUserId === input.currentUserId) {
    throw new Error('You cannot open a chat with yourself.');
  }

  const participantPair = normalizeParticipantPair(input.currentUserId, listing.createdByUserId);
  const contextKey = buildContextKey(input.contextType, input.listingId);
  const existing = await findExistingChat({
    contextKey,
    ...participantPair,
  });

  if (existing) {
    return existing;
  }

  try {
    return await prisma.chat.create({
      data: {
        contextType: ChatContextType.WANTED_LISTING,
        contextKey,
        wantedListingId: listing.id,
        participantLowUserId: participantPair.participantLowUserId,
        participantHighUserId: participantPair.participantHighUserId,
        createdByUserId: input.currentUserId,
        titleSnapshot: listing.models.join(', ') || 'Wanted listing',
        priceSnapshot: listing.budgetMax,
        imageSnapshot: null,
        statusSnapshot: listing.status,
        participants: {
          create: [
            {
              userId: input.currentUserId,
            },
            {
              userId: listing.createdByUserId,
            },
          ],
        },
      },
      include: chatSummaryInclude,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      const collision = await findExistingChat({
        contextKey,
        ...participantPair,
      });
      if (collision) {
        return collision;
      }
    }

    throw error;
  }
}

export async function openOrCreateListingChat(
  input: OpenOrCreateListingChatInput,
): Promise<ChatSummary> {
  const record =
    input.contextType === 'SALE_LISTING'
      ? await createSaleListingChat(input)
      : await createWantedListingChat(input);

  return mapChatSummary(record, input.currentUserId);
}

export async function listChatsForUser(userId: string): Promise<ChatSummary[]> {
  const records = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          userId,
        },
      },
    },
    include: chatSummaryInclude,
    orderBy: [
      {
        lastMessageAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });

  return records.map((record) => mapChatSummary(record, userId));
}

export async function getChatSummaryForUser(chatId: string, userId: string): Promise<ChatSummary> {
  const record = await getChatRecordForUser(chatId, userId);
  return mapChatSummary(record, userId);
}

export async function getChatMessages(
  input: GetChatMessagesInput,
): Promise<ChatMessagesPage> {
  await getChatRecordForUser(input.chatId, input.userId);

  const take = Math.min(Math.max(input.limit ?? 30, 1), 100);
  let beforeCreatedAt: Date | undefined;
  let afterCreatedAt: Date | undefined;

  if (input.before) {
    const cursor = await prisma.chatMessage.findUnique({
      where: {
        id: input.before,
      },
      select: {
        createdAt: true,
      },
    });

    beforeCreatedAt = cursor?.createdAt;
  }

  if (input.after) {
    const cursor = await prisma.chatMessage.findUnique({
      where: {
        id: input.after,
      },
      select: {
        createdAt: true,
      },
    });

    afterCreatedAt = cursor?.createdAt;
  }

  const records = await prisma.chatMessage.findMany({
    where: {
      chatId: input.chatId,
      deletedAt: null,
      createdAt:
        beforeCreatedAt || afterCreatedAt
          ? {
              ...(beforeCreatedAt ? { lt: beforeCreatedAt } : {}),
              ...(afterCreatedAt ? { gt: afterCreatedAt } : {}),
            }
          : undefined,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: take + 1,
  });

  const hasMore = records.length > take;
  const items = records.slice(0, take).reverse().map(mapMessage);

  return {
    items,
    nextCursor: hasMore ? records[take - 1]?.id : undefined,
  };
}

export async function sendChatMessage(
  input: SendChatMessageInput,
): Promise<ChatMessageItem> {
  const text = input.text.trim();

  if (!text) {
    throw new Error('Chat message text is required.');
  }

  if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
    throw new Error('Chat message is too long.');
  }

  await ensureMessageFloodLimit(input.senderId);
  const chatRecord = await getChatRecordForUser(input.chatId, input.senderId);

  const created = await prisma.$transaction(async (tx) => {
    const message = await tx.chatMessage.create({
      data: {
        chatId: input.chatId,
        senderId: input.senderId,
        messageType: ChatMessageType.TEXT,
        text,
      },
    });

    await tx.chat.update({
      where: {
        id: input.chatId,
      },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
      },
    });

    await tx.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId: input.chatId,
          userId: input.senderId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: message.createdAt,
        lastReadMessageId: message.id,
      },
    });

    await tx.chatParticipant.updateMany({
      where: {
        chatId: input.chatId,
        userId: {
          not: input.senderId,
        },
      },
      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });

    return message;
  });

  const sender = chatRecord.participants.find((participant) => participant.userId === input.senderId);

  if (!sender) {
    throw new Error('Chat sender state is invalid.');
  }

  const recipients = chatRecord.participants.filter((participant) => participant.userId !== input.senderId);
  await Promise.all(
    recipients.map((participant) =>
      createChatMessageNotification({
        chatId: chatRecord.id,
        contextType: chatRecord.contextType,
        listingId: getChatListingId(chatRecord),
        listingTitle: chatRecord.titleSnapshot,
        senderName: sender.user.name,
        messageText: created.text,
        recipient: participant.user,
      })
    )
  );

  const unreadCounts = await Promise.all(
    chatRecord.participants.map(async (participant) => ({
      userId: participant.userId,
      totalUnreadCount: await countUnreadChatMessagesForUser(participant.userId),
    }))
  );

  await Promise.all(
    chatRecord.participants.flatMap((participant) => {
      const unreadPayload = unreadCounts.find((item) => item.userId === participant.userId);

      return [
        publishChatEvent(participant.userId, 'chat.message.created', {
          chatId: chatRecord.id,
          senderId: input.senderId,
          message: mapMessage(created),
        }),
        publishChatEvent(participant.userId, 'chat.list.updated', {
          chatId: chatRecord.id,
        }),
        publishChatEvent(participant.userId, 'chat.unread.updated', {
          chatId: chatRecord.id,
          totalUnreadCount: unreadPayload?.totalUnreadCount ?? 0,
        }),
      ];
    }),
  );

  return mapMessage(created);
}

export async function markChatRead(input: MarkChatReadInput): Promise<ChatReadState> {
  const record = await getChatRecordForUser(input.chatId, input.userId);
  const currentParticipant = record.participants.find((participant) => participant.userId === input.userId);

  if (!currentParticipant) {
    throw new Error('Chat access denied.');
  }

  if (
    currentParticipant.unreadCount === 0 &&
    currentParticipant.lastReadMessageId === record.lastMessageId
  ) {
    return {
      chatId: currentParticipant.chatId,
      userId: currentParticipant.userId,
      unreadCount: currentParticipant.unreadCount,
      lastReadAt: currentParticipant.lastReadAt?.toISOString(),
      lastReadMessageId: currentParticipant.lastReadMessageId ?? undefined,
    };
  }

  const now = new Date();
  const updated = await prisma.chatParticipant.update({
    where: {
      chatId_userId: {
        chatId: input.chatId,
        userId: input.userId,
      },
    },
    data: {
      unreadCount: 0,
      lastReadAt: now,
      lastReadMessageId: record.lastMessageId,
    },
  });

  const state = {
    chatId: updated.chatId,
    userId: updated.userId,
    unreadCount: updated.unreadCount,
    lastReadAt: updated.lastReadAt?.toISOString(),
    lastReadMessageId: updated.lastReadMessageId ?? undefined,
  };

  const totalUnreadCount = await countUnreadChatMessagesForUser(input.userId);
  await Promise.all([
    publishChatEvent(input.userId, 'chat.read.updated', state),
    publishChatEvent(input.userId, 'chat.list.updated', {
      chatId: updated.chatId,
    }),
    publishChatEvent(input.userId, 'chat.unread.updated', {
      chatId: updated.chatId,
      totalUnreadCount,
    }),
  ]);

  const counterparty = record.participants.find((participant) => participant.userId !== input.userId);
  if (counterparty) {
    await publishChatEvent(counterparty.userId, 'chat.read.updated', {
      ...state,
      readerUserId: input.userId,
    });
  }

  return state;
}

export async function countUnreadChatMessagesForUser(userId: string): Promise<number> {
  const result = await prisma.chatParticipant.aggregate({
    where: {
      userId,
    },
    _sum: {
      unreadCount: true,
    },
  });

  return result._sum.unreadCount ?? 0;
}
