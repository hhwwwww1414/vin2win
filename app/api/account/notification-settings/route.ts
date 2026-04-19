import { NextResponse } from 'next/server';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/server/account-notifications';
import { getSessionUser } from '@/lib/server/auth';

export const runtime = 'nodejs';

function parseBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function parseString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === 'string' ? value : undefined;
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const user = await updateNotificationSettings(currentUser.id, {
      emailNotificationsEnabled: parseBoolean(payload.emailNotificationsEnabled),
      telegramNotificationsEnabled: parseBoolean(payload.telegramNotificationsEnabled),
      browserPushEnabled: parseBoolean(payload.browserPushEnabled),
      chatSoundEnabled: parseBoolean(payload.chatSoundEnabled),
      chatPushEnabled: parseBoolean(payload.chatPushEnabled),
      telegramChatId: parseString(payload.telegramChatId),
    });

    return NextResponse.json(
      {
        ok: true,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        telegramNotificationsEnabled: user.telegramNotificationsEnabled,
        browserPushEnabled: user.browserPushEnabled,
        chatSoundEnabled: user.chatSoundEnabled,
        chatPushEnabled: user.chatPushEnabled,
        telegramChatId: user.telegramChatId,
        pushSubscriptionCount: user.pushSubscriptions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить настройки уведомлений.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const user = await getNotificationSettings(currentUser.id);

    return NextResponse.json(
      {
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        telegramNotificationsEnabled: user.telegramNotificationsEnabled,
        browserPushEnabled: user.browserPushEnabled,
        chatSoundEnabled: user.chatSoundEnabled,
        chatPushEnabled: user.chatPushEnabled,
        telegramChatId: user.telegramChatId,
        pushSubscriptionCount: user.pushSubscriptions.length,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось получить настройки уведомлений.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
