import Link from 'next/link';
import { ArrowRight, BadgeCheck, Layers3, ShieldCheck } from 'lucide-react';

export const homepageFaqItems = [
  {
    question: 'Чем vin2win отличается от Avito и Auto.ru?',
    answer:
      'vin2win сфокусирован на профессиональном B2B-обороте автомобилей: продавцах, подборщиках, автоброкерах и менеджерах. Вместо массовой витрины для всех пользователей платформа собирает структурированные карточки, рабочие фильтры, сравнение и запросы в подбор без B2C-шума.',
  },
  {
    question: 'Кто может размещать объявления?',
    answer:
      'Размещать объявления могут профессиональные участники авторынка: дилеры, продавцы, брокеры, подборщики и менеджеры, которые работают с автомобилями как с регулярным бизнес-процессом.',
  },
  {
    question: 'Что значит профессиональный B2B-авторынок?',
    answer:
      'Это среда для сделок между специалистами, где важны проверяемые параметры автомобиля, понятный статус объявления, быстрый контакт, история цены и возможность сравнивать предложения по рабочим критериям.',
  },
  {
    question: 'Как работает модерация объявлений?',
    answer:
      'Карточки проходят проверку на полноту данных, корректность ключевых параметров и качество публикации. После модерации объявление попадает в профессиональную ленту, а автор видит статус в кабинете.',
  },
  {
    question: 'Для кого раздел “Запросы в подбор”?',
    answer:
      'Раздел нужен тем, кто ищет автомобиль под конкретную задачу клиента: подборщикам, брокерам, менеджерам и продавцам. Запрос фиксирует бюджет, модели, ограничения и регион, чтобы поставщики быстрее понимали, подходит ли их лот.',
  },
];

const seoCards = [
  {
    title: 'Что такое vin2win',
    text: 'vin2win — профессиональная платформа для работы с автомобильными объявлениями и запросами в подбор. Она объединяет каталог, модерацию, сравнение, избранное и сохранение поисков в одном рабочем продукте для рынка России.',
    icon: Layers3,
  },
  {
    title: 'Для кого платформа',
    text: 'Основная аудитория — продавцы, автоподборщики, автоброкеры, дилерские команды и менеджеры, которым нужна не витрина, а удобный поток проверяемых предложений и заявок.',
    icon: BadgeCheck,
  },
  {
    title: 'Профессиональная лента',
    text: 'В отличие от массовых классифайдов, vin2win снижает шум частных объявлений и делает акцент на структурированных карточках, понятных статусах, проверке и быстром сравнении лотов.',
    icon: ShieldCheck,
  },
];

const internalLinks = [
  { href: '/sale', label: 'Автомобили в продаже' },
  { href: '/wanted', label: 'Запросы в подбор' },
  { href: '/about', label: 'О проекте' },
  { href: '/contacts', label: 'Контакты' },
  { href: '/privacy', label: 'Политика обработки данных' },
  { href: '/terms', label: 'Правила платформы' },
];

export function HomepageSeoSections() {
  return (
    <section className="relative py-10 sm:py-12 lg:py-14" aria-labelledby="homepage-seo-heading">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        <div className="rounded-[28px] border border-border/60 bg-card/88 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] dark:bg-surface-elevated/88 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-accent">
            B2B-авторынок
          </p>
          <h2
            id="homepage-seo-heading"
            className="mt-3 max-w-xl font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Рабочая платформа для профессиональных сделок с автомобилями
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-[15px]">
            vin2win помогает участникам авторынка быстрее находить релевантные автомобили, публиковать
            структурированные карточки и отвечать на запросы в подбор. Платформа рассчитана на деловой
            сценарий: меньше случайного трафика, больше параметров, статусов и инструментов для оценки лота.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {internalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/65 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
              >
                {link.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {seoCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="group rounded-[24px] border border-border/60 bg-card/72 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.12)] transition-colors hover:border-teal-accent/30 dark:bg-surface-elevated/72 sm:p-5"
              >
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-accent/25 bg-[var(--accent-bg-soft)] text-teal-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">{card.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{card.text}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomepageFAQ() {
  return (
    <section className="relative py-10 sm:py-12 lg:py-14" aria-labelledby="homepage-faq-heading">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-accent">
            Вопросы и ответы
          </p>
          <h2
            id="homepage-faq-heading"
            className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Частые вопросы о vin2win
          </h2>
        </div>
        <div className="space-y-2.5">
          {homepageFaqItems.map((item) => (
            <details
              key={item.question}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-card/78 shadow-[0_10px_28px_rgba(0,0,0,0.1)] transition-colors open:border-teal-accent/30 open:bg-teal-accent/[0.035] dark:bg-surface-elevated/78"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left marker:hidden">
                <h3 className="text-sm font-semibold text-foreground sm:text-base">{item.question}</h3>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70 text-lg leading-none text-muted-foreground transition-colors group-open:border-teal-accent/35 group-open:text-teal-accent">
                  +
                </span>
              </summary>
              <div className="border-t border-border/35 px-5 pb-4 pt-3">
                <p className="text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
