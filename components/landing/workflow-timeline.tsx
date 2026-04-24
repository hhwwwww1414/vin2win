'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CheckCircle2, ClipboardCheck, ShieldCheck, UserRoundPlus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type WorkflowStep = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const workflowSteps: WorkflowStep[] = [
  {
    label: 'Шаг 01',
    title: 'Регистрация',
    description: 'Создайте профессиональный аккаунт. Верификация занимает минуты.',
    icon: UserRoundPlus,
  },
  {
    label: 'Шаг 02',
    title: 'Паспорт авто',
    description: 'Заполните структурированную карточку: марка, модель, год, цена.',
    icon: ClipboardCheck,
  },
  {
    label: 'Шаг 03',
    title: 'Проверка',
    description: 'Добавьте технику, историю, состояние, фото и контакты.',
    icon: ShieldCheck,
  },
  {
    label: 'Шаг 04',
    title: 'Публикация',
    description: 'После быстрой модерации карточка появляется в ленте.',
    icon: CheckCircle2,
  },
];

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function WorkflowTimeline() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const mobileListRef = useRef<HTMLDivElement | null>(null);
  const mobileIconRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let frame = 0;

    const updateMobileLine = () => {
      const list = mobileListRef.current;
      const icons = mobileIconRefs.current.filter((icon): icon is HTMLDivElement => Boolean(icon));
      if (!list || icons.length < 2) {
        return;
      }

      const listRect = list.getBoundingClientRect();
      const firstRect = icons[0].getBoundingClientRect();
      const lastRect = icons[icons.length - 1].getBoundingClientRect();
      const top = firstRect.top + firstRect.height / 2 - listRect.top;
      const bottom = lastRect.top + lastRect.height / 2 - listRect.top;

      list.style.setProperty('--workflow-mobile-line-top', `${top}px`);
      list.style.setProperty('--workflow-mobile-line-height', `${Math.max(bottom - top, 0)}px`);
    };

    const updateProgress = () => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const start = viewportHeight * 0.74;
      const end = viewportHeight * 0.28;
      const travel = rect.height + start - end;
      const nextProgress = clampProgress((start - rect.top) / travel);

      setProgress(nextProgress);
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateMobileLine();
        updateProgress();
      });
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(requestUpdate) : null;
    if (resizeObserver) {
      resizeObserver.observe(section);
    }

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      resizeObserver?.disconnect();

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="landing-stagger-item relative overflow-hidden rounded-[34px] border border-white/[0.075] bg-[radial-gradient(circle_at_50%_0%,rgba(129,216,208,0.09),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] px-4 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:px-8 sm:py-12 lg:px-10 lg:py-14"
      style={{ '--workflow-progress': progress } as CSSProperties}
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-teal-accent">
          Как начать
        </p>
        <h2
          id="workflow-heading"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl"
        >
          От аккаунта до публикации за 4 шага
        </h2>
      </div>

      <div className="relative mt-12 hidden md:block">
        <div
          aria-hidden="true"
          className="absolute left-[12.5%] right-[12.5%] top-12 h-px bg-white/12"
        />
        <div
          aria-hidden="true"
          className="absolute left-[12.5%] top-12 h-px w-[75%] origin-left bg-teal-accent shadow-[0_0_18px_rgba(129,216,208,0.28)] transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />

        <div className="grid grid-cols-4 gap-6">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const threshold = workflowSteps.length === 1 ? 0 : index / (workflowSteps.length - 1);
            const isActive = progress >= threshold - 0.06;

            return (
              <article key={step.title} className="relative text-center">
                <div className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-[#11191c] shadow-[0_16px_45px_rgba(0,0,0,0.28)]">
                  <div
                    className={cn(
                      'flex h-20 w-20 items-center justify-center rounded-full border bg-[#0b1114] text-teal-accent transition-[border-color,box-shadow,background] duration-500',
                      isActive
                        ? 'border-teal-accent/45 bg-teal-accent/[0.075] shadow-[0_0_26px_rgba(129,216,208,0.16)]'
                        : 'border-white/10',
                    )}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <p className="mt-8 font-display text-sm font-semibold uppercase tracking-[0.24em] text-teal-accent/78">
                  {step.label}
                </p>
                <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mx-auto mt-4 max-w-[17rem] text-lg leading-8 text-white/62">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div ref={mobileListRef} className="relative mt-8 space-y-5 md:hidden">
        <div
          aria-hidden="true"
          className="absolute left-10 w-px bg-white/12"
          style={{
            top: 'var(--workflow-mobile-line-top, 2.5rem)',
            height: 'var(--workflow-mobile-line-height, calc(100% - 5rem))',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-10 w-px origin-top bg-teal-accent shadow-[0_0_18px_rgba(129,216,208,0.24)] transition-transform duration-150 ease-out"
          style={{
            top: 'var(--workflow-mobile-line-top, 2.5rem)',
            height: 'var(--workflow-mobile-line-height, calc(100% - 5rem))',
            transform: `scaleY(${progress})`,
          }}
        />

        {workflowSteps.map((step, index) => {
          const Icon = step.icon;
          const threshold = workflowSteps.length === 1 ? 0 : index / (workflowSteps.length - 1);
          const isActive = progress >= threshold - 0.08;

          return (
            <article key={step.title} className="relative flex gap-4 rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
              <div
                ref={(node) => {
                  mobileIconRefs.current[index] = node;
                }}
                className={cn(
                  'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-[#0b1114] text-teal-accent transition-[border-color,box-shadow,background] duration-500',
                  isActive
                    ? 'border-teal-accent/45 bg-teal-accent/[0.08] shadow-[0_0_22px_rgba(129,216,208,0.14)]'
                    : 'border-white/10',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-teal-accent/78">
                  {step.label}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/62">{step.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
