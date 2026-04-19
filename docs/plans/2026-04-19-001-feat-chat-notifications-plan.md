---
title: Internal Chats And Notifications
type: feat
status: active
date: 2026-04-19
---

# Internal Chats And Notifications

## Overview

Добавить в vin2win внутренние диалоги по смыслу как на Avito: один чат на пару пользователей в контексте одного конкретного объявления, мгновенная доставка на сайте, push при отсутствии активного присутствия, непрочитанные сообщения, быстрый переход в нужный чат и серверно сохраняемая настройка звука.

## Problem Frame

Сейчас у карточки объявления нет внутреннего диалога: пользователь может только раскрыть контакт и уйти во внешний канал связи. Проект уже имеет авторизацию, профили продавцов, публикации, серверные уведомления, web push и личный кабинет, но не имеет чатов и realtime-доставки. Новая система должна встроиться в существующую Next.js + Prisma архитектуру, не ломая текущие уведомления, и сохранить бизнес-инвариант: диалог существует не просто между двумя людьми, а между двумя людьми по одному конкретному объявлению.

## Requirements Trace

- R1. Один чат создаётся и переиспользуется на комбинацию `listing + user A + user B`.
- R2. Пользователь в списке чатов видит собеседника, контекст объявления, последнее сообщение и непрочитанные.
- R3. Сообщение появляется мгновенно, если получатель находится на сайте.
- R4. При отсутствии активного присутствия на сайте получатель получает browser push и обычное пользовательское уведомление.
- R5. Звук новых сообщений можно включать и выключать, состояние хранится на сервере и переживает новые сессии.
- R6. Доступ к чатам ограничен только участниками; чужие чаты и чужой контекст объявления недоступны.
- R7. Решение должно переиспользовать существующие `UserNotification`, `PushSubscription`, `public/push-sw.js` и cookie-auth вместо параллельной второй системы.

## Scope Boundaries

- Не включать вложения, фото, файлы и голосовые сообщения в MVP.
- Не строить отдельный websocket-сервер или внешний realtime-сервис, если можно остаться в текущем Node runtime.
- Не менять существующую систему авторизации и не переносить уведомления в отдельный микросервис.
- Не добавлять read receipts на уровень каждого пузыря сообщения в первой версии.

### Deferred To Separate Tasks

- Email и Telegram-уведомления для чатовых сообщений, если это понадобится позже.
- Архивирование, блокировки, жалобы, шаблоны ответов и вложения.

## Context & Research

### Relevant Code And Patterns

- `prisma/schema.prisma` уже описывает `User`, `Session`, `SaleListing`, `WantedListing`, `UserNotification`, `PushSubscription`.
- `lib/server/auth.ts` реализует cookie-based session auth через `getSessionUser`, `requireAuthenticatedUser`, `getCurrentSession`.
- `lib/server/marketplace.ts` уже определяет права на публикации через `createdByUserId` и отдаёт `ownerUserId` в DTO.
- `lib/server/admin-activity.ts` создаёт `UserNotification` и сразу вызывает `dispatchUserNotification`.
- `lib/server/account-notifications.ts`, `app/api/account/notification-settings/route.ts`, `app/api/account/push-subscriptions/route.ts` уже хранят настройки уведомлений и web push подписки.
- `lib/server/notification-dispatch.ts` и `public/push-sw.js` уже закрывают browser push и переход по `href`.
- `components/account/notification-delivery-settings.tsx` уже даёт UI для настроек уведомлений.
- `components/marketplace/header.tsx` уже запрашивает `/api/auth/session` и показывает пользовательские счётчики в шапке.
- `components/listing/deal-block.tsx` является естественной точкой входа для кнопки `Написать`.

### Institutional Learnings

- `docs/solutions/` в репозитории отсутствует; опираться нужно на текущие паттерны кода.

### External References

- Внешнее исследование не требуется: стек стандартный, в проекте уже есть все критичные строительные блоки кроме realtime-канала.

## Key Technical Decisions

