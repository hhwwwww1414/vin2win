'use client';

import { startTransition, useState } from 'react';
import Link from 'next/link';
import { Bell, BellOff, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { buildSaleSearchParams, describeSaleSearch } from '@/lib/sale-search';
import { SALE_ROUTE } from '@/lib/routes';
import type { SavedSearchRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function SavedSearchesPanel({ items }: { items: SavedSearchRecord[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateItem = async (id: string, payload: { notifyEnabled?: boolean }) => {
    setPendingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/account/saved-searches/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? 'Не удалось обновить сохранённый поиск.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось обновить сохранённый поиск.');
    } finally {
      setPendingId(null);
    }
  };

  const deleteItem = async (id: string) => {
    setPendingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/account/saved-searches/${id}`, {
        method: 'DELETE',
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? 'Не удалось удалить сохранённый поиск.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось удалить сохранённый поиск.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[0_18px_48px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Сохранённые поиски</h2>
          <p className="mt-1 text-sm text-muted-foreground">Храните готовые фильтры и включайте уведомления о новых совпадениях.</p>
        </div>
        <span className="text-sm text-muted-foreground">{items.length}</span>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="space-y-3">
        {items.length ? (
          items.map((item) => {
            const query = buildSaleSearchParams({ ...item.filters, page: 1 }).toString();
            const isPending = pendingId === item.id;
            return (
              <div key={item.id} className="rounded-[24px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={query ? `${SALE_ROUTE}?${query}` : SALE_ROUTE}
                      className="text-sm font-semibold text-foreground transition-colors hover:text-teal-accent"
                    >
                      {item.name ?? 'Сохранённый поиск'}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{describeSaleSearch(item.filters)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => updateItem(item.id, { notifyEnabled: !item.notifyEnabled })}>
                      {item.notifyEnabled ? <Bell className="mr-1.5 h-3.5 w-3.5" /> : <BellOff className="mr-1.5 h-3.5 w-3.5" />}
                      {item.notifyEnabled ? 'Уведомления включены' : 'Уведомления выключены'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => deleteItem(item.id)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[28px] border border-dashed border-border/80 bg-background/45 p-6 text-sm text-muted-foreground">
            Сохранённых поисков пока нет. Сохраните фильтры из основной ленты, и они появятся здесь.
          </div>
        )}
      </div>
    </section>
  );
}
