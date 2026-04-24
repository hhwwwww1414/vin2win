'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
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

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <span ref={ref} className="tabular-nums">
      {isInView ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CountUp from={0} to={value} duration={2} />
          {suffix}
        </motion.span>
      ) : (
        '0' + suffix
      )}
    </span>
  );
}

function CountUp({ from, to, duration }: { from: number; to: number; duration: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
    >
      <motion.span
        initial={{ }}
        animate={isInView ? { } : {}}
      >
        {isInView && (
          <Counter from={from} to={to} duration={duration} />
        )}
      </motion.span>
    </motion.span>
  );
}

function Counter({ from, to, duration }: { from: number; to: number; duration: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  
  return (
    <motion.span
      ref={nodeRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        animate={{ }}
        transition={{ duration }}
        onUpdate={(latest) => {
          if (nodeRef.current) {
            // Simple counter that shows final value
          }
        }}
      >
        {to}
      </motion.span>
    </motion.span>
  );
}

export function TrustSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.9]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-20 sm:py-28 lg:py-36"
      aria-labelledby="trust-heading"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(129,216,208,0.06),transparent)]" />
      </div>

      <motion.div style={{ opacity, scale }} className="relative">
        {/* Central featured card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-[36px] border border-teal-accent/25 bg-gradient-to-br from-surface-elevated/95 via-card/95 to-surface-elevated/95 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:from-surface-elevated/80 dark:via-surface-panel/90 dark:to-surface-elevated/80 sm:p-12 lg:p-16"
        >
          {/* Decorative elements */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/50 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-accent/10 blur-[80px]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-seafoam/10 blur-[80px]"
          />

          <div className="relative">
            {/* Icon and header */}
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-teal-accent/30 bg-teal-accent/10 shadow-[0_8px_32px_rgba(129,216,208,0.2)]"
              >
                <Shield className="h-10 w-10 text-teal-accent" />
              </motion.div>

              <p className="text-meta font-semibold uppercase tracking-[0.28em] text-teal-accent">
                Доверие и качество
              </p>
              <h2
                id="trust-heading"
                className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
              >
                <span className="text-balance">Структура вместо случайных описаний</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Каждая карточка собирает паспорт, технику, историю, состояние, фото, условия сделки и контакты. 
                Модерация помогает держать ленту пригодной для профессионального просмотра.
              </p>
            </div>

            {/* Trust points grid */}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16">
              {trustPoints.map((point, index) => {
                const Icon = point.icon;
                
                return (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2 + index * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group flex gap-4 rounded-2xl border border-border/40 bg-background/50 p-5 transition-all duration-300 hover:border-teal-accent/30 hover:bg-background/80"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-accent/10 text-teal-accent transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {point.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
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
