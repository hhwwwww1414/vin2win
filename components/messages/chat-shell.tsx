'use client';

import { type KeyboardEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCheck, Loader2, MessageCircle, Send, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Textarea } from '@/components/ui/textarea';
import { ChatPushSetup } from '@/components/messages/chat-push-setup';
import { useChatEvents } from '@/hooks/use-chat-events';
import { type ChatMessageDto, type ChatSummaryDto } from '@/lib/chat/dto';
import { formatPrice } from '@/lib/price-formatting';
import { cn } from '@/lib/utils';

interface ChatShellProps {
  currentUserId: string;
  initialChats: ChatSummaryDto[];
  initialChat?: ChatSummaryDto | null;
  initialMessages?: ChatMessageDto[];
  initialNextCursor?: string;
  initialError?: string | null;
}

type OutgoingMessageStatus = 'sent' | 'read';

const EMPTY_MESSAGES: ChatMessageDto[] = [];
const MESSAGE_GROUP_GAP_MS = 10 * 60 * 1000;

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatListTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return new Intl.DateTimeFormat(
    'ru-RU',
    sameDay
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit' },
  ).format(date);
}

function formatDayDivider(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (sameDay) {
    return 'Сегодня';
  }

  const sameYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (sameYesterday) {
    return 'Вчера';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  }).format(date);
}

function getMessageDayKey(value: string) {
  return value.slice(0, 10);
}

function isSameMessageGroup(left: ChatMessageDto, right: ChatMessageDto) {
  if (left.senderId !== right.senderId) {
    return false;
  }

  if (getMessageDayKey(left.createdAt) !== getMessageDayKey(right.createdAt)) {
    return false;
  }

  return Math.abs(new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()) <= MESSAGE_GROUP_GAP_MS;
}

function getListingHref(chat: ChatSummaryDto) {
  return chat.listing.type === 'SALE_LISTING' ? `/listing/${chat.listing.id}` : `/wanted/${chat.listing.id}`;
}

function getAvatarFallback(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'V2'
  );
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

