import {
  AdminActionType,
  AdminEntityType,
  UserNotificationType,
  type Prisma,
} from '@prisma/client';
import { dispatchUserNotification } from './notification-dispatch';
import { prisma } from './prisma';

export interface CreateAdminActionLogInput {
  actorUserId?: string | null;
  targetUserId?: string | null;
  entityType: AdminEntityType;
  entityId: string;
  actionType: AdminActionType;
  title: string;
  description: string;
}

export interface CreateUserNotificationInput {
  userId: string;
  type: UserNotificationType;
  title: string;
  message: string;
  href?: string | null;
  entityType?: AdminEntityType | null;
  entityId?: string | null;
}

export async function createAdminActionLog(input: CreateAdminActionLogInput) {
  return prisma.adminActionLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      targetUserId: input.targetUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      actionType: input.actionType,
      title: input.title,
      description: input.description,
    },
  });
}

export async function createUserNotification(input: CreateUserNotificationInput) {
  const notification = await prisma.userNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    },
  });

  await dispatchUserNotification(notification.id);
  return notification;
}

export async function getRecentAdminActions(limit = 40) {
  return prisma.adminActionLog.findMany({
    include: {
      actorUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.userNotification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

export async function countUnreadUserNotifications(userId: string) {
  return prisma.userNotification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markUserNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.userNotification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Уведомление не найдено.');
  }

  if (notification.isRead) {
    return notification;
  }

  return prisma.userNotification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllUserNotificationsRead(userId: string) {
  return prisma.userNotification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export type RecentAdminAction = Prisma.AdminActionLogGetPayload<{
  include: {
    actorUser: {
      select: {
        id: true;
        name: true;
        email: true;
        role: true;
      };
    };
    targetUser: {
      select: {
        id: true;
        name: true;
        email: true;
        role: true;
        isActive: true;
      };
    };
  };
}>;

export type AccountNotification = Prisma.UserNotificationGetPayload<Prisma.UserNotificationDefaultArgs>;
