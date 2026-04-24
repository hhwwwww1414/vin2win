'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Shield, FileText, Eye, Lock, CheckCircle2 } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const trustPoints = [
  {
    icon: FileText,
    title: 'Паспорт автомобиля',
    description: 'Структурированные данные: марка, модель, год, VIN, техника, история владения.',
  },
  {
    icon: Eye,
    title: 'Прозрачность',
    description: 'Единый формат карточки. Никаких скрытых условий и неполных описаний.',
  },
  {
    icon: Lock,
    title: 'Верификация',
    description: 'Профессиональные аккаунты проходят проверку перед публикацией.',
  },
  {
    icon: CheckCircle2,
    title: 'Модерация 24/7',
    description: 'Каждое объявление проверяется на соответствие стандартам качества.',
  },
];

export function TrustSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.5, 1, 1, 0.92]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.985, 1]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
      aria-labelledby="trust-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_20%,rgba(129,216,208,0.045),transparent)]" />
      </div>

      {/* Top continuity hairline */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent sm:inset-x-16"
      />

      <motion.div style={{ opacity, scale }} className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1, ease: EASE }}
          className="
            relative mx-auto max-w-4xl overflow-hidden
            rounded-3xl border border-teal-accent/20
            bg-gradient-to-br from-surface-elevated/95 via-card/95 to-surface-elevated/95
            p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-sm
            dark:from-surface-elevated/80 dark:via-surface-panel/90 dark:to-surface-elevated/80
            sm:p-8 lg:p-10
          "
        >
          {/* Decorative elements */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-52 w-52 rounded-full bg-teal-accent/8 blur-[80px]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-seafoam/8 blur-[80px]"
          />

          <div className="relative">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.88, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
                className="
                  mb-5 flex h-12 w-12 items-center justify-center rounded-2xl
                  border border-teal-accent/30 bg-teal-accent/10
                  shadow-[0_4px_18px_rgba(129,216,208,0.16)]
                "
              >
                <Shield className="h-6 w-6 text-teal-accent" />
              </motion.div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-accent">
                Доверие и качество
              </p>
              <h2
                id="trust-heading"
                className="mt-2.5 font-display text-[1.625rem] font-bold tracking-tight text-foreground sm:text-[1.875rem] lg:text-[2rem]"
              >
                <span className="text-balance">Структура вместо случайных описаний</span>
              </h2>
              <p className="mx-auto mt-3.5 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                Каждая карточка собирает паспорт, технику, историю, состояние, фото и контакты. Модерация держит ленту пригодной для профессионального просмотра.
              </p>
            </div>

            {/* Trust points — premium grid */}
            <div className="mt-7 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:mt-9">
              {trustPoints.map((point, index) => {
                const Icon = point.icon;

                return (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.7,
                      delay: 0.22 + index * 0.08,
                      ease: EASE,
                    }}
                    className="
                      group relative flex gap-3.5 overflow-hidden rounded-2xl
                      border border-border/40 bg-background/40 p-4
                      transition-colors duration-500
                      hover:border-teal-accent/30 hover:bg-background/70
                    "
                  >
                    {/* Corner accent on hover */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />

                    <div
                      className="
                        flex h-9 w-9 shrink-0 items-center justify-center
                        rounded-lg bg-teal-accent/10 text-teal-accent
                        ring-1 ring-inset ring-teal-accent/20
                        transition-transform duration-500
                        group-hover:scale-[1.04]
                      "
                    >
                      <Icon className="h-[16px] w-[16px]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-[14.5px] font-semibold text-foreground">
                        {point.title}
                      </h3>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
