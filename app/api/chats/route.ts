import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getChatErrorMessage, getChatErrorStatus } from '@/lib/server/chat-api-errors';
import { countUnreadChatMessagesForUser, listChatsForUser } from '@/lib/server/chats';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const [items, totalUnreadCount] = await Promise.all([
      listChatsForUser(currentUser.id),
      countUnreadChatMessagesForUser(currentUser.id),
    ]);

    return NextResponse.json(
      {
        items,
        totalUnreadCount,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = getChatErrorMessage(error, 'Не удалось загрузить список чатов.');
    return NextResponse.json({ error: message }, { status: getChatErrorStatus(message) });
  }
}
