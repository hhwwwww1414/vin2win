import Link from 'next/link';
import { AdminEntityType, UserRole } from '@prisma/client';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { AdminActivityFeed } from '@/components/admin/admin-activity-feed';
import { SaleListingAdminBoard } from '@/components/admin/sale-listing-admin-board';
import { UserRoleTable } from '@/components/admin/user-role-table';
import { WantedListingAdminBoard } from '@/components/admin/wanted-listing-admin-board';
import { Button } from '@/components/ui/button';
import { getRecentAdminActions } from '@/lib/server/admin-activity';
import { countUsersByRole, getAdminUsers, requireRole } from '@/lib/server/auth';
import { getModerationOverview } from '@/lib/server/moderation';
import { prisma } from '@/lib/server/prisma';

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

function getEntityHref(entityType: AdminEntityType, entityId: string) {
  if (entityType === AdminEntityType.SALE_LISTING) {
    return `/listing/${entityId}`;
  }

  if (entityType === AdminEntityType.WANTED_LISTING) {
    return `/wanted/${entityId}`;
  }

  return '/admin';
}

export default async function AdminPage() {
  const currentUser = await requireRole([UserRole.ADMIN, UserRole.MODERATOR], '/admin');
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const [usersByRole, users, activeSessions, moderation, recentActions] = await Promise.all([
    countUsersByRole(),
    getAdminUsers(),
    prisma.session.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    }),
    getModerationOverview(),
    getRecentAdminActions(24),
  ]);

  const pendingTotal = moderation.saleCounts.PENDING + moderation.wantedCounts.PENDING;

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
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div>
              <p className="inline-flex items-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                {isAdmin ? 'Admin control' : 'Moderation'}
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {isAdmin ? 'Управление пользователями и объявлениями' : 'Панель модерации объявлений'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Текущий оператор: {currentUser.name} • {currentUser.email}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild variant="outline" className="border-border/80 bg-background/70 dark:bg-background/10">
                  <Link href="/account">Вернуться в кабинет</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">На модерации</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{pendingTotal}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Активные сессии</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{activeSessions}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Продажи в системе</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{moderation.saleListings.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Опубликовано: {moderation.saleCounts.PUBLISHED}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wanted в системе</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{moderation.wantedListings.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Опубликовано: {moderation.wantedCounts.PUBLISHED}</p>
              </div>
            </div>
          </div>

          <div className="relative grid gap-4 border-t border-border/60 px-6 pb-6 pt-4 md:grid-cols-3 xl:grid-cols-6 sm:px-8">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
              <p className="text-sm text-muted-foreground">USER</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{usersByRole.users}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
              <p className="text-sm text-muted-foreground">MODERATOR</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{usersByRole.moderators}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
              <p className="text-sm text-muted-foreground">ADMIN</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{usersByRole.admins}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
              <p className="text-sm text-muted-foreground">Деактивированы</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{usersByRole.inactive}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
              <p className="text-sm text-muted-foreground">Продаж на модерации</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{moderation.saleCounts.PENDING}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
              <p className="text-sm text-muted-foreground">Wanted на модерации</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{moderation.wantedCounts.PENDING}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-8">
          <SaleListingAdminBoard
            title="Модерация продаж"
            description="Панель помогает оперативно проверять карточки, менять статус публикации и поддерживать актуальную витрину продаж."
            counts={moderation.saleCounts}
            items={moderation.saleListings.map((listing) => ({
              id: listing.id,
              make: listing.make,
              model: listing.model,
              year: listing.year,
              price: listing.price,
              city: listing.city,
              mileage: listing.mileage,
              description: listing.description,
              ownerLine: `${listing.seller.name}${listing.createdByUser?.email ? ` • ${listing.createdByUser.email}` : ''}`,
              detailHref: `/listing/${listing.id}`,
              status: listing.status,
              moderationNote: listing.moderationNote,
              createdAt: formatDate(listing.createdAt),
              statusUpdatedAt: formatDate(listing.statusUpdatedAt),
              coverUrl: listing.media.find((item) => item.kind === 'GALLERY')?.publicUrl,
            }))}
          />

          <WantedListingAdminBoard
            title="Модерация запросов в подбор"
            description="Панель помогает быстро проверять, актуализировать и публиковать запросы покупателей."
            counts={moderation.wantedCounts}
            items={moderation.wantedListings.map((listing) => ({
              id: listing.id,
              models: listing.models,
              budgetMin: listing.budgetMin,
              budgetMax: listing.budgetMax,
              region: listing.region,
              comment: listing.comment,
              ownerLine: `${listing.author.name}${listing.createdByUser?.email ? ` • ${listing.createdByUser.email}` : ''}`,
              detailHref: `/wanted/${listing.id}`,
              status: listing.status,
              moderationNote: listing.moderationNote,
              createdAt: formatDate(listing.createdAt),
              statusUpdatedAt: formatDate(listing.statusUpdatedAt),
            }))}
          />

          <AdminActivityFeed
            title="История действий"
            description="Журнал действий показывает решения модерации, изменения карточек и работу с аккаунтами."
            items={recentActions.map((action) => ({
              id: action.id,
              title: action.title,
              description: action.description,
              createdAt: formatDateTime(action.createdAt),
              actorLine: `Оператор: ${action.actorUser?.name ?? 'System'}${action.targetUser ? ` • Цель: ${action.targetUser.email}` : ''}`,
              href: getEntityHref(action.entityType, action.entityId),
            }))}
          />
        </section>

        {isAdmin ? (
          <section className="mt-8">
            <UserRoleTable
              currentUserId={currentUser.id}
              users={users.map((user) => ({
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                saleCount: user._count.saleListings,
                wantedCount: user._count.wantedListings,
                createdAt: formatDate(user.createdAt),
                isActive: user.isActive,
                sellerVerified: user.sellerProfile?.verified ?? false,
                activeSessionCount: user.activeSessionCount,
                lastSeenAt: user.lastSeenAt ? formatDateTime(user.lastSeenAt) : null,
              }))}
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
