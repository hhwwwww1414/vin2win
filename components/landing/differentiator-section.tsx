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

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.9]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-14 sm:py-18 lg:py-22"
      aria-labelledby="differentiator-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-elevated/30 to-transparent dark:via-surface-elevated/45" />
      </div>

      <motion.div style={{ opacity }} className="relative">
        {/* Compact header */}
        <div className="mb-10 text-center lg:mb-12">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-accent"
          >
            Почему vin2win
          </motion.p>
          <motion.h2
            id="differentiator-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-3 max-w-2xl font-display text-[1.75rem] font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            <span className="text-balance">Структура вместо хаоса</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-3 max-w-xl text-[14px] text-muted-foreground"
          >
            Сравните работу на общих досках и профессиональной платформе.
          </motion.p>
        </div>

        {/* Comparison cards */}
        <div className="mx-auto max-w-5xl space-y-4">
          {comparisons.map((comparison, compIndex) => (
            <motion.div
              key={compIndex}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.6,
                delay: compIndex * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="grid gap-3 lg:grid-cols-2 lg:gap-4"
            >
              {/* Chaos side */}
              <div className="relative overflow-hidden rounded-2xl border border-destructive/15 bg-destructive/[0.025] p-5 transition-colors duration-300 hover:border-destructive/25 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <comparison.chaos.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-[17px] font-bold text-foreground">
                    {comparison.chaos.title}
                  </h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {comparison.chaos.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13.5px] text-muted-foreground">
                      <X className="h-3.5 w-3.5 shrink-0 text-destructive/60" strokeWidth={2.5} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Order side */}
              <div className="group relative overflow-hidden rounded-2xl border border-teal-accent/25 bg-teal-accent/[0.04] p-5 transition-colors duration-300 hover:border-teal-accent/40 sm:p-6">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-teal-accent/8 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-accent/12 text-teal-accent ring-1 ring-teal-accent/20">
                    <comparison.order.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-[17px] font-bold text-foreground">
                    {comparison.order.title}
                  </h3>
                </div>
                <ul className="relative mt-4 space-y-2">
                  {comparison.order.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13.5px] text-foreground">
                      <Check className="h-3.5 w-3.5 shrink-0 text-teal-accent" strokeWidth={2.5} />
                      <span>{point}</span>
                    </li>
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
