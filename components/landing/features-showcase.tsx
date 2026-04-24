'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { Filter, GitCompareArrows, Sparkles, BellRing, Shield, Zap } from 'lucide-react';

const features = [
  {
    title: 'Умный поиск',
    description: 'Фильтры по марке, цене, пробегу, году, истории и статусам.',
    icon: Filter,
    glow: 'rgba(129, 216, 208, 0.18)',
  },
  {
    title: 'Сравнение',
    description: 'Shortlist карточек с ценой, пробегом, окраской и техникой бок о бок.',
    icon: GitCompareArrows,
    glow: 'rgba(159, 229, 222, 0.18)',
  },
  {
    title: 'Избранное',
    description: 'Сохраняйте варианты для повторной оценки и переговоров.',
    icon: Sparkles,
    glow: 'rgba(99, 199, 190, 0.18)',
  },
  {
    title: 'Уведомления',
    description: 'События по объявлениям, модерации и важным изменениям.',
    icon: BellRing,
    glow: 'rgba(129, 216, 208, 0.14)',
  },
  {
    title: 'Модерация',
    description: 'Каждое объявление проходит проверку на соответствие стандартам.',
    icon: Shield,
    glow: 'rgba(159, 229, 222, 0.14)',
  },
  {
    title: 'Быстрая публикация',
    description: 'От создания до ленты менее чем за 2 часа без лишних шагов.',
    icon: Zap,
    glow: 'rgba(99, 199, 190, 0.14)',
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 18 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), springConfig);

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const Icon = feature.icon;

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="group relative"
    >
      {/* Glow on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundColor: feature.glow }}
      />

      <div className="relative h-full overflow-hidden rounded-3xl border border-border/50 bg-card/90 p-5 shadow-[var(--shadow-surface)] backdrop-blur-sm transition-colors duration-300 group-hover:border-teal-accent/30 dark:bg-surface-elevated/90 sm:p-6">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="relative" style={{ transform: 'translateZ(20px)' }}>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-teal-accent/20 bg-teal-accent/10 text-teal-accent transition-transform duration-300 group-hover:scale-105">
            <Icon className="h-5 w-5" />
          </div>

          <h3 className="font-display text-[17px] font-bold tracking-tight text-foreground">
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

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.9]);

  return (
    <section
      ref={containerRef}
      className="relative py-14 sm:py-18 lg:py-22"
      aria-labelledby="features-heading"
    >
      {/* Background pattern */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_70%_at_20%_40%,rgba(129,216,208,0.04),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_70%_at_80%_60%,rgba(159,229,222,0.035),transparent)]" />
      </div>

      <motion.div style={{ opacity }} className="relative">
        {/* Compact header */}
        <div className="mb-10 lg:mb-12">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-accent"
          >
            Возможности
          </motion.p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <motion.h2
              id="features-heading"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl font-display text-[1.75rem] font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
            >
              <span className="text-balance">Инструменты профессионального уровня</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.65, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md text-[14px] text-muted-foreground lg:text-right"
            >
              Всё необходимое для работы с автомобилями уже встроено в платформу.
            </motion.p>
          </div>
        </div>

        {/* Features grid - tighter gaps */}
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={{ perspective: '1000px' }}
        >
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
