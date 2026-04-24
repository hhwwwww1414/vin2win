import { CheckCircle2, ClipboardCheck, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Reveal } from '@/components/landing/reveal';

const STEPS = [
  {
    title: 'Регистрация',
    description:
      'Создайте аккаунт продавца или войдите в существующий профиль. Можно войти через Telegram — для тех, кто уже работает в мессенджере.',
    icon: UserRoundPlus,
    badge: '01',
  },
  {
    title: 'Паспорт объявления',
    description:
      'Начните с базовых полей: марка, модель, год, город, цена. Каталог предсказуемо ведёт вас по структуре автомобиля.',
    icon: ClipboardCheck,
    badge: '02',
  },
  {
    title: 'Техника и история',
    description:
      'Заполните двигатель, трансмиссию, пробег, окраску, бенефиты, историю ресурсов и фото. Чем полнее, тем выше доверие.',
    icon: ShieldCheck,
    badge: '03',
  },
  {
    title: 'Публикация',
    description:
      'После модерации карточка появляется в профессиональной ленте. Вы управляете статусом и возвращаетесь к черновику из кабинета.',
    icon: CheckCircle2,
    badge: '04',
  },
];

export function HomeHowItWorks() {
  return (
    <section aria-labelledby="home-how-it-works-heading" className="py-12 sm:py-16">
      <Reveal>
        <div className="mb-8 max-w-3xl">
          <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Как это работает</p>
          <h2
            id="home-how-it-works-heading"
            className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
          >
            От аккаунта до публикации в ленте — за четыре шага
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Мастер объявления ведёт продавца от паспорта автомобиля до отправки на модерацию. Статусы и уведомления
            держат в курсе всех, кто работает над сделкой.
          </p>
        </div>
      </Reveal>

      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-[44px] hidden h-px bg-gradient-to-r from-transparent via-teal-accent/40 to-transparent lg:block"
        />
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <Reveal key={step.title} delay={index * 110} as="li">
              <article className="group relative h-full overflow-hidden rounded-[28px] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-surface)] transition-all duration-500 hover:-translate-y-0.5 hover:border-teal-accent/40 hover:shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-teal-accent/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-3xl font-bold tabular-nums text-muted-foreground/30">
                    {step.badge}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </article>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}
