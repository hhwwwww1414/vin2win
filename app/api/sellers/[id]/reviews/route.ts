import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { createSellerReview, getPublicSellerReviews } from '@/lib/server/marketplace';

export const runtime = 'nodejs';

function getErrorStatus(message: string) {
  if (/не найден/i.test(message)) {
    return 404;
  }

  if (/нельзя|уже|минимум|превышать|оценк/i.test(message)) {
    return 400;
  }

  return 500;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await getPublicSellerReviews(id);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить отзывы.';
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    const { id } = await params;
    const payload = (await request.json().catch(() => null)) as
      | {
          rating?: unknown;
          text?: unknown;
        }
      | null;

    const rating = typeof payload?.rating === 'number' ? payload.rating : Number(payload?.rating);
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Оценка должна быть от 1 до 5.' }, { status: 400 });
    }

    if (text.length < 20) {
      return NextResponse.json(
        { error: 'Отзыв должен содержать минимум 20 символов.' },
        { status: 400 }
      );
    }

    if (text.length > 1500) {
      return NextResponse.json(
        { error: 'Отзыв не должен превышать 1500 символов.' },
        { status: 400 }
      );
    }

    const review = await createSellerReview({
      sellerId: id,
      authorUserId: currentUser.id,
      rating,
      text,
    });

    return NextResponse.json({ item: review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить отзыв.';
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
