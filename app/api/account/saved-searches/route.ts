import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { createSavedSearch, listSavedSearches } from '@/lib/server/saved-searches';
import type { SaleSearchFilters } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }
    const items = await listSavedSearches(user.id);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить сохранённые поиски.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }
    const payload = (await request.json().catch(() => null)) as
      | {
          name?: string;
          notifyEnabled?: boolean;
          filters?: Partial<SaleSearchFilters>;
        }
      | null;

    const savedSearch = await createSavedSearch({
      userId: user.id,
      name: payload?.name,
      notifyEnabled: payload?.notifyEnabled,
      filters: payload?.filters ?? {},
    });

    return NextResponse.json({ item: savedSearch }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить поиск.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
