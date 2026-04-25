import Link from 'next/link';
import { Mail, ShieldCheck, Users, Wrench } from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Контакты',
  description:
    'Контакты vin2win: связь по вопросам объявлений, модерации, партнёрства и работы B2B-платформы для профессионального авторынка.',
  path: '/contacts',
});

function getPublicEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

const contactEmail = getPublicEnv('NEXT_PUBLIC_CONTACT_EMAIL');
const legalName = getPublicEnv('NEXT_PUBLIC_LEGAL_NAME');
const inn = getPublicEnv('NEXT_PUBLIC_INN');
const ogrn = getPublicEnv('NEXT_PUBLIC_OGRN');
const legalAddress = getPublicEnv('NEXT_PUBLIC_LEGAL_ADDRESS');
const companyCity = getPublicEnv('NEXT_PUBLIC_COMPANY_CITY');

const contactLine = contactEmail
  ? `Контакт для связи: ${contactEmail}`
  : 'Контакт для связи: будет добавлен после настройки публичного email.';

const legalRows = [
  legalName ? ['Наименование', legalName] : null,
  inn ? ['ИНН', inn] : null,
  ogrn ? ['ОГРН', ogrn] : null,
  legalAddress ? ['Юридический адрес', legalAddress] : null,
  companyCity ? ['Город', companyCity] : null,
].filter(Boolean) as Array<[string, string]>;

const supportCards = [
  {
    title: 'Вопросы по объявлениям',
    body: 'Помогаем разобраться с карточками автомобилей, публикацией, обновлением данных, фотографиями и статусами объявлений.',
    icon: Wrench,
  },
  {
    title: 'Вопросы по модерации',
    body: 'Принимаем обращения по отклонённым публикациям, спорным параметрам, жалобам на некорректные карточки и качеству ленты.',
    icon: ShieldCheck,
  },
  {
    title: 'Для партнёров и продавцов',
    body: 'Обсуждаем подключение профессиональных продавцов, автоброкеров, дилеров, подборщиков и команд, работающих с B2B-потоком.',
    icon: Users,
  },
];

export default function ContactsPage() {
  return (
    <div className="min-h-full bg-background">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-accent">
            Контакты
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Связь с vin2win
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Эта страница нужна для рабочих обращений по объявлениям, модерации, партнёрству и юридической информации
            платформы. Мы не публикуем вымышленные реквизиты: официальные данные появятся после завершения оформления.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5 dark:bg-background/10">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-accent/25 bg-[var(--accent-bg-soft)] text-teal-accent">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Контакты</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{contactLine}</p>
                  {contactEmail ? (
                    <a
                      href={`mailto:${contactEmail}`}
                      className="mt-4 inline-flex rounded-xl bg-teal-dark px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-teal-accent dark:text-[#09090B]"
                    >
                      Написать на email
                    </a>
                  ) : (
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">
                      Для production-деплоя задайте переменную NEXT_PUBLIC_CONTACT_EMAIL.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-5 dark:bg-background/10">
              <h2 className="text-xl font-semibold text-foreground">Юридическая информация</h2>
              {legalRows.length > 0 ? (
                <dl className="mt-4 space-y-3">
                  {legalRows.map(([label, value]) => (
                    <div key={label} className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Юридические реквизиты будут опубликованы после завершения оформления.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {supportCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="rounded-[24px] border border-border/70 bg-card/88 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:bg-surface-elevated/88"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-accent/25 bg-[var(--accent-bg-soft)] text-teal-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-5 rounded-[24px] border border-border/70 bg-background/70 p-5 text-sm leading-7 text-muted-foreground dark:bg-background/10">
          Для правил публикации и обработки данных используйте страницы{' '}
          <Link href="/terms" className="font-semibold text-teal-accent hover:underline">
            пользовательского соглашения
          </Link>{' '}
          и{' '}
          <Link href="/privacy" className="font-semibold text-teal-accent hover:underline">
            политики конфиденциальности
          </Link>
          .
        </section>
      </main>
    </div>
  );
}
