'use client';

import { startTransition, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SellerReview, SellerReviewStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SellerReviewsSectionProps {
  sellerId: string;
  sellerName: string;
  initialReviews: SellerReview[];
  reviewSummary: {
    count: number;
    averageRating?: number;
  };
  viewerReviewStatus?: SellerReviewStatus;
  isAuthenticated: boolean;
  loginHref: string;
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value));
}

function statusMessage(status: SellerReviewStatus) {
  switch (status) {
    case 'pending':
      return 'Ваш отзыв уже отправлен на модерацию. После проверки он появится в профиле продавца.';
    case 'published':
      return 'Вы уже оставили отзыв этому продавцу. Спасибо, он участвует в общем рейтинге.';
    case 'rejected':
      return 'Предыдущий отзыв был отклонён модерацией. Повторная отправка сейчас недоступна.';
    default:
      return '';
  }
}

function StarRating({
  value,
  onChange,
  interactive = false,
  size = 'md',
}: {
  value: number;
  onChange?: (value: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}) {
  const iconClassName = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;

        if (!interactive || !onChange) {
          return (
            <Star
              key={starValue}
              className={cn(iconClassName, filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/35')}
            />
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            className="rounded-sm p-0.5 transition-transform hover:scale-105"
            aria-label={`Оценка ${starValue}`}
          >
            <Star
              className={cn(iconClassName, filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/35')}
            />
          </button>
        );
      })}
    </div>
  );
}

export function SellerReviewsSection({
  sellerId,
  sellerName,
  initialReviews,
  reviewSummary,
  viewerReviewStatus,
  isAuthenticated,
  loginHref,
}: SellerReviewsSectionProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localViewerStatus, setLocalViewerStatus] = useState<SellerReviewStatus | undefined>(viewerReviewStatus);

  const handleSubmit = async () => {
    const trimmedText = text.trim();

    if (rating < 1 || rating > 5) {
      setError('Выберите оценку от 1 до 5.');
      return;
    }

    if (trimmedText.length < 20) {
      setError('Отзыв должен содержать минимум 20 символов.');
      return;
    }

    if (trimmedText.length > 1500) {
      setError('Отзыв не должен превышать 1500 символов.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/sellers/${sellerId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          text: trimmedText,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось отправить отзыв.');
      }

      setLocalViewerStatus('pending');
      setSuccess('Отзыв отправлен на модерацию.');
      setRating(0);
      setText('');
      startTransition(() => {
        router.refresh();
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось отправить отзыв.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-border/70 bg-card/92 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:bg-surface-elevated/92 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
            Репутация продавца
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Отзывы покупателей</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Публикуются только отзывы после модерации. Это помогает сохранить релевантную и
            предметную обратную связь по сделкам с продавцом {sellerName}.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-right dark:bg-background/10">
          <div className="flex items-center justify-end gap-2">
            <StarRating value={Math.round(reviewSummary.averageRating ?? 0)} size="sm" />
            <span className="text-lg font-semibold text-foreground">
              {reviewSummary.averageRating ? reviewSummary.averageRating.toFixed(1) : 'Новый'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {reviewSummary.count > 0
              ? `${reviewSummary.count} опубликованных отзывов`
              : 'Опубликованных отзывов пока нет'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {initialReviews.length > 0 ? (
            initialReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.authorName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatReviewDate(review.createdAt)}</p>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/90">{review.text}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/45 p-5 text-sm leading-6 text-muted-foreground">
              У продавца пока нет опубликованных отзывов. Первый отзыв появится после модерации.
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-border/70 bg-background/70 p-4 dark:bg-background/10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-accent" />
            Ваш отзыв
          </div>

          {localViewerStatus ? (
            <div className="mt-4 rounded-2xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] p-4 text-sm leading-6 text-foreground">
              {statusMessage(localViewerStatus)}
            </div>
          ) : !isAuthenticated ? (
            <div className="mt-4 rounded-2xl border border-border/70 bg-card/80 p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Войдите в аккаунт, чтобы оставить отзыв о сделке с этим продавцом.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link href={loginHref}>Войти и оставить отзыв</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Оценка</p>
                <div className="mt-2">
                  <StarRating value={rating} onChange={setRating} interactive />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">Комментарий</p>
                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="mt-2 min-h-[140px] resize-none"
                  placeholder="Опишите, как прошла сделка: коммуникация, состояние машины, соответствие описанию, документы."
                  maxLength={1500}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Минимум 20 символов. Отзыв сначала попадёт на модерацию.
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {success}
                </div>
              ) : null}

              <Button type="button" className="w-full" disabled={submitting} onClick={handleSubmit}>
                <MessageSquare className="h-4 w-4" />
                {submitting ? 'Отправка...' : 'Отправить на модерацию'}
              </Button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