- Использовать контекст объявления, а не абстрактную модель `user <-> user`: чат хранит `contextType`, `contextKey` и FK на публикацию.
- Поддержать оба типа объявлений в модели (`SALE_LISTING`, `WANTED_LISTING`), чтобы не закладывать тупиковую схему только под продажу.
- Ввести таблицу `ChatParticipant` с `unreadCount`, `lastReadAt` и `lastReadMessageId`, чтобы не пересчитывать unread в лоб на каждый запрос.
- Для уникальности чата хранить отсортированную пару участников (`participantLowUserId`, `participantHighUserId`) и уникальный индекс вместе с `contextKey`.
- Realtime делать через SSE на Node runtime и `PostgreSQL LISTEN/NOTIFY`, а не через websocket: текущий проект монолитный, отдельного сокет-сервера и Redis нет.
- Для решения online/offline добавить `ChatPresence` с heartbeat от клиента. Push отправлять только если у получателя нет свежего видимого присутствия на сайте или вкладка скрыта.
- Push и in-app уведомления переиспользуют существующие `UserNotification`, `PushSubscription`, `dispatchUserNotification` и `public/push-sw.js`; расширяется только тип уведомления и полезная нагрузка.
- Настройки `chatSoundEnabled` и `chatPushEnabled` хранить на `User`, потому что текущая архитектура уже использует пользовательские флаги уведомлений в этой таблице. Отдельная `notification_settings` таблица для MVP не нужна.
- Ввести env-flag `CHAT_ENABLED` и `NEXT_PUBLIC_CHAT_ENABLED`, потому что штатного feature-flag механизма в проекте нет.

## Open Questions

### Resolved During Planning

- Нужен ли отдельный модуль настроек? Нет: для MVP расширяем текущие поля пользователя и текущий API настроек.
- Нужен ли websocket? Нет: для этой архитектуры достаточно SSE + HTTP POST + Postgres notifications.
- Стоит ли поддержать `WantedListing` сразу? Да: модель будет общей для sale/wanted, чтобы не делать несовместимый первый релиз.

### Deferred To Implementation

- Точный формат push payload для лучшего отображения на Android/iOS браузерах. Это зависит от фактической проверки в браузерах.
- Конкретный интервал heartbeat и TTL presence-записей. Выбирается после первых ручных прогонов, но план должен закладывать механизм.

## Output Structure

    app/
      api/
        chats/
          open/route.ts
          route.ts
          [id]/
            route.ts
            messages/route.ts
            read/route.ts
        chat-presence/route.ts
        realtime/
          chat-events/route.ts
      messages/
        page.tsx
        [id]/page.tsx
    components/
      messages/
        chat-shell.tsx
        chat-list.tsx
        chat-list-item.tsx
        chat-thread.tsx
        chat-composer.tsx
        chat-context-card.tsx
        chat-sound-toggle.tsx
    hooks/
      use-chat-events.ts
      use-chat-sound.ts
    lib/
      chat/
        constants.ts
        dto.ts
      server/
        chats.ts
        chat-notifications.ts
        chat-presence.ts
        chat-realtime.ts
    prisma/
      schema.prisma
      migrations/<new_chat_migration>/
    tests/
      chats-server.integration.test.ts
      chats-api.test.ts
      chat-list-page.test.tsx
      chat-thread-page.test.tsx
      chat-notification-settings.test.tsx
      qa/
        messages.spec.ts

## Implementation Units

- [ ] **Unit 1: Chat Data Model And Notification Settings**

**Goal:** Добавить в БД сущности чатов, сообщений, участников, присутствия и новые пользовательские настройки.

**Requirements:** R1, R5, R6

