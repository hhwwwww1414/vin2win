'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function BrandIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.3], [60, 0]);

  return (
    <section
      ref={containerRef}
      className="relative py-24 sm:py-32 lg:py-40"
      aria-labelledby="brand-intro-heading"
    >
      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-teal-accent/[0.03] blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-teal-accent/[0.02] blur-[100px]" />
      </div>

      <motion.div
        style={{ opacity, y }}
        className="relative mx-auto max-w-4xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-meta font-semibold uppercase tracking-[0.28em] text-teal-accent">
            Профессиональная платформа
          </p>
          <h2
            id="brand-intro-heading"
            className="mt-6 font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            <span className="block text-balance">Авторынок нового поколения</span>
            <span className="mt-2 block text-muted-foreground/70">для тех, кто работает с автомобилями</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          Структурированные данные, модерация качества и инструменты для продавцов, подборщиков и менеджеров. 
          Без шума частных объявлений и случайных покупателей.
        </motion.p>

        {/* Animated stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 grid grid-cols-3 gap-8 border-y border-border/50 py-10"
        >
          {[
            { value: '100%', label: 'Профессионалы' },
            { value: '24/7', label: 'Модерация' },
            { value: '<2ч', label: 'До публикации' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p className="font-display text-3xl font-bold tracking-tight text-teal-accent sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
