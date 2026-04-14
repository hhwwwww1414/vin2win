import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { dispatchTestBrowserPush } from '@/lib/server/notification-dispatch';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    await dispatchTestBrowserPush(currentUser.id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось отправить контрольное уведомление.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
