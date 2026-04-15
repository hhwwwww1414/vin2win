import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  GitCompareArrows,
  LogIn,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
} from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { Button } from '@/components/ui/button';
import { SALE_ROUTE } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'vin2win — профессиональный авторынок',
  description:
    'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: публикация объявлений, фильтры, сравнение и модерация без B2C-шума.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'vin2win — профессиональный авторынок',
    description:
      'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: публикация объявлений, фильтры, сравнение и модерация без B2C-шума.',
    url: '/',
    type: 'website',
    siteName: 'vin2win',
  },
};

const audiences = [
  {
    title: 'Продавцам',
    description: 'Публикация карточек с ценой, городом, техникой, историей и условиями сделки.',
  },
  {
    title: 'Подборщикам',
    description: 'Быстрый переход от запроса клиента к shortlist, сравнению и контакту с продавцом.',
  },
  {
    title: 'Менеджерам',
    description: 'Единый рабочий контур для объявлений, модерации, статусов и повторных публикаций.',
  },
] as const;

const steps = [
  { title: 'Регистрация', description: 'Создайте аккаунт продавца или войдите в существующий профиль.', icon: UserRoundPlus },
  { title: 'Паспорт объявления', description: 'Начните с марки, модели, года, города и цены.', icon: ClipboardCheck },
  { title: 'Проверка', description: 'Заполните технику, историю, состояние, фото и контакты.', icon: ShieldCheck },
  { title: 'Публикация', description: 'После модерации карточка появляется в профессиональной ленте.', icon: CheckCircle2 },
] as const;

const features = [
  { title: 'Поиск и фильтры', description: 'Марка, модель, цена, пробег, год, кузов, история, статус на ресурсах.', icon: Filter },
  { title: 'Сравнение', description: 'Shortlist из нескольких карточек с ценой, пробегом, окраской и техникой.', icon: GitCompareArrows },
  { title: 'Избранное', description: 'Сохранение вариантов для повторной оценки и переговоров.', icon: Sparkles },
  { title: 'Уведомления', description: 'События по объявлениям, модерации и важным изменениям аккаунта.', icon: BellRing },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative min-h-[620px] overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[var(--shadow-floating)]">
          <Image
            src="/cars/cruiser/cruiser.jpg"
            alt="Премиальный автомобиль в карточке vin2win"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/20 dark:from-background dark:via-background/86 dark:to-background/18" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(129,216,208,0.2),transparent_28%),linear-gradient(180deg,transparent,rgba(0,0,0,0.14))]" />

          <div className="relative flex min-h-[620px] max-w-3xl flex-col justify-center px-5 py-12 sm:px-8 lg:px-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-accent/25 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
              <Sparkles className="h-3.5 w-3.5" />
              B2B авторынок
            </div>
            <h1 className="mt-6 font-display text-[1.75rem] font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[4.8rem] lg:leading-[0.98]">
              Профессиональный авторынок без лишнего шума
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              vin2win помогает продавцам, подборщикам и менеджерам быстрее публиковать автомобили,
              собирать структурированные карточки и работать с лентой предложений в одном интерфейсе.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-teal-dark px-6 text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
              >
                <Link href="/register">
                  Зарегистрироваться
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-border/80 bg-background/75 dark:bg-background/20">
                <Link href="/listing/new">Подать объявление</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-xl text-muted-foreground hover:text-foreground">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  Войти
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ['5', 'этапов объявления'],
                ['24/7', 'доступ к ленте'],
                ['B2B', 'фокус без B2C-шума'],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-teal-accent/45 pl-4">
                  <div className="font-display text-2xl font-bold text-foreground">{value}</div>
                  <div className="mt-1 text-caption text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Для кого</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Рабочая среда для профессионалов</h2>
            </div>
            <Link href={SALE_ROUTE} className="inline-flex items-center gap-2 text-sm font-medium text-teal-accent transition-colors hover:text-foreground">
              Перейти в каталог
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {audiences.map((item) => (
              <article key={item.title} className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[var(--shadow-surface)] dark:bg-surface-elevated/92 sm:p-6">
                <div className="mb-4 h-px bg-gradient-to-r from-teal-accent/70 to-transparent" />
                <h3 className="font-display text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-body text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 py-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92 sm:p-8">
            <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Как начать</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">От аккаунта до публикации в ленте</h2>
            <p className="mt-4 text-body text-muted-foreground">
              Мастер объявления начинается с паспорта автомобиля, а финальная отправка уходит на модерацию.
              Пользователь видит статус и возвращается к черновику из кабинета.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article key={step.title} className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[var(--shadow-surface)] dark:bg-surface-elevated/92">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-display text-3xl font-bold text-muted-foreground/30">{index + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">{step.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mb-5 max-w-3xl">
            <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Возможности</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Инструменты уже встроены в продукт</h2>
            <p className="mt-3 text-body text-muted-foreground">
              Лендинг не дублирует доску. Он ведёт к реальным маршрутам: каталогу, созданию объявления,
              входу и регистрации.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[var(--shadow-surface)] dark:bg-surface-elevated/92">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 pb-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent" />
            <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Доверие</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">Структура вместо случайных описаний</h2>
            <p className="mt-4 text-body text-muted-foreground">
              Карточка собирает паспорт, технику, историю, состояние, фото, условия сделки и контакты.
              Модерация помогает держать ленту пригодной для профессионального просмотра.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {['Паспорт', 'История', 'Контакты'].map((item) => (
                <div key={item} className="border-t border-teal-accent/35 pt-3 text-sm font-medium text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-teal-accent/25 bg-[var(--accent-bg-soft)] p-6 shadow-[var(--shadow-floating)] sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-dark text-white dark:bg-teal-accent dark:text-[#09090B]">
              <Search className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground">Откройте каталог или начните с объявления</h2>
            <p className="mt-4 text-body text-muted-foreground">
              Доска объявлений теперь находится отдельно, а главная страница объясняет продукт и ведёт к первым действиям.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                className="rounded-xl bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
              >
                <Link href={SALE_ROUTE}>Перейти в каталог</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-border/80 bg-background/75 dark:bg-background/20">
                <Link href="/listing/new">Подать объявление</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
