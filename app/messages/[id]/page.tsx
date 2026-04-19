import { ChatShell } from '@/components/messages/chat-shell';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { type ChatMessagesPageDto, type ChatSummaryDto } from '@/lib/chat/dto';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { getChatMessages, getChatSummaryForUser, listChatsForUser } from '@/lib/server/chats';

interface MessageThreadPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function MessageThreadPage({ params }: MessageThreadPageProps) {
  const currentUser = await requireAuthenticatedUser('/messages');
  const { id } = await params;
  const chats = await listChatsForUser(currentUser.id);

  let chat: ChatSummaryDto | null = null;
  let messagesPage: ChatMessagesPageDto = { items: [], nextCursor: undefined };
  let error: string | null = null;

  try {
    chat = await getChatSummaryForUser(id, currentUser.id);
    messagesPage = await getChatMessages({
      chatId: id,
      userId: currentUser.id,
      limit: 30,
    });
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : 'Чат не найден или недоступен.';
  }

  return (
    <div className="min-h-full bg-background">
      <MarketplaceHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ChatShell
          currentUserId={currentUser.id}
          initialChats={chats}
          initialChat={chat}
          initialMessages={messagesPage.items}
          initialNextCursor={messagesPage.nextCursor}
          initialError={error}
        />
      </main>
    </div>
  );
}
