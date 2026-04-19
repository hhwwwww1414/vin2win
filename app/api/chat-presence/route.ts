import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getChatErrorMessage, getChatErrorStatus } from '@/lib/server/chat-api-errors';
import { removeChatPresence, upsertChatPresence } from '@/lib/server/chat-presence';

export const runtime = 'nodejs';

function parseString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const clientId = parseString(payload.clientId);
    const visibilityState = parseString(payload.visibilityState) ?? 'visible';

    if (!clientId) {
      return NextResponse.json({ error: 'Не указан clientId.' }, { status: 400 });
    }

    await upsertChatPresence({
      userId: currentUser.id,
      clientId,
      activeChatId: parseString(payload.activeChatId) ?? null,
      pathname: parseString(payload.pathname) ?? null,
      visibilityState,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = getChatErrorMessage(error, 'Не удалось обновить присутствие чата.');
    return NextResponse.json({ error: message }, { status: getChatErrorStatus(message) });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId')?.trim();
    if (!clientId) {
      return NextResponse.json({ error: 'Не указан clientId.' }, { status: 400 });
    }

    await removeChatPresence(currentUser.id, clientId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = getChatErrorMessage(error, 'Не удалось снять присутствие чата.');
    return NextResponse.json({ error: message }, { status: getChatErrorStatus(message) });
  }
}
