'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  X,
  Check,
  ShieldAlert,
  ShieldCheck,
  FileWarning,
  FileCheck,
  Users,
  UserCheck,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const comparisons = [
  {
    topic: 'Структура',
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
    topic: 'Контент',
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
    topic: 'Аудитория',
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

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.5, 1, 1, 0.92]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
      aria-labelledby="differentiator-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-elevated/25 to-transparent dark:via-surface-elevated/40" />
      </div>

      {/* Top continuity hairline */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent sm:inset-x-16"
      />

      <motion.div style={{ opacity }} className="relative">
        {/* Header */}
        <div className="mb-9 text-center lg:mb-12">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, ease: EASE }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Почему vin2win
          </motion.p>
          <motion.h2
            id="differentiator-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
            className="mx-auto mt-3 max-w-2xl font-display text-[1.625rem] font-bold tracking-tight text-foreground sm:text-[1.875rem] lg:text-[2.25rem]"
          >
            <span className="text-balance">Структура вместо хаоса</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
            className="mx-auto mt-3 max-w-xl text-[13.5px] text-muted-foreground"
          >
            Сравните работу на общих досках и профессиональной платформе.
          </motion.p>
        </div>

        {/* ── Premium unified comparison cards with center divider ───────── */}
        <div className="mx-auto max-w-5xl space-y-3.5">
          {comparisons.map((comparison, compIndex) => {
            const ChaosIcon = comparison.chaos.icon;
            const OrderIcon = comparison.order.icon;

            return (
              <motion.article
                key={comparison.topic}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.85,
                  delay: compIndex * 0.12,
                  ease: EASE,
                }}
                className="
                  relative overflow-hidden rounded-2xl
                  border border-border/55 bg-card/90
                  shadow-[var(--shadow-surface)] backdrop-blur-sm
                  dark:bg-surface-elevated/80
                "
              >
                {/* Topic label tab */}
                <div className="flex items-center justify-center border-b border-border/40 bg-gradient-to-b from-background/40 to-transparent py-2">
                  <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.24em] text-muted-foreground/90">
                    {comparison.topic}
                  </span>
                </div>

                {/* Split grid with center divider */}
                <div className="relative grid md:grid-cols-2">
                  {/* Center divider (md+) */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-6 left-1/2 hidden w-px bg-border/50 md:block"
                  />
                  {/* Mobile horizontal divider */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-6 top-1/2 h-px bg-border/50 md:hidden"
                    style={{ transform: 'translateY(-50%)' }}
                  />

                  {/* Chaos side */}
                  <div className="relative p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20">
                        <ChaosIcon className="h-[16px] w-[16px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-destructive/85">
                          Без системы
                        </p>
                        <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">
                          {comparison.chaos.title}
                        </h3>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {comparison.chaos.points.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2.5 text-[13px] text-muted-foreground"
                        >
                          <X
                            className="h-3 w-3 shrink-0 text-destructive/55"
                            strokeWidth={3}
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Order side */}
                  <div className="relative bg-gradient-to-br from-teal-accent/[0.035] via-transparent to-transparent p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-accent/12 text-teal-accent ring-1 ring-inset ring-teal-accent/25">
                        <OrderIcon className="h-[16px] w-[16px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                          vin2win
                        </p>
                        <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">
                          {comparison.order.title}
                        </h3>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {comparison.order.points.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2.5 text-[13px] text-foreground/90"
                        >
                          <Check
                            className="h-3 w-3 shrink-0 text-teal-accent"
                            strokeWidth={3}
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
