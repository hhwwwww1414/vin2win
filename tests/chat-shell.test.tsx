import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatShell } from '@/components/messages/chat-shell';
import type { ChatMessageDto, ChatSummaryDto } from '@/lib/chat/dto';

const sampleChat: ChatSummaryDto = {
  id: 'chat-1',
  contextType: 'SALE_LISTING',
  listing: {
    id: 'listing-1',
    type: 'SALE_LISTING',
    title: 'Toyota Camry 2022',
    price: 2500000,
    imageUrl: '/camry.jpg',
  },
  counterparty: {
    id: 'user-2',
    name: 'Ivan Petrov',
    verified: true,
  },
  unreadCount: 2,
  counterpartyLastReadMessageId: 'message-2',
  lastMessageAt: '2026-04-19T12:30:00.000Z',
  lastMessage: {
    id: 'message-last',
    chatId: 'chat-1',
    senderId: 'user-2',
    messageType: 'TEXT',
    text: 'Is it still available?',
    createdAt: '2026-04-19T12:30:00.000Z',
    updatedAt: '2026-04-19T12:30:00.000Z',
  },
};

const sampleMessages: ChatMessageDto[] = [
  {
    id: 'message-1',
    chatId: 'chat-1',
    senderId: 'user-2',
    messageType: 'TEXT',
    text: 'Is it still available?',
    createdAt: '2026-04-19T12:30:00.000Z',
    updatedAt: '2026-04-19T12:30:00.000Z',
  },
  {
    id: 'message-2',
    chatId: 'chat-1',
    senderId: 'user-1',
    messageType: 'TEXT',
    text: 'Yes, the car is still for sale.',
    createdAt: '2026-04-19T12:31:00.000Z',
    updatedAt: '2026-04-19T12:31:00.000Z',
  },
];

test('chat shell renders chat list, thread context, and read state without server-side time labels', () => {
  const markup = renderToStaticMarkup(
    <ChatShell
      currentUserId="user-1"
      initialChats={[sampleChat]}
      initialChat={sampleChat}
      initialMessages={sampleMessages}
    />,
  );

  assert.match(markup, /Toyota Camry 2022/);
  assert.match(markup, /Ivan Petrov/);
  assert.match(markup, /Yes, the car is still for sale\./);
  assert.match(markup, /Is it still available\?/);
  assert.match(markup, /2 500 000/);
  assert.match(markup, /Открыть карточку объявления/);
  assert.match(markup, /Прочитано/);
  assert.doesNotMatch(markup, />\d{2}:\d{2}</);
  assert.doesNotMatch(markup, />\d{2}\.\d{2}</);
});

test('chat composer keeps mobile-safe font sizing and bottom inset padding', () => {
  const markup = renderToStaticMarkup(
    <ChatShell
      currentUserId="user-1"
      initialChats={[sampleChat]}
      initialChat={sampleChat}
      initialMessages={sampleMessages}
    />,
  );

  assert.match(markup, /pb-\[calc\(env\(safe-area-inset-bottom\)\+0\.75rem\)\]/);
  assert.match(markup, /text-base leading-6/);
  assert.doesNotMatch(markup, /text-\[15px\] leading-6/);
});
