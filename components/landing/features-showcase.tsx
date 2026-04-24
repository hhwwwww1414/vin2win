'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Filter, GitCompareArrows, Sparkles, BellRing, Shield, Zap } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const features = [
  {
    title: 'Умный поиск',
    description: 'Фильтры по марке, цене, пробегу, году, истории и статусам.',
    icon: Filter,
  },
  {
    title: 'Сравнение',
    description: 'Shortlist карточек с ценой, пробегом, окраской и техникой бок о бок.',
    icon: GitCompareArrows,
  },
  {
    title: 'Избранное',
    description: 'Сохраняйте варианты для повторной оценки и переговоров.',
    icon: Sparkles,
  },
  {
    title: 'Уведомления',
    description: 'События по объявлениям, модерации и важным изменениям.',
    icon: BellRing,
  },
  {
    title: 'Модерация',
    description: 'Каждое объявление проходит проверку на соответствие стандартам.',
    icon: Shield,
  },
  {
    title: 'Быстрая публикация',
    description: 'От создания до ленты менее чем за 2 часа без лишних шагов.',
    icon: Zap,
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const Icon = feature.icon;
  const cardNumber = String(index + 1).padStart(2, '0');

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.85,
        delay: index * 0.08,
        ease: EASE,
      }}
      className="group relative"
    >
      {/* Subtle glow halo on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-3xl bg-teal-accent/[0.06] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
      />

      <div
        className="
          relative h-full overflow-hidden rounded-3xl
          border border-border/55 bg-card/92 p-5
          shadow-[var(--shadow-surface)] backdrop-blur-sm
          transition-all duration-500
          group-hover:-translate-y-0.5 group-hover:border-teal-accent/30
          group-hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]
          dark:bg-surface-elevated/90
          dark:group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.32)]
          sm:p-6
        "
      >
        {/* Top hairline */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div
            className="
              flex h-11 w-11 items-center justify-center rounded-xl
              border border-teal-accent/20 bg-teal-accent/10 text-teal-accent
              transition-transform duration-500
              group-hover:scale-[1.04]
            "
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <span className="font-mono text-[10.5px] font-medium tracking-[0.16em] text-muted-foreground/60">
            {cardNumber}
          </span>
        </div>

        <div className="relative mt-5">
          <h3 className="font-display text-[16.5px] font-bold tracking-tight text-foreground">
            {feature.title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export function FeaturesShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.5, 1, 1, 0.92]);

  return (
    <section
      ref={containerRef}
      className="relative py-12 sm:py-16 lg:py-20"
      aria-labelledby="features-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_70%_at_20%_40%,rgba(129,216,208,0.035),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_70%_at_80%_60%,rgba(159,229,222,0.03),transparent)]" />
      </div>

      {/* Top continuity hairline */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent sm:inset-x-16"
      />

      <motion.div style={{ opacity }} className="relative">
        {/* Editorial header — title left, description right */}
        <div className="mb-9 lg:mb-12">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, ease: EASE }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Возможности
          </motion.p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <motion.h2
              id="features-heading"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
              className="max-w-2xl font-display text-[1.625rem] font-bold tracking-tight text-foreground sm:text-[1.875rem] lg:text-[2.25rem]"
            >
              <span className="text-balance">Инструменты профессионального уровня</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.85, delay: 0.18, ease: EASE }}
              className="max-w-md text-[13.5px] text-muted-foreground lg:text-right"
            >
              Всё необходимое для работы с автомобилями уже встроено в платформу.
            </motion.p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
