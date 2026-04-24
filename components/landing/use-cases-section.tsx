'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Store, Search, Building2, ArrowRight, Quote } from 'lucide-react';

const useCases = [
  {
    id: 'dealer',
    icon: Store,
    role: 'Дилер с автопарком',
    scenario: 'Управление 50+ автомобилями',
    story: 'Виктор управляет автосалоном с парком из 60 автомобилей. Раньше он тратил часы на обновление объявлений на разных площадках. Теперь все карточки в одном месте с единым форматом и статусами.',
    result: 'Экономия 15 часов в неделю на администрировании',
    testimonial: 'Наконец-то могу сосредоточиться на продажах, а не на рутине.',
    gradient: 'from-teal-accent/20 via-teal-accent/5 to-transparent',
  },
  {
    id: 'selector',
    icon: Search,
    role: 'Профессиональный подборщик',
    scenario: '10-15 клиентов в месяц',
    story: 'Анна подбирает автомобили для клиентов уже 5 лет. Фильтры по истории, техническому состоянию и статусам помогают быстро находить варианты под запрос без просмотра сотен неподходящих объявлений.',
    result: 'Время на подбор сократилось в 3 раза',
    testimonial: 'Сравнение карточек бок о бок — то, чего мне не хватало годами.',
    gradient: 'from-seafoam/20 via-seafoam/5 to-transparent',
  },
  {
    id: 'fleet',
    icon: Building2,
    role: 'Менеджер автопарка',
    scenario: 'Корпоративный флот',
    story: 'Дмитрий отвечает за продажу выбывающих корпоративных автомобилей. Структурированные данные и история обслуживания в карточке повышают доверие покупателей и ускоряют сделки.',
    result: 'Средний срок продажи сократился на 40%',
    testimonial: 'Профессиональная аудитория ценит прозрачность данных.',
    gradient: 'from-accent-strong/20 via-accent-strong/5 to-transparent',
  },
];

export function UseCasesSection() {
  const [activeCase, setActiveCase] = useState(useCases[0]);
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
      aria-labelledby="use-cases-heading"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-elevated/30 to-transparent dark:via-surface-elevated/50" />
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
            Сценарии использования
          </motion.p>
          <motion.h2
            id="use-cases-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            <span className="text-balance">Как профессионалы используют vin2win</span>
          </motion.h2>
        </div>

        {/* Case selector */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex flex-wrap justify-center gap-3"
        >
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            const isActive = activeCase.id === useCase.id;

            return (
              <button
                key={useCase.id}
                onClick={() => setActiveCase(useCase)}
                className={`group relative flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'border-teal-accent/40 bg-teal-accent/10 text-foreground'
                    : 'border-border/50 bg-card/60 text-muted-foreground hover:border-border hover:bg-card/80 hover:text-foreground'
                }`}
                aria-pressed={isActive}
              >
                <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-teal-accent' : ''}`} />
                <span>{useCase.role}</span>
                {isActive && (
                  <motion.div
                    layoutId="use-case-indicator"
                    className="absolute -bottom-px left-4 right-4 h-0.5 rounded-full bg-teal-accent"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Active case content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCase.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-border/60 bg-card/95 shadow-[var(--shadow-floating)] backdrop-blur-sm dark:bg-surface-elevated/95"
          >
            {/* Gradient background */}
            <div
              aria-hidden="true"
              className={`absolute inset-0 bg-gradient-to-br ${activeCase.gradient} opacity-50`}
            />

            {/* Top accent */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent"
            />

            <div className="relative p-8 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-accent/15 text-teal-accent ring-1 ring-teal-accent/20">
                  <activeCase.icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    {activeCase.role}
                  </h3>
                  <p className="text-sm text-muted-foreground">{activeCase.scenario}</p>
                </div>
              </div>

              {/* Story */}
              <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
                {activeCase.story}
              </p>

              {/* Result badge */}
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-teal-accent/30 bg-teal-accent/10 px-4 py-2">
                <ArrowRight className="h-4 w-4 text-teal-accent" />
                <span className="text-sm font-medium text-foreground">{activeCase.result}</span>
              </div>

              {/* Testimonial */}
              <div className="mt-8 flex gap-4 border-t border-border/40 pt-8">
                <Quote className="h-8 w-8 shrink-0 text-teal-accent/40" />
                <p className="text-lg font-medium italic text-foreground">
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
