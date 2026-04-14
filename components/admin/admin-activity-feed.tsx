import Link from 'next/link';

type AdminActivityItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  actorLine: string;
  href?: string;
};

export function AdminActivityFeed({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: AdminActivityItem[];
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[0_18px_48px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
        aria-hidden="true"
      />
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-[26px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.actorLine}</p>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">{item.createdAt}</div>
              </div>
              {item.href ? (
                <div className="mt-3">
                  <Link href={item.href} className="text-sm font-medium text-teal-accent hover:underline">
                    Открыть связанную сущность
                  </Link>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          История действий пока пуста.
        </div>
      )}
    </section>
  );
}
