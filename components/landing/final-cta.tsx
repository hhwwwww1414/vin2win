'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Search, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HOME_HERO_CTA_VARIANT_A } from '@/lib/home-cta';
import { SALE_ROUTE } from '@/lib/routes';

export function FinalCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0.4, 1, 1, 0.95]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.97, 1]);

  const primaryCta = HOME_HERO_CTA_VARIANT_A.primary;
  const secondaryCta = HOME_HERO_CTA_VARIANT_A.secondary;

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-14 sm:py-18 lg:py-22"
      aria-labelledby="final-cta-heading"
    >
      {/* Background effects */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_100%,rgba(129,216,208,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_0%,rgba(129,216,208,0.05),transparent)]" />
      </div>

      <motion.div style={{ opacity, scale }} className="relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-teal-accent/25 bg-gradient-to-br from-[#0a1214] via-[#0d1518] to-[#0a1214] p-7 shadow-[0_30px_70px_rgba(0,0,0,0.25),0_0_0_1px_rgba(129,216,208,0.08)_inset] sm:p-10 lg:p-12"
        >
          {/* Decorative elements */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/50 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-teal-accent/8 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-seafoam/8 blur-[100px]"
          />

          {/* Carbon fiber subtle texture */}
          <div
            aria-hidden="true"
            className="carbon-fiber-center absolute inset-0 opacity-[0.012]"
          />

          <div className="relative text-center">
            {/* Compact badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-accent/30 bg-teal-accent/10 px-3 py-1.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-accent" />
              </span>
              <span className="text-[12px] font-medium text-teal-accent">Открыта регистрация</span>
            </motion.div>

            <h2
              id="final-cta-heading"
              className="font-display text-[1.75rem] font-bold tracking-tight text-white sm:text-3xl lg:text-[2.25rem]"
            >
              <span className="text-balance">
                Начните работать с <span className="text-teal-accent">vin2win</span> сегодня
              </span>
            </h2>

            <p className="mx-auto mt-3.5 max-w-lg text-[14.5px] leading-relaxed text-white/65">
              Присоединяйтесь к профессионалам авторынка. Структурированные данные, модерация и инструменты для эффективной работы.
            </p>

            {/* CTA buttons - tighter */}
            <div className="mx-auto mt-7 grid max-w-xl gap-3 sm:grid-cols-2 sm:gap-3.5">
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
                      <span className="block text-base font-semibold tracking-tight">Перейти в каталог</span>
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
                      <span className="block text-base font-semibold tracking-tight">Подать объявление</span>
                      <span className={secondaryCta.descriptionClassName}>
                        Начать публикацию
                      </span>
                    </span>
                  </span>
                  <ArrowRight className={secondaryCta.arrowClassName} />
                </Link>
              </Button>
            </div>

            {/* Trust indicators - tighter */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-white/45"
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
