import { NextResponse } from 'next/server';
import { markAllUserNotificationsRead } from '@/lib/server/admin-activity';
import { getSessionUser } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const result = await markAllUserNotificationsRead(currentUser.id);
    return NextResponse.json({ ok: true, updated: result.count }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось отметить уведомления как прочитанные.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
