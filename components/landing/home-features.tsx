import {
  BellRing,
  Bookmark,
  Filter,
  GitCompareArrows,
  History,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Reveal } from '@/components/landing/reveal';

const FEATURES = [
  {
    icon: Filter,
    title: 'Глубокий поиск и фильтры',
    description:
      'Марка, модель, поколение, кузов, трансмиссия, привод, цвет, регион, пробег, двигатель, мощность и статусы на ресурсах.',
    chips: ['Регион', 'Пробег', 'Двигатель', 'История'],
  },
  {
    icon: GitCompareArrows,
    title: 'Сравнение карточек',
    description:
      'Shortlist до нескольких автомобилей в одной таблице: цена, пробег, техника, окраска и бенефиты — без переключения вкладок.',
    chips: ['Shortlist', 'Таблица', 'Экспорт'],
  },
  {
    icon: Bookmark,
    title: 'Избранное и сохранённые поиски',
    description:
      'Сохраняйте понравившиеся автомобили и целые запросы. Получайте уведомления о новых совпадениях по вашим параметрам.',
    chips: ['Избранное', 'Подписки', 'Теги'],
  },
  {
    icon: MessageSquareText,
    title: 'Встроенный чат',
    description:
      'Переписка с продавцом идёт внутри платформы. История сделки, предложения по цене и документы — в одном потоке.',
    chips: ['Сделка', 'История', 'Push'],
  },
  {
    icon: History,
    title: 'История цены и VIN',
    description:
      'Динамика цены объявления, VIN-отчёт и статусы проверок — материал, который работает в переговорах.',
    chips: ['VIN', 'Цена', 'Статусы'],
  },
  {
    icon: ShieldCheck,
    title: 'Модерация и качество',
    description:
      'Карточки проходят структурную проверку: полнота полей, корректность и отсутствие дублей. Лента остаётся рабочей.',
    chips: ['Проверка', 'Антидубли', 'Качество'],
  },
  {
    icon: BellRing,
    title: 'Уведомления',
    description:
      'Email, push и Telegram — события по объявлениям, сообщениям и новым совпадениям доходят туда, где вы работаете.',
    chips: ['Email', 'Push', 'Telegram'],
  },
  {
    icon: Sparkles,
    title: 'Профиль продавца',
    description:
      'Рейтинг, отзывы и история публикаций повышают доверие и помогают быстрее закрывать переговоры.',
    chips: ['Рейтинг', 'Отзывы', 'История'],
  },
];

export function HomeFeatures() {
  return (
    <section aria-labelledby="home-features-heading" className="py-12 sm:py-16">
      <Reveal>
        <div className="mb-8 max-w-3xl">
          <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Возможности</p>
          <h2
            id="home-features-heading"
            className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
          >
            Инструменты, которые уже встроены в продукт
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Всё, что нужно профессиональному продавцу, подборщику и менеджеру — в одной среде. Без сторонних
            расширений, таблиц и ручных сверок.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Reveal key={feature.title} delay={index * 70}>
              <article className="group relative h-full overflow-hidden rounded-[24px] border border-border/70 bg-card/92 p-5 shadow-[var(--shadow-surface)] transition-all duration-500 hover:-translate-y-0.5 hover:border-teal-accent/40 hover:shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent transition-transform duration-500 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {feature.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
