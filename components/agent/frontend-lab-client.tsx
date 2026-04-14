'use client';

import { useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { AgentChat, createAgentChat } from '@21st-sdk/nextjs';
import { Bot, Radio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STARTER_PROMPTS = [
  'Проанализируй hero-блок главной страницы. Улучши визуал без полного редизайна, сохрани премиальный стиль vin2win. Дай минимальный diff-план и Playwright-checklist.',
  'Проанализируй карточку объявления в листинге. Предложи 3 точечных улучшения и дай prompt для аккуратного визуального апгрейда без ломки текущей сетки.',
  'Проанализируй экран /listing/new. Выбери один самый слабый визуальный блок и предложи аккуратное улучшение в рамках существующей дизайн-системы.',
  'Проанализируй compact-row и table-view на главной. Дай минимальный план улучшения обоих режимов, acceptance criteria и Playwright-checklist.',
];

const agentSlug = process.env.NEXT_PUBLIC_21ST_AGENT_SLUG?.trim();

function ConfiguredFrontendLab({ slug }: { slug: string }) {
  const chat = useMemo(() => {
    return createAgentChat({
      agent: slug,
      tokenUrl: '/api/agent/token',
    });
  }, [slug]);

  const { messages, sendMessage, status, stop, error } = useChat({ chat });

  const handleSend = async (text: string) => {
    await sendMessage({
      parts: [{ type: 'text', text }],
    });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-accent/15 text-teal-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Starter prompts</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-accent/20 bg-teal-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
                <Radio className="h-3.5 w-3.5" />
                Live 21st relay
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Используй агент как генератор точечных frontend-улучшений: один элемент, один prompt, одна проверка через Playwright.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              className="h-auto max-w-full whitespace-normal py-2 text-left"
              onClick={() => void handleSend(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bot className="h-4 w-4 text-teal-accent" />
              Живой агент
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Чат ходит в задеплоенный `my-agent` через `relay.an.dev`, а не в локальную заглушку.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="text-sm font-semibold text-foreground">CLI runner</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Для отчетов и воспроизводимых prompt-циклов используй `npm run 21st:run -- --prompt-file ... --output-file ...`.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="text-sm font-semibold text-foreground">Playwright loop</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              После каждого локального diff-пакета прогоняй `npm run qa:audit`, а потом закрепляй следующий компонент.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-3 shadow-xl">
        <AgentChat
          messages={messages}
          onSend={(message) => handleSend(message.content)}
          status={status}
          onStop={stop}
          error={error}
          showWindowChrome
        />
      </section>
    </div>
  );
}

export function FrontendLabClient() {
  if (!agentSlug) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">21st agent пока не привязан к UI</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Заполни `NEXT_PUBLIC_21ST_AGENT_SLUG` после первого деплоя агента, и этот экран станет рабочим frontend-lab.
        </p>
      </div>
    );
  }

  return <ConfiguredFrontendLab slug={agentSlug} />;
}
