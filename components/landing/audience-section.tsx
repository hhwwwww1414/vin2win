'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Briefcase, Search, Settings2, ChevronRight } from 'lucide-react';

const audiences = [
  {
    id: 'sellers',
    title: 'Продавцам',
    role: 'Профессиональные дилеры',
    icon: Briefcase,
    description: 'Публикация структурированных карточек с полной информацией о технике, истории и условиях сделки. Управление статусами и повторными публикациями из единого кабинета.',
    features: [
      'Паспорт автомобиля с полной техникой',
      'История владения и состояние',
      'Управление статусами объявлений',
      'Быстрые повторные публикации',
    ],
    gradient: 'from-teal-accent/20 via-teal-accent/5 to-transparent',
    accentColor: 'bg-teal-accent',
  },
  {
    id: 'selectors',
    title: 'Подборщикам',
    role: 'Автоэксперты и подборщики',
    icon: Search,
    description: 'Мгновенный переход от запроса клиента к shortlist лучших вариантов. Сравнение по ключевым параметрам и прямой контакт с проверенными продавцами.',
    features: [
      'Умные фильтры под задачу клиента',
      'Shortlist с быстрым сравнением',
      'Прямой контакт с продавцом',
      'Избранное для переговоров',
    ],
    gradient: 'from-seafoam/20 via-seafoam/5 to-transparent',
    accentColor: 'bg-seafoam',
  },
  {
    id: 'managers',
    title: 'Менеджерам',
    role: 'Управление автопарком',
    icon: Settings2,
    description: 'Единый рабочий контур для всех объявлений компании. Модерация, статусы, аналитика и командная работа в одном месте.',
    features: [
      'Контроль всех объявлений команды',
      'Статусы и модерация в реальном времени',
      'Уведомления о важных событиях',
      'Командная работа и делегирование',
    ],
    gradient: 'from-accent-strong/20 via-accent-strong/5 to-transparent',
    accentColor: 'bg-accent-strong',
  },
];

export function AudienceSection() {
  const [activeAudience, setActiveAudience] = useState(audiences[0]);
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
      aria-labelledby="audience-heading"
    >
      {/* Background treatment */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-elevated/30 to-transparent dark:via-surface-elevated/50" />
      </div>

      <motion.div style={{ opacity }} className="relative">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-meta font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Для кого
          </motion.p>
          <motion.h2
            id="audience-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Рабочая среда для профессионалов
          </motion.h2>
        </div>

        {/* Audience selector tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex justify-center"
        >
          <div className="inline-flex gap-2 rounded-full border border-border/50 bg-surface-elevated/80 p-1.5 backdrop-blur-sm dark:bg-surface-elevated/60">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              const isActive = activeAudience.id === audience.id;
              
              return (
                <button
                  key={audience.id}
                  onClick={() => setActiveAudience(audience)}
                  className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <motion.div
                      layoutId="audience-tab-bg"
                      className="absolute inset-0 rounded-full bg-teal-accent/15 ring-1 ring-teal-accent/30"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{audience.title}</span>
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
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-8 lg:grid-cols-2 lg:gap-12"
          >
            {/* Left: Main content card */}
            <div className="group relative overflow-hidden rounded-[32px] border border-border/60 bg-card/95 p-8 shadow-[var(--shadow-floating)] backdrop-blur-sm dark:bg-surface-elevated/95 sm:p-10">
              {/* Gradient accent */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-gradient-to-br ${activeAudience.gradient} opacity-60`}
              />
              
              {/* Top accent line */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/50 to-transparent"
              />

              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${activeAudience.accentColor}/15 ring-1 ring-current/20`}>
                    <activeAudience.icon className="h-7 w-7 text-teal-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {activeAudience.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{activeAudience.role}</p>
                  </div>
                </div>

                <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
                  {activeAudience.description}
                </p>
              </div>
            </div>

            {/* Right: Features list */}
            <div className="flex flex-col justify-center">
              <ul className="space-y-4">
                {activeAudience.features.map((feature, i) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-card/60 p-5 transition-all duration-300 hover:border-teal-accent/30 hover:bg-card/80 dark:bg-surface-elevated/60 dark:hover:bg-surface-elevated/80"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-accent/10 text-teal-accent ring-1 ring-teal-accent/20 transition-transform duration-300 group-hover:scale-110">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-foreground">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
