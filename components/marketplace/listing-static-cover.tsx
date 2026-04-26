'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type ListingStaticCoverProps = {
  images: string[];
  alt: string;
  priority?: boolean;
  size?: 'card' | 'compact' | 'landscape';
  className?: string;
};

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

export function useDesktopMediaQuery() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

export function ListingStaticCover({
  images,
  alt,
  priority = false,
  size = 'card',
  className,
}: ListingStaticCoverProps) {
  const cover = images[0];
  const aspectClass =
    size === 'card' ? 'aspect-[4/3]' : size === 'landscape' ? 'aspect-[16/10]' : 'aspect-[3/2] min-h-0';

  if (!cover) {
    return (
      <div
        data-mobile-static-cover="true"
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground dark:bg-surface-3',
          size === 'compact' ? 'h-full w-full' : aspectClass,
          className
        )}
      >
        <span className="text-xs">Нет фото</span>
      </div>
    );
  }

  return (
    <div
      data-mobile-static-cover="true"
      className={cn(
        'relative overflow-hidden bg-muted',
        size === 'compact' ? 'h-full w-full' : aspectClass,
        className
      )}
    >
      <Image
        src={cover}
        alt={`${alt} — фото 1`}
        fill
        className="object-cover"
        sizes={
          size === 'card'
            ? '(max-width: 640px) 100vw, 280px'
            : size === 'landscape'
              ? '(max-width: 767px) 100vw, (max-width: 1279px) 320px, 360px'
              : '96px'
        }
        priority={priority}
      />
    </div>
  );
}
