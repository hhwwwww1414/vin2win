import { BadgeCheck, Gauge, LineChart, Workflow } from 'lucide-react';
import { Reveal } from '@/components/landing/reveal';

const PILLARS = [
  {
    icon: Gauge,
    title: 'Профессиональная лента',
    text: 'Структурированные карточки, предсказуемые поля и отсутствие случайных описаний — только рабочая информация.',
  },
  {
    icon: Workflow,
    title: 'Единый рабочий контур',
    text: 'Паспорт, история, состояние, фото, условия сделки и контакты собраны в одной форме.',
  },
  {
    icon: BadgeCheck,
    title: 'Модерация по смыслу',
    text: 'Мы следим не за шаблоном, а за полнотой данных и корректностью. Это сокращает шум в выдаче.',
  },
  {
    icon: LineChart,
    title: 'Данные для переговоров',
    text: 'История цены, статусы на ресурсах, сравнение и shortlist — готовый материал к разговору с клиентом.',
  },
];

export function HomeAbout() {
  return (
    <section aria-labelledby="home-about-heading" className="py-12 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">
              О платформе
            </p>
            <h2
              id="home-about-heading"
              className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-4xl"
            >
              vin2win — <span className="text-teal-accent">профессиональный</span> авторынок без B2C-шума
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Это не доска частных объявлений и не витрина автосалонов. vin2win — рабочая среда, где продавцы,
              подборщики и менеджеры работают с одними и теми же данными: паспортом автомобиля, его историей,
              статусами на ресурсах и условиями сделки.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Мы убрали всё, что мешает принятию решения: случайные описания, маркетинговый мусор, повторяющиеся
              объявления. Оставили структуру, которая одинаково полезна и продающей стороне, и покупающей.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {['Паспорт', 'Техника', 'История', 'Состояние', 'Сделка', 'Контакты'].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground dark:bg-surface-elevated/80"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.title} delay={index * 90}>
                <article className="group relative h-full overflow-hidden rounded-[28px] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-surface)] transition-all duration-500 hover:-translate-y-0.5 hover:border-teal-accent/40 hover:shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92">
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-accent/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
