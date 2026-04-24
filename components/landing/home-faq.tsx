'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Reveal } from '@/components/landing/reveal';

const FAQ = [
  {
    q: 'Кому подходит vin2win?',
    a: 'Платформа создана для профессиональных продавцов автомобилей, подборщиков, работающих с клиентами, и менеджеров, которые ведут несколько объявлений одновременно. Частные пользователи тоже могут смотреть каталог, но основной инструментарий заточен под B2B-сценарии.',
  },
  {
    q: 'Сколько стоит размещение объявления?',
    a: 'Базовая публикация бесплатна: вы создаёте карточку, проходите модерацию и появляетесь в ленте. Тарифы на расширенные возможности — профиль продавца, массовые публикации и приоритет в выдаче — доступны в кабинете.',
  },
  {
    q: 'Как проходит модерация?',
    a: 'Мы проверяем полноту ключевых полей: паспорт автомобиля, техника, история, фото и условия сделки. Дубли и заведомо неполные карточки отклоняются. Обычно проверка занимает минуты.',
  },
  {
    q: 'Можно ли войти через Telegram?',
    a: 'Да. Вход через Telegram доступен на странице регистрации и логина. Это удобно для тех, кто уже работает с клиентами в мессенджере.',
  },
  {
    q: 'Как работают сохранённые поиски и уведомления?',
    a: 'Настройте параметры в расширенном фильтре и сохраните поиск. Как только в ленте появится новое совпадение, вы получите уведомление по email, push или в Telegram — в зависимости от настроек.',
  },
  {
    q: 'Чем vin2win отличается от обычной доски?',
    a: 'Классическая доска — это свободный текст и случайные описания. vin2win — структурированный паспорт автомобиля, модерация, глубокие фильтры, сравнение, чат сделки и инструменты для команды. Лента остаётся рабочей, без B2C-шума.',
  },
  {
    q: 'Мои данные в безопасности?',
    a: 'Мы храним данные пользователей и объявления в соответствии с политикой конфиденциальности. Контакты скрыты от незалогиненных пользователей, а чат по сделкам ведётся внутри платформы.',
  },
];

export function HomeFaq() {
  return (
    <section aria-labelledby="home-faq-heading" className="py-12 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <p className="text-meta font-semibold uppercase tracking-[0.18em] text-teal-accent">FAQ</p>
            <h2
              id="home-faq-heading"
              className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl"
            >
              Короткие ответы на частые вопросы
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Если что-то осталось неясным — напишите нам в чате платформы или через поддержку.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="rounded-[28px] border border-border/70 bg-card/92 px-5 py-2 shadow-[var(--shadow-surface)] sm:px-6 dark:bg-surface-elevated/92">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, index) => (
                <AccordionItem key={item.q} value={`faq-${index}`} className="border-border/60">
                  <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
