'use client';

import { startTransition, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  href?: string | null;
};

export function NotificationsPanel({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const markRead = async (notificationId: string) => {
    setError(null);
    setPendingKey(notificationId);

    try {
      const response = await fetch(`/api/account/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось обновить уведомление.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось обновить уведомление.');
    } finally {
      setPendingKey(null);
    }
  };

  const markAllRead = async () => {
    setError(null);
    setPendingKey('all');

    try {
      const response = await fetch('/api/account/notifications/read-all', {
        method: 'POST',
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось обновить список уведомлений.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось обновить список уведомлений.');
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[0_18px_48px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Уведомления</h2>
            <span className="rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-accent">
              Inbox
            </span>
            <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
              Непрочитано: <span className="font-semibold text-foreground">{unreadCount}</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Здесь отображаются решения модерации, публикация карточек и важные изменения по вашему аккаунту.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button variant="outline" disabled={pendingKey === 'all'} onClick={markAllRead}>
            {pendingKey === 'all' ? 'Обновляем...' : 'Отметить все как прочитанные'}
          </Button>
        ) : null}
      </div>

      {error ? <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="mt-5 space-y-3">
        {notifications.length ? (
          notifications.map((notification) => {
            const isPending = pendingKey === notification.id;
            return (
              <article
                key={notification.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  notification.isRead
                    ? 'border-border/70 bg-background/55'
                    : 'border-teal-accent/25 bg-teal-accent/5 shadow-[0_12px_28px_rgba(20,184,166,0.08)]'
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">{notification.title}</h3>
                      {!notification.isRead ? (
                        <span className="rounded-full border border-teal-accent/30 bg-teal-accent/10 px-2 py-0.5 text-[11px] font-medium text-teal-accent">
                          Новое
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{notification.createdAt}</p>
                    {notification.href ? (
                      <div className="mt-3">
                        <Link href={notification.href} className="text-sm font-medium text-teal-accent hover:underline">
                          Перейти
                        </Link>
                      </div>
                    ) : null}
                  </div>
                  {!notification.isRead ? (
                    <Button variant="outline" disabled={isPending} onClick={() => markRead(notification.id)}>
                      {isPending ? 'Сохраняем...' : 'Прочитано'}
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[28px] border border-dashed border-border/80 bg-background/45 p-6 text-sm text-muted-foreground">
            Уведомлений пока нет.
          </div>
        )}
      </div>
    </section>
  );
}
