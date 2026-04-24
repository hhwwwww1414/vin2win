'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { Filter, GitCompareArrows, Sparkles, BellRing, Shield, Zap } from 'lucide-react';

const features = [
  {
    title: 'Умный поиск',
    description: 'Фильтры по марке, модели, цене, пробегу, году, кузову, истории и статусам. Найдите нужное за секунды.',
    icon: Filter,
    gradient: 'from-teal-accent/30 to-teal-accent/5',
    glow: 'rgba(129, 216, 208, 0.2)',
  },
  {
    title: 'Сравнение',
    description: 'Shortlist из карточек с ценой, пробегом, окраской и техникой. Все параметры рядом для быстрого решения.',
    icon: GitCompareArrows,
    gradient: 'from-seafoam/30 to-seafoam/5',
    glow: 'rgba(159, 229, 222, 0.2)',
  },
  {
    title: 'Избранное',
    description: 'Сохраняйте варианты для повторной оценки и переговоров. Ваш shortlist всегда под рукой.',
    icon: Sparkles,
    gradient: 'from-accent-strong/30 to-accent-strong/5',
    glow: 'rgba(99, 199, 190, 0.2)',
  },
  {
    title: 'Уведомления',
    description: 'События по объявлениям, модерации и важным изменениям аккаунта. Ничего не пропустите.',
    icon: BellRing,
    gradient: 'from-teal-accent/25 to-transparent',
    glow: 'rgba(129, 216, 208, 0.15)',
  },
  {
    title: 'Модерация',
    description: 'Каждое объявление проходит проверку. Только качественный контент в профессиональной ленте.',
    icon: Shield,
    gradient: 'from-seafoam/25 to-transparent',
    glow: 'rgba(159, 229, 222, 0.15)',
  },
  {
    title: 'Быстрая публикация',
    description: 'От создания до ленты менее чем за 2 часа. Структурированный процесс без лишних шагов.',
    icon: Zap,
    gradient: 'from-accent-strong/25 to-transparent',
    glow: 'rgba(99, 199, 190, 0.15)',
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

  const springConfig = { stiffness: 150, damping: 15 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
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
      {/* Glow effect on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[28px] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundColor: feature.glow }}
      />

      <div className="relative h-full overflow-hidden rounded-[28px] border border-border/50 bg-card/90 p-6 shadow-[var(--shadow-surface)] backdrop-blur-sm transition-all duration-300 group-hover:border-teal-accent/30 group-hover:shadow-[var(--shadow-floating)] dark:bg-surface-elevated/90 sm:p-8">
        {/* Gradient background */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-40 transition-opacity duration-300 group-hover:opacity-60`}
        />

        {/* Top accent */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="relative" style={{ transform: 'translateZ(20px)' }}>
          {/* Icon */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-accent/20 bg-teal-accent/10 text-teal-accent transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-7 w-7" />
          </div>

          {/* Content */}
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
            {feature.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.9]);

  return (
    <section
      ref={containerRef}
      className="relative py-20 sm:py-28 lg:py-36"
      aria-labelledby="features-heading"
    >
      {/* Background pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_20%_40%,rgba(129,216,208,0.05),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_80%_60%,rgba(159,229,222,0.04),transparent)]" />
      </div>

      <motion.div style={{ opacity }} className="relative">
        {/* Header */}
        <div className="mb-16 lg:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-meta font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Возможности
          </motion.p>
          <motion.h2
            id="features-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            <span className="text-balance">Инструменты профессионального уровня</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-2xl text-lg text-muted-foreground"
          >
            Всё необходимое для эффективной работы с автомобилями уже встроено в платформу.
          </motion.p>
        </div>

        {/* Features grid */}
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
