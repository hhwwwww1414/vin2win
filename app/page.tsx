import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  ClipboardCheck,
  Database,
  Filter,
  GitCompareArrows,
  LockKeyhole,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { HomeHero } from '@/components/landing/home-hero';
import { AudienceTabs } from '@/components/landing/audience-tabs';
import { LandingRevealSection } from '@/components/landing/landing-reveal';
import { WorkflowTimeline } from '@/components/landing/workflow-timeline';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { SALE_ROUTE } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'vin2win - профессиональный авторынок',
  description:
    'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: публикация объявлений, фильтры, сравнение и модерация без B2C-шума.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'vin2win - профессиональный авторынок',
    description:
      'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров: публикация объявлений, фильтры, сравнение и модерация без B2C-шума.',
    url: '/',
    type: 'website',
    siteName: 'vin2win',
  },
};

const platformStats = [
  {
    value: '3',
    label: 'профессиональные роли',
    description: 'Продавцы, подборщики и менеджеры работают в одном продукте.',
  },
  {
    value: '4',
    label: 'рабочих маршрута',
    description: 'Каталог, публикация, сравнение и уведомления связаны между собой.',
  },
  {
    value: '0',
    label: 'B2C-шума',
    description: 'Главная ведет в профессиональные сценарии без витринной перегрузки.',
  },
] as const;

const features = [
  {
    title: 'Поиск и фильтры',
    description: 'Марка, модель, цена, пробег, год, кузов, история и статусы на ресурсах.',
    icon: Filter,
    label: 'вход',
  },
  {
    title: 'Сравнение',
    description: 'Shortlist из нескольких карточек с ценой, пробегом, окраской и техникой.',
    icon: GitCompareArrows,
    label: 'выбор',
  },
  {
    title: 'Избранное',
    description: 'Сохранение вариантов для повторной оценки и переговоров.',
    icon: Sparkles,
    label: 'память',
  },
  {
    title: 'Уведомления',
    description: 'События по объявлениям, модерации и важным изменениям аккаунта.',
    icon: BellRing,
    label: 'статус',
  },
] as const;

const trustItems = [
  {
    title: 'Паспорт вместо свободного текста',
    description: 'Структура удерживает цену, город, технику, историю, состояние и контакты в одном формате.',
    icon: Database,
  },
  {
    title: 'Модерация перед публикацией',
    description: 'Проверка помогает держать ленту пригодной для профессионального просмотра.',
    icon: ShieldCheck,
  },
  {
    title: 'Сигналы по статусам',
    description: 'Пользователь видит состояние карточки и возвращается к черновику из кабинета.',
    icon: BadgeCheck,
  },
] as const;

const faqItems = [
  {
    question: 'Для кого создан vin2win?',
    answer:
      'Для профессиональных продавцов, автомобильных подборщиков и менеджеров, которым нужна рабочая среда без B2C-шума и случайных описаний.',
  },
  {
    question: 'Главная заменяет каталог?',
    answer:
      'Нет. Главная объясняет продукт и ведет к реальным маршрутам: каталогу, созданию объявления, входу и регистрации.',
  },
  {
    question: 'Что происходит после отправки объявления?',
    answer:
      'Карточка уходит на модерацию. После проверки она появляется в профессиональной ленте, а статус остается доступен в кабинете.',
  },
  {
    question: 'Можно ли быстро сравнить несколько вариантов?',
    answer:
      'Да. Shortlist и сравнение помогают держать рядом цену, пробег, окраску, технику и другие параметры рабочих карточек.',
  },
] as const;

const staggerStyle = (index: number) =>
  ({
    '--landing-stagger-index': index,
  }) as CSSProperties;

