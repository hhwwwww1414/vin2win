import { NextResponse } from 'next/server';
import { attachSessionCookie, authenticateWithTelegram, resolveNextPath, type TelegramAuthPayload } from '@/lib/server/auth';

export const runtime = 'nodejs';

function parsePayload(value: unknown): TelegramAuthPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('Telegram payload is missing.');
  }

  return value as TelegramAuthPayload;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as
      | {
          telegram?: TelegramAuthPayload;
          nextPath?: string;
        }
      | null;

    const telegram = parsePayload(payload?.telegram);
    const nextPath = resolveNextPath(payload?.nextPath, '/account');
    const user = await authenticateWithTelegram(telegram);
    const response = NextResponse.json(
      {
        ok: true,
        nextPath,
        user,
      },
      { status: 200 }
    );

    await attachSessionCookie(response, user.id);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить вход через Telegram.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
