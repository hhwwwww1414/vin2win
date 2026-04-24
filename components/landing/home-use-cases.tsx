import { ArrowRight, BarChart3, Handshake, Layers } from 'lucide-react';
import { Reveal } from '@/components/landing/reveal';

const CASES = [
  {
    icon: Handshake,
    tag: 'Сделка',
    title: 'Подборщик закрывает запрос клиента за день',
    steps: [
      'Сохраняет параметры клиента как отдельный поиск',
      'Получает уведомление о свежей карточке',
      'Добавляет 3 варианта в сравнение и отправляет клиенту',
    ],
  },
  {
    icon: Layers,
    tag: 'Поток',
    title: 'Продавец ведёт сразу 20 автомобилей',
    steps: [
      'Каталог черновиков и активных публикаций в кабинете',
      'Статусы модерации и повторные публикации в один клик',
      'Чаты по каждой карточке с контекстом сделки',
    ],
  },
  {
    icon: BarChart3,
    tag: 'Контроль',
    title: 'Менеджер следит за качеством команды',
    steps: [
      'Обзор объявлений команды в едином интерфейсе',
      'Фильтры по статусам и регионам помогают расставить приоритеты',
      'VIN и история цены — аргумент в обсуждении с коллегами',
    ],
  },
];

export function HomeUseCases() {
  return (
    <section aria-labelledby="home-use-cases-heading" className="py-12 sm:py-16">
      <Reveal>
        <div className="mb-8 max-w-3xl">
          <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Сценарии</p>
          <h2
            id="home-use-cases-heading"
            className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
          >
            Как профессионалы используют vin2win каждый день
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Несколько типичных рабочих ситуаций — чтобы вы увидели, как платформа встраивается в ваш процесс.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3">
        {CASES.map((useCase, index) => {
          const Icon = useCase.icon;
          return (
            <Reveal key={useCase.title} delay={index * 110}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-surface)] transition-all duration-500 hover:-translate-y-1 hover:border-teal-accent/40 hover:shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal-accent/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-border/70 bg-background/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {useCase.tag}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground text-balance">
                  {useCase.title}
                </h3>
                <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {useCase.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-teal-accent/30 bg-[var(--accent-bg-soft)] text-[10px] font-semibold text-teal-accent">
                        {stepIndex + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div
                  aria-hidden="true"
                  className="mt-6 flex items-center gap-2 text-xs font-medium text-teal-accent/0 transition-all duration-500 group-hover:translate-x-0 group-hover:text-teal-accent"
                >
                  Тот же сценарий у вас
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
