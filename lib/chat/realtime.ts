export const CHAT_WINDOW_EVENT_NAME = 'vin2win:chat-event';

export type ChatRealtimeEventType =
  | 'chat.message.created'
  | 'chat.read.updated'
  | 'chat.list.updated'
  | 'chat.unread.updated';

export interface ChatRealtimeEvent {
  id: string;
  userId: string;
  type: ChatRealtimeEventType;
  payload: Record<string, unknown>;
  createdAt: string;
}
