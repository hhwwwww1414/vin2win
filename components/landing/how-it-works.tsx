'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { UserRoundPlus, ClipboardCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const steps = [
  {
    title: 'Регистрация',
    description: 'Создайте профессиональный аккаунт. Верификация занимает минуты.',
    icon: UserRoundPlus,
  },
  {
    title: 'Паспорт авто',
    description: 'Заполните структурированную карточку: марка, модель, год, цена.',
    icon: ClipboardCheck,
  },
  {
    title: 'Проверка',
    description: 'Добавьте технику, историю, состояние, фото и контакты.',
    icon: ShieldCheck,
  },
  {
    title: 'Публикация',
    description: 'После быстрой модерации карточка появляется в ленте.',
    icon: CheckCircle2,
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineProgress = useTransform(scrollYProgress, [0.2, 0.7], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(129,216,208,0.05),transparent)]" />
      </div>

      {/* Top continuity hairline */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent sm:inset-x-16"
      />

      <div className="relative">
        {/* Header */}
        <div className="mb-10 text-center lg:mb-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, ease: EASE }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Как начать
          </motion.p>
          <motion.h2
            id="how-it-works-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
            className="mx-auto mt-3 max-w-2xl font-display text-[1.625rem] font-bold tracking-tight text-foreground sm:text-[1.875rem] lg:text-[2.25rem]"
          >
            <span className="text-balance">От аккаунта до публикации за 4 шага</span>
          </motion.h2>
        </div>

        {/* Steps timeline */}
        <div className="relative mx-auto max-w-4xl">
          {/* Desktop connecting line */}
          <div
            aria-hidden="true"
            className="absolute top-7 hidden h-px lg:block"
            style={{ left: '12.5%', right: '12.5%' }}
          >
            <div className="h-full w-full bg-border/40" />
            <motion.div
              style={{ scaleX: lineProgress, transformOrigin: 'left' }}
              className="absolute inset-0 h-full bg-gradient-to-r from-teal-accent via-teal-accent to-seafoam"
            />
          </div>

          {/* Mobile vertical line */}
          <div
            aria-hidden="true"
            className="absolute bottom-6 left-7 top-6 w-px bg-border/40 lg:hidden"
          >
            <motion.div
              style={{ scaleY: lineProgress, transformOrigin: 'top' }}
              className="absolute inset-0 h-full w-full bg-gradient-to-b from-teal-accent via-teal-accent to-seafoam"
            />
          </div>

          {/* Steps */}
          <div className="grid gap-7 lg:grid-cols-4 lg:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const stepNumber = String(index + 1).padStart(2, '0');

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{
                    duration: 0.85,
                    delay: index * 0.12,
                    ease: EASE,
                  }}
                  className="relative flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
                >
                  {/* Step circle — clean, no number bubble */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className="
                        relative flex h-14 w-14 items-center justify-center rounded-full
                        border border-teal-accent/25 bg-background
                        shadow-[0_4px_16px_rgba(129,216,208,0.1)]
                      "
                    >
                      {/* Inner subtle gradient ring */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-gradient-to-b from-teal-accent/6 to-transparent"
                      />
                      <Icon className="relative h-5 w-5 text-teal-accent" />
                    </div>
                  </div>

                  {/* Content — editorial step kicker */}
                  <div className="flex-1 pt-1 lg:mt-5 lg:px-2 lg:pt-0">
                    <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.22em] text-teal-accent/75">
                      Шаг {stepNumber}
                    </p>
                    <h3 className="mt-1 font-display text-[15.5px] font-bold tracking-tight text-foreground sm:text-base">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
