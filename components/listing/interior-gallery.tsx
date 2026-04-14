'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, Images, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteriorGalleryProps {
  images: string[];
}

export function InteriorGallery({ images }: InteriorGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isOpen = lightboxIndex !== null;

  const close = useCallback(() => setLightboxIndex(null), []);

  const prev = useCallback(
    () => setLightboxIndex((index) => (index === null ? null : (index - 1 + images.length) % images.length)),
    [images.length]
  );

  const next = useCallback(
    () => setLightboxIndex((index) => (index === null ? null : (index + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') prev();
      if (event.key === 'ArrowRight') next();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close, isOpen, next, prev]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <section className="overflow-hidden rounded-[28px] border border-border/70 bg-card/92 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92">
        <div
          className="h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
          aria-hidden="true"
        />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                <Images className="h-3.5 w-3.5" />
                Interior view
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold text-foreground">
                Фотографии салона
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Блок помогает быстро оценить ухоженность интерьера и не терять контекст после
                просмотра экстерьера.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
            >
              <Expand className="h-4 w-4" />
              Открыть галерею
            </button>
          </div>

          <div className="mt-5 grid auto-rows-[120px] grid-cols-2 gap-3 sm:auto-rows-[140px] sm:grid-cols-4">
            {images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-border/70 bg-muted/20 text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  index === 0 && images.length > 3 ? 'sm:col-span-2 sm:row-span-2' : ''
                )}
              >
                <Image
                  src={src}
                  alt={`Фото салона ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes={index === 0 && images.length > 3 ? '(max-width: 640px) 50vw, 40vw' : '(max-width: 640px) 50vw, 20vw'}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 pb-3 pt-10 text-white">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                      Фото {index + 1}
                    </span>
                    <Expand className="h-4 w-4 opacity-80" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
              {images.length} фотографий
            </span>
            <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
              Быстрый доступ к lightbox
            </span>
          </div>
        </div>
      </section>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between text-white">
              <div>
                <p className="text-sm font-semibold">Фотографии салона</p>
                <p className="mt-1 text-xs text-white/70">
                  {lightboxIndex !== null ? `${lightboxIndex + 1} / ${images.length}` : null}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
              <div className="relative aspect-[16/10] w-full">
                {lightboxIndex !== null ? (
                  <Image
                    src={images[lightboxIndex]}
                    alt={`Фото салона ${lightboxIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                ) : null}
              </div>

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Предыдущее фото"
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Следующее фото"
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
