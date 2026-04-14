'use client';

import { startTransition, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const FAVORITES_CHANGED_EVENT = 'vin2win:favorites-changed';

export function FavoriteToggle({
  listingId,
  initialActive = false,
  isAuthenticated = false,
  loginHref = '/login?next=%2F',
  className,
  compact = false,
}: {
  listingId: string;
  initialActive?: boolean;
  isAuthenticated?: boolean;
  loginHref?: string;
  className?: string;
  compact?: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive]);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = loginHref;
      return;
    }

    setPending(true);

    try {
      const response = await fetch(`/api/account/favorites/${listingId}`, {
        method: 'POST',
      });
      const payload = (await response.json().catch(() => null)) as { active?: boolean; error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось обновить избранное.');
      }

      const nextActive = Boolean(payload?.active);
      setActive(nextActive);
      window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, { detail: { listingId, active: nextActive } }));
      startTransition(() => {
        toast({
          title: nextActive ? 'Добавлено в избранное' : 'Удалено из избранного',
          description: nextActive ? 'Объявление сохранено в вашем кабинете.' : 'Объявление убрано из избранного.',
        });
      });
    } catch (error) {
      toast({
        title: 'Не удалось обновить избранное',
        description: error instanceof Error ? error.message : 'Повторите попытку ещё раз.',
        variant: 'destructive',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={active ? 'Убрать из избранного' : 'Добавить в избранное'}
      aria-pressed={active}
      onClick={handleClick}
      disabled={pending}
      className={cn(
        'inline-flex items-center justify-center rounded-full border backdrop-blur transition-colors',
        compact ? 'h-8 w-8' : 'h-9 w-9',
        active
          ? 'border-teal-accent/40 bg-teal-accent/12 text-teal-accent'
          : 'border-border/80 bg-card/90 text-muted-foreground hover:border-teal-accent/30 hover:text-foreground',
        pending && 'cursor-wait opacity-80',
        className
      )}
    >
      <Heart className={cn('h-4 w-4', active && 'fill-current')} />
    </button>
  );
}
