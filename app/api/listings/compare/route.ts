import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getSaleListingsByIds } from '@/lib/server/marketplace';

export const runtime = 'nodejs';
const MAX_COMPARE_ITEMS = 4;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams
      .get('ids')
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, MAX_COMPARE_ITEMS) ?? [];

    const sessionUser = await getSessionUser();
    const items = await getSaleListingsByIds(ids, sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить сравнение.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
