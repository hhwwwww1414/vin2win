'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

export function PremiumBackground({
  className,
  cursorReactive = true,
}: {
  className?: string;
  cursorReactive?: boolean;
}) {
  const flairRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursorReactive || !flairRef.current) return;

    const flair = flairRef.current;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || reducedMotion) return;

    gsap.set(flair, { xPercent: -50, yPercent: -50, opacity: 1 });
    const xTo = gsap.quickTo(flair, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(flair, 'y', { duration: 0.6, ease: 'power3' });
    const onMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      gsap.set(flair, { opacity: 0 });
    };
  }, [cursorReactive]);

  return (
    <div className={cn('fixed inset-0 pointer-events-none -z-10 overflow-hidden', className)} aria-hidden>
      {/* Clean solid background — no carbon */}
      <div className="absolute inset-0 bg-background" />

      {/* Subtle gradient atmosphere — dark only, tiffany accent */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(129, 216, 208, 0.03) 0%, transparent 55%)',
        }}
      />

      <div
        ref={flairRef}
        className="absolute hidden h-[160px] w-[160px] rounded-full opacity-0 dark:block"
        style={{
          background: 'radial-gradient(circle, rgba(129, 216, 208, 0.06) 0%, transparent 65%)',
          left: 0,
          top: 0,
        }}
      />
    </div>
  );
}
