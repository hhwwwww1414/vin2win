'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ListingStatusBadge } from '@/components/listing/listing-status-badge';
import { LISTING_STATUS_LABELS, LISTING_STATUS_VALUES, type ListingStatusValue } from '@/lib/listing-status';

type WantedAdminItem = {
  id: string;
  models: string[];
  budgetMin?: number | null;
  budgetMax: number;
  region?: string | null;
  comment?: string | null;
  ownerLine: string;
  detailHref: string;
  status: ListingStatusValue;
  moderationNote?: string | null;
  createdAt: string;
  statusUpdatedAt: string;
};

type WantedDraft = {
  models: string;
  budgetMin: string;
  budgetMax: string;
  region: string;
  comment: string;
  status: ListingStatusValue;
  moderationNote: string;
};

function mapDraft(item: WantedAdminItem): WantedDraft {
  return {
    models: item.models.join(', '),
    budgetMin: item.budgetMin ? String(item.budgetMin) : '',
    budgetMax: String(item.budgetMax),
    region: item.region ?? '',
    comment: item.comment ?? '',
    status: item.status,
    moderationNote: item.moderationNote ?? '',
  };
}

export function WantedListingAdminBoard({
  title,
  description,
  items,
  counts,
}: {
  title: string;
  description: string;
  items: WantedAdminItem[];
  counts: Record<ListingStatusValue, number>;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, WantedDraft>>(Object.fromEntries(items.map((item) => [item.id, mapDraft(item)])));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ListingStatusValue>('PENDING');
  const [bulkNote, setBulkNote] = useState('');

  useEffect(() => {
    setDrafts(Object.fromEntries(items.map((item) => [item.id, mapDraft(item)])));
    setSelectedIds((current) => current.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  const allSelected = useMemo(() => items.length > 0 && selectedIds.length === items.length, [items.length, selectedIds.length]);

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : items.map((item) => item.id));
  };

  const updateRow = async (id: string) => {
    setError(null);
    setPendingKey(`${id}:save`);

    try {
      const draft = drafts[id];
      const models = draft.models.split(',').map((item) => item.trim()).filter(Boolean);
      const budgetMax = Number(draft.budgetMax);
      const budgetMin = draft.budgetMin.trim() ? Number(draft.budgetMin) : null;

      if (!models.length) {
        throw new Error('Specify at least one model for the wanted listing.');
      }

      if (!Number.isInteger(budgetMax) || budgetMax <= 0) {
        throw new Error('Budget max must be a positive integer.');
      }

      if (budgetMin !== null && (!Number.isInteger(budgetMin) || budgetMin < 0)) {
        throw new Error('Budget min must be an integer value.');
      }

      const response = await fetch(`/api/admin/wanted-listings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          models,
          budgetMin,
          budgetMax,
          region: draft.region.trim() || null,
          comment: draft.comment.trim() || null,
          status: draft.status,
          moderationNote: draft.moderationNote,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось обновить запрос на подбор.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось обновить запрос на подбор.');
    } finally {
      setPendingKey(null);
    }
  };

  const deleteRow = async (id: string, titleText: string) => {
    if (!window.confirm(`Удалить "${titleText}"? Действие необратимо.`)) {
      return;
    }

    setError(null);
    setPendingKey(`${id}:delete`);

    try {
      const response = await fetch(`/api/admin/wanted-listings/${id}`, {
        method: 'DELETE',
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось удалить запрос на подбор.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось удалить запрос на подбор.');
    } finally {
      setPendingKey(null);
    }
  };

  const applyBulkStatus = async () => {
    if (!selectedIds.length) {
      setError('Select at least one wanted listing.');
      return;
    }

    setError(null);
    setPendingKey('bulk:status');

    try {
      const response = await fetch('/api/admin/wanted-listings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'setStatus',
          ids: selectedIds,
          status: bulkStatus,
          moderationNote: bulkNote,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось применить массовое изменение статуса.');
      }

      setSelectedIds([]);
      setBulkNote('');

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось применить массовое изменение статуса.');
    } finally {
      setPendingKey(null);
    }
  };

  const applyBulkDelete = async () => {
    if (!selectedIds.length) {
      setError('Select at least one wanted listing.');
      return;
    }

    if (!window.confirm(`Удалить ${selectedIds.length} запросов в подбор? Действие необратимо.`)) {
      return;
    }

    setError(null);
    setPendingKey('bulk:delete');

    try {
      const response = await fetch('/api/admin/wanted-listings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          ids: selectedIds,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось удалить выбранные запросы на подбор.');
      }

      setSelectedIds([]);
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось удалить выбранные запросы на подбор.');
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

      <div className="mb-5 rounded-[26px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              <span>Выбрать все</span>
            </label>
            <span className="text-sm text-muted-foreground">Выбрано: {selectedIds.length}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-[180px_1fr_auto_auto] xl:min-w-[760px]">
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ListingStatusValue)}>
              {LISTING_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {LISTING_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <input value={bulkNote} onChange={(event) => setBulkNote(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" placeholder="Общий комментарий для выбранных запросов" />
            <Button variant="outline" disabled={pendingKey === 'bulk:status'} onClick={applyBulkStatus}>
              {pendingKey === 'bulk:status' ? 'Применяем...' : 'Применить статус'}
            </Button>
            <Button variant="outline" disabled={pendingKey === 'bulk:delete'} onClick={applyBulkDelete}>
              {pendingKey === 'bulk:delete' ? 'Удаляем...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="space-y-4">
        {items.length ? (
          items.map((item) => {
            const draft = drafts[item.id];
            const titleText = draft.models;
            const isSaving = pendingKey === `${item.id}:save`;
            const isDeleting = pendingKey === `${item.id}:delete`;
            const isPending = isSaving || isDeleting;

            return (
              <article key={item.id} className="rounded-[26px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="flex gap-4">
                    <div className="pt-1">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{titleText}</h3>
                        <ListingStatusBadge status={draft.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        До {Number(draft.budgetMax || 0).toLocaleString('ru-RU')} ₽
                        {draft.region ? ` • ${draft.region}` : ''}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.ownerLine}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Создано: {item.createdAt}</span>
                        <span>Статус обновлён: {item.statusUpdatedAt}</span>
                      </div>
                      <a href={item.detailHref} className="mt-3 inline-flex text-sm font-medium text-teal-accent hover:underline">
                        Открыть карточку
                      </a>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input value={draft.models} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], models: event.target.value } }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30 md:col-span-2" placeholder="Марки и модели" />
                      <input value={draft.budgetMin} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], budgetMin: event.target.value } }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" placeholder="Бюджет от" />
                      <input value={draft.budgetMax} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], budgetMax: event.target.value } }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" placeholder="Бюджет до" />
                      <input value={draft.region} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], region: event.target.value } }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30 md:col-span-2" placeholder="Регион" />
                    </div>

                    <textarea value={draft.comment} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], comment: event.target.value } }))} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" placeholder="Комментарий к запросу" />

                    <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                      <select value={draft.status} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], status: event.target.value as ListingStatusValue } }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30">
                        {LISTING_STATUS_VALUES.map((status) => (
                          <option key={status} value={status}>
                            {LISTING_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      <input value={draft.moderationNote} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], moderationNote: event.target.value } }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" placeholder="Комментарий модератора" />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" disabled={isPending} onClick={() => deleteRow(item.id, titleText)}>
                        {isDeleting ? 'Удаляем...' : 'Удалить'}
                      </Button>
                      <Button type="button" disabled={isPending} onClick={() => updateRow(item.id)} className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam">
                        {isSaving ? 'Сохраняем...' : 'Сохранить'}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Запросов в подбор пока нет.
          </div>
        )}
      </div>
    </section>
  );
}
