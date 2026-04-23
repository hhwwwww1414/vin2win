import { Heart } from 'lucide-react';

import { cn } from '@/lib/utils';

export type HeaderFavoritesHeartState = 'default' | 'filled';

export function getHeaderFavoritesHeartState(favoriteCount: number): HeaderFavoritesHeartState {
  return favoriteCount > 0 ? 'filled' : 'default';
}

export function HeaderFavoritesHeartIcon({
  state,
  className,
}: {
  state: HeaderFavoritesHeartState;
  className?: string;
}) {
  return (
    <Heart
      data-favorites-heart-state={state}
      className={cn(
        className,
        state === 'default' && 'text-muted-foreground',
        state === 'filled' && 'fill-current text-red-500'
      )}
    />
  );
}
