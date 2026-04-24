'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function BrandIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.85]);
  const y = useTransform(scrollYProgress, [0, 0.3], [40, 0]);

  return (
    <section
      ref={containerRef}
      className="relative py-14 sm:py-18 lg:py-22"
      aria-labelledby="brand-intro-heading"
    >
      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-teal-accent/[0.03] blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[340px] w-[340px] rounded-full bg-teal-accent/[0.02] blur-[100px]" />
      </div>

      <motion.div
        style={{ opacity, y }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-accent">
            Профессиональная платформа
          </p>
          <h2
            id="brand-intro-heading"
            className="mt-4 font-display text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
          >
            <span className="block text-balance">Авторынок нового поколения</span>
            <span className="mt-1.5 block text-muted-foreground/65">для тех, кто работает с автомобилями</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base"
        >
          Структурированные данные, модерация качества и инструменты для продавцов, подборщиков и менеджеров — без шума частных объявлений.
        </motion.p>

        {/* Compact stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-6 border-y border-border/40 py-6"
        >
          {[
            { value: '100%', label: 'Профессионалы' },
            { value: '24/7', label: 'Модерация' },
            { value: '<2ч', label: 'До публикации' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.28 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p className="font-display text-2xl font-bold tracking-tight text-teal-accent sm:text-[1.75rem]">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-[13px]">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
