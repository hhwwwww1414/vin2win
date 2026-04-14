import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { listFavoriteListings } from '@/lib/server/favorites';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }
    const items = await listFavoriteListings(user.id);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить избранное.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
