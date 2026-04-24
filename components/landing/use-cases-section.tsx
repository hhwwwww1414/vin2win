'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Store, Search, Building2, ArrowUpRight, Quote } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const useCases = [
  {
    id: 'dealer',
    icon: Store,
    role: 'Дилер',
    fullRole: 'Дилер с автопарком',
    scenario: 'Управление 50+ автомобилями',
    story:
      'Виктор управляет автосалоном с парком из 60 автомобилей. Раньше он тратил часы на обновление объявлений на разных площадках. Теперь все карточки в одном месте с единым форматом и статусами.',
    result: 'Экономия 15 часов в неделю на администрировании',
    testimonial: 'Наконец-то могу сосредоточиться на продажах, а не на рутине.',
  },
  {
    id: 'selector',
    icon: Search,
    role: 'Подборщик',
    fullRole: 'Профессиональный подборщик',
    scenario: '10–15 клиентов в месяц',
    story:
      'Анна подбирает автомобили для клиентов уже 5 лет. Фильтры по истории, техническому состоянию и статусам помогают быстро находить варианты под запрос без просмотра сотен неподходящих объявлений.',
    result: 'Время на подбор сократилось в 3 раза',
    testimonial: 'Сравнение карточек бок о бок — то, чего мне не хватало годами.',
  },
  {
    id: 'fleet',
    icon: Building2,
    role: 'Флот',
    fullRole: 'Менеджер автопарка',
    scenario: 'Корпоративный флот',
    story:
      'Дмитрий отвечает за продажу выбывающих корпоративных автомобилей. Структурированные данные и история обслуживания в карточке повышают доверие покупателей и ускоряют сделки.',
    result: 'Средний срок продажи сократился на 40%',
    testimonial: 'Профессиональная аудитория ценит прозрачность данных.',
  },
];

export function UseCasesSection() {
  const [activeCase, setActiveCase] = useState(useCases[0]);
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
      aria-labelledby="use-cases-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-elevated/20 to-transparent dark:via-surface-elevated/35" />
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
            Сценарии использования
          </motion.p>
          <motion.h2
            id="use-cases-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
            className="mx-auto mt-3 max-w-2xl font-display text-[1.625rem] font-bold tracking-tight text-foreground sm:text-[1.875rem] lg:text-[2.25rem]"
          >
            <span className="text-balance">Как профессионалы используют vin2win</span>
          </motion.h2>
        </div>

        {/* ── Case selector — responsive segmented tab bar ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mb-6 flex justify-center px-2"
          role="tablist"
          aria-label="Сценарии использования"
        >
          <div
            className="
              grid w-full max-w-lg grid-cols-3 gap-0.5
              rounded-full border border-border/60 bg-surface-elevated/80 p-1
              backdrop-blur-md
              shadow-[0_4px_20px_rgba(15,23,42,0.04)]
              dark:bg-surface-elevated/60 dark:shadow-[0_6px_24px_rgba(0,0,0,0.22)]
              sm:gap-1
            "
          >
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              const isActive = activeCase.id === useCase.id;

              return (
                <button
                  key={useCase.id}
                  role="tab"
                  onClick={() => setActiveCase(useCase)}
                  className={`
                    relative flex min-w-0 items-center justify-center gap-1.5
                    rounded-full px-2 py-2 text-[12px] font-medium
                    transition-colors duration-300
                    sm:gap-2 sm:px-4 sm:text-[13px]
                    ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                  `}
                  aria-selected={isActive}
                >
                  {isActive && (
                    <motion.span
                      layoutId="use-case-pill"
                      className="absolute inset-0 rounded-full bg-teal-accent/12 ring-1 ring-teal-accent/30"
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${
                      isActive ? 'text-teal-accent' : ''
                    }`}
                  />
                  <span className="relative z-10 truncate">
                    <span className="sm:hidden">{useCase.role}</span>
                    <span className="hidden sm:inline">{useCase.fullRole}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Active case content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCase.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="
              relative mx-auto max-w-3xl overflow-hidden rounded-3xl
              border border-border/60 bg-card/95
              shadow-[var(--shadow-surface)] backdrop-blur-sm
              dark:bg-surface-elevated/95
            "
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(129,216,208,0.055),transparent_60%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/35 to-transparent"
            />

            <div className="relative p-6 sm:p-7">
              {/* Header row */}
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-accent/12 text-teal-accent ring-1 ring-teal-accent/25">
                  <activeCase.icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                    {activeCase.scenario}
                  </p>
                  <h3 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground sm:text-[1.2rem]">
                    {activeCase.fullRole}
                  </h3>
                </div>
              </div>

              <p className="mt-5 text-[14px] leading-relaxed text-muted-foreground sm:text-[14.5px]">
                {activeCase.story}
              </p>

              {/* Result chip */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal-accent/30 bg-teal-accent/10 px-3.5 py-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-teal-accent" strokeWidth={2.5} />
                <span className="text-[12.5px] font-medium text-foreground">
                  {activeCase.result}
                </span>
              </div>

              {/* Testimonial */}
              <div className="mt-5 flex gap-3 border-t border-border/40 pt-5">
                <Quote className="h-[18px] w-[18px] shrink-0 text-teal-accent/55" />
                <p className="text-[14px] font-medium italic leading-relaxed text-foreground">
                  {activeCase.testimonial}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
