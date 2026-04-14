import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/header';

export function LegalStubPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <section className="relative overflow-hidden rounded-[34px] border border-border/70 bg-card/92 shadow-[0_20px_55px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />

          <div className="relative p-5 sm:p-6 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
              <FileText className="h-3.5 w-3.5" />
              {eyebrow}
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-sm font-semibold text-foreground">Что здесь будет</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Финальная редакция документа, ссылки из форм авторизации и постоянный маршрут для правовых страниц vin2win.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
                <p className="text-sm font-semibold text-foreground">Текущий статус</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Временная страница-заглушка. Структура уже доступна для навигации и проверки пользовательского сценария.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Вернуться к регистрации
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
