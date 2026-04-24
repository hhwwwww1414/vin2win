import { Check, X } from 'lucide-react';
import { Reveal } from '@/components/landing/reveal';

const ROWS = [
  {
    topic: 'Аудитория',
    generic: 'Частные продавцы и случайные покупатели',
    vin2win: 'Профессиональные продавцы, подборщики, менеджеры',
  },
  {
    topic: 'Структура карточки',
    generic: 'Свободный текст, неполные поля',
    vin2win: 'Паспорт, техника, история, состояние, сделка',
  },
  {
    topic: 'Модерация',
    generic: 'Автоматические фильтры по ключевым словам',
    vin2win: 'Проверка полноты данных и структурная валидация',
  },
  {
    topic: 'Фильтры',
    generic: 'Базовые: марка, цена, год',
    vin2win: 'Глубокие: до двигателя, окраски, статусов и бенефитов',
  },
  {
    topic: 'Работа с клиентами',
    generic: 'Перенос в мессенджеры и потеря истории',
    vin2win: 'Чат внутри платформы с историей сделки',
  },
  {
    topic: 'Сравнение вариантов',
    generic: 'Вручную через вкладки и скриншоты',
    vin2win: 'Встроенный shortlist и сводная таблица',
  },
  {
    topic: 'Уведомления',
    generic: 'Реклама и рассылки',
    vin2win: 'События по объявлениям, сообщениям и сохранённым поискам',
  },
];

export function HomeWhyChoose() {
  return (
    <section aria-labelledby="home-why-choose-heading" className="py-12 sm:py-16">
      <Reveal>
        <div className="mb-8 max-w-3xl">
          <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Почему vin2win</p>
          <h2
            id="home-why-choose-heading"
            className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
          >
            Не очередная доска — а рабочая среда профессионалов
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Сравните, чем классический классифайд отличается от профессиональной платформы. Вся разница — в данных,
            модерации и инструментах сделки.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92">
          <div className="grid grid-cols-3 gap-0 border-b border-border/70 bg-background/40 px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:px-6">
            <div>Критерий</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
                <X className="h-3 w-3" aria-hidden="true" />
              </span>
              <span>Обычная доска</span>
            </div>
            <div className="flex items-center gap-2 text-teal-accent">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-bg-soft)] text-teal-accent">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              <span>vin2win</span>
            </div>
          </div>

          <ul>
            {ROWS.map((row, index) => (
              <li
                key={row.topic}
                className="grid grid-cols-3 gap-0 border-b border-border/60 px-5 py-4 text-sm transition-colors last:border-b-0 hover:bg-[var(--accent-bg-soft)]/30 sm:px-6"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="pr-3 font-medium text-foreground">{row.topic}</div>
                <div className="pr-3 text-muted-foreground">{row.generic}</div>
                <div className="pr-3 font-medium text-foreground">{row.vin2win}</div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
