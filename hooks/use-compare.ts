'use client';

import { useEffect, useState } from 'react';

const COMPARE_STORAGE_KEY = 'vin2win_compare_ids';
const COMPARE_CHANGED_EVENT = 'vin2win:compare-changed';
const COMPARE_LIMIT = 4;

function readCompareIds() {
  if (typeof window === 'undefined') {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return [...new Set(parsed.map((value) => (typeof value === 'string' ? value : '')).filter(Boolean))].slice(0, COMPARE_LIMIT);
  } catch {
    return [];
  }
}

function writeCompareIds(ids: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids.slice(0, COMPARE_LIMIT)));
  window.dispatchEvent(new CustomEvent(COMPARE_CHANGED_EVENT, { detail: ids.slice(0, COMPARE_LIMIT) }));
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(readCompareIds());
    sync();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === COMPARE_STORAGE_KEY) {
        sync();
      }
    };

    const handleCustom = () => sync();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(COMPARE_CHANGED_EVENT, handleCustom as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COMPARE_CHANGED_EVENT, handleCustom as EventListener);
    };
  }, []);

  const add = (id: string) => {
    if (!id) {
      return;
    }

    const next = [...new Set([...readCompareIds(), id])].slice(0, COMPARE_LIMIT);
    writeCompareIds(next);
    setIds(next);
  };

  const remove = (id: string) => {
    const next = readCompareIds().filter((value) => value !== id);
    writeCompareIds(next);
    setIds(next);
  };

  const toggle = (id: string) => {
    if (readCompareIds().includes(id)) {
      remove(id);
    } else {
      add(id);
    }
  };

  const clear = () => {
    writeCompareIds([]);
    setIds([]);
  };

  return {
    ids,
    limit: COMPARE_LIMIT,
    has: (id: string) => ids.includes(id),
    add,
    remove,
    toggle,
    clear,
  };
}
