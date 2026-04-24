'use client';

import {
  BadgeCheck,
  BriefcaseBusiness,
  CarFront,
  ClipboardCheck,
  Gauge,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Audience = {
  value: string;
  title: string;
  eyebrow: string;
  description: string;
  summary: string;
  icon: LucideIcon;
  metrics: Array<{ label: string; value: string }>;
  points: Array<{ title: string; description: string }>;
};

const audiences: Audience[] = [
  {
    value: 'sellers',
    title: 'Продавцам',
    eyebrow: 'Публикация без лишнего шума',
    description: 'Публикация карточек с ценой, городом, техникой, историей и условиями сделки.',
    summary: 'Быстро собрать понятную карточку, пройти проверку и попасть в профессиональную ленту.',
    icon: CarFront,
    metrics: [
      { label: 'контур', value: 'Sale' },
      { label: 'фокус', value: 'карточка' },
      { label: 'выход', value: 'лид' },
    ],
    points: [
      {
        title: 'Паспорт автомобиля',
        description: 'Марка, модель, год, город, цена и ресурсные статусы собраны в одной структуре.',
      },
      {
        title: 'Сделочная ясность',
        description: 'Фото, состояние, история и контакты не теряются в свободном описании.',
      },
    ],
  },
  {
    value: 'selectors',
    title: 'Подборщикам',
    eyebrow: 'Shortlist для клиента',
    description: 'Быстрый переход от запроса клиента к shortlist, сравнению и контакту с продавцом.',
    summary: 'Сузить выдачу до рабочих вариантов, сравнить детали и быстрее выйти на контакт.',
    icon: Gauge,
    metrics: [
      { label: 'контур', value: 'Search' },
      { label: 'фокус', value: 'сравнение' },
      { label: 'выход', value: 'решение' },
    ],
    points: [
      {
        title: 'Фильтры по делу',
        description: 'Цена, пробег, год, кузов, история и статусы помогают убрать нерелевантные варианты.',
      },
      {
        title: 'Сравнение без таблиц',
        description: 'Ключевые параметры нескольких карточек остаются рядом и читаются быстро.',
      },
    ],
  },
  {
    value: 'managers',
    title: 'Менеджерам',
    eyebrow: 'Контроль качества ленты',
    description: 'Единый рабочий контур для объявлений, модерации, статусов и повторных публикаций.',
    summary: 'Держать публикации, статусы и повторные проверки в одном операционном процессе.',
    icon: BriefcaseBusiness,
    metrics: [
      { label: 'контур', value: 'Ops' },
      { label: 'фокус', value: 'статус' },
      { label: 'выход', value: 'порядок' },
    ],
    points: [
      {
        title: 'Модерация как процесс',
        description: 'Заявки проходят понятные статусы, а комментарии остаются рядом с карточкой.',
      },
      {
        title: 'Повторная публикация',
        description: 'Рабочие объявления можно возвращать в контур без ручного восстановления данных.',
      },
    ],
  },
];

const controlIcons = [BadgeCheck, UsersRound, ShieldCheck] as const;

export function AudienceTabs() {
  return (
    <Tabs defaultValue={audiences[0].value} className="w-full gap-0">
      <TabsList
        aria-label="Аудитория vin2win"
        className="scrollbar-hide grid h-auto w-full grid-cols-3 gap-1 overflow-x-auto rounded-[22px] border border-white/10 bg-white/[0.035] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:max-w-[560px]"
      >
        {audiences.map((audience, index) => {
          const Icon = controlIcons[index];

          return (
            <TabsTrigger
              key={audience.value}
              value={audience.value}
              className="min-w-0 rounded-[17px] px-2 py-2.5 text-[0.72rem] font-semibold text-white/58 transition-[background,color,box-shadow] duration-500 data-[state=active]:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.055))] data-[state=active]:text-white data-[state=active]:shadow-[0_14px_28px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.16)] sm:px-4 sm:text-sm"
            >
              <Icon className="hidden h-4 w-4 text-teal-accent sm:block" />
              <span className="min-w-0 truncate">{audience.title}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {audiences.map((audience) => {
        const Icon = audience.icon;

        return (
          <TabsContent key={audience.value} value={audience.value} className="mt-4 outline-none sm:mt-5">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035)_48%,rgba(129,216,208,0.065))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.26)] sm:p-5 lg:p-6">
              <div
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
              />
              <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-teal-accent/25 bg-teal-accent/10 text-teal-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-teal-accent/82">
                        {audience.eyebrow}
                      </p>
                      <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-white">
                        {audience.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/66">{audience.description}</p>
                  <p className="mt-3 max-w-xl text-base leading-7 text-white/86">{audience.summary}</p>
                </div>

                <div className="space-y-4">
                  <dl className="grid grid-cols-3 overflow-hidden rounded-[20px] border border-white/10 bg-black/12">
                    {audience.metrics.map((metric) => (
                      <div key={metric.label} className="min-w-0 border-r border-white/10 px-3 py-3 last:border-r-0">
                        <dt className="truncate text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white/42">
                          {metric.label}
                        </dt>
                        <dd className="mt-1 truncate font-display text-sm font-semibold text-white sm:text-base">
                          {metric.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {audience.points.map((point) => (
                      <div key={point.title} className="border-t border-white/10 pt-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <ClipboardCheck className="h-4 w-4 shrink-0 text-teal-accent" />
                          {point.title}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/60">{point.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
