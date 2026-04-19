import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/auth';
import { countFavorites } from '@/lib/server/favorites';
import { countUnreadChatMessagesForUser } from '@/lib/server/chats';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 200 }
    );
  }

  const [favoriteCount, chatUnreadCount] = await Promise.all([
    countFavorites(session.user.id),
    countUnreadChatMessagesForUser(session.user.id),
  ]);

  return NextResponse.json(
    {
      authenticated: true,
      user: session.user,
      favoriteCount,
      chatUnreadCount,
      chatSoundEnabled: session.user.chatSoundEnabled,
      chatPushEnabled: session.user.chatPushEnabled,
      expiresAt: session.expiresAt.toISOString(),
    },
    { status: 200 }
  );
}
