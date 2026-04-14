import { NextResponse } from 'next/server';
import { deletePushSubscription, savePushSubscription, updateNotificationSettings } from '@/lib/server/account-notifications';
import { getSessionUser } from '@/lib/server/auth';

export const runtime = 'nodejs';

function parseDate(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const payload = (await request.json()) as {
      endpoint?: string;
      expirationTime?: number | null;
      keys?: {
        p256dh?: string;
        auth?: string;
      };
    };

    if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
      return NextResponse.json({ error: 'Некорректные данные браузерной подписки.' }, { status: 400 });
    }

    await savePushSubscription({
      userId: currentUser.id,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
      expirationTime: parseDate(payload.expirationTime),
      userAgent: request.headers.get('user-agent'),
    });

    await updateNotificationSettings(currentUser.id, {
      browserPushEnabled: true,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить браузерную подписку.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const payload = (await request.json()) as {
      endpoint?: string;
    };

    if (!payload.endpoint) {
      return NextResponse.json({ error: 'Не указан адрес браузерной подписки.' }, { status: 400 });
    }

    await deletePushSubscription(currentUser.id, payload.endpoint);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось отключить браузерную подписку.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
