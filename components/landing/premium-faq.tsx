'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const faqs = [
  {
    question: 'Для кого предназначена платформа vin2win?',
    answer:
      'vin2win создан для профессиональных участников авторынка: дилеров, подборщиков, менеджеров автопарков и трейд-ин специалистов. Платформа фокусируется на B2B-взаимодействии и не ориентирована на частных покупателей и продавцов.',
  },
  {
    question: 'Чем vin2win отличается от обычных досок объявлений?',
    answer:
      'В отличие от общих площадок, vin2win предлагает структурированные карточки с обязательными полями, верификацию профессиональных аккаунтов, модерацию качества и инструменты для работы: сравнение, избранное, фильтры по истории и техническому состоянию. Это рабочая среда, а не доска объявлений.',
  },
  {
    question: 'Сколько стоит размещение объявлений?',
    answer:
      'Базовое размещение объявлений бесплатно для верифицированных профессиональных аккаунтов. Премиум-функции, такие как приоритетное размещение и расширенная аналитика, доступны по подписке. Актуальные тарифы можно узнать после регистрации в личном кабинете.',
  },
  {
    question: 'Как проходит модерация объявлений?',
    answer:
      'Каждое объявление проверяется на соответствие стандартам качества: полнота данных, актуальность информации, качество фото. Модерация работает 24/7, среднее время проверки — менее 2 часов. Вы получите уведомление о статусе объявления.',
  },
  {
    question: 'Можно ли импортировать объявления с других площадок?',
    answer:
      'Да, для крупных дилеров доступен импорт каталога через API или CSV. Наша команда поможет настроить автоматическую синхронизацию с вашей CRM или учётной системой. Свяжитесь с поддержкой для подключения.',
  },
  {
    question: 'Как работает система сравнения автомобилей?',
    answer:
      'Добавляйте интересующие карточки в shortlist одним кликом. Система сравнения показывает ключевые параметры бок о бок: цену, пробег, техническое состояние, историю, окраску. Это помогает быстро выбрать лучший вариант для клиента.',
  },
];

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const qNumber = String(index + 1).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.75,
        delay: index * 0.06,
        ease: EASE,
      }}
      className="group"
    >
      <div
        className={`
          overflow-hidden rounded-2xl border transition-all duration-500
          ${isOpen
            ? 'border-teal-accent/30 bg-gradient-to-br from-teal-accent/[0.045] via-teal-accent/[0.02] to-transparent shadow-[0_4px_20px_rgba(129,216,208,0.08)]'
            : 'border-border/55 bg-card/65 hover:border-border hover:bg-card/85 dark:bg-surface-elevated/55 dark:hover:bg-surface-elevated/80'
          }
        `}
      >
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-4 px-5 py-4 text-left"
          aria-expanded={isOpen}
        >
          <span
            className={`
              font-mono text-[10.5px] font-medium tracking-[0.18em] transition-colors duration-500
              ${isOpen ? 'text-teal-accent' : 'text-muted-foreground/65'}
            `}
          >
            {qNumber}
          </span>
          <h3 className="flex-1 font-display text-[14.5px] font-semibold text-foreground sm:text-[15px]">
            {faq.question}
          </h3>
          <div
            className={`
              flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
              transition-all duration-500
              ${isOpen
                ? 'rotate-45 bg-teal-accent text-accent-foreground'
                : 'bg-muted/50 text-muted-foreground group-hover:bg-teal-accent/15 group-hover:text-teal-accent'
              }
            `}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="border-t border-border/30 px-5 pb-5 pt-4 pl-[68px]">
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function PremiumFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.5, 1, 1, 0.92]);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      ref={containerRef}
      className="relative py-11 sm:py-14 lg:py-18"
      aria-labelledby="faq-heading"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_60%,rgba(129,216,208,0.03),transparent)]" />
      </div>

      {/* Top continuity hairline */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent sm:inset-x-16"
      />

      <motion.div style={{ opacity }} className="relative mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-7 text-center lg:mb-9">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, ease: EASE }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Вопросы и ответы
          </motion.p>
          <motion.h2
            id="faq-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
            className="mt-3 font-display text-[1.625rem] font-bold tracking-tight text-foreground sm:text-[1.875rem] lg:text-[2rem]"
          >
            Частые вопросы
          </motion.h2>
        </div>

        {/* FAQ list */}
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
