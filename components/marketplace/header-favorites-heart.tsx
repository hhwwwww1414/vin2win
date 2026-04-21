import { Heart } from 'lucide-react';

import { cn } from '@/lib/utils';

export type HeaderFavoritesHeartState = 'default' | 'filled' | 'active';

export function getHeaderFavoritesHeartState(input: {
  favoriteCount: number;
  pathname: string | null;
  hash: string;
}): HeaderFavoritesHeartState {
  if (input.pathname === '/account' && input.hash === '#favorites') {
    return 'active';
  }

  if (input.favoriteCount > 0) {
    return 'filled';
  }

  return 'default';
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
        state === 'filled' && 'fill-current text-teal-accent',
        state === 'active' && 'fill-current text-red-500'
      )}
    />
  );
}
