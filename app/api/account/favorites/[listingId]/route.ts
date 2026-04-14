import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { addFavorite, removeFavorite, toggleFavorite } from '@/lib/server/favorites';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{
    listingId: string;
  }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }
    const { listingId } = await context.params;
    const result = await toggleFavorite(user.id, listingId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить избранное.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(_request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }
    const { listingId } = await context.params;
    await addFavorite(user.id, listingId);
    return NextResponse.json({ active: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось добавить в избранное.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }
    const { listingId } = await context.params;
    await removeFavorite(user.id, listingId);
    return NextResponse.json({ active: false }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось удалить из избранного.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
