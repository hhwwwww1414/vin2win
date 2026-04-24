'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Shield, FileText, Eye, Lock, CheckCircle2 } from 'lucide-react';

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

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.9]);
  const scale = useTransform(scrollYProgress, [0, 0.25], [0.97, 1]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-14 sm:py-18 lg:py-22"
      aria-labelledby="trust-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_20%,rgba(129,216,208,0.05),transparent)]" />
      </div>

      <motion.div style={{ opacity, scale }} className="relative">
        {/* Featured card - tighter padding, smaller radius */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-teal-accent/20 bg-gradient-to-br from-surface-elevated/95 via-card/95 to-surface-elevated/95 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.1)] backdrop-blur-sm dark:from-surface-elevated/80 dark:via-surface-panel/90 dark:to-surface-elevated/80 sm:p-9 lg:p-10"
        >
          {/* Decorative elements */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-teal-accent/8 blur-[80px]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-seafoam/8 blur-[80px]"
          />

          <div className="relative">
            {/* Tighter header */}
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-accent/30 bg-teal-accent/10 shadow-[0_4px_20px_rgba(129,216,208,0.18)]"
              >
                <Shield className="h-7 w-7 text-teal-accent" />
              </motion.div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-accent">
                Доверие и качество
              </p>
              <h2
                id="trust-heading"
                className="mt-2.5 font-display text-[1.75rem] font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]"
              >
                <span className="text-balance">Структура вместо случайных описаний</span>
              </h2>
              <p className="mx-auto mt-3.5 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
                Каждая карточка собирает паспорт, технику, историю, состояние, фото и контакты. Модерация держит ленту пригодной для профессионального просмотра.
              </p>
            </div>

            {/* Trust points - tighter grid */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-10">
              {trustPoints.map((point, index) => {
                const Icon = point.icon;

                return (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: 0.15 + index * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group flex gap-3.5 rounded-2xl border border-border/40 bg-background/40 p-4 transition-colors duration-300 hover:border-teal-accent/30 hover:bg-background/70"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-accent/10 text-teal-accent transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <h3 className="font-display text-[15px] font-semibold text-foreground">
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
