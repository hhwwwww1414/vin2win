import nodemailer from 'nodemailer';
import webpush, { type PushSubscription } from 'web-push';
import { prisma } from './prisma';
import { serverEnv } from './env';

export interface DispatchUserNotificationOptions {
  email?: boolean;
  telegram?: boolean;
  browserPush?: boolean;
}

let transporter: nodemailer.Transporter | null | undefined;
let vapidConfigured = false;

function getEmailTransporter() {
  if (transporter !== undefined) {
    return transporter;
  }

  if (!serverEnv.smtpHost || !serverEnv.smtpPort || !serverEnv.smtpFrom) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: serverEnv.smtpHost,
    port: serverEnv.smtpPort,
    secure: serverEnv.smtpSecure,
    auth:
      serverEnv.smtpUser && serverEnv.smtpPassword
        ? {
            user: serverEnv.smtpUser,
            pass: serverEnv.smtpPassword,
          }
        : undefined,
  });

  return transporter;
}

function ensureWebPushConfigured() {
  if (vapidConfigured) {
    return true;
  }

  if (!serverEnv.vapidPublicKey || !serverEnv.vapidPrivateKey || !serverEnv.vapidSubject) {
    return false;
  }

  webpush.setVapidDetails(serverEnv.vapidSubject, serverEnv.vapidPublicKey, serverEnv.vapidPrivateKey);
  vapidConfigured = true;
  return true;
}

async function sendEmailNotification(input: {
  email: string;
  title: string;
  message: string;
  href?: string | null;
}) {
  const emailTransporter = getEmailTransporter();
  if (!emailTransporter || !serverEnv.smtpFrom) {
    return;
  }

  const hrefLine = input.href ? `<p><a href="${input.href}">Открыть уведомление</a></p>` : '';

  await emailTransporter.sendMail({
    from: serverEnv.smtpFrom,
    to: input.email,
    subject: input.title,
    text: [input.title, '', input.message, input.href ? `Ссылка: ${input.href}` : ''].filter(Boolean).join('\n'),
    html: `<div><h2>${input.title}</h2><p>${input.message}</p>${hrefLine}</div>`,
  });
}

async function sendTelegramMessage(chatId: string, text: string) {
  if (!serverEnv.telegramBotToken) {
    return;
  }

  const response = await fetch(`${serverEnv.telegramApiBase}/bot${serverEnv.telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram API returned ${response.status}.`);
  }
}

async function sendBrowserPushNotification(input: {
  userId: string;
  notificationId: string;
  subscriptions: Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }>;
  title: string;
  message: string;
  href?: string | null;
  tag?: string;
  requireInteraction?: boolean;
}) {
  if (!ensureWebPushConfigured()) {
    console.warn('[notifications] browser push skipped: VAPID is not configured');
    return;
  }

  await Promise.all(
    input.subscriptions.map(async (subscription) => {
      const payload = JSON.stringify({
        notificationId: input.notificationId,
        title: input.title,
        body: input.message,
        href: input.href,
        tag: input.tag ?? `vin2win:${input.notificationId}`,
        requireInteraction: input.requireInteraction ?? true,
        timestamp: Date.now(),
      });

      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        await prisma.pushSubscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            lastSuccessAt: new Date(),
          },
        });
        console.info('[notifications] browser push delivered', {
          notificationId: input.notificationId,
          userId: input.userId,
          subscriptionId: subscription.id,
        });
      } catch (error) {
        const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: number }).statusCode) : undefined;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: {
              id: subscription.id,
            },
          }).catch(() => undefined);
          console.warn('[notifications] browser push subscription removed', {
            notificationId: input.notificationId,
            userId: input.userId,
            subscriptionId: subscription.id,
            statusCode,
          });
          return;
        }

        throw error;
      }
    })
  );
}

export async function dispatchUserNotification(
  notificationId: string,
  options: DispatchUserNotificationOptions = {},
) {
  const notification = await prisma.userNotification.findUnique({
    where: {
      id: notificationId,
    },
    include: {
      user: {
        include: {
          pushSubscriptions: true,
        },
      },
    },
  });

  if (!notification) {
    return;
  }

  const absoluteHref =
    notification.href && process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '')}${notification.href}`
      : notification.href;

  const tasks: Promise<unknown>[] = [];

  const shouldSendEmail = options.email ?? notification.user.emailNotificationsEnabled;
  const shouldSendTelegram = options.telegram ?? notification.user.telegramNotificationsEnabled;
  const shouldSendBrowserPush = options.browserPush ?? notification.user.browserPushEnabled;

  if (shouldSendEmail) {
    tasks.push(
      sendEmailNotification({
        email: notification.user.email,
        title: notification.title,
        message: notification.message,
        href: absoluteHref,
      })
    );
  }

  if (shouldSendTelegram && notification.user.telegramChatId) {
    tasks.push(
      sendTelegramMessage(
        notification.user.telegramChatId,
        [notification.title, notification.message, absoluteHref ? `Ссылка: ${absoluteHref}` : ''].filter(Boolean).join('\n')
      )
    );
  } else if (serverEnv.telegramDefaultChatId) {
    tasks.push(
      sendTelegramMessage(
        serverEnv.telegramDefaultChatId,
        `[${notification.user.email}]\n${notification.title}\n${notification.message}${absoluteHref ? `\n${absoluteHref}` : ''}`
      )
    );
  }

  if (shouldSendBrowserPush && notification.user.pushSubscriptions.length > 0) {
    tasks.push(
      sendBrowserPushNotification({
        userId: notification.user.id,
        notificationId: notification.id,
        subscriptions: notification.user.pushSubscriptions.map((subscription) => ({
          id: subscription.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        })),
        title: notification.title,
        message: notification.message,
        href: notification.href,
        tag: `notification:${notification.id}`,
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[notifications] delivery failed', result.reason);
    }
  }
}

export async function dispatchTestBrowserPush(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      pushSubscriptions: true,
    },
  });

  if (!user) {
    throw new Error('Пользователь не найден.');
  }

  if (!user.browserPushEnabled) {
    throw new Error('Браузерные уведомления отключены для этого аккаунта.');
  }

  if (!user.pushSubscriptions.length) {
    throw new Error('Для этого аккаунта нет активных браузерных подписок.');
  }

  await sendBrowserPushNotification({
    userId: user.id,
    notificationId: `test:${user.id}:${Date.now()}`,
    subscriptions: user.pushSubscriptions.map((subscription) => ({
      id: subscription.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    })),
    title: 'Контрольное уведомление vin2win',
    message: 'Тестовое уведомление vin2win доставлено.',
    href: '/account',
    tag: `test:${user.id}`,
    requireInteraction: true,
  });
}
