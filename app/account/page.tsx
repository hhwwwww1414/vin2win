import Image from 'next/image';
import Link from 'next/link';
import { Copy, Eye, FilePenLine } from 'lucide-react';
import { NotificationDeliverySettings } from '@/components/account/notification-delivery-settings';
import { AccountSellerProfilePanel } from '@/components/account/seller-profile-panel';
import { SavedSearchesPanel } from '@/components/account/saved-searches-panel';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { FavoriteToggle } from '@/components/marketplace/favorite-toggle';
import { NotificationsPanel } from '@/components/account/notifications-panel';
import { ListingStatusActions } from '@/components/account/listing-status-actions';
import { ListingStatusBadge } from '@/components/listing/listing-status-badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/price-formatting';
import { cleanSaleSearchFiltersForPersistence } from '@/lib/sale-search';
import { getAccountOverview, requireAuthenticatedUser } from '@/lib/server/auth';
import { mapSellerProfileRecord } from '@/lib/server/seller-profile';

export const dynamic = 'force-dynamic';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default async function AccountPage() {
  const currentUser = await requireAuthenticatedUser('/account');
  const overview = await getAccountOverview(currentUser.id);

  if (!overview) {
    return null;
  }

  const canOpenAdmin = overview.role === 'ADMIN' || overview.role === 'MODERATOR';
  const generatedAt = overview.generatedAt.getTime();
  const savedSearches = overview.savedSearches.map((item) => ({
    id: item.id,
    name: item.name ?? undefined,
    filters: cleanSaleSearchFiltersForPersistence(item.filters as Record<string, unknown>),
    notifyEnabled: item.notifyEnabled,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
  const sellerProfile = overview.sellerProfile ? mapSellerProfileRecord(overview.sellerProfile) : null;

  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
            <div>
              <p className="inline-flex items-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                Личный кабинет
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {overview.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {overview.email}
                {overview.phone ? ` • ${overview.phone}` : ''}
                {` • роль ${overview.role}`}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                >
                  <Link href="/listing/new">Подать объявление</Link>
                </Button>
                {canOpenAdmin ? (
                  <Button asChild variant="outline" className="border-border/80 bg-background/70 dark:bg-background/10">
                    <Link href="/admin">Открыть панель</Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Профиль продавца</p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {overview.sellerProfile?.name ?? 'Не создан'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Непрочитанные</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{overview.unreadNotifications}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Объявлений о продаже</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{overview.saleListings.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Запросов в подбор</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{overview.wantedListings.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <AccountSellerProfilePanel sellerProfile={sellerProfile} />
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
          <NotificationsPanel
            unreadCount={overview.unreadNotifications}
            notifications={overview.notifications.map((notification) => ({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              createdAt: formatDateTime(notification.createdAt),
              isRead: notification.isRead,
              href: notification.href,
            }))}
          />
          <NotificationDeliverySettings
            emailEnabled={overview.emailNotificationsEnabled}
            telegramEnabled={overview.telegramNotificationsEnabled}
            browserPushEnabled={overview.browserPushEnabled}
            chatSoundEnabled={overview.chatSoundEnabled}
            chatPushEnabled={overview.chatPushEnabled}
            telegramChatId={overview.telegramChatId}
            hasPushSubscription={overview.pushSubscriptions.length > 0}
            lastPushSuccessAt={overview.pushSubscriptions[0]?.lastSuccessAt ? formatDateTime(overview.pushSubscriptions[0].lastSuccessAt) : null}
          />
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section id="favorites" className="rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Избранное</h2>
                <p className="mt-1 text-sm text-muted-foreground">Сохранённые карточки, которые удобно держать под рукой для повторного просмотра и сравнения.</p>
              </div>
              <span className="text-sm text-muted-foreground">{overview.favorites.length}</span>
            </div>
            <div className="space-y-4">
              {overview.favorites.length ? (
                overview.favorites.map((favorite) => {
                  const listing = favorite.saleListing;
                  const cover = listing.media.find((item) => item.kind === 'GALLERY')?.publicUrl;
                  return (
                    <div key={favorite.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <Link href={`/listing/${listing.id}`} className="overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                          {cover ? (
                            <Image src={cover} alt={`${listing.make} ${listing.model}`} width={160} height={128} unoptimized className="h-32 w-full object-cover" />
                          ) : (
                            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Без фото</div>
                          )}
                        </Link>
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <Link href={`/listing/${listing.id}`} className="font-semibold text-foreground transition-colors hover:text-teal-accent">
                                {listing.make} {listing.model}, {listing.year}
                              </Link>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {listing.city} • {formatPrice(listing.price)}
                              </p>
                            </div>
                            <FavoriteToggle listingId={listing.id} initialActive isAuthenticated />
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">
                            Сохранено {formatDate(favorite.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Пока нет сохранённых карточек. Добавляйте интересные предложения в избранное прямо из ленты.
                </div>
              )}
            </div>
          </section>

          <SavedSearchesPanel items={savedSearches} />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Мои объявления</h2>
              <span className="text-sm text-muted-foreground">{overview.saleListings.length}</span>
            </div>
            <div className="space-y-4">
              {overview.saleListings.length ? (
                overview.saleListings.map((listing) => {
                  const cover = listing.media.find((item) => item.kind === 'GALLERY')?.publicUrl;
                  return (
                    <div
                      key={listing.id}
                      className="rounded-2xl border border-border/70 bg-background/60 p-4 transition-colors hover:border-teal-accent/35 hover:bg-background/80"
                    >
                      <Link href={`/listing/${listing.id}`} className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                          {cover ? (
                            <Image src={cover} alt={`${listing.make} ${listing.model}`} width={160} height={128} unoptimized className="h-32 w-full object-cover" />
                          ) : (
                            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Без фото</div>
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {listing.make} {listing.model}
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {listing.year} • {listing.city} • {formatPrice(listing.price)}
                              </p>
                            </div>
                            <ListingStatusBadge status={listing.status} />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>Создано {formatDate(listing.createdAt)}</span>
                            {listing.publishedAt ? (
                              <span>Опубликовано {formatDate(listing.publishedAt)} ({Math.max(1, Math.ceil((generatedAt - listing.publishedAt.getTime()) / 86_400_000))} дн.)</span>
                            ) : null}
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {listing.viewCount.toLocaleString('ru-RU')}
                            </span>
                          </div>
                          {listing.moderationNote ? (
                            <div className="mt-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
                              {listing.moderationNote}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                      <ListingStatusActions listingId={listing.id} currentStatus={listing.status} />
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/listing/new?edit=${listing.id}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <FilePenLine className="h-3.5 w-3.5" />
                          Редактировать
                        </Link>
                        <Link
                          href={`/listing/new?duplicate=${listing.id}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Дублировать
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  У вас пока нет объявлений о продаже.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Мои запросы в подбор</h2>
              <span className="text-sm text-muted-foreground">{overview.wantedListings.length}</span>
            </div>
            <div className="space-y-4">
              {overview.wantedListings.length ? (
                overview.wantedListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/wanted/${listing.id}`}
                    className="block rounded-2xl border border-border/70 bg-background/60 p-4 transition-colors hover:border-teal-accent/35 hover:bg-background/80"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{listing.models.join(', ')}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          До {formatPrice(listing.budgetMax)}
                          {listing.region ? ` • ${listing.region}` : ''}
                        </p>
                      </div>
                      <ListingStatusBadge status={listing.status} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Создано {formatDate(listing.createdAt)}</p>
                    {listing.publishedAt ? (
                      <p className="mt-1 text-sm text-muted-foreground">Опубликовано {formatDate(listing.publishedAt)}</p>
                    ) : null}
                    {listing.moderationNote ? (
                      <div className="mt-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
                        {listing.moderationNote}
                      </div>
                    ) : null}
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  У вас пока нет запросов на подбор.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
