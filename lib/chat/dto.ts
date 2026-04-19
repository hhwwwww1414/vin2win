export type ChatContextTypeValue = 'SALE_LISTING' | 'WANTED_LISTING';

export interface ChatCounterpartyDto {
  id: string;
  name: string;
  avatarUrl?: string;
  sellerProfileId?: string;
  verified: boolean;
}

export interface ChatListingSnapshotDto {
  id: string;
  type: ChatContextTypeValue;
  title: string;
  price?: number;
  imageUrl?: string;
  status?: string;
}

export interface ChatMessageDto {
  id: string;
  chatId: string;
  senderId: string;
  messageType: 'TEXT';
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSummaryDto {
  id: string;
  contextType: ChatContextTypeValue;
  listing: ChatListingSnapshotDto;
  counterparty: ChatCounterpartyDto;
  unreadCount: number;
  lastMessageAt: string;
  lastMessage?: ChatMessageDto;
}

export interface ChatMessagesPageDto {
  items: ChatMessageDto[];
  nextCursor?: string;
}
