'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { UserRoundPlus, ClipboardCheck, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Регистрация',
    description: 'Создайте профессиональный аккаунт продавца. Верификация занимает минуты.',
    icon: UserRoundPlus,
  },
  {
    number: '02',
    title: 'Паспорт авто',
    description: 'Заполните структурированную карточку: марка, модель, год, цена, город.',
    icon: ClipboardCheck,
  },
  {
    number: '03',
    title: 'Проверка',
    description: 'Добавьте технику, историю, состояние, фото и контакты. Всё структурировано.',
    icon: ShieldCheck,
  },
  {
    number: '04',
    title: 'Публикация',
    description: 'После быстрой модерации карточка появляется в профессиональной ленте.',
    icon: CheckCircle2,
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineProgress = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-20 sm:py-28 lg:py-36"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(129,216,208,0.08),transparent)]" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="mb-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-meta font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Как начать
          </motion.p>
          <motion.h2
            id="how-it-works-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            <span className="text-balance">От аккаунта до публикации за 4 простых шага</span>
          </motion.h2>
        </div>

        {/* Steps timeline */}
        <div className="relative mx-auto max-w-5xl">
          {/* Connecting line - desktop */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-[72px] hidden h-0.5 bg-border/30 lg:block"
          >
            <motion.div
              style={{ scaleX: lineProgress, transformOrigin: 'left' }}
              className="h-full bg-gradient-to-r from-teal-accent via-teal-accent to-seafoam"
            />
          </div>

          {/* Connecting line - mobile */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-8 top-0 w-0.5 bg-border/30 lg:hidden"
          >
            <motion.div
              style={{ scaleY: lineProgress, transformOrigin: 'top' }}
              className="h-full bg-gradient-to-b from-teal-accent via-teal-accent to-seafoam"
            />
          </div>

          {/* Steps grid */}
          <div className="grid gap-6 lg:grid-cols-4 lg:gap-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    duration: 0.7,
                    delay: index * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative flex gap-6 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
                >
                  {/* Step circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="relative">
                      {/* Outer glow ring */}
                      <div
                        aria-hidden="true"
                        className="absolute -inset-2 rounded-full bg-teal-accent/10 blur-md"
                      />
                      {/* Main circle */}
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-accent/40 bg-background shadow-[0_8px_32px_rgba(129,216,208,0.15)]">
                        <Icon className="h-7 w-7 text-teal-accent" />
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-accent text-xs font-bold text-accent-foreground">
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 lg:mt-8 lg:px-4">
                    <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow between steps - desktop only */}
                  {index < steps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute right-0 top-[72px] hidden -translate-y-1/2 translate-x-1/2 lg:block"
                    >
                      <ArrowRight className="h-5 w-5 text-teal-accent/50" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
