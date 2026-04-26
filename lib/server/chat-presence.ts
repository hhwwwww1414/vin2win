import { prisma } from './prisma';
import { shouldRunChatPresenceCleanup } from './chat-presence-cleanup';

export const CHAT_PRESENCE_TTL_MS = 90_000;

function getPresenceCutoffDate() {
  return new Date(Date.now() - CHAT_PRESENCE_TTL_MS);
}

export interface UpsertChatPresenceInput {
  userId: string;
  clientId: string;
  activeChatId?: string | null;
  pathname?: string | null;
  visibilityState: string;
}

async function assertActiveChatAccess(userId: string, activeChatId?: string | null) {
  if (!activeChatId) {
    return;
  }

  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId: activeChatId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!participant) {
    throw new Error('Chat access denied.');
  }
}

export async function cleanupExpiredChatPresence() {
  return prisma.chatPresence.deleteMany({
    where: {
      lastHeartbeatAt: {
        lt: getPresenceCutoffDate(),
      },
    },
  });
}

export async function cleanupExpiredChatPresenceIfDue() {
  if (!shouldRunChatPresenceCleanup()) {
    return null;
  }

  return cleanupExpiredChatPresence();
}

export async function upsertChatPresence(input: UpsertChatPresenceInput) {
  await assertActiveChatAccess(input.userId, input.activeChatId);
  await cleanupExpiredChatPresenceIfDue();

  return prisma.chatPresence.upsert({
    where: {
      userId_clientId: {
        userId: input.userId,
        clientId: input.clientId,
      },
    },
    update: {
      activeChatId: input.activeChatId ?? null,
      pathname: input.pathname ?? null,
      visibilityState: input.visibilityState,
      lastHeartbeatAt: new Date(),
    },
    create: {
      userId: input.userId,
      clientId: input.clientId,
      activeChatId: input.activeChatId ?? null,
      pathname: input.pathname ?? null,
      visibilityState: input.visibilityState,
      lastHeartbeatAt: new Date(),
    },
  });
}

export async function removeChatPresence(userId: string, clientId: string) {
  return prisma.chatPresence.deleteMany({
    where: {
      userId,
      clientId,
    },
  });
}

export async function hasVisibleChatPresence(userId: string) {
  const count = await prisma.chatPresence.count({
    where: {
      userId,
      visibilityState: 'visible',
      lastHeartbeatAt: {
        gte: getPresenceCutoffDate(),
      },
    },
  });

  return count > 0;
}
