import { prisma } from './prisma';

export interface UpdateNotificationSettingsInput {
  emailNotificationsEnabled?: boolean;
  telegramNotificationsEnabled?: boolean;
  browserPushEnabled?: boolean;
  chatSoundEnabled?: boolean;
  chatPushEnabled?: boolean;
  telegramChatId?: string | null;
}

function normalizeChatId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function updateNotificationSettings(userId: string, input: UpdateNotificationSettingsInput) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      emailNotificationsEnabled: input.emailNotificationsEnabled,
      telegramNotificationsEnabled: input.telegramNotificationsEnabled,
      browserPushEnabled: input.browserPushEnabled,
      chatSoundEnabled: input.chatSoundEnabled,
      chatPushEnabled: input.chatPushEnabled,
      telegramChatId: input.telegramChatId !== undefined ? normalizeChatId(input.telegramChatId) : undefined,
    },
    include: {
      pushSubscriptions: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

export async function getNotificationSettings(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    include: {
      pushSubscriptions: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

export async function savePushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime?: Date | null;
  userAgent?: string | null;
}) {
  return prisma.pushSubscription.upsert({
    where: {
      endpoint: input.endpoint,
    },
    update: {
      userId: input.userId,
      p256dh: input.p256dh,
      auth: input.auth,
      expirationTime: input.expirationTime ?? null,
      userAgent: input.userAgent ?? null,
    },
    create: {
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      expirationTime: input.expirationTime ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  return prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint,
    },
  });
}
