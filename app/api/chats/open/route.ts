import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getChatErrorMessage, getChatErrorStatus } from '@/lib/server/chat-api-errors';
import { openOrCreateListingChat } from '@/lib/server/chats';

export const runtime = 'nodejs';

function isSupportedContextType(value: unknown): value is 'SALE_LISTING' | 'WANTED_LISTING' {
  return value === 'SALE_LISTING' || value === 'WANTED_LISTING';
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const contextType = payload.contextType;
    const listingId = typeof payload.listingId === 'string' ? payload.listingId.trim() : '';

    if (!isSupportedContextType(contextType) || !listingId) {
      return NextResponse.json({ error: 'Некорректный контекст чата.' }, { status: 400 });
    }

    const chat = await openOrCreateListingChat({
      currentUserId: currentUser.id,
      contextType,
      listingId,
    });

    return NextResponse.json({ chat }, { status: 200 });
  } catch (error) {
    const message = getChatErrorMessage(error, 'Не удалось открыть чат.');
    return NextResponse.json({ error: message }, { status: getChatErrorStatus(message) });
  }
}
