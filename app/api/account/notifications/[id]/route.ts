import { NextResponse } from 'next/server';
import { markUserNotificationRead } from '@/lib/server/admin-activity';
import { getSessionUser } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function PATCH(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const { id } = await context.params;
    const notification = await markUserNotificationRead(currentUser.id, id);
    return NextResponse.json({ ok: true, id: notification.id, isRead: notification.isRead }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить уведомление.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