function MessageStatusIcon({ status }: { status: OutgoingMessageStatus }) {
  const read = status === 'read';

  return (
    <span
      aria-label={read ? 'Прочитано' : 'Отправлено'}
      className={cn(
        'inline-flex items-center justify-center',
        read ? 'text-teal-100 dark:text-[#0B4E4E]' : 'text-white/65 dark:text-[#081215]/55',
      )}
    >
      {read ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
    </span>
  );
}

function ChatListItem({
  chat,
  currentUserId,
  hydrated,
  selected,
}: {
  chat: ChatSummaryDto;
  currentUserId: string;
  hydrated: boolean;
  selected: boolean;
}) {
  const chatHref = `/messages/${chat.id}`;
  const ownLastMessage = chat.lastMessage?.senderId === currentUserId;

  return (
    <a
      href={chatHref}
      className={cn(
        'group block rounded-[22px] border px-3 py-3 transition-all',
        selected
          ? 'border-teal-accent/30 bg-[var(--accent-bg-soft)] shadow-[0_10px_28px_rgba(17,24,39,0.16)]'
          : 'border-border/70 bg-background/55 hover:border-teal-accent/18 hover:bg-background/75',
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0 border border-border/70">
          <AvatarImage src={chat.counterparty.avatarUrl} alt={chat.counterparty.name} />
          <AvatarFallback>{getAvatarFallback(chat.counterparty.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground">{chat.counterparty.name}</p>
                {chat.counterparty.verified ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-accent" /> : null}
              </div>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{chat.listing.title}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                {hydrated ? formatListTime(chat.lastMessageAt) : ''}
              </span>
              {chat.unreadCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-teal-accent/30 bg-[var(--accent-bg-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-teal-accent">
                  {chat.unreadCount}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-[48px_minmax(0,1fr)] gap-2.5">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
              {chat.listing.imageUrl ? (
                <Image
                  src={chat.listing.imageUrl}
                  alt={chat.listing.title}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center text-[10px] text-muted-foreground">Нет фото</div>
              )}
            </div>

            <div className="min-w-0">
              {chat.listing.price ? (
                <p className="truncate text-xs font-medium text-foreground">{formatPrice(chat.listing.price)}</p>
              ) : null}

              <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-foreground">
                {chat.lastMessage ? `${ownLastMessage ? 'Вы: ' : ''}${chat.lastMessage.text}` : 'Диалог создан. Можно написать первым сообщением.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export function ChatShell({
  currentUserId,
  initialChats,
  initialChat = null,
  initialMessages,
  initialNextCursor,
  initialError = null,
}: ChatShellProps) {
  const safeInitialMessages = initialMessages ?? EMPTY_MESSAGES;
  const [chats, setChats] = useState(initialChats);
  const [currentChat, setCurrentChat] = useState<ChatSummaryDto | null>(initialChat);
  const [messages, setMessages] = useState<ChatMessageDto[]>(safeInitialMessages);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(initialError);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastMessageCountRef = useRef(safeInitialMessages.length);
  const readRequestInFlightRef = useRef<string | null>(null);
  const lastCompletedReadRef = useRef<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  useEffect(() => {
    setCurrentChat(initialChat ?? null);
    setMessages(safeInitialMessages);
    setNextCursor(initialNextCursor);
    setThreadError(initialError);
    lastMessageCountRef.current = safeInitialMessages.length;
  }, [initialChat, initialError, initialNextCursor, safeInitialMessages]);

  const currentChatId = currentChat?.id;
  const currentChatUnreadCount = currentChat?.unreadCount ?? 0;
  const latestMessageId = messages[messages.length - 1]?.id;

  const sortedChats = useMemo(
    () =>
      [...chats].sort((left, right) => {
        return new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime();
      }),
    [chats],
  );

  const counterpartyReadMessageIndex = useMemo(() => {
    if (!currentChat?.counterpartyLastReadMessageId) {
      return -1;
    }

    return messages.findIndex((message) => message.id === currentChat.counterpartyLastReadMessageId);
  }, [currentChat?.counterpartyLastReadMessageId, messages]);

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

  const markCurrentChatRead = useCallback(
    async (options: { force?: boolean; messageId?: string } = {}) => {
      if (!currentChatId) {
        return;
      }

      const marker = options.messageId ?? latestMessageId ?? currentChat?.lastMessage?.id ?? 'empty';
      const signature = `${currentChatId}:${marker}`;

      if (!options.force && currentChatUnreadCount < 1) {
        return;
      }

      if (readRequestInFlightRef.current === signature || lastCompletedReadRef.current === signature) {
        return;
      }

      readRequestInFlightRef.current = signature;

      try {
        await fetch(`/api/chats/${currentChatId}/read`, {
          method: 'POST',
        }).catch(() => undefined);
        lastCompletedReadRef.current = signature;
      } finally {
        if (readRequestInFlightRef.current === signature) {
          readRequestInFlightRef.current = null;
        }
      }

      setChats((current) =>
        current.map((chat) =>
          chat.id === currentChatId && chat.unreadCount > 0
            ? { ...chat, unreadCount: 0 }
            : chat,
        ),
      );
      setCurrentChat((current) =>
        current && current.unreadCount > 0 ? { ...current, unreadCount: 0 } : current,
      );
    },
    [currentChat?.lastMessage?.id, currentChatId, currentChatUnreadCount, latestMessageId],
  );

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

    setCurrentChat((current) =>
      current
        ? {
            ...current,
            lastMessage: newItems[newItems.length - 1] ?? current.lastMessage,
            lastMessageAt: newItems[newItems.length - 1]?.createdAt ?? current.lastMessageAt,
          }
        : current,
    );

    if (typeof payload.nextCursor === 'string') {
      setNextCursor((current) => current ?? payload.nextCursor);
    }

    const newestIncoming = [...newItems].reverse().find((item) => item.senderId !== currentUserId);
    if (newestIncoming) {
      void markCurrentChatRead({
        force: true,
        messageId: newestIncoming.id,
      });
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
          setCurrentChat((current) =>
            current
              ? {
                  ...current,
                  lastMessage: incoming,
                  lastMessageAt: incoming.createdAt,
                }
              : current,
          );
          setChats((current) =>
            current.map((chat) =>
              chat.id === incoming.chatId
                ? {
                    ...chat,
                    lastMessage: incoming,
                    lastMessageAt: incoming.createdAt,
                  }
                : chat,
            ),
          );

          if (incoming.senderId !== currentUserId) {
            void markCurrentChatRead({
              force: true,
              messageId: incoming.id,
            });
          }
        }

        if (event.type === 'chat.read.updated') {
          const readerUserId = typeof event.payload.readerUserId === 'string' ? event.payload.readerUserId : null;
          const lastReadMessageId =
            typeof event.payload.lastReadMessageId === 'string' ? event.payload.lastReadMessageId : undefined;

          if (readerUserId && readerUserId !== currentUserId) {
            setCurrentChat((current) =>
              current ? { ...current, counterpartyLastReadMessageId: lastReadMessageId } : current,
            );
            setChats((current) =>
              current.map((chat) =>
                chat.id === currentChatId
                  ? { ...chat, counterpartyLastReadMessageId: lastReadMessageId }
                  : chat,
              ),
            );
          }

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
      setCurrentChat((current) =>
        current
          ? {
              ...current,
              lastMessage: sentMessage,
              lastMessageAt: sentMessage.createdAt,
            }
          : current,
      );
      setChats((current) =>
        current.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                lastMessage: sentMessage,
                lastMessageAt: sentMessage.createdAt,
              }
            : chat,
        ),
      );
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
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-5">
      <ChatPushSetup className={cn('shrink-0', currentChat ? 'hidden lg:block' : undefined)} />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[21.5rem_minmax(0,1fr)] lg:items-stretch lg:gap-5">
        <aside className={cn('min-h-0 min-w-0', currentChat ? 'hidden lg:block' : 'flex-1 lg:block')}>
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/92 shadow-[0_16px_40px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
            <div className="shrink-0 px-5 pt-5 pb-4">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">Сообщения</p>
                  <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-foreground">Диалоги</h1>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{sortedChats.length}</span>
              </div>
            </div>

            {sortedChats.length ? (
              <div className="panel-scroll-y min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4">
                <div className="space-y-2.5">
                  {sortedChats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      currentUserId={currentUserId}
                      hydrated={hydrated}
                      selected={chat.id === currentChatId}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 px-4 pb-4">
                <Empty className="min-h-full rounded-[24px] border border-dashed border-border/70 bg-background/50">
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
              </div>
            )}
          </div>
        </aside>

        <section className={cn('min-h-0 min-w-0', !currentChat ? 'hidden lg:block' : 'flex-1 lg:block')}>
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/92 shadow-[0_16px_40px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
            {currentChat ? (
              <>
                <div className="shrink-0 border-b border-border/60 bg-[linear-gradient(180deg,rgba(121,224,212,0.08)_0%,rgba(17,24,39,0)_100%)] px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 lg:hidden">
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          <Link href="/messages">
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            К списку
                          </Link>
                        </Button>
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/70 sm:h-11 sm:w-11">
                          <AvatarImage src={currentChat.counterparty.avatarUrl} alt={currentChat.counterparty.name} />
                          <AvatarFallback>{getAvatarFallback(currentChat.counterparty.name)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">{currentChat.counterparty.name}</h2>
                            {currentChat.counterparty.verified ? <ShieldCheck className="h-4 w-4 shrink-0 text-teal-accent" /> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={getListingHref(currentChat)}
                    className="group mt-3 flex min-w-0 items-start gap-3 rounded-[20px] border border-border/70 bg-background/65 p-2.5 transition-colors hover:border-teal-accent/25 hover:bg-background/82 sm:p-3"
                  >
                    <div className="overflow-hidden rounded-[18px] border border-border/70 bg-muted/20">
                      {currentChat.listing.imageUrl ? (
                        <Image
                          src={currentChat.listing.imageUrl}
                          alt={currentChat.listing.title}
                          width={72}
                          height={72}
                          unoptimized
                          className="h-[64px] w-[64px] object-cover sm:h-[72px] sm:w-[72px]"
                        />
                      ) : (
                        <div className="flex h-[64px] w-[64px] items-center justify-center text-xs text-muted-foreground sm:h-[72px] sm:w-[72px]">
                          Нет фото
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-accent">
                          {currentChat.listing.type === 'SALE_LISTING' ? 'Объявление о продаже' : 'Запрос в подбор'}
                        </p>
                        {currentChat.listing.price ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border/80" />
                            <p className="text-xs font-medium text-foreground">{formatPrice(currentChat.listing.price)}</p>
                          </>
                        ) : null}
                      </div>

                      <p className="mt-1 truncate text-sm font-semibold text-foreground sm:text-[15px]">{currentChat.listing.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">Открыть карточку объявления</p>
                    </div>
                  </Link>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div
                    ref={viewportRef}
                    className="panel-scroll-y min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(121,224,212,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_22rem)] px-3 py-4 sm:px-5 sm:py-5"
                  >
                    {nextCursor ? (
                      <div className="mb-4 flex justify-center">
                        <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void handleLoadMore()}>
                          {loadingMore ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                          Показать более ранние сообщения
                        </Button>
                      </div>
                    ) : null}

                    <div>
                      {messages.map((message, index) => {
                        const previousMessage = messages[index - 1];
                        const nextMessage = messages[index + 1];
                        const own = message.senderId === currentUserId;
                        const startsDay = !previousMessage || getMessageDayKey(previousMessage.createdAt) !== getMessageDayKey(message.createdAt);
                        const groupedWithPrev = previousMessage ? isSameMessageGroup(previousMessage, message) : false;
                        const groupedWithNext = nextMessage ? isSameMessageGroup(message, nextMessage) : false;
                        const status: OutgoingMessageStatus | null = own ? (counterpartyReadMessageIndex >= index ? 'read' : 'sent') : null;

                        return (
                          <Fragment key={message.id}>
                            {startsDay ? (
                              <div className={cn('flex justify-center', index === 0 ? 'mb-3' : 'my-5')}>
                                <span
                                  className="rounded-full border border-white/8 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur"
                                  suppressHydrationWarning
                                >
                                  {hydrated ? formatDayDivider(message.createdAt) : ''}
                                </span>
                              </div>
                            ) : null}

                            <div
                              className={cn(
                                'flex min-w-0',
                                own ? 'justify-end' : 'justify-start',
                                index === 0 ? 'mt-0' : groupedWithPrev ? 'mt-1.5' : 'mt-4',
                              )}
                            >
                              <div
                                className={cn(
                                  'max-w-[92%] px-3.5 py-2.5 shadow-[0_10px_24px_rgba(8,15,27,0.08)] sm:max-w-[min(36rem,78%)] sm:px-4 sm:py-3',
                                  own
                                    ? 'bg-teal-dark text-white ring-1 ring-white/6 dark:bg-teal-accent/95 dark:text-[#081215]'
                                    : 'border border-border/70 bg-background/78 text-foreground dark:bg-background/16',
                                  own
                                    ? cn(
                                        'rounded-[22px] rounded-tl-[22px] rounded-bl-[22px]',
                                        groupedWithPrev ? 'rounded-tr-[12px]' : 'rounded-tr-[22px]',
                                        groupedWithNext ? 'rounded-br-[12px]' : 'rounded-br-[18px]',
                                      )
                                    : cn(
                                        'rounded-[22px] rounded-tr-[22px] rounded-br-[22px]',
                                        groupedWithPrev ? 'rounded-tl-[12px]' : 'rounded-tl-[22px]',
                                        groupedWithNext ? 'rounded-bl-[12px]' : 'rounded-bl-[18px]',
                                      ),
                                )}
                              >
                                <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.45] sm:text-[15px] sm:leading-6">{message.text}</p>

                                <div
                                  className={cn(
                                    'mt-1.5 flex items-center justify-end gap-1.5 text-[11px]',
                                    own ? 'text-white/72 dark:text-[#081215]/58' : 'text-muted-foreground',
                                  )}
                                >
                                  <span suppressHydrationWarning>{hydrated ? formatMessageTime(message.createdAt) : ''}</span>
                                  {status ? <MessageStatusIcon status={status} /> : null}
                                </div>
                              </div>
                            </div>
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-border/60 bg-background/55 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur sm:px-5 sm:pb-3">
                    {threadError ? (
                      <div className="mb-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {threadError}
                      </div>
                    ) : null}

                    <div className="flex min-w-0 items-end gap-2.5">
                      <div className="min-w-0 flex-1 rounded-[22px] border border-border/70 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors focus-within:border-teal-accent/35 focus-within:bg-background/85">
                        <Textarea
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={handleComposerKeyDown}
                          placeholder="Сообщение по этому объявлению"
                          className="min-h-[58px] max-h-36 min-w-0 resize-none border-0 bg-transparent px-4 py-3 text-base leading-6 shadow-none focus-visible:ring-0"
                          maxLength={4000}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={sending || !draft.trim()}
                        className="h-11 w-11 shrink-0 rounded-full bg-teal-dark p-0 text-white shadow-[0_10px_24px_rgba(25,92,89,0.28)] hover:bg-teal-medium disabled:shadow-none sm:h-11 sm:w-auto sm:rounded-[18px] sm:px-4 dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only sm:not-sr-only sm:ml-2">Отправить</span>
                      </Button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                      <span>Ctrl/Cmd + Enter для быстрой отправки.</span>
                      <span>{draft.length}/4000</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-0 flex-1 p-6">
                <Empty className="min-h-full rounded-[24px] border border-dashed border-border/70 bg-background/50">
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
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
