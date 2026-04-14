'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

const VIEWED_LISTINGS_STORAGE_KEY = 'vin2win:viewed-sale-listings';

function readViewedListings(): string[] {
  try {
    const raw = window.localStorage.getItem(VIEWED_LISTINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeViewedListings(ids: string[]) {
  window.localStorage.setItem(VIEWED_LISTINGS_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function ViewCountBadge({
  listingId,
  initialCount,
  shouldTrack,
}: {
  listingId: string;
  initialCount: number;
  shouldTrack: boolean;
}) {
  const [viewCount, setViewCount] = useState(initialCount);

  useEffect(() => {
    if (!shouldTrack) {
      return;
    }

    const viewedIds = readViewedListings();
    if (viewedIds.includes(listingId)) {
      return;
    }

    writeViewedListings([...viewedIds, listingId]);

    void fetch(`/api/listings/${listingId}/view`, {
      method: 'POST',
      cache: 'no-store',
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { viewCount?: number } | null;
        if (response.ok && typeof payload?.viewCount === 'number') {
          setViewCount(payload.viewCount);
        }
      })
      .catch(() => {});
  }, [listingId, shouldTrack]);

  return (
    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Eye className="h-4 w-4 shrink-0" />
      <span>просмотров: {viewCount.toLocaleString('ru-RU')}</span>
    </div>
  );
}
