import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getChatErrorMessage, getChatErrorStatus } from '@/lib/server/chat-api-errors';
import { markChatRead } from '@/lib/server/chats';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const { id } = await context.params;
    const state = await markChatRead({
      chatId: id,
      userId: currentUser.id,
    });

    return NextResponse.json({ state }, { status: 200 });
  } catch (error) {
    const message = getChatErrorMessage(error, 'Не удалось отметить чат как прочитанный.');
    return NextResponse.json({ error: message }, { status: getChatErrorStatus(message) });
  }
}
