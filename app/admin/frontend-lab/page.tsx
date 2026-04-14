import Link from 'next/link';
import { UserRole } from '@prisma/client';
import { Wand2 } from 'lucide-react';
import { FrontendLabClient } from '@/components/agent/frontend-lab-client';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { Button } from '@/components/ui/button';
import { requireRole } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function FrontendLabPage() {
  await requireRole([UserRole.ADMIN, UserRole.MODERATOR], '/admin/frontend-lab');

  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-teal-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-accent">
                <Wand2 className="h-3.5 w-3.5" />
                Frontend Lab
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-foreground">21st + Playwright цикл для улучшения визуала</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Здесь агент работает по одному элементу за раз: находит слабое место, генерирует аккуратный prompt без полного
                редизайна, после изменений проверяет результат через Playwright и только потом переходит к следующему блоку.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin">Вернуться в admin</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-foreground">1. Выбрать элемент</p>
              <p className="mt-2 text-sm text-muted-foreground">Hero, карточка, фильтры, галерея, form block, header, empty state.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-foreground">2. Дать prompt агенту</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Сохраняем текущую визуальную систему, улучшаем локально, без полной переделки страницы.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-foreground">3. Проверить через Playwright</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Smoke, console/network, мобильный сценарий, скриншот до/после и a11y-проверка.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <FrontendLabClient />
        </section>
      </main>
    </div>
  );
}
