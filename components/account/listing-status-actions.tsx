'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListingStatusActionsProps {
  listingId: string;
  currentStatus: string;
}

const STATUS_ACTIONS: Record<string, { label: string; nextStatus: string; icon: typeof Archive; variant: 'outline' | 'destructive' }[]> = {
  PUBLISHED: [
    { label: 'Снять с публикации', nextStatus: 'ARCHIVED', icon: Archive, variant: 'outline' },
  ],
  DRAFT: [
    { label: 'На модерацию', nextStatus: 'PENDING', icon: RotateCcw, variant: 'outline' },
  ],
  REJECTED: [
    { label: 'На модерацию повторно', nextStatus: 'PENDING', icon: RotateCcw, variant: 'outline' },
  ],
  ARCHIVED: [
    { label: 'На модерацию повторно', nextStatus: 'PENDING', icon: RotateCcw, variant: 'outline' },
  ],
};

export function ListingStatusActions({ listingId, currentStatus }: ListingStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = STATUS_ACTIONS[currentStatus];
  if (!actions?.length) return null;

  async function handleAction(nextStatus: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/account/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Ошибка');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.nextStatus}
            variant={action.variant}
            size="sm"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleAction(action.nextStatus);
            }}
            className="text-xs"
          >
            <Icon className="mr-1 h-3.5 w-3.5" />
            {loading ? 'Обновляем...' : action.label}
          </Button>
        );
      })}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
