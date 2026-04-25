import type { Metadata } from 'next';
import { ChatShell } from '@/components/messages/chat-shell';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { requireAuthenticatedUser } from '@/lib/server/auth';
import { listChatsForUser } from '@/lib/server/chats';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Сообщения',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MessagesPage() {
  const currentUser = await requireAuthenticatedUser('/messages');
  const chats = await listChatsForUser(currentUser.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-0 py-0 sm:px-6 sm:py-6 lg:px-8">
        <ChatShell currentUserId={currentUser.id} initialChats={chats} />
      </main>
    </div>
  );
}
