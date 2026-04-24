'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Handshake,
  LayoutList,
  SlidersHorizontal,
  Star,
  Store,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/landing/reveal';
import { SALE_ROUTE } from '@/lib/routes';

type AudienceKey = 'seller' | 'selector' | 'manager';

type Audience = {
  key: AudienceKey;
  label: string;
  icon: typeof Store;
  headline: string;
  description: string;
  capabilities: { icon: typeof CheckCircle2; title: string; text: string }[];
  primaryHref: string;
  primaryLabel: string;
};

const AUDIENCES: Audience[] = [
  {
    key: 'seller',
    label: 'Продавцу',
    icon: Store,
    headline: 'Продавайте быстрее — без случайных звонков',
    description:
      'Создавайте карточки по паспорту автомобиля: техника, история, фото и условия сделки. Контакт с реальными покупателями, а не с туристами.',
    capabilities: [
      {
        icon: LayoutList,
        title: 'Структурный паспорт',
        text: 'Форма ведёт вас по полям, ничего не забывается: марка, модель, VIN, пробег, город, цена.',
      },
      {
        icon: Star,
        title: 'Профиль продавца',
        text: 'Отзывы, рейтинг и история публикаций повышают доверие к объявлению.',
      },
      {
        icon: CheckCircle2,
        title: 'Статусы и модерация',
        text: 'Вы видите, где объявление: черновик, на модерации, опубликовано или архив.',
      },
      {
        icon: Handshake,
        title: 'Чат внутри платформы',
        text: 'Переговоры идут без пересылок в мессенджеры: история сделки остаётся с вами.',
      },
    ],
    primaryHref: '/listing/new',
    primaryLabel: 'Подать объявление',
  },
  {
    key: 'selector',
    label: 'Подборщику',
    icon: Users,
    headline: 'От запроса клиента до shortlist — за минуты',
    description:
      'Расширенные фильтры, сравнение нескольких карточек, избранное и сохранённые поиски с уведомлениями о новых совпадениях.',
    capabilities: [
      {
        icon: SlidersHorizontal,
        title: 'Глубокие фильтры',
        text: 'Марка, модель, кузов, трансмиссия, пробег, двигатель, мощность, цвет, регион и история.',
      },
      {
        icon: LayoutList,
        title: 'Сравнение',
        text: 'Shortlist из нескольких карточек с ценой, пробегом, окраской и техникой в одной таблице.',
      },
      {
        icon: Star,
        title: 'Избранное',
        text: 'Сохраняйте кандидатов и возвращайтесь к ним без повторного поиска.',
      },
      {
        icon: CheckCircle2,
        title: 'Сохранённые поиски',
        text: 'Уведомления, когда в ленте появляется объявление под параметры клиента.',
      },
    ],
    primaryHref: SALE_ROUTE,
    primaryLabel: 'Открыть каталог',
  },
  {
    key: 'manager',
    label: 'Менеджеру',
    icon: Briefcase,
    headline: 'Единый рабочий контур для всей команды',
    description:
      'Объявления, статусы, модерация, повторные публикации и сделки — в одном интерфейсе. Меньше переключений, больше обзора.',
    capabilities: [
      {
        icon: LayoutList,
        title: 'Лента без дублей',
        text: 'Каталог отделён от лендинга, карточки собраны в предсказуемом виде.',
      },
      {
        icon: SlidersHorizontal,
        title: 'Сегментация',
        text: 'Быстрые фильтры по статусам, регионам и бенефитам — управление потоком, а не пересмотром.',
      },
      {
        icon: CheckCircle2,
        title: 'Контроль качества',
        text: 'История цены, VIN-отчёт и предупреждения помогают отсечь сомнительные карточки.',
      },
      {
        icon: Handshake,
        title: 'Переписка и сделка',
        text: 'Чат с контекстом объявления, уведомления и документы — сделка не теряется.',
      },
    ],
    primaryHref: SALE_ROUTE,
    primaryLabel: 'Перейти к работе',
  },
];

export function HomeAudiences() {
  const [active, setActive] = useState<AudienceKey>('seller');
  const audience = AUDIENCES.find((item) => item.key === active) ?? AUDIENCES[0];

  return (
    <section aria-labelledby="home-audiences-heading" className="py-12 sm:py-16">
      <Reveal>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Для кого</p>
            <h2
              id="home-audiences-heading"
              className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
            >
              Три роли, один профессиональный контекст
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Выберите свою роль — и посмотрите, какие инструменты уже встроены под ваши сценарии работы.
            </p>
          </div>
        </div>
      </Reveal>

      <div
        role="tablist"
        aria-label="Аудитории vin2win"
        className="mb-6 inline-flex flex-wrap gap-2 rounded-full border border-border/70 bg-card/80 p-1.5 dark:bg-surface-elevated/80"
      >
        {AUDIENCES.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(item.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-teal-accent text-[#071114] shadow-[0_8px_22px_rgba(21,157,147,0.28)]'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <Reveal key={audience.key}>
        <div className="grid gap-5 rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-floating)] sm:p-8 lg:grid-cols-[1fr_1.2fr] dark:bg-surface-elevated/92">
          <div className="flex flex-col">
            <div
              aria-hidden="true"
              className="mb-5 h-px bg-gradient-to-r from-teal-accent/70 to-transparent"
            />
            <h3 className="font-display text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">
              {audience.headline}
            </h3>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{audience.description}</p>

            <Link
              href={audience.primaryHref}
              className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-teal-accent/30 bg-[var(--accent-bg-soft)] px-4 py-2 text-sm font-semibold text-teal-accent transition-all duration-300 hover:border-teal-accent/60 hover:bg-[var(--accent-bg-soft)]/80"
            >
              {audience.primaryLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {audience.capabilities.map((cap, index) => {
              const Icon = cap.icon;
              return (
                <li
                  key={cap.title}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="group flex gap-3 rounded-[20px] border border-border/60 bg-background/40 p-4 transition-all duration-300 hover:border-teal-accent/30 hover:bg-[var(--accent-bg-soft)]/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-accent/20 bg-card text-teal-accent transition-transform duration-300 group-hover:scale-110 dark:bg-surface-elevated">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">{cap.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cap.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
