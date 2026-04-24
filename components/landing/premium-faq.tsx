'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'Для кого предназначена платформа vin2win?',
    answer: 'vin2win создан для профессиональных участников авторынка: дилеров, подборщиков, менеджеров автопарков и трейд-ин специалистов. Платформа фокусируется на B2B-взаимодействии и не ориентирована на частных покупателей и продавцов.',
  },
  {
    question: 'Чем vin2win отличается от обычных досок объявлений?',
    answer: 'В отличие от общих площадок, vin2win предлагает структурированные карточки с обязательными полями, верификацию профессиональных аккаунтов, модерацию качества и инструменты для работы: сравнение, избранное, фильтры по истории и техническому состоянию. Это рабочая среда, а не доска объявлений.',
  },
  {
    question: 'Сколько стоит размещение объявлений?',
    answer: 'Базовое размещение объявлений бесплатно для верифицированных профессиональных аккаунтов. Премиум-функции, такие как приоритетное размещение и расширенная аналитика, доступны по подписке. Актуальные тарифы можно узнать после регистрации в личном кабинете.',
  },
  {
    question: 'Как проходит модерация объявлений?',
    answer: 'Каждое объявление проверяется на соответствие стандартам качества: полнота данных, актуальность информации, качество фото. Модерация работает 24/7, среднее время проверки — менее 2 часов. Вы получите уведомление о статусе объявления.',
  },
  {
    question: 'Можно ли импортировать объявления с других площадок?',
    answer: 'Да, для крупных дилеров доступен импорт каталога через API или CSV. Наша команда поможет настроить автоматическую синхронизацию с вашей CRM или учётной системой. Свяжитесь с поддержкой для подключения.',
  },
  {
    question: 'Как работает система сравнения автомобилей?',
    answer: 'Добавляйте интересующие карточки в shortlist одним кликом. Система сравнения показывает ключевые параметры бок о бок: цену, пробег, техническое состояние, историю, окраску. Это помогает быстро выбрать лучший вариант для клиента.',
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group"
    >
      <div
        className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
          isOpen
            ? 'border-teal-accent/30 bg-teal-accent/[0.03]'
            : 'border-border/50 bg-card/60 hover:border-border hover:bg-card/80 dark:bg-surface-elevated/60 dark:hover:bg-surface-elevated/80'
        }`}
      >
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          aria-expanded={isOpen}
        >
          <h3 className="font-display text-lg font-semibold text-foreground pr-4">
            {faq.question}
          </h3>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
              isOpen
                ? 'bg-teal-accent text-accent-foreground'
                : 'bg-muted/50 text-muted-foreground group-hover:bg-teal-accent/20 group-hover:text-teal-accent'
            }`}
          >
            {isOpen ? (
              <Minus className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </div>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="border-t border-border/30 px-6 py-5">
                <p className="text-base leading-relaxed text-muted-foreground">
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

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.9]);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      ref={containerRef}
      className="relative py-20 sm:py-28 lg:py-36"
      aria-labelledby="faq-heading"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgba(129,216,208,0.04),transparent)]" />
      </div>

      <motion.div style={{ opacity }} className="relative mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center lg:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-meta font-semibold uppercase tracking-[0.28em] text-teal-accent"
          >
            Вопросы и ответы
          </motion.p>
          <motion.h2
            id="faq-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Частые вопросы
          </motion.h2>
        </div>

        {/* FAQ list */}
        <div className="space-y-4">
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
