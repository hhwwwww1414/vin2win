'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

export function BrandIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.85, 1], [0, 1, 1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.35], [28, 0]);

  return (
    <section
      ref={containerRef}
      className="relative py-12 sm:py-16 lg:py-20"
      aria-labelledby="brand-intro-heading"
    >
      {/* Ambient glow — subtler */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/4 top-1/3 h-[360px] w-[360px] rounded-full bg-teal-accent/[0.025] blur-[110px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[280px] w-[280px] rounded-full bg-teal-accent/[0.018] blur-[90px]" />
      </div>

      <motion.div
        style={{ opacity, y }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-accent">
            Профессиональная платформа
          </p>
          <h2
            id="brand-intro-heading"
            className="mt-4 font-display text-[1.75rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-[2rem] lg:text-[2.625rem]"
          >
            <span className="block text-balance">Авторынок нового поколения</span>
            <span className="mt-1.5 block font-normal text-muted-foreground/70">
              для тех, кто работает с автомобилями
            </span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, delay: 0.15, ease: EASE }}
          className="mx-auto mt-5 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]"
        >
          Структурированные данные, модерация качества и инструменты для продавцов, подборщиков и менеджеров — без шума частных объявлений.
        </motion.p>

        {/* Premium stats module — with vertical dividers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
          className="relative mx-auto mt-10 max-w-2xl"
        >
          {/* Top hairline */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent"
          />
          {/* Bottom hairline */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent"
          />

          <div className="grid grid-cols-3 divide-x divide-border/40 py-5">
            {[
              { value: '100%', label: 'Профессионалы' },
              { value: '24/7', label: 'Модерация' },
              { value: '<2ч', label: 'До публикации' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.35 + i * 0.1, ease: EASE }}
                className="px-2 text-center"
              >
                <p className="font-display text-xl font-bold tracking-tight text-teal-accent sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[12px]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
