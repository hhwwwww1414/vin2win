'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { UserRoundPlus, ClipboardCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

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

  const lineProgress = useTransform(scrollYProgress, [0.15, 0.65], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-14 sm:py-18 lg:py-22"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(129,216,208,0.06),transparent)]" />
      </div>

      <div className="relative">
        {/* Compact header */}
        <div className="mb-12 text-center lg:mb-14">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-accent"
          >
            Как начать
          </motion.p>
          <motion.h2
            id="how-it-works-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-3 max-w-2xl font-display text-[1.75rem] font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            <span className="text-balance">От аккаунта до публикации за 4 шага</span>
          </motion.h2>
        </div>

        {/* Steps timeline - tighter, more elegant */}
        <div className="relative mx-auto max-w-4xl">
          {/* Connecting line - desktop (between circles) */}
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

          {/* Connecting line - mobile (vertical, through circle centers) */}
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
          <div className="grid gap-6 lg:grid-cols-4 lg:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
                >
                  {/* Step circle - smaller, more refined */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-teal-accent/30 bg-background shadow-[0_4px_20px_rgba(129,216,208,0.12)]">
                      <Icon className="h-5 w-5 text-teal-accent" />
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-accent text-[10px] font-bold text-accent-foreground">
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Content - tighter spacing */}
                  <div className="flex-1 pt-1 lg:mt-5 lg:px-2 lg:pt-0">
                    <h3 className="font-display text-base font-bold tracking-tight text-foreground sm:text-[17px]">
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
