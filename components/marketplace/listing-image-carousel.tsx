'use client';

import { useCallback, useSyncExternalStore } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

type CarouselSlide =
  | {
      kind: 'video';
      key: string;
    }
  | {
      kind: 'image';
      key: string;
      src: string;
      imageNumber: number;
    };

interface ListingImageCarouselProps {
  images: string[];
  videoUrl?: string;
  alt: string;
  priority?: boolean;
  size?: 'card' | 'compact' | 'landscape';
  className?: string;
}

export function ListingImageCarousel({
  images,
  videoUrl,
  alt,
  priority = false,
  size = 'card',
  className,
}: ListingImageCarouselProps) {
  const slides: CarouselSlide[] = [
    ...(videoUrl
      ? [
          {
            kind: 'video' as const,
            key: `video:${videoUrl}`,
          },
        ]
      : []),
    ...images.map((src, index) => ({
      kind: 'image' as const,
      key: `image:${src}:${index}`,
      src,
      imageNumber: index + 1,
    })),
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    loop: false,
    dragFree: false,
    containScroll: 'trimSnaps',
    align: 'start',
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!emblaApi) {
        return () => {};
      }

      emblaApi.on('reInit', onStoreChange).on('select', onStoreChange);
      return () => {
        emblaApi.off('reInit', onStoreChange);
        emblaApi.off('select', onStoreChange);
      };
    },
    [emblaApi]
  );

  const canScrollPrev = useSyncExternalStore(
    subscribe,
    () => emblaApi?.canScrollPrev() ?? false,
    () => false
  );
  const canScrollNext = useSyncExternalStore(
    subscribe,
    () => emblaApi?.canScrollNext() ?? false,
    () => false
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const aspectClass =
    size === 'card' ? 'aspect-[4/3]' : size === 'landscape' ? 'aspect-[16/10]' : 'aspect-[3/2] min-h-0';
  const firstImageSlideIndex = slides.findIndex((slide) => slide.kind === 'image');
  const isCompact = size === 'compact';
  const arrowSize = isCompact ? 'h-6 w-6' : 'h-8 w-8';

  if (!slides.length) {
    return (
      <div
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
      className={cn(
        'group relative overflow-hidden bg-muted',
        size === 'compact' ? 'h-full w-full' : aspectClass,
        className
      )}
    >
      <div ref={emblaRef} className="h-full touch-pan-x overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div key={slide.key} className="relative h-full min-w-0 flex-[0_0_100%]">
              {slide.kind === 'image' ? (
                <Image
                  src={slide.src}
                  alt={`${alt} — фото ${slide.imageNumber}`}
                  fill
                  className="object-cover"
                  sizes={
                    size === 'card'
                      ? '(max-width: 640px) 100vw, 280px'
                      : size === 'landscape'
                        ? '(max-width: 767px) 100vw, (max-width: 1279px) 320px, 360px'
                        : '96px'
                  }
                  priority={priority && index === firstImageSlideIndex}
                />
              ) : (
                <>
                  <video
                    src={videoUrl}
                    poster={images[0]}
                    playsInline
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                    aria-label={`${alt} — видео`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                      <Play className="h-3.5 w-3.5 fill-white" />
                      Видео
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="pointer-events-auto absolute bottom-0 left-0 top-0 flex w-10 items-center justify-start pl-1"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                scrollPrev();
              }}
              disabled={!canScrollPrev}
              className={cn(
                'rounded-full bg-black/50 p-1 text-white shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent disabled:cursor-not-allowed disabled:opacity-30',
                arrowSize
              )}
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-full w-full" />
            </button>
          </div>
          <div
            className="pointer-events-auto absolute bottom-0 right-0 top-0 flex w-10 items-center justify-end pr-1"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                scrollNext();
              }}
              disabled={!canScrollNext}
              className={cn(
                'rounded-full bg-black/50 p-1 text-white shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent disabled:cursor-not-allowed disabled:opacity-30',
                arrowSize
              )}
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-full w-full" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
