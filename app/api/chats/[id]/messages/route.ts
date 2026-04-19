import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getChatErrorMessage, getChatErrorStatus } from '@/lib/server/chat-api-errors';
import { getChatMessages, sendChatMessage } from '@/lib/server/chats';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const { id } = await context.params;
    const url = new URL(request.url);
    const items = await getChatMessages({
      chatId: id,
      userId: currentUser.id,
      before: url.searchParams.get('before') ?? undefined,
      limit: parsePositiveInteger(url.searchParams.get('limit'), 30),
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    const message = getChatErrorMessage(error, 'Не удалось загрузить сообщения.');
    return NextResponse.json({ error: message }, { status: getChatErrorStatus(message) });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const text = typeof payload.text === 'string' ? payload.text : '';

    const item = await sendChatMessage({
      chatId: id,
      senderId: currentUser.id,
      text,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = getChatErrorMessage(error, 'Не удалось отправить сообщение.');
    return NextResponse.json({ error: message }, { status: getChatErrorStatus(message) });
  }
}
