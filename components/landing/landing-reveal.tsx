'use client';

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type LandingRevealSectionProps = ComponentPropsWithoutRef<'section'> & {
  delay?: number;
};

export function LandingRevealSection({
  children,
  className,
  delay = 0,
  style,
  ...props
}: LandingRevealSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.14,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={cn('landing-reveal', isVisible && 'landing-reveal-visible', className)}
      style={
        {
          ...style,
          '--landing-reveal-delay': `${delay}ms`,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </section>
  );
}
