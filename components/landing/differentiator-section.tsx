'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { X, Check, ShieldAlert, ShieldCheck, FileWarning, FileCheck, Users, UserCheck } from 'lucide-react';

const comparisons = [
  {
    chaos: {
      title: 'Хаотичные доски',
      icon: ShieldAlert,
      points: [
        'Смешение B2B и B2C трафика',
        'Непроверенные продавцы',
        'Разрозненные описания',
        'Нет структуры данных',
      ],
    },
    order: {
      title: 'vin2win',
      icon: ShieldCheck,
      points: [
        'Только профессионалы',
        'Верифицированные аккаунты',
        'Единый формат карточки',
        'Структурированные данные',
      ],
    },
  },
  {
    chaos: {
      title: 'Случайный контент',
      icon: FileWarning,
      points: [
        'Неполные объявления',
        'Устаревшая информация',
        'Низкое качество фото',
        'Нет истории авто',
      ],
    },
    order: {
      title: 'vin2win',
      icon: FileCheck,
      points: [
        'Обязательные поля',
        'Актуальные статусы',
        'Стандарты качества',
        'Полный паспорт авто',
      ],
    },
  },
  {
    chaos: {
      title: 'Общий доступ',
      icon: Users,
      points: [
        'Частные покупатели',
        'Случайные запросы',
        'Нецелевые звонки',
        'Потеря времени',
      ],
    },
    order: {
      title: 'vin2win',
      icon: UserCheck,
      points: [
        'Целевая аудитория',
        'Профессиональные запросы',
        'Релевантные контакты',
        'Эффективное время',
      ],
    },
  },
];

export function DifferentiatorSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.9]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-20 sm:py-28 lg:py-36"
      aria-labelledby="differentiator-heading"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-elevated/40 to-transparent dark:via-surface-elevated/60" />
        {/* Dividing line effect */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border/50 to-transparent" />
      </div>

      <motion.div style={{ opacity }} className="relative">
        {/* Header */}
        <div className="mb-16 text-center lg:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-meta font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Почему vin2win
          </motion.p>
          <motion.h2
            id="differentiator-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            <span className="text-balance">Структура вместо хаоса</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground"
          >
            Сравните работу на общих досках и профессиональной платформе
          </motion.p>
        </div>

        {/* Comparison cards */}
        <div className="space-y-8">
          {comparisons.map((comparison, compIndex) => (
            <motion.div
              key={compIndex}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.7,
                delay: compIndex * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="grid gap-4 lg:grid-cols-2 lg:gap-6"
            >
              {/* Chaos side */}
              <div className="group relative overflow-hidden rounded-[28px] border border-destructive/20 bg-destructive/[0.03] p-6 transition-all duration-300 hover:border-destructive/30 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <comparison.chaos.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {comparison.chaos.title}
                  </h3>
                </div>
                <ul className="mt-6 space-y-3">
                  {comparison.chaos.points.map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: compIndex * 0.1 + i * 0.05 }}
                      className="flex items-center gap-3 text-muted-foreground"
                    >
                      <X className="h-4 w-4 shrink-0 text-destructive/70" />
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Order side */}
              <div className="group relative overflow-hidden rounded-[28px] border border-teal-accent/25 bg-teal-accent/[0.04] p-6 transition-all duration-300 hover:border-teal-accent/40 sm:p-8">
                {/* Accent glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-br from-teal-accent/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-accent/15 text-teal-accent ring-1 ring-teal-accent/20">
                    <comparison.order.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {comparison.order.title}
                  </h3>
                </div>
                <ul className="relative mt-6 space-y-3">
                  {comparison.order.points.map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: compIndex * 0.1 + i * 0.05 + 0.1 }}
                      className="flex items-center gap-3 text-foreground"
                    >
                      <Check className="h-4 w-4 shrink-0 text-teal-accent" />
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
