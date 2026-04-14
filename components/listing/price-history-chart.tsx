import type { SalePriceHistoryPoint } from '@/lib/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value));
}

export function PriceHistoryChart({ items }: { items: SalePriceHistoryPoint[] }) {
  if (!items.length) {
    return null;
  }

  const prices = items.map((item) => item.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);
  const width = 100;
  const height = 48;

  const points = items.map((item, index) => {
    const x = items.length === 1 ? width / 2 : (index / (items.length - 1)) * width;
    const y = height - ((item.price - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <section className="bg-card dark:bg-surface-elevated rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">История цены</h3>
          <p className="mt-1 text-xs text-muted-foreground">Динамика карточки по опубликованным изменениям стоимости.</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Мин.: {min.toLocaleString('ru-RU')} ₽</div>
          <div>Макс.: {max.toLocaleString('ru-RU')} ₽</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/50 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
          <defs>
            <linearGradient id="price-history-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(129,216,208,0.35)" />
              <stop offset="100%" stopColor="rgba(129,216,208,0.02)" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="rgba(129,216,208,0.9)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points.join(' ')}
          />
          {items.length > 1 ? (
            <polygon
              fill="url(#price-history-fill)"
              points={`0,${height} ${points.join(' ')} ${width},${height}`}
            />
          ) : null}
        </svg>

        <div className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <div key={`${item.createdAt}-${item.price}`} className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
              <div className="text-sm font-medium text-foreground">{item.price.toLocaleString('ru-RU')} ₽</div>
              <div className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
