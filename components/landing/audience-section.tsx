'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Briefcase, Search, Settings2, Check } from 'lucide-react';

const audiences = [
  {
    id: 'sellers',
    title: 'Продавцам',
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
    gradient: 'from-teal-accent/15 via-teal-accent/[0.04] to-transparent',
  },
  {
    id: 'selectors',
    title: 'Подборщикам',
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
    gradient: 'from-seafoam/15 via-seafoam/[0.04] to-transparent',
  },
  {
    id: 'managers',
    title: 'Менеджерам',
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
    gradient: 'from-accent-strong/15 via-accent-strong/[0.04] to-transparent',
  },
];

export function AudienceSection() {
  const [activeAudience, setActiveAudience] = useState(audiences[0]);
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
      aria-labelledby="audience-heading"
    >
      {/* Background treatment */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-elevated/25 to-transparent dark:via-surface-elevated/40" />
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
            Для кого
          </motion.p>
          <motion.h2
            id="audience-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 font-display text-[1.75rem] font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            Рабочая среда для профессионалов
          </motion.h2>
        </div>

        {/* Audience selector tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex justify-center"
        >
          <div
            data-audience-tab-list="true"
            className="grid w-full max-w-full grid-cols-3 gap-1 rounded-2xl border border-border/50 bg-surface-elevated/80 p-1 backdrop-blur-sm dark:bg-surface-elevated/60 sm:inline-flex sm:w-auto sm:rounded-full"
          >
            {audiences.map((audience) => {
              const Icon = audience.icon;
              const isActive = activeAudience.id === audience.id;

              return (
                <button
                  key={audience.id}
                  onClick={() => setActiveAudience(audience)}
                  data-audience-tab="true"
                  className={`relative flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-center text-[11px] font-medium leading-none transition-colors duration-300 sm:gap-2 sm:rounded-full sm:px-5 sm:text-[13px] ${
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <motion.div
                      layoutId="audience-tab-bg"
                      className="absolute inset-0 rounded-xl bg-teal-accent/15 ring-1 ring-teal-accent/30 sm:rounded-full"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex min-w-0 items-center justify-center gap-1.5 sm:gap-2">
                    <Icon data-audience-tab-icon="true" className="hidden h-4 w-4 shrink-0 sm:block" />
                    <span>{audience.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Active audience content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAudience.id}
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-6"
          >
            {/* Left: Main content card */}
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/95 p-6 shadow-[var(--shadow-surface)] backdrop-blur-sm dark:bg-surface-elevated/95 sm:p-8">
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-gradient-to-br ${activeAudience.gradient} opacity-70`}
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent"
              />

              <div className="relative">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-accent/12 ring-1 ring-teal-accent/25">
                    <activeAudience.icon className="h-5 w-5 text-teal-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-[1.375rem]">
                      {activeAudience.title}
                    </h3>
                    <p className="text-[13px] text-muted-foreground">{activeAudience.role}</p>
                  </div>
                </div>

                <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                  {activeAudience.description}
                </p>
              </div>
            </div>

            {/* Right: Compact features list */}
            <ul className="grid gap-2.5">
              {activeAudience.features.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 px-4 py-3 transition-colors duration-300 hover:border-teal-accent/30 hover:bg-card/80 dark:bg-surface-elevated/60 dark:hover:bg-surface-elevated/80"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-accent/10 text-teal-accent ring-1 ring-teal-accent/20">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                  <span className="text-[14px] font-medium text-foreground">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