export default function LandingPage() {
  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <HomeHero />

        <LandingRevealSection
          aria-labelledby="platform-value-heading"
          className="overflow-hidden pt-8 sm:pt-10"
        >
          <div className="landing-stagger-item relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[radial-gradient(circle_at_20%_0%,rgba(129,216,208,0.105),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018)_52%,rgba(0,0,0,0.16))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-6 lg:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-teal-accent/10 opacity-40"
            />

            <div className="relative z-10 grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-teal-accent">
                    Платформа
                  </p>
                  <h2
                    id="platform-value-heading"
                    className="mt-4 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl"
                  >
                    Инструменты уже встроены в продукт
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-7 text-white/62">
                    Лендинг не дублирует доску. Он ведет к реальным маршрутам: каталогу, созданию объявления,
                    входу и регистрации.
                  </p>
                </div>

                <div className="mt-7 rounded-[26px] border border-white/10 bg-black/[0.16] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                    Рабочий контур
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-white/10 bg-white/10">
                    {['Каталог', 'Публикация', 'Сравнение', 'Уведомления'].map((item) => (
                      <div key={item} className="bg-[#0c1115]/95 px-3 py-3 text-sm font-semibold text-white/72">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <dl className="grid overflow-hidden rounded-[24px] border border-white/10 bg-black/[0.12] sm:grid-cols-3">
                  {platformStats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className="landing-stagger-item border-b border-white/10 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                      style={staggerStyle(index)}
                    >
                      <dt className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-white/42">
                        {stat.label}
                      </dt>
                      <dd className="mt-3 flex items-end gap-3">
                        <span className="font-display text-4xl font-semibold leading-none tracking-tight text-white">
                          {stat.value}
                        </span>
                        <span className="mb-1 h-px flex-1 bg-gradient-to-r from-teal-accent/60 to-transparent" />
                      </dd>
                      <p className="mt-3 text-sm leading-6 text-white/56">{stat.description}</p>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))]">
                  <div className="grid sm:grid-cols-2">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;

                    return (
                      <article
                        key={feature.title}
                        className={`landing-stagger-item group border-t border-white/10 p-4 first:border-t-0 sm:p-5 ${index < 2 ? 'sm:border-t-0' : ''} ${index % 2 === 0 ? 'sm:border-r sm:border-white/10' : ''}`}
                        style={staggerStyle(index)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-teal-accent/22 bg-teal-accent/10 text-teal-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/46 transition-colors duration-300 group-hover:border-teal-accent/24 group-hover:text-teal-accent/78">
                            {feature.label}
                          </span>
                        </div>
                        <h3 className="mt-4 font-display text-lg font-semibold text-white">{feature.title}</h3>
                        <p className="mt-1.5 text-sm leading-6 text-white/58">{feature.description}</p>
                      </article>
                    );
                  })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LandingRevealSection>

        <LandingRevealSection aria-labelledby="audience-heading" className="pt-6 sm:pt-8">
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-teal-accent">
                Для кого
              </p>
              <h2
                id="audience-heading"
                className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl"
              >
                Рабочая среда для профессионалов
              </h2>
            </div>
            <Link
              href={SALE_ROUTE}
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-semibold text-white/72 transition-[border-color,background,color] duration-300 hover:border-teal-accent/30 hover:bg-teal-accent/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60"
            >
              Перейти в каталог
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="landing-stagger-item">
            <AudienceTabs />
          </div>
        </LandingRevealSection>

        <LandingRevealSection aria-labelledby="workflow-heading" className="pt-7 sm:pt-9">
          <WorkflowTimeline />
        </LandingRevealSection>

        <LandingRevealSection aria-labelledby="trust-heading" className="pt-7 sm:pt-9">
          <div className="landing-stagger-item relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(129,216,208,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.026)_58%,rgba(0,0,0,0.2))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-6 lg:p-7">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            />
            <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-teal-accent">
                  Доверие
                </p>
                <h2
                  id="trust-heading"
                  className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                >
                  Структура вместо случайных описаний
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62 sm:text-[0.95rem]">
                  Карточка собирает паспорт, технику, историю, состояние, фото, условия сделки и контакты.
                  Модерация помогает держать ленту пригодной для профессионального просмотра.
                </p>
                <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-[22px] border border-white/10 bg-black/[0.14]">
                  {['Паспорт', 'История', 'Контакты'].map((item) => (
                    <div key={item} className="border-r border-white/10 px-3 py-3 text-center last:border-r-0">
                      <span className="text-xs font-semibold text-white/72">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                {trustItems.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="landing-stagger-item flex gap-4 border-t border-white/10 pt-4 first:border-t-0 first:pt-0"
                      style={staggerStyle(index)}
                    >
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-teal-accent/22 bg-teal-accent/10 text-teal-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-white">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-6 text-white/58">{item.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </LandingRevealSection>

        <LandingRevealSection aria-labelledby="actions-heading" className="pt-7 sm:pt-9">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.92fr]">
            <div className="landing-stagger-item rounded-[30px] border border-white/10 bg-[#07090d]/88 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.22)] sm:p-6">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-teal-accent">
                Маршруты
              </p>
              <h2
                id="actions-heading"
                className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl"
              >
                Откройте каталог или начните с объявления
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/62 sm:text-[0.95rem]">
                Доска объявлений теперь находится отдельно, а главная страница объясняет продукт и ведет к первым
                действиям.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  className="group h-auto min-h-16 justify-between overflow-hidden whitespace-normal rounded-[20px] border border-teal-accent/25 bg-[linear-gradient(135deg,#0f7770_0%,#35c4bb_100%)] px-4 py-3 text-left text-[#061112] shadow-[0_18px_38px_rgba(21,157,147,0.24)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(21,157,147,0.32)]"
                >
                  <Link href={SALE_ROUTE}>
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-black/10 ring-1 ring-black/10">
                        <Search className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold tracking-tight sm:text-base">Перейти в каталог</span>
                        <span className="mt-0.5 block text-xs font-semibold text-[#061112]/64">
                          Смотреть свежие объявления
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="group h-auto min-h-16 justify-between overflow-hidden whitespace-normal rounded-[20px] border-white/12 bg-white/[0.045] px-4 py-3 text-left text-white shadow-[0_18px_38px_rgba(0,0,0,0.18)] transition-[border-color,background,transform] duration-300 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.075] hover:text-white"
                >
                  <Link href="/listing/new">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.06] text-teal-accent">
                        <ClipboardCheck className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold tracking-tight sm:text-base">Подать объявление</span>
                        <span className="mt-0.5 block text-xs font-semibold text-white/52">
                          Запустить публикацию
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-white/62 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="landing-stagger-item grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { title: 'Каталог', description: 'Смотреть ленту', icon: SlidersHorizontal },
                { title: 'Сравнение', description: 'Собрать shortlist', icon: GitCompareArrows },
                { title: 'Кабинет', description: 'Следить за статусом', icon: LockKeyhole },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="landing-stagger-item flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_44px_rgba(0,0,0,0.16)]"
                    style={staggerStyle(index)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-teal-accent/22 bg-teal-accent/10 text-teal-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-0.5 truncate text-sm text-white/52">{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </LandingRevealSection>

        <LandingRevealSection aria-labelledby="faq-heading" className="pb-8 pt-7 sm:pb-10 sm:pt-9">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="landing-stagger-item">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-teal-accent">FAQ</p>
              <h2
                id="faq-heading"
                className="mt-3 max-w-xl font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl"
              >
                Коротко о рабочем процессе
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/58">
                Основные маршруты остаются компактными: найти вариант, сравнить, опубликовать карточку и отслеживать
                статус.
              </p>
            </div>

            <Accordion type="single" collapsible className="landing-stagger-item grid gap-2">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`faq-${index}`}
                  className="landing-stagger-item overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] px-4 shadow-[0_16px_44px_rgba(0,0,0,0.16)]"
                  style={staggerStyle(index)}
                >
                  <AccordionTrigger className="py-4 text-base font-semibold text-white hover:no-underline [&>svg]:text-teal-accent">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-0 text-sm leading-6 text-white/60">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </LandingRevealSection>
      </main>
    </div>
  );
}
