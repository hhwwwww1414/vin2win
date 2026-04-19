'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface OpenChatButtonProps {
  contextType: 'SALE_LISTING' | 'WANTED_LISTING';
  listingId: string;
  currentUserId?: string;
  ownerUserId?: string;
  nextPath?: string;
  variant?: 'default' | 'outline';
  className?: string;
}

export function OpenChatButton({
  contextType,
  listingId,
  currentUserId,
  ownerUserId,
  nextPath,
  variant = 'outline',
  className,
}: OpenChatButtonProps) {
  const [pending, setPending] = useState(false);

  if (currentUserId && ownerUserId && currentUserId === ownerUserId) {
    return null;
  }

  if (!currentUserId) {
    return (
      <Button asChild variant={variant} className={className}>
        <Link href={`/login?next=${encodeURIComponent(nextPath || '/messages')}`}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Написать
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);

        try {
          const response = await fetch('/api/chats/open', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contextType,
              listingId,
            }),
          });

          const payload = (await response.json()) as { error?: string; chat?: { id: string } };
          if (!response.ok || !payload.chat?.id) {
            throw new Error(payload.error ?? 'Не удалось открыть чат.');
          }

          window.location.href = `/messages/${payload.chat.id}`;
        } catch (error) {
          toast({
            title: 'Чат не открыт',
            description: error instanceof Error ? error.message : 'Не удалось открыть диалог.',
            variant: 'destructive',
          });
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
      Написать
    </Button>
  );
}
