'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Users, Car, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

type Stat = {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  hint: string;
  icon: typeof ShieldCheck;
};

const STATS: Stat[] = [
  {
    label: 'Активных карточек',
    value: 12500,
    suffix: '+',
    hint: 'В ленте после модерации',
    icon: Car,
  },
  {
    label: 'Профессионалов',
    value: 3400,
    suffix: '+',
    hint: 'Продавцы, подборщики, менеджеры',
    icon: Users,
  },
  {
    label: 'Модерация',
    value: 98,
    suffix: '%',
    hint: 'Карточек прошли структурную проверку',
    icon: ShieldCheck,
  },
  {
    label: 'Среднее время отклика',
    value: 4,
    suffix: ' мин',
    hint: 'От сообщения до ответа в чате',
    icon: Activity,
  },
];

function useCountUp(target: number, durationMs: number, start: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [start, target, durationMs]);

  return value;
}

function StatCard({ stat, started, delay }: { stat: Stat; started: boolean; delay: number }) {
  const value = useCountUp(stat.value, 1400, started);
  const Icon = stat.icon;
  const formatted = value.toLocaleString('ru-RU');

  return (
    <div
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'group relative overflow-hidden rounded-[24px] border border-border/70 bg-card/92 p-5 shadow-[var(--shadow-surface)] transition-all duration-500 ease-out',
        'hover:-translate-y-0.5 hover:border-teal-accent/40 hover:shadow-[var(--shadow-floating)]',
        'dark:bg-surface-elevated/92',
        started ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/50 to-transparent opacity-60"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          {stat.label}
        </span>
      </div>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-[2rem] font-bold tracking-tight text-foreground tabular-nums sm:text-[2.25rem]">
          {stat.prefix}
          {formatted}
        </span>
        {stat.suffix ? (
          <span className="font-display text-lg font-semibold text-teal-accent">{stat.suffix}</span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stat.hint}</p>
    </div>
  );
}

export function HomeStats() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setStarted(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="Платформа в цифрах" className="pt-6 sm:pt-8">
      <div ref={ref} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} started={started} delay={index * 90} />
        ))}
      </div>
    </section>
  );
}
