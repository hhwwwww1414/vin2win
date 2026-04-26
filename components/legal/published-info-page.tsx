import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/header';

export interface PublishedInfoSection {
  title: string;
  body: string;
  items?: string[];
}

export function PublishedInfoPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: PublishedInfoSection[];
}) {
  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>
        <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92 sm:p-7">
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-accent">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        </section>

        <div className="mt-5 grid gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[24px] border border-border/70 bg-card/76 p-5 shadow-[0_12px_34px_rgba(0,0,0,0.1)] dark:bg-surface-elevated/76 sm:p-6"
            >
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{section.body}</p>
              {section.items ? (
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Справочные страницы">
          {[
            { href: '/about', label: 'О проекте' },
            { href: '/contacts', label: 'Контакты' },
            { href: '/privacy', label: 'Политика' },
            { href: '/terms', label: 'Правила' },
            { href: '/faq', label: 'FAQ' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/65 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
            >
              {link.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
