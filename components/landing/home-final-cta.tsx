import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HOME_HERO_CTA_VARIANT_A } from '@/lib/home-cta';
import { SALE_ROUTE } from '@/lib/routes';
import { Reveal } from '@/components/landing/reveal';

export function HomeFinalCta() {
  const primaryCta = HOME_HERO_CTA_VARIANT_A.primary;
  const secondaryCta = HOME_HERO_CTA_VARIANT_A.secondary;

  return (
    <section aria-labelledby="home-final-cta-heading" className="pb-16 pt-10 sm:pt-14">
      <Reveal>
        <div className="relative overflow-hidden rounded-[36px] border border-teal-accent/25 bg-[var(--accent-bg-soft)] p-6 shadow-[var(--shadow-floating)] sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-teal-accent/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-[340px] w-[340px] rounded-full bg-teal-accent/8 blur-3xl"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-accent/30 bg-card/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-accent backdrop-blur-sm dark:bg-surface-elevated/60">
                <Sparkles className="h-3.5 w-3.5" />
                Готовы попробовать
              </span>
              <h2
                id="home-final-cta-heading"
                className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-4xl lg:text-[2.75rem]"
              >
                Откройте каталог или запустите первое объявление
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                vin2win — это профессиональный авторынок, где данные работают на сделку. Начните с каталога, если
                подбираете, или с публикации, если продаёте. Переключаться между ролями можно в любой момент.
              </p>

              <ul className="mt-6 grid gap-3 text-sm text-foreground sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-accent"
                    aria-hidden="true"
                  />
                  <span>Бесплатная базовая публикация</span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-accent"
                    aria-hidden="true"
                  />
                  <span>Модерация и структурная проверка</span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-accent"
                    aria-hidden="true"
                  />
                  <span>Глубокие фильтры и сравнение</span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-accent"
                    aria-hidden="true"
                  />
                  <span>Чат сделки и уведомления</span>
                </li>
              </ul>
            </div>

            <div className="grid gap-3">
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
                        Свежая лента для профессиональной работы
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
                        Публикация, модерация и первый просмотр
                      </span>
                    </span>
                  </span>
                  <ArrowRight className={secondaryCta.arrowClassName} />
                </Link>
              </Button>

              <p className="mt-1 text-center text-xs text-muted-foreground">
                Ещё нет аккаунта?{' '}
                <Link
                  href="/register"
                  className="font-medium text-teal-accent underline-offset-4 transition-colors hover:underline"
                >
                  Зарегистрируйтесь
                </Link>{' '}
                — займёт пару минут.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
