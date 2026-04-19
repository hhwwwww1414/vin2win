CREATE TYPE "ChatContextType" AS ENUM ('SALE_LISTING', 'WANTED_LISTING');

CREATE TYPE "ChatMessageType" AS ENUM ('TEXT');

ALTER TYPE "UserNotificationType" ADD VALUE 'CHAT_MESSAGE';

ALTER TABLE "User"
ADD COLUMN     "chatSoundEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "chatPushEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "contextType" "ChatContextType" NOT NULL,
    "contextKey" TEXT NOT NULL,
    "saleListingId" TEXT,
    "wantedListingId" TEXT,
    "participantLowUserId" TEXT NOT NULL,
    "participantHighUserId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "lastMessageId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "titleSnapshot" TEXT NOT NULL,
    "priceSnapshot" INTEGER,
    "imageSnapshot" TEXT,
    "statusSnapshot" "ListingStatus",
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatParticipant" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),
    "lastReadMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "messageType" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
    "text" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatPresence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "activeChatId" TEXT,
    "pathname" TEXT,
    "visibilityState" TEXT NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatPresence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Chat_lastMessageId_key" ON "Chat"("lastMessageId");
CREATE UNIQUE INDEX "Chat_contextKey_participantLowUserId_participantHighUserId_key" ON "Chat"("contextKey", "participantLowUserId", "participantHighUserId");
CREATE INDEX "Chat_saleListingId_idx" ON "Chat"("saleListingId");
CREATE INDEX "Chat_wantedListingId_idx" ON "Chat"("wantedListingId");
CREATE INDEX "Chat_participantLowUserId_lastMessageAt_idx" ON "Chat"("participantLowUserId", "lastMessageAt" DESC);
CREATE INDEX "Chat_participantHighUserId_lastMessageAt_idx" ON "Chat"("participantHighUserId", "lastMessageAt" DESC);
CREATE INDEX "Chat_lastMessageAt_idx" ON "Chat"("lastMessageAt" DESC);

CREATE UNIQUE INDEX "ChatParticipant_chatId_userId_key" ON "ChatParticipant"("chatId", "userId");
CREATE INDEX "ChatParticipant_userId_unreadCount_idx" ON "ChatParticipant"("userId", "unreadCount");
CREATE INDEX "ChatParticipant_userId_updatedAt_idx" ON "ChatParticipant"("userId", "updatedAt" DESC);

CREATE INDEX "ChatMessage_chatId_createdAt_idx" ON "ChatMessage"("chatId", "createdAt" DESC);
CREATE INDEX "ChatMessage_senderId_createdAt_idx" ON "ChatMessage"("senderId", "createdAt" DESC);

CREATE UNIQUE INDEX "ChatPresence_userId_clientId_key" ON "ChatPresence"("userId", "clientId");
CREATE INDEX "ChatPresence_userId_lastHeartbeatAt_idx" ON "ChatPresence"("userId", "lastHeartbeatAt" DESC);
CREATE INDEX "ChatPresence_activeChatId_lastHeartbeatAt_idx" ON "ChatPresence"("activeChatId", "lastHeartbeatAt" DESC);

ALTER TABLE "Chat" ADD CONSTRAINT "Chat_saleListingId_fkey" FOREIGN KEY ("saleListingId") REFERENCES "SaleListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_wantedListingId_fkey" FOREIGN KEY ("wantedListingId") REFERENCES "WantedListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_participantLowUserId_fkey" FOREIGN KEY ("participantLowUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_participantHighUserId_fkey" FOREIGN KEY ("participantHighUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChatPresence" ADD CONSTRAINT "ChatPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatPresence" ADD CONSTRAINT "ChatPresence_activeChatId_fkey" FOREIGN KEY ("activeChatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Chat" ADD CONSTRAINT "Chat_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
