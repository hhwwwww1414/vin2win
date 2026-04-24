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
    story:
      'Виктор управляет автосалоном с парком из 60 автомобилей. Раньше он тратил часы на обновление объявлений на разных площадках. Теперь все карточки в одном месте с единым форматом и статусами.',
    result: 'Экономия 15 часов в неделю на администрировании',
    testimonial: 'Наконец-то могу сосредоточиться на продажах, а не на рутине.',
    gradient: 'from-teal-accent/15 via-teal-accent/[0.04] to-transparent',
  },
  {
    id: 'selector',
    icon: Search,
    role: 'Профессиональный подборщик',
    scenario: '10–15 клиентов в месяц',
    story:
      'Анна подбирает автомобили для клиентов уже 5 лет. Фильтры по истории, техническому состоянию и статусам помогают быстро находить варианты под запрос без просмотра сотен неподходящих объявлений.',
    result: 'Время на подбор сократилось в 3 раза',
    testimonial: 'Сравнение карточек бок о бок — то, чего мне не хватало годами.',
    gradient: 'from-seafoam/15 via-seafoam/[0.04] to-transparent',
  },
  {
    id: 'fleet',
    icon: Building2,
    role: 'Менеджер автопарка',
    scenario: 'Корпоративный флот',
    story:
      'Дмитрий отвечает за продажу выбывающих корпоративных автомобилей. Структурированные данные и история обслуживания в карточке повышают доверие покупателей и ускоряют сделки.',
    result: 'Средний срок продажи сократился на 40%',
    testimonial: 'Профессиональная аудитория ценит прозрачность данных.',
    gradient: 'from-accent-strong/15 via-accent-strong/[0.04] to-transparent',
  },
];

export function UseCasesSection() {
  const [activeCase, setActiveCase] = useState(useCases[0]);
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
      aria-labelledby="use-cases-heading"
    >
      {/* Background */}
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
            Сценарии использования
          </motion.p>
          <motion.h2
            id="use-cases-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-3 max-w-2xl font-display text-[1.75rem] font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            <span className="text-balance">Как профессионалы используют vin2win</span>
          </motion.h2>
        </div>

        {/* Case selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex flex-wrap justify-center gap-2"
        >
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            const isActive = activeCase.id === useCase.id;

            return (
              <button
                key={useCase.id}
                onClick={() => setActiveCase(useCase)}
                className={`group relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-colors duration-300 ${
                  isActive
                    ? 'border-teal-accent/40 bg-teal-accent/10 text-foreground'
                    : 'border-border/50 bg-card/60 text-muted-foreground hover:border-border hover:bg-card/80 hover:text-foreground'
                }`}
                aria-pressed={isActive}
              >
                <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-teal-accent' : ''}`} />
                <span>{useCase.role}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Active case content - tighter card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCase.id}
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-[var(--shadow-surface)] backdrop-blur-sm dark:bg-surface-elevated/95"
          >
            <div
              aria-hidden="true"
              className={`absolute inset-0 bg-gradient-to-br ${activeCase.gradient} opacity-60`}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent"
            />

            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-accent/12 text-teal-accent ring-1 ring-teal-accent/20">
                  <activeCase.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                    {activeCase.role}
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground">{activeCase.scenario}</p>
                </div>
              </div>

              <p className="mt-5 text-[14.5px] leading-relaxed text-muted-foreground">
                {activeCase.story}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal-accent/30 bg-teal-accent/10 px-3.5 py-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-teal-accent" />
                <span className="text-[13px] font-medium text-foreground">{activeCase.result}</span>
              </div>

              <div className="mt-5 flex gap-3 border-t border-border/40 pt-5">
                <Quote className="h-5 w-5 shrink-0 text-teal-accent/50" />
                <p className="text-[14.5px] font-medium italic text-foreground">
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
