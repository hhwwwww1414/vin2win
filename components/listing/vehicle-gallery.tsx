'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, Heart, Play, X } from 'lucide-react';
import type { Vehicle } from '@/lib/marketplace-data';

type GallerySlide =
  | {
      kind: 'video';
      key: string;
    }
  | {
      kind: 'image';
      key: string;
      src: string;
      imageIndex: number;
    };

interface VehicleGalleryProps {
  vehicle: Vehicle;
}

export function VehicleGallery({ vehicle }: VehicleGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);

  const images = useMemo(() => {
    const galleryImages = vehicle.images.filter(Boolean);
    const fallbackImage = vehicle.imageUrl.trim() ? vehicle.imageUrl : null;

    return galleryImages.length > 0 ? galleryImages : fallbackImage ? [fallbackImage] : [];
  }, [vehicle.imageUrl, vehicle.images]);
  const slides = useMemo<GallerySlide[]>(
    () => [
      ...(vehicle.videoUrl
        ? [
            {
              kind: 'video' as const,
              key: `video:${vehicle.videoUrl}`,
            },
          ]
        : []),
      ...images.map((src, index) => ({
        kind: 'image' as const,
        key: `image:${src}:${index}`,
        src,
        imageIndex: index,
      })),
    ],
    [images, vehicle.videoUrl]
  );
  const hasMedia = slides.length > 0;
  const totalSlides = slides.length;
  const activeIndex = totalSlides === 0 ? 0 : Math.min(selectedIndex, totalSlides - 1);
  const activeSlide = slides[activeIndex];
  const isVideoSlide = activeSlide?.kind === 'video';
  const isLightboxOpen = lightboxIndex !== null;
  const lightboxSlide = lightboxIndex !== null ? slides[lightboxIndex] : null;
  const lightboxIsVideo = lightboxSlide?.kind === 'video';

  const getImageAlt = useCallback(
    (index: number) => `${vehicle.make} ${vehicle.model} ${vehicle.year} — фото экстерьера ${index + 1}`,
    [vehicle.make, vehicle.model, vehicle.year]
  );

  useEffect(() => {
    if (!videoRef.current || !vehicle.videoUrl) return;

    if (isVideoSlide) {
      videoRef.current.play().catch(() => {});
      return;
    }

    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, [isVideoSlide, vehicle.videoUrl]);

  useEffect(() => {
    if (!lightboxVideoRef.current || !vehicle.videoUrl) return;

    if (lightboxIsVideo) {
      lightboxVideoRef.current.play().catch(() => {});
      return;
    }

    lightboxVideoRef.current.pause();
    lightboxVideoRef.current.currentTime = 0;
  }, [lightboxIsVideo, vehicle.videoUrl]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
      if (event.key === 'ArrowLeft') {
        setLightboxIndex((current) =>
          current === null ? null : (current - 1 + totalSlides) % totalSlides
        );
      }
      if (event.key === 'ArrowRight') {
        setLightboxIndex((current) => (current === null ? null : (current + 1) % totalSlides));
      }
    };

    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen, totalSlides]);

  const goToPrevious = () => {
    if (totalSlides < 2) return;
    setSelectedIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const goToNext = () => {
    if (totalSlides < 2) return;
    setSelectedIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null || totalSlides < 2) return;

    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    touchStartX.current = null;
  };

  const openLightbox = (index = activeIndex) => {
    if (!hasMedia) return;
    setLightboxIndex(index);
  };

  const mediaLabel = vehicle.videoUrl
    ? images.length > 0
      ? `${images.length} фото + видео`
      : 'Видео'
    : `${images.length} фото`;

  return (
    <>
      <div className="space-y-4">
        <div
          className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-sm ring-2 ring-border/50"
          onTouchEnd={onTouchEnd}
          onTouchStart={onTouchStart}
        >
          {slides.map((slide, index) =>
            slide.kind === 'image' ? (
              <Image
                key={slide.key}
                src={slide.src}
                alt={getImageAlt(slide.imageIndex)}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                priority={slide.imageIndex === 0}
              />
            ) : (
              <div
                key={slide.key}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <video
                  ref={videoRef}
                  src={vehicle.videoUrl}
                  controls
                  playsInline
                  poster={images[0]}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            )
          )}

          {!hasMedia ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
              Без фото и видео
            </div>
          ) : null}

          {totalSlides > 1 ? (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/95 shadow-md opacity-0 transition-opacity backdrop-blur-sm group-hover:opacity-100 hover:bg-card"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/95 shadow-md opacity-0 transition-opacity backdrop-blur-sm group-hover:opacity-100 hover:bg-card"
                aria-label="Следующее фото"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          ) : null}

          {hasMedia ? (
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-card/90 shadow-sm transition-all backdrop-blur-sm hover:bg-card"
                aria-label="Добавить в избранное"
              >
                <Heart className="h-5 w-5 text-muted-foreground transition-colors hover:text-red-500" />
              </button>
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-card/90 shadow-sm transition-all backdrop-blur-sm hover:bg-card"
                aria-label="Развернуть"
                onClick={() => openLightbox()}
              >
                <Expand className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          ) : null}

          {totalSlides > 0 ? (
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-base font-medium text-white backdrop-blur-sm">
              {isVideoSlide ? <Play className="h-4 w-4 fill-white" /> : null}
              <span>
                {activeIndex + 1} / {totalSlides}
              </span>
            </div>
          ) : null}
        </div>

        {totalSlides > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((slide, index) =>
              slide.kind === 'image' ? (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    index === activeIndex
                      ? 'border-teal-accent ring-1 ring-teal-accent/30'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <Image
                    src={slide.src}
                    alt={getImageAlt(slide.imageIndex)}
                    fill
                    className="object-cover"
                  />
                </button>
              ) : (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    index === activeIndex
                      ? 'border-teal-accent ring-1 ring-teal-accent/30'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  {images[0] ? (
                    <Image
                      src={images[0]}
                      alt={`${vehicle.make} ${vehicle.model} — видео`}
                      fill
                      className="object-cover brightness-50"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted-foreground/20" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                      <Play className="ml-0.5 h-3.5 w-3.5 fill-foreground text-foreground" />
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        ) : null}

        {hasMedia ? (
          <button
            type="button"
            onClick={() => openLightbox()}
            className="text-base font-semibold text-teal-accent underline-offset-4 transition-colors hover:text-teal-dark hover:underline"
          >
            Развернуть все материалы ({mediaLabel})
          </button>
        ) : null}
      </div>

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
              {lightboxSlide?.kind === 'image' ? (
                <Image
                  src={lightboxSlide.src}
                  alt={getImageAlt(lightboxSlide.imageIndex)}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              ) : null}

              {lightboxIsVideo ? (
                <video
                  ref={lightboxVideoRef}
                  src={vehicle.videoUrl}
                  controls
                  playsInline
                  poster={images[0]}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Закрыть"
              className="absolute -top-10 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>

            {totalSlides > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((current) =>
                      current === null ? null : (current - 1 + totalSlides) % totalSlides
                    )
                  }
                  aria-label="Предыдущее фото"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((current) => (current === null ? null : (current + 1) % totalSlides))
                  }
                  aria-label="Следующее фото"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}

            <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-sm text-white">
              {lightboxIndex !== null ? `${lightboxIndex + 1} / ${totalSlides}` : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