**Dependencies:** None

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_internal_chats/`
- Test: `tests/chats-server.integration.test.ts`

**Approach:**
- Добавить `ChatContextType` enum со значениями `SALE_LISTING` и `WANTED_LISTING`.
- Добавить `Chat`, `ChatParticipant`, `ChatMessage`, `ChatPresence`.
- В `Chat` хранить `contextType`, `contextKey`, `saleListingId?`, `wantedListingId?`, `participantLowUserId`, `participantHighUserId`, `lastMessageId?`, `lastMessageAt`, snapshot-поля заголовка, цены/бюджета, фото и статуса объявления.
- В `ChatParticipant` хранить `chatId`, `userId`, `unreadCount`, `lastReadAt`, `lastReadMessageId`.
- В `ChatMessage` хранить `chatId`, `senderId`, `messageType`, `text`, `createdAt`, `updatedAt`.
- В `ChatPresence` хранить `userId`, `clientId`, `activeChatId?`, `pathname?`, `visibilityState`, `lastHeartbeatAt`.
- В `User` добавить `chatSoundEnabled Boolean @default(true)` и `chatPushEnabled Boolean @default(true)`.
- В `UserNotificationType` добавить `CHAT_MESSAGE`.
- Индексы: по `Chat.lastMessageAt`, `Chat.contextKey + participants`, `ChatParticipant.userId`, `ChatMessage.chatId + createdAt`, `ChatMessage.senderId + createdAt`, `ChatPresence.userId + lastHeartbeatAt`.

**Patterns To Follow:**
- `prisma/schema.prisma`
- Existing Prisma migration layout in `prisma/migrations/`

**Test Scenarios:**
- Happy path: unique chat по той же паре и тому же объявлению создаётся один раз.
- Happy path: для той же пары по другому объявлению создаётся новый чат.
- Edge case: чат по `WantedListing` и по `SaleListing` с одним и тем же `id` не конфликтует за счёт `contextKey`.
- Edge case: snapshot сохраняет title/price/image/status на момент создания и не зависит от дальнейшего редактирования объявления.
- Integration: миграция применима к живой схеме без удаления существующих данных.

**Verification:**
- Миграция проходит на текущей схеме и новые таблицы/поля отражаются в Prisma client.

- [ ] **Unit 2: Chat Domain Services And Secure API**

Отправка сообщения должна выполняться в одной транзакции:
создание ChatMessage, обновление Chat.lastMessageAt / lastMessageId, увеличение unreadCount у второго участника, создание UserNotification, публикация realtime-события после успешного commit.

**Goal:** Реализовать открытие/создание чата, список чатов, выдачу сообщений, отправку, read-маркировку и доступ только участникам.

**Requirements:** R1, R2, R6, R7

**Dependencies:** Unit 1

**Files:**
- Create: `lib/server/chats.ts`
- Create: `lib/chat/dto.ts`
- Create: `app/api/chats/open/route.ts`
- Create: `app/api/chats/route.ts`
- Create: `app/api/chats/[id]/route.ts`
- Create: `app/api/chats/[id]/messages/route.ts`
- Create: `app/api/chats/[id]/read/route.ts`
- Modify: `app/api/auth/session/route.ts`
- Test: `tests/chats-api.test.ts`
- Test: `tests/chats-server.integration.test.ts`

**Approach:**
- Все route handlers используют текущую cookie-auth через `getSessionUser`.
- `POST /api/chats/open` принимает `contextType` и `listingId`, определяет владельца публикации по `createdByUserId`, сортирует пару участников, ищет чат по уникальному индексу и создаёт его при отсутствии.
POST /api/chats/open должен быть идемпотентным: повторный вызов с тем же contextType + listingId + sorted participants обязан возвращать уже существующий чат.
- `GET /api/chats` возвращает список чатов текущего пользователя, уже агрегированный по собеседнику, snapshot-данным объявления, последнему сообщению и `unreadCount`.
- `GET /api/chats/[id]/messages` выдаёт пагинированную историю.
- `POST /api/chats/[id]/messages` валидирует текст, проверяет участие в чате, создаёт сообщение, обновляет `Chat.lastMessageAt`, `Chat.lastMessageId`, увеличивает `unreadCount` у второго участника и выполняет анти-флуд проверку по последним сообщениям отправителя.
- `POST /api/chats/[id]/read` сбрасывает `unreadCount`, фиксирует `lastReadAt` и отправляет read event.
- `/api/auth/session` расширяется общим `chatUnreadCount`, чтобы шапка могла показать badge без отдельного запроса.

**Patterns To Follow:**
- `app/api/account/notification-settings/route.ts`
- `app/api/account/notifications/[id]/route.ts`
- `lib/server/marketplace.ts`
- `lib/server/auth.ts`

**Test Scenarios:**
- Happy path: открыть новый чат по опубликованному sale listing.
- Happy path: повторное открытие возвращает существующий чат.
- Happy path: список чатов отсортирован по `lastMessageAt desc`.
- Happy path: read endpoint обнуляет unread только для текущего участника.
- Edge case: попытка написать самому себе по своему объявлению блокируется понятной ошибкой.
- Edge case: пустое или слишком длинное сообщение отклоняется валидатором.
- Error path: пользователь не-участник не может получить чат, историю и отправить сообщение.
- Error path: flood из нескольких сообщений подряд сверх лимита получает `429`.
- Integration: отправка сообщения обновляет `chatUnreadCount` в session payload и `unreadCount` на участнике.

**Verification:**
- API покрывает сценарии open/list/messages/send/read без N+1 и без доступа к чужим чатам.

- [ ] **Unit 3: Realtime Transport And Presence**

**Goal:** Доставлять обновления чата и списка без перезагрузки, а также корректно различать online/hidden/offline состояния.

**Requirements:** R3, R4, R6

**Dependencies:** Unit 1, Unit 2

**Files:**
- Create: `lib/server/chat-realtime.ts`
- Create: `lib/server/chat-presence.ts`
- Create: `app/api/realtime/chat-events/route.ts`
- Create: `app/api/chat-presence/route.ts`
- Create: `hooks/use-chat-events.ts`
- Test: `tests/chats-server.integration.test.ts`

**Approach:**
- Реализовать SSE endpoint на `runtime = 'nodejs'`.
- Для межзапросной доставки внутри и между процессами использовать Postgres `LISTEN/NOTIFY`. После успешного commit сообщения/прочтения сервер публикует событие в канал.
- Клиент подписывается на SSE после авторизации и держит heartbeat presence.
- Presence endpoint принимает `clientId`, `activeChatId`, `pathname`, `visibilityState`, обновляет/создаёт запись и чистит протухшие записи.
- Базовые события: `chat.message.created`, `chat.read.updated`, `chat.list.updated`, `chat.unread.updated`.
- SSE поток шлёт heartbeats/keepalive, клиент обрабатывает reconnect с backoff.

**Patterns To Follow:**
- Node runtime API routes in `app/api/account/*`
- Existing browser push message handling in `components/account/notification-delivery-settings.tsx`

**Test Scenarios:**
- Happy path: событие нового сообщения доходит второму участнику через realtime-слой.
- Happy path: read update меняет unread badge без полной перезагрузки.
- Edge case: reconnect после обрыва SSE заново подписывает клиента и восстанавливает доставку.
- Edge case: несколько вкладок одного пользователя не ломают presence и не дублируют состояние unread.
- Error path: отсутствие свежего presence трактуется как offline и не блокирует отправку сообщения.
- Integration: hidden tab классифицируется как кандидат на push, visible tab без активного чата получает только realtime UI update.

**Verification:**
- При открытом сайте новое сообщение появляется без manual refresh, а presence корректно отражает состояние вкладки.

- [ ] **Unit 4: Chat Notifications, Push And Sound Settings**

**Goal:** Встроить чатовые уведомления в текущую систему и добавить серверно сохраняемые настройки звука/push.

**Requirements:** R4, R5, R7

**Dependencies:** Unit 1, Unit 2, Unit 3

**Files:**
- Modify: `lib/server/admin-activity.ts`
- Create: `lib/server/chat-notifications.ts`
- Modify: `lib/server/notification-dispatch.ts`
- Modify: `lib/server/account-notifications.ts`
- Modify: `app/api/account/notification-settings/route.ts`
- Modify: `components/account/notification-delivery-settings.tsx`
- Modify: `public/push-sw.js`
- Test: `tests/chat-notification-settings.test.tsx`
- Test: `tests/chats-server.integration.test.ts`

**Approach:**
- Сообщение чата создаёт обычный `UserNotification` с типом `CHAT_MESSAGE`, `href` на конкретный чат и текстом вида `Новое сообщение: <listing title>` / `<sender>: <snippet>`.
- Перед отправкой push сервер определяет состояние получателя по `ChatPresence`.
- Если получатель online и вкладка видима, отправляется только realtime event; если online без активного чата, UI покажет toast/badge; если hidden/offline, используется существующий browser push канал.
- `public/push-sw.js` уже умеет открывать `href`; меняется только payload-обогащение при необходимости.
- Текущий settings API расширяется полями `chatSoundEnabled` и `chatPushEnabled`.
- UI настроек получает отдельные переключатели для sound/push именно для чатов.

**Patterns To Follow:**
- `lib/server/notification-dispatch.ts`
- `lib/server/account-notifications.ts`
- `components/account/notification-delivery-settings.tsx`
- `public/push-sw.js`

**Test Scenarios:**
- Happy path: offline пользователь с активной push subscription получает chat notification с корректным `href`.
- Happy path: настройка `chatPushEnabled=false` отключает push только для чатов, не ломая общий канал.
- Happy path: `chatSoundEnabled=false` сохраняется и приходит в следующий сеанс.
- Edge case: протухшая push subscription удаляется так же, как в текущем notification dispatcher.
- Error path: отсутствие VAPID-конфига не ломает отправку сообщения и сохраняет обычное in-app уведомление.
- Integration: click по push переводит в нужный чат и контекст объявления.

**Verification:**
- Chat notifications идут через существующий dispatch pipeline и уважают пользовательские настройки.

- [ ] **Unit 5: Messages UI, Listing Entry Points And Header Badge**

**Goal:** Добавить полноценный раздел сообщений, кнопку входа из карточек объявлений, badge в шапке и управление звуком в интерфейсе.

**Requirements:** R1, R2, R3, R5

**Dependencies:** Unit 2, Unit 3, Unit 4

**Files:**
- Create: `app/messages/page.tsx`
- Create: `app/messages/[id]/page.tsx`
- Create: `components/messages/chat-shell.tsx`
- Create: `components/messages/chat-list.tsx`
- Create: `components/messages/chat-list-item.tsx`
- Create: `components/messages/chat-thread.tsx`
- Create: `components/messages/chat-composer.tsx`
- Create: `components/messages/chat-context-card.tsx`
- Create: `components/messages/chat-sound-toggle.tsx`
- Create: `hooks/use-chat-sound.ts`
- Modify: `components/marketplace/header.tsx`
- Modify: `components/listing/deal-block.tsx`
- Modify: `app/listing/[id]/page.tsx`
- Modify: `app/wanted/[id]/page.tsx`
- Test: `tests/chat-list-page.test.tsx`
- Test: `tests/chat-thread-page.test.tsx`
- Test: `tests/qa/messages.spec.ts`

**Approach:**
- Добавить auth-protected messages section со split-view на десктопе и route-based detail на мобильном.
- В списке чатов показывать аватар собеседника, имя, snapshot объявления, цену/бюджет, последнее сообщение, время, unread.
- Внутри чата показывать шапку собеседника, блок объявления, историю, composer, disabled state во время отправки, optimistic append только после server ack, autoscroll при нахождении пользователя внизу.
- На `DealBlock` карточки продажи вместо внешней логики как единственного канала связи добавить кнопку `Написать`, которая для неавторизованного ведёт на login c `next`, а для авторизованного вызывает `POST /api/chats/open`.
- На wanted detail странице добавить такой же CTA в контексте объявления.
- В шапке сайта добавить badge непрочитанных сообщений рядом с кабинетом или отдельную ссылку `Сообщения`.
- В messages UI добавить быстрый sound toggle, синхронизированный с аккаунтными настройками.

**Patterns To Follow:**
- `app/account/page.tsx`
- `components/marketplace/header.tsx`
- `components/ui/avatar.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/textarea.tsx`
- `components/ui/switch.tsx`
- `components/ui/empty.tsx`

**Test Scenarios:**
- Happy path: открыть чат из sale listing detail.
- Happy path: открыть чат из wanted listing detail.
- Happy path: список чатов показывает корректный контекст объявления и unread badge.
- Happy path: отправка сообщения блокирует повторную отправку до ответа сервера.
- Edge case: пустой список, чат не найден, нет доступа и сетевой сбой отображаются отдельными пустыми состояниями.
- Edge case: длинные сообщения и длинные названия объявлений не ломают верстку.
- Integration: header badge обновляется после входящего сообщения без reload.
- Integration: мобильный переход по `/messages/[id]` открывает нужный чат напрямую из push.

**Verification:**
- Пользователь может начать чат с карточки, видеть контекст объявления и общаться без перезагрузки.

- [ ] **Unit 6: Rollout, Logging And End-To-End Verification**

**Goal:** Подготовить безопасное включение функции и минимально достаточную диагностику в production-like окружении.

**Requirements:** R4, R6, R7

**Dependencies:** Unit 1, Unit 2, Unit 3, Unit 4, Unit 5

**Files:**
- Modify: `lib/server/env.ts`
- Modify: `app/layout.tsx`
- Modify: `app/messages/page.tsx`
- Modify: `app/messages/[id]/page.tsx`
- Test: `tests/chats-server.integration.test.ts`
- Test: `tests/qa/messages.spec.ts`

**Approach:**
- Ввести `CHAT_ENABLED` и `NEXT_PUBLIC_CHAT_ENABLED`.
- Все UI entry points и API routes проверяют флаг и могут возвращать controlled fallback до включения.
- Логировать создание чата, отправку сообщения, read update, ошибки realtime-доставки и push.
- Проверить rollout с учётом того, что текущий build script уже запускает `db:migrate:deploy`; значит миграция должна быть безопасной и быстрой.

**Patterns To Follow:**
- `lib/server/env.ts`
- Existing console logging in `lib/server/notification-dispatch.ts`
- Build pipeline contract from `package.json`

**Test Scenarios:**
- Happy path: при выключенном feature flag UI entry points скрыты, API не активируется.
- Edge case: включённый backend flag при выключенном frontend flag не роняет страницу.
- Integration: QA сценарий покрывает online delivery, unread update, push fallback и deep link.

**Verification:**
- Фича может быть развернута с миграцией заранее и включена отдельно от деплоя кода.

## System-Wide Impact

- **Interaction graph:** listing detail -> open chat API -> chat service -> message persistence -> realtime publisher -> presence evaluation -> user notification -> push service worker -> messages UI and header badge.
- **Error propagation:** ошибки чата должны возвращаться как обычные JSON API ошибки без потери текущей страницы; ошибки push/realtime логируются и не откатывают уже сохранённое сообщение.
- **State lifecycle risks:** двойное создание чата, двойная отправка сообщения, устаревшие presence rows, некорректный unread после нескольких вкладок.
- **API surface parity:** `/api/auth/session` и `/api/account/notification-settings` получают новые поля, поэтому нужно сохранить обратную совместимость существующих потребителей.
- **Integration coverage:** обязательны сценарии online-visible, online-not-active-chat, hidden tab, offline with push, repeated open on same listing, same users on different listings.
- **Unchanged invariants:** текущая cookie-auth, `UserNotification`, `PushSubscription`, `public/push-sw.js`, страницы аккаунта и карточек объявлений продолжают работать без обязательного изменения пользовательского потока вне чатов.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| SSE в Next.js может вести себя нестабильно при агрессивных прокси-таймаутах | Держать endpoint на Node runtime, отправлять keepalive и проверить поведение на текущем хостинге до включения флага |
| Push может срабатывать лишний раз при гонке presence/visibility | Решение строить на свежем heartbeat TTL и консервативном правиле: visible presence подавляет push |
| Непрочитанные сообщения рассинхронизируются при нескольких вкладках | Хранить unread на `ChatParticipant`, read changes слать всем вкладкам пользователя через SSE |
| Изменение `/api/auth/session` затронет шапку | Добавлять новые поля без ломки существующего payload |
| Build pipeline автоматически запускает миграции | Делать миграцию additive-only, без тяжёлых backfill-операций в транзакции деплоя |

## Documentation / Operational Notes

- После реализации обновить ручной smoke-checklist для аккаунта и сообщений.
- Отдельно задокументировать env-переменные `CHAT_ENABLED` и `NEXT_PUBLIC_CHAT_ENABLED`.
- Перед включением флага проверить, что VAPID-конфиг для browser push присутствует на окружении, иначе offline push останется отключённым.

## Sources & References

- Related code: `prisma/schema.prisma`
- Related code: `lib/server/auth.ts`
- Related code: `lib/server/marketplace.ts`
- Related code: `lib/server/admin-activity.ts`
- Related code: `lib/server/account-notifications.ts`
- Related code: `lib/server/notification-dispatch.ts`
- Related code: `public/push-sw.js`
- Related code: `components/account/notification-delivery-settings.tsx`
- Related code: `components/marketplace/header.tsx`
- Related code: `components/listing/deal-block.tsx`
## Additional Hard Requirements Before Implementation

1. `POST /api/chats/open` must be idempotent for the same `contextType + listingId + sorted participant pair`.

2. Message sending must be transactional:

* create `ChatMessage`
* update `Chat.lastMessageAt` / `lastMessageId`
* increment recipient `unreadCount`
* create `UserNotification`
* publish realtime event only after successful commit

3. Message validation:

* trimmed text only
* empty messages are rejected
* max message length: 4000 characters

4. Anti-flood rules for MVP:

* no more than 5 messages per 10 seconds in one chat
* no more than 20 messages per minute per sender globally

5. Presence rules:

* heartbeat interval: 20–30 seconds
* stale TTL: 60–90 seconds
* push must be suppressed if at least one fresh visible presence exists for the recipient

6. Realtime robustness:

* if SSE proves unstable on the current hosting/proxy path, allow fallback to short polling for chat list and unread badge without changing the core chat data model

7. Unread semantics:

* `unreadCount` is stored per `ChatParticipant`
* it counts messages from the other participant created after the participant’s last read marker

8. Snapshot fields should be generalized for both sale and wanted contexts:

* `contextTitleSnapshot`
* `contextPriceSnapshot`
* `contextImageSnapshot`
* `contextStatusSnapshot`
