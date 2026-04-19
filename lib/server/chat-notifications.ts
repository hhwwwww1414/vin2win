import { AdminEntityType, ChatContextType, type User } from '@prisma/client';
import { hasVisibleChatPresence } from './chat-presence';
import { dispatchUserNotification } from './notification-dispatch';
import { prisma } from './prisma';

const CHAT_NOTIFICATION_TEXT_LIMIT = 180;

function truncateChatMessage(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= CHAT_NOTIFICATION_TEXT_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, CHAT_NOTIFICATION_TEXT_LIMIT - 1)}…`;
}

function getEntityTypeForChatContext(contextType: ChatContextType) {
  return contextType === ChatContextType.SALE_LISTING
    ? AdminEntityType.SALE_LISTING
    : AdminEntityType.WANTED_LISTING;
}

export interface CreateChatMessageNotificationInput {
  chatId: string;
  contextType: ChatContextType;
  listingId?: string;
  listingTitle: string;
  senderName: string;
  messageText: string;
  recipient: Pick<User, 'id' | 'browserPushEnabled' | 'chatPushEnabled'>;
}

export async function createChatMessageNotification(input: CreateChatMessageNotificationInput) {
  const excerpt = truncateChatMessage(input.messageText);
  const shouldSendBrowserPush =
    input.recipient.browserPushEnabled &&
    input.recipient.chatPushEnabled &&
    !(await hasVisibleChatPresence(input.recipient.id));

  const notification = await prisma.userNotification.create({
    data: {
      userId: input.recipient.id,
      type: 'CHAT_MESSAGE',
      entityType: getEntityTypeForChatContext(input.contextType),
      entityId: input.listingId ?? null,
      href: `/messages/${input.chatId}`,
      title: `Новое сообщение от ${input.senderName}`,
      message: `${input.listingTitle}\n${excerpt}`,
    },
  });

  if (shouldSendBrowserPush) {
    await dispatchUserNotification(notification.id, {
      email: false,
      telegram: false,
      browserPush: true,
    });
  }

  console.info('[chat] notification created', {
    chatId: input.chatId,
    recipientUserId: input.recipient.id,
    notificationId: notification.id,
  });

  return notification;
}
