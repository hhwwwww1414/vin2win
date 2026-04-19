'use client';

import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Loader2, MessageCircle, Send, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Textarea } from '@/components/ui/textarea';
import { ChatPushSetup } from '@/components/messages/chat-push-setup';
import { useChatEvents } from '@/hooks/use-chat-events';
import { type ChatMessageDto, type ChatSummaryDto } from '@/lib/chat/dto';
import { cn } from '@/lib/utils';

interface ChatShellProps {
  currentUserId: string;
  initialChats: ChatSummaryDto[];
  initialChat?: ChatSummaryDto | null;
  initialMessages?: ChatMessageDto[];
  initialNextCursor?: string;
  initialError?: string | null;
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatListTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat(
    'ru-RU',
    sameDay
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit' },
  ).format(date);
}

function formatPrice(value?: number) {
  if (!value) {
    return null;
  }

  return `${value.toLocaleString('ru-RU')} ₽`;
}

function getListingHref(chat: ChatSummaryDto) {
  return chat.listing.type === 'SALE_LISTING' ? `/listing/${chat.listing.id}` : `/wanted/${chat.listing.id}`;
}

function getAvatarFallback(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'V2';
}

function normalizeIncomingMessage(value: unknown): ChatMessageDto | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.chatId !== 'string' ||
    typeof candidate.senderId !== 'string' ||
    typeof candidate.text !== 'string' ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    chatId: candidate.chatId,
    senderId: candidate.senderId,
    messageType: 'TEXT',
    text: candidate.text,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

