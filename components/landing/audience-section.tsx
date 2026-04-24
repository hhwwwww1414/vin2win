'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Briefcase, Search, Settings2, Check } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const audiences = [
  {
    id: 'sellers',
    title: 'Продавцам',
    short: 'Продавцам',
    role: 'Профессиональные дилеры',
    icon: Briefcase,
    description:
      'Публикация структурированных карточек с полной информацией о технике, истории и условиях сделки. Управление статусами и повторными публикациями из единого кабинета.',
    features: [
      'Паспорт автомобиля с полной техникой',
      'История владения и состояние',
      'Управление статусами объявлений',
      'Быстрые повторные публикации',
    ],
  },
  {
    id: 'selectors',
    title: 'Подборщикам',
    short: 'Подбор',
    role: 'Автоэксперты и подборщики',
    icon: Search,
    description:
      'Мгновенный переход от запроса клиента к shortlist лучших вариантов. Сравнение по ключевым параметрам и прямой контакт с проверенными продавцами.',
    features: [
      'Умные фильтры под задачу клиента',
      'Shortlist с быстрым сравнением',
      'Прямой контакт с продавцом',
      'Избранное для переговоров',
    ],
  },
  {
    id: 'managers',
    title: 'Менеджерам',
    short: 'Менеджмент',
    role: 'Управление автопарком',
    icon: Settings2,
    description:
      'Единый рабочий контур для всех объявлений компании. Модерация, статусы, аналитика и командная работа в одном месте.',
    features: [
      'Контроль всех объявлений команды',
      'Статусы и модерация в реальном времени',
      'Уведомления о важных событиях',
      'Командная работа и делегирование',
    ],
  },
];

export function AudienceSection() {
  const [activeAudience, setActiveAudience] = useState(audiences[0]);
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
      aria-labelledby="audience-heading"
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
        {/* Compact header */}
        <div className="mb-9 text-center lg:mb-12">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, ease: EASE }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Для кого
          </motion.p>
          <motion.h2
            id="audience-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
            className="mt-3 font-display text-[1.625rem] font-bold tracking-tight text-foreground sm:text-[1.875rem] lg:text-[2.25rem]"
          >
            Рабочая среда для профессионалов
          </motion.h2>
        </div>

        {/* ── Premium segmented control (mobile-safe, responsive) ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mb-7 flex justify-center px-2"
          role="tablist"
          aria-label="Выбор аудитории"
        >
          <div
            className="
              relative grid w-full max-w-md grid-cols-3 gap-0.5
              rounded-full border border-border/60
              bg-surface-elevated/80 p-1
              backdrop-blur-md
              shadow-[0_4px_20px_rgba(15,23,42,0.04)]
              dark:bg-surface-elevated/60 dark:shadow-[0_6px_24px_rgba(0,0,0,0.24)]
              sm:gap-1
            "
          >
            {audiences.map((audience) => {
              const Icon = audience.icon;
              const isActive = activeAudience.id === audience.id;

              return (
                <button
                  key={audience.id}
                  role="tab"
                  onClick={() => setActiveAudience(audience)}
                  className={`
                    relative flex min-w-0 items-center justify-center gap-1.5
                    rounded-full px-2 py-2 text-[11.5px] font-medium
                    transition-colors duration-300
                    sm:gap-2 sm:px-4 sm:text-[13px]
                    ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                  `}
                  aria-selected={isActive}
                >
                  {isActive && (
                    <motion.span
                      layoutId="audience-pill"
                      className="absolute inset-0 rounded-full bg-teal-accent/12 ring-1 ring-teal-accent/30"
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
                    />
                  )}
                  <Icon
                    className={`
                      relative z-10 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4
                      ${isActive ? 'text-teal-accent' : ''}
                    `}
                  />
                  <span className="relative z-10 truncate">
                    <span className="sm:hidden">{audience.short}</span>
                    <span className="hidden sm:inline">{audience.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Active audience content — premium editorial two-column ──────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAudience.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1.05fr_1fr] lg:gap-5"
          >
            {/* Left: main content card */}
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/95 p-6 shadow-[var(--shadow-surface)] backdrop-blur-sm dark:bg-surface-elevated/95 sm:p-7">
              {/* Subtle noise overlay via gradient */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(129,216,208,0.08),transparent_60%)]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/35 to-transparent"
              />

              <div className="relative">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-accent/12 text-teal-accent ring-1 ring-teal-accent/25">
                    <activeAudience.icon className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                      {activeAudience.role}
                    </p>
                    <h3 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                      {activeAudience.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-5 text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
                  {activeAudience.description}
                </p>
              </div>
            </div>

            {/* Right: features list — premium rows */}
            <ul className="grid gap-2">
              {activeAudience.features.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                  className="
                    group flex items-center gap-3
                    rounded-xl border border-border/40 bg-card/60
                    px-4 py-3 transition-colors duration-300
                    hover:border-teal-accent/30 hover:bg-card/85
                    dark:bg-surface-elevated/55 dark:hover:bg-surface-elevated/80
                  "
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-accent/10 text-teal-accent ring-1 ring-inset ring-teal-accent/20">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <span className="text-[13.5px] font-medium text-foreground">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
