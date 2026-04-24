import { Car, FileText, Gauge, ImageIcon, Phone, ShieldCheck, Wallet, Wrench } from 'lucide-react';
import { Reveal } from '@/components/landing/reveal';

const ANATOMY = [
  {
    icon: FileText,
    title: 'Паспорт',
    text: 'Марка, модель, поколение, год выпуска, VIN, госномер и регион.',
  },
  {
    icon: Wrench,
    title: 'Техника',
    text: 'Двигатель, трансмиссия, привод, тип топлива, мощность и объём.',
  },
  {
    icon: Gauge,
    title: 'Состояние',
    text: 'Пробег, окраска кузовных элементов, комплектность и ремонты.',
  },
  {
    icon: ShieldCheck,
    title: 'История',
    text: 'Статусы ресурсов, ДТП, такси, каршеринг, оригинальность ПТС.',
  },
  {
    icon: ImageIcon,
    title: 'Фото',
    text: 'Экстерьер и интерьер — карточка без фото на публикацию не уходит.',
  },
  {
    icon: Wallet,
    title: 'Сделка',
    text: 'Цена, цена в руки, бенефиты, возможность инвестиции и торга.',
  },
  {
    icon: Phone,
    title: 'Контакты',
    text: 'Имя, город и удобный способ связи — мессенджер или звонок.',
  },
  {
    icon: Car,
    title: 'Бенефиты',
    text: 'Скидка, бонус, подарок или условия лизинга — рабочий аргумент.',
  },
];

export function HomeTrust() {
  return (
    <section aria-labelledby="home-trust-heading" className="py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] border border-teal-accent/25 bg-[var(--accent-bg-soft)] p-6 shadow-[var(--shadow-floating)] sm:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            />
            <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">Доверие</p>
            <h2
              id="home-trust-heading"
              className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
            >
              Структурированные карточки вместо случайных описаний
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Мы разложили объявление на восемь рабочих блоков. Так покупатель видит всё, что нужно для решения, а
              продавец не забывает указать важное.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-accent" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Антидубли.</strong>{' '}
                  Модерация отсекает повторные публикации и карточки без ключевых полей.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-accent" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Прозрачность истории.</strong>{' '}
                  Статусы ресурсов, ДТП и операционное прошлое автомобиля — не прячутся в описании.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-accent" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Рабочая цена.</strong>{' '}
                  История цены и условия сделки видны на карточке — переговоры начинаются по делу.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-accent" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Репутация продавца.</strong>{' '}
                  Профиль, отзывы и история публикаций — сделка в один клик от оценки партнёра.
                </span>
              </li>
            </ul>
          </div>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2">
          {ANATOMY.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 60}>
                <article className="group h-full rounded-[20px] border border-border/70 bg-card/92 p-4 shadow-[var(--shadow-surface)] transition-all duration-500 hover:-translate-y-0.5 hover:border-teal-accent/40 hover:shadow-[var(--shadow-floating)] dark:bg-surface-elevated/92">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