function ChatListItem({
  chat,
  hydrated,
  selected,
}: {
  chat: ChatSummaryDto;
  hydrated: boolean;
  selected: boolean;
}) {
  return (
    <Link
      href={`/messages/${chat.id}`}
      className={cn(
        'group block rounded-[24px] border p-3 transition-colors',
        selected
          ? 'border-teal-accent/35 bg-[var(--accent-bg-soft)]'
          : 'border-border/70 bg-background/60 hover:border-teal-accent/20 hover:bg-background/80',
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 border border-border/70">
          <AvatarImage src={chat.counterparty.avatarUrl} alt={chat.counterparty.name} />
          <AvatarFallback>{getAvatarFallback(chat.counterparty.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground">{chat.counterparty.name}</p>
                {chat.counterparty.verified ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-accent" /> : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{chat.listing.title}</p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground" suppressHydrationWarning>
              {hydrated ? formatListTime(chat.lastMessageAt) : ''}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-[56px_minmax(0,1fr)] gap-3">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
              {chat.listing.imageUrl ? (
                <Image src={chat.listing.imageUrl} alt={chat.listing.title} width={56} height={56} unoptimized className="h-14 w-14 object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center text-[10px] text-muted-foreground">Нет фото</div>
              )}
            </div>
            <div className="min-w-0">
              {chat.listing.price ? <p className="text-xs font-medium text-foreground">{formatPrice(chat.listing.price)}</p> : null}
              <div className="mt-1 flex items-start justify-between gap-3">
                <p className="line-clamp-2 min-w-0 text-xs leading-5 text-muted-foreground">
                  {chat.lastMessage?.text ?? 'Диалог создан. Можно написать первым сообщением.'}
                </p>
                {chat.unreadCount > 0 ? (
                  <span className="shrink-0 rounded-full border border-teal-accent/30 bg-[var(--accent-bg-soft)] px-2 py-0.5 text-[11px] font-semibold text-teal-accent">
                    {chat.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ChatShell({
  currentUserId,
  initialChats,
  initialChat = null,
  initialMessages = [],
  initialNextCursor,
  initialError = null,
}: ChatShellProps) {
  const [chats, setChats] = useState(initialChats);
  const [currentChat, setCurrentChat] = useState<ChatSummaryDto | null>(initialChat);
  const [messages, setMessages] = useState<ChatMessageDto[]>(initialMessages);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(initialError);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastMessageCountRef = useRef(initialMessages.length);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  useEffect(() => {
    setCurrentChat(initialChat ?? null);
    setMessages(initialMessages);
    setNextCursor(initialNextCursor);
    setThreadError(initialError);
    lastMessageCountRef.current = initialMessages.length;
  }, [initialChat, initialError, initialMessages, initialNextCursor]);

  const currentChatId = currentChat?.id;
  const latestMessageId = messages[messages.length - 1]?.id;
  const sortedChats = useMemo(
    () =>
      [...chats].sort((left, right) => {
        return new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime();
      }),
    [chats],
  );

  const refreshChats = useCallback(async () => {
    const response = await fetch('/api/chats', {
      cache: 'no-store',
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { items?: ChatSummaryDto[] };
    setChats(payload.items ?? []);
    if (!currentChatId) {
      return;
    }

    const freshCurrentChat = (payload.items ?? []).find((item) => item.id === currentChatId);
    if (freshCurrentChat) {
      setCurrentChat(freshCurrentChat);
    }
  }, [currentChatId]);

  const markCurrentChatRead = useCallback(async () => {
    if (!currentChatId) {
      return;
    }

    await fetch(`/api/chats/${currentChatId}/read`, {
      method: 'POST',
    }).catch(() => undefined);

    setChats((current) =>
      current.map((chat) => (chat.id === currentChatId ? { ...chat, unreadCount: 0 } : chat)),
    );
    setCurrentChat((current) => (current ? { ...current, unreadCount: 0 } : current));
  }, [currentChatId]);

  const refreshCurrentThread = useCallback(async () => {
    if (!currentChatId) {
      return;
    }

    const params = new URLSearchParams();
    params.set('limit', '40');
    if (latestMessageId) {
      params.set('after', latestMessageId);
    }

    const response = await fetch(`/api/chats/${currentChatId}/messages?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { items?: ChatMessageDto[]; nextCursor?: string };
    const newItems = payload.items ?? [];
    if (newItems.length === 0) {
      return;
    }

    setMessages((current) => {
      const seenIds = new Set(current.map((item) => item.id));
      const appended = newItems.filter((item) => !seenIds.has(item.id));
      return appended.length ? [...current, ...appended] : current;
    });

    if (typeof payload.nextCursor === 'string') {
      setNextCursor((current) => current ?? payload.nextCursor);
    }

    if (newItems.some((item) => item.senderId !== currentUserId)) {
      void markCurrentChatRead();
    }
  }, [currentChatId, currentUserId, latestMessageId, markCurrentChatRead]);

  useEffect(() => {
    if (!currentChatId) {
      return;
    }

    void markCurrentChatRead();
  }, [currentChatId, markCurrentChatRead]);

  useEffect(() => {
    const runRefresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      void refreshChats();
      void refreshCurrentThread();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runRefresh();
      }
    };

    runRefresh();
    const intervalId = window.setInterval(runRefresh, currentChatId ? 4_000 : 6_000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentChatId, refreshChats, refreshCurrentThread]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const shouldStickToBottom =
      messages.length <= lastMessageCountRef.current ||
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 140;

    if (shouldStickToBottom) {
      requestAnimationFrame(() => {
        viewport.scrollTop = viewport.scrollHeight;
      });
    }

    lastMessageCountRef.current = messages.length;
  }, [messages, currentChatId]);

  useChatEvents(
    useCallback(
      (event) => {
        const eventChatId = typeof event.payload.chatId === 'string' ? event.payload.chatId : null;

        if (event.type === 'chat.list.updated' || event.type === 'chat.unread.updated') {
          void refreshChats();
        }

        if (!currentChatId || eventChatId !== currentChatId) {
          return;
        }

        if (event.type === 'chat.message.created') {
          const incoming = normalizeIncomingMessage(event.payload.message);
          if (!incoming) {
            void refreshChats();
            return;
          }

          setMessages((current) => (current.some((item) => item.id === incoming.id) ? current : [...current, incoming]));

          if (incoming.senderId !== currentUserId) {
            void markCurrentChatRead();
          }
        }

        if (event.type === 'chat.read.updated') {
          void refreshChats();
        }
      },
      [currentChatId, currentUserId, markCurrentChatRead, refreshChats],
    ),
  );

  const handleLoadMore = useCallback(async () => {
    if (!currentChatId || !nextCursor) {
      return;
    }

    setLoadingMore(true);
    try {
      const response = await fetch(`/api/chats/${currentChatId}/messages?before=${encodeURIComponent(nextCursor)}`, {
        cache: 'no-store',
      });

      const payload = (await response.json()) as { items?: ChatMessageDto[]; nextCursor?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Не удалось загрузить историю сообщений.');
      }

      setMessages((current) => {
        const seenIds = new Set(current.map((item) => item.id));
        const nextItems = (payload.items ?? []).filter((item) => !seenIds.has(item.id));
        return [...nextItems, ...current];
      });
      setNextCursor(payload.nextCursor);
    } catch (error) {
      setThreadError(error instanceof Error ? error.message : 'Не удалось загрузить историю сообщений.');
    } finally {
      setLoadingMore(false);
    }
  }, [currentChatId, nextCursor]);

  const handleSend = useCallback(async () => {
    if (!currentChatId || sending) {
      return;
    }

    const text = draft.trim();
    if (!text) {
      return;
    }

    setSending(true);
    setThreadError(null);

    try {
      const response = await fetch(`/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const payload = (await response.json()) as { item?: ChatMessageDto; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? 'Не удалось отправить сообщение.');
      }

      const sentMessage = payload.item;

      setDraft('');
      setMessages((current) => (current.some((item) => item.id === sentMessage.id) ? current : [...current, sentMessage]));
      void refreshChats();
    } catch (error) {
      setThreadError(error instanceof Error ? error.message : 'Не удалось отправить сообщение.');
    } finally {
      setSending(false);
    }
  }, [currentChatId, draft, refreshChats, sending]);

  const handleComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  return (
    <>
      <ChatPushSetup />
      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className={cn('min-w-0', currentChat ? 'hidden lg:block' : 'block')}>
        <div className="rounded-[32px] border border-border/70 bg-card/92 p-4 shadow-[0_18px_48px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
          <div className="mb-4 flex items-end justify-between gap-4 px-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">Сообщения</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Диалоги по объявлениям</h1>
            </div>
            <span className="text-sm text-muted-foreground">{sortedChats.length}</span>
          </div>

          {sortedChats.length ? (
            <div className="space-y-3">
              {sortedChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  hydrated={hydrated}
                  selected={chat.id === currentChatId}
                />
              ))}
            </div>
          ) : (
            <Empty className="min-h-[360px] rounded-[28px] border border-dashed border-border/70 bg-background/50">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircle className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>Пока нет диалогов</EmptyTitle>
                <EmptyDescription>
                  Откройте карточку автомобиля и нажмите «Написать», чтобы создать первый чат по конкретному объявлению.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
        </aside>

        <section className={cn('min-w-0', !currentChat ? 'hidden lg:block' : 'block')}>
        <div className="flex min-h-[720px] flex-col overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[0_18px_48px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
          {currentChat ? (
            <>
              <div className="border-b border-border/60 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-3 lg:hidden">
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        <Link href="/messages">
                          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                          К списку
                        </Link>
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-border/70">
                        <AvatarImage src={currentChat.counterparty.avatarUrl} alt={currentChat.counterparty.name} />
                        <AvatarFallback>{getAvatarFallback(currentChat.counterparty.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate text-lg font-semibold text-foreground">{currentChat.counterparty.name}</h2>
                          {currentChat.counterparty.verified ? <ShieldCheck className="h-4 w-4 shrink-0 text-teal-accent" /> : null}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          Чат привязан к конкретному объявлению и не смешивается с другими автомобилями.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Link href={getListingHref(currentChat)} className="mt-4 grid gap-3 rounded-[24px] border border-border/70 bg-background/65 p-3 transition-colors hover:border-teal-accent/25 hover:bg-background/80 sm:grid-cols-[88px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                    {currentChat.listing.imageUrl ? (
                      <Image src={currentChat.listing.imageUrl} alt={currentChat.listing.title} width={88} height={88} unoptimized className="h-[88px] w-full object-cover" />
                    ) : (
                      <div className="flex h-[88px] items-center justify-center text-xs text-muted-foreground">Нет фото</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                      {currentChat.listing.type === 'SALE_LISTING' ? 'Объявление о продаже' : 'Запрос в подбор'}
                    </p>
                    <p className="mt-2 truncate text-base font-semibold text-foreground">{currentChat.listing.title}</p>
                    {currentChat.listing.price ? (
                      <p className="mt-1 text-sm text-muted-foreground">{formatPrice(currentChat.listing.price)}</p>
                    ) : null}
                    <p className="mt-3 text-xs text-muted-foreground">Открыть карточку объявления</p>
                  </div>
                </Link>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div ref={viewportRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  {nextCursor ? (
                    <div className="mb-4 flex justify-center">
                      <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void handleLoadMore()}>
                        {loadingMore ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                        Показать более ранние сообщения
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {messages.map((message) => {
                      const own = message.senderId === currentUserId;
                      return (
                        <div key={message.id} className={cn('flex', own ? 'justify-end' : 'justify-start')}>
                          <div
                            className={cn(
                              'max-w-[min(520px,92%)] rounded-[24px] px-4 py-3 shadow-[0_10px_24px_rgba(8,15,27,0.06)]',
                              own
                                ? 'bg-teal-dark text-white dark:bg-teal-accent dark:text-[#09090B]'
                                : 'border border-border/70 bg-background/75 text-foreground dark:bg-background/10',
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                            <p
                              className={cn('mt-2 text-[11px]', own ? 'text-white/75 dark:text-[#09090B]/70' : 'text-muted-foreground')}
                              suppressHydrationWarning
                            >
                              {hydrated ? formatMessageTime(message.createdAt) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border/60 px-5 py-4">
                  {threadError ? (
                    <div className="mb-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {threadError}
                    </div>
                  ) : null}
                  <div className="flex gap-3">
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Напишите сообщение по этому автомобилю"
                      className="min-h-[92px] rounded-[24px] border-border/70 bg-background/60 px-4 py-3"
                      maxLength={4000}
                    />
                    <Button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={sending || !draft.trim()}
                      className="h-auto min-w-28 rounded-[24px] bg-teal-dark px-4 text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                    >
                      {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Отправить
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Ctrl/Cmd + Enter для быстрой отправки.</p>
                </div>
              </div>
            </>
          ) : (
            <Empty className="m-6 min-h-[640px] rounded-[28px] border border-dashed border-border/70 bg-background/50">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircle className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>{threadError ? 'Чат недоступен' : 'Выберите диалог'}</EmptyTitle>
                <EmptyDescription>
                  {threadError
                    ? threadError
                    : 'Слева видны собеседник, автомобиль, последнее сообщение и непрочитанные. Выберите чат, чтобы продолжить переписку по конкретному объявлению.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
        </section>
      </section>
    </>
  );
}
