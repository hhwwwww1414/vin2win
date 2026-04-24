'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Search, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HOME_HERO_CTA_VARIANT_A } from '@/lib/home-cta';
import { SALE_ROUTE } from '@/lib/routes';

const EASE = [0.22, 1, 0.36, 1] as const;

export function FinalCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.9, 1], [0.5, 1, 1, 0.95]);
  const scale = useTransform(scrollYProgress, [0, 0.35], [0.985, 1]);

  const primaryCta = HOME_HERO_CTA_VARIANT_A.primary;
  const secondaryCta = HOME_HERO_CTA_VARIANT_A.secondary;

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
      aria-labelledby="final-cta-heading"
    >
      {/* Background effects */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_100%,rgba(129,216,208,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_0%,rgba(129,216,208,0.04),transparent)]" />
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
            relative mx-auto max-w-3xl overflow-hidden rounded-3xl
            border border-teal-accent/25
            bg-gradient-to-br from-[#0a1214] via-[#0d1518] to-[#0a1214]
            p-6 shadow-[0_22px_56px_rgba(0,0,0,0.22),0_0_0_1px_rgba(129,216,208,0.08)_inset]
            sm:p-9 lg:p-11
          "
        >
          {/* Decorative */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/50 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -left-28 -top-28 h-56 w-56 rounded-full bg-teal-accent/8 blur-[90px]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 -right-28 h-56 w-56 rounded-full bg-seafoam/8 blur-[90px]"
          />
          <div
            aria-hidden="true"
            className="carbon-fiber-center absolute inset-0 opacity-[0.01]"
          />

          <div className="relative text-center">
            {/* Compact live badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-accent/30 bg-teal-accent/10 px-3 py-1.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-accent" />
              </span>
              <span className="text-[11.5px] font-medium tracking-wide text-teal-accent">
                Открыта регистрация
              </span>
            </motion.div>

            <motion.h2
              id="final-cta-heading"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
              className="font-display text-[1.625rem] font-bold tracking-tight text-white sm:text-[1.875rem] lg:text-[2.125rem]"
            >
              <span className="text-balance">
                Начните работать с <span className="text-teal-accent">vin2win</span> сегодня
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.3, ease: EASE }}
              className="mx-auto mt-3 max-w-lg text-[13.5px] leading-relaxed text-white/65 sm:text-[14px]"
            >
              Присоединяйтесь к профессионалам авторынка. Структурированные данные, модерация и инструменты для эффективной работы.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.38, ease: EASE }}
              className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2 sm:gap-3.5"
            >
              <Button asChild className={primaryCta.buttonClassName}>
                <Link href={SALE_ROUTE}>
                  <span
                    aria-hidden="true"
                    className={primaryCta.sweepClassName}
                    style={{ animationDelay: `${primaryCta.sweepDelayMs}ms` }}
                  />
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={primaryCta.iconClassName}>
                      <Search className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold tracking-tight">
                        Перейти в каталог
                      </span>
                      <span className={primaryCta.descriptionClassName}>
                        Смотреть свежие объявления
                      </span>
                    </span>
                  </span>
                  <ArrowRight className={primaryCta.arrowClassName} />
                </Link>
              </Button>
              <Button asChild variant="outline" className={secondaryCta.buttonClassName}>
                <Link href="/listing/new">
                  <span
                    aria-hidden="true"
                    className={secondaryCta.sweepClassName}
                    style={{ animationDelay: `${secondaryCta.sweepDelayMs}ms` }}
                  />
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={secondaryCta.iconClassName}>
                      <ClipboardCheck className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold tracking-tight">
                        Подать объявление
                      </span>
                      <span className={secondaryCta.descriptionClassName}>
                        Начать публикацию
                      </span>
                    </span>
                  </span>
                  <ArrowRight className={secondaryCta.arrowClassName} />
                </Link>
              </Button>
            </motion.div>

            {/* Trust indicators — tighter, single line on sm+ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.48, ease: EASE }}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/45"
            >
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-teal-accent" />
                Бесплатная регистрация
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-teal-accent" />
                Модерация 24/7
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-teal-accent" />
                Только профессионалы
              </span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
