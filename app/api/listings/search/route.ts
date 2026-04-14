import { NextResponse } from 'next/server';
import { parseSaleSearchParams } from '@/lib/sale-search';
import { getSessionUser } from '@/lib/server/auth';
import { searchPublishedSaleListings } from '@/lib/server/marketplace';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const filters = parseSaleSearchParams(searchParams);
    const result = await searchPublishedSaleListings(filters, sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить поиск.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
