import { ChatShell } from '@/components/messages/chat-shell';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { listChatsForUser } from '@/lib/server/chats';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const currentUser = await requireAuthenticatedUser('/messages');
  const chats = await listChatsForUser(currentUser.id);

  return (
    <div className="min-h-full bg-background">
      <MarketplaceHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ChatShell currentUserId={currentUser.id} initialChats={chats} />
      </main>
    </div>
  );
}
