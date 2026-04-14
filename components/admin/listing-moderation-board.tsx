'use client';

import Image from 'next/image';
import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingStatusBadge } from '@/components/listing/listing-status-badge';
import { LISTING_STATUS_LABELS, LISTING_STATUS_VALUES, type ListingStatusValue } from '@/lib/listing-status';

type ModerationItem = {
  id: string;
  title: string;
  subtitle: string;
  ownerLine: string;
  detailHref: string;
  status: ListingStatusValue;
  moderationNote?: string | null;
  createdAt: string;
  statusUpdatedAt: string;
  coverUrl?: string;
};

type ListingModerationBoardProps = {
  title: string;
  description: string;
  endpointBase: string;
  items: ModerationItem[];
  counts: Record<ListingStatusValue, number>;
  allowDelete?: boolean;
};

export function ListingModerationBoard({
  title,
  description,
  endpointBase,
  items,
  counts,
  allowDelete = true,
}: ListingModerationBoardProps) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, { status: ListingStatusValue; moderationNote: string }>>(
    Object.fromEntries(
      items.map((item) => [
        item.id,
        {
          status: item.status,
          moderationNote: item.moderationNote ?? '',
        },
      ])
    )
  );

  useEffect(() => {
    setState(
      Object.fromEntries(
        items.map((item) => [
          item.id,
          {
            status: item.status,
            moderationNote: item.moderationNote ?? '',
          },
        ])
      )
    );
  }, [items]);

  const updateRow = async (id: string) => {
    setError(null);
    setPendingKey(`${id}:save`);

    try {
      const rowState = state[id];
      const response = await fetch(`${endpointBase}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: rowState.status,
          moderationNote: rowState.moderationNote,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось обновить объявление.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось обновить объявление.');
    } finally {
      setPendingKey(null);
    }
  };

  const deleteRow = async (id: string, itemTitle: string) => {
    const isConfirmed = window.confirm(`Удалить "${itemTitle}"? Действие необратимо.`);
    if (!isConfirmed) {
      return;
    }

    setError(null);
    setPendingKey(`${id}:delete`);

    try {
      const response = await fetch(`${endpointBase}/${id}`, {
        method: 'DELETE',
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось удалить объявление.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось удалить объявление.');
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-xl">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {LISTING_STATUS_VALUES.map((status) => (
            <span key={status} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              <span>{LISTING_STATUS_LABELS[status]}</span>
              <span className="font-semibold text-foreground">{counts[status]}</span>
            </span>
          ))}
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="space-y-4">
        {items.length ? (
          items.map((item) => {
            const rowState = state[item.id];
            const isSaving = pendingKey === `${item.id}:save`;
            const isDeleting = pendingKey === `${item.id}:delete`;
            const isPending = isSaving || isDeleting;

            return (
              <article key={item.id} className="grid gap-4 rounded-2xl border border-border/70 bg-background/60 p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                <div className="flex gap-4">
                  {item.coverUrl ? (
                    <div className="hidden h-24 w-32 overflow-hidden rounded-xl border border-border/70 bg-muted/20 sm:block">
                      <Image src={item.coverUrl} alt={item.title} width={128} height={96} unoptimized className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                      <ListingStatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.ownerLine}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Создано: {item.createdAt}</span>
                      <span>Статус обновлён: {item.statusUpdatedAt}</span>
                    </div>
                    <a href={item.detailHref} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-accent hover:underline">
                      Открыть карточку
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[220px_1fr] xl:grid-cols-1">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Статус</span>
                    <select
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30"
                      value={rowState.status}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            status: event.target.value as ListingStatusValue,
                          },
                        }))
                      }
                    >
                      {LISTING_STATUS_VALUES.map((status) => (
                        <option key={status} value={status}>
                          {LISTING_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Комментарий модератора</span>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30"
                      placeholder="Причина отклонения, пояснение по публикации или внутренний комментарий"
                      value={rowState.moderationNote}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            moderationNote: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>

                  <div className="flex justify-end gap-2">
                    {allowDelete ? (
                      <Button type="button" variant="outline" disabled={isPending} onClick={() => deleteRow(item.id, item.title)}>
                        {isDeleting ? 'Удаляем...' : 'Удалить'}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={() => updateRow(item.id)}
                      className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                    >
                      {isSaving ? 'Сохраняем...' : 'Сохранить'}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Объявлений в этом разделе пока нет.
          </div>
        )}
      </div>
    </section>
  );
}
