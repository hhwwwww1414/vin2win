import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getChatErrorMessage, getChatErrorStatus } from '@/lib/server/chat-api-errors';
import { getChatSummaryForUser } from '@/lib/server/chats';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const { id } = await context.params;
    const chat = await getChatSummaryForUser(id, currentUser.id);
    return NextResponse.json({ chat }, { status: 200 });
  } catch (error) {
    const message = getChatErrorMessage(error, 'Не удалось загрузить чат.');
    return NextResponse.json({ error: message }, { status: getChatErrorStatus(message) });
  }
}
