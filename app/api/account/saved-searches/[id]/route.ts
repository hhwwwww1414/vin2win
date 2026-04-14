import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { deleteSavedSearch, updateSavedSearch } from '@/lib/server/saved-searches';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }
    const { id } = await context.params;
    const payload = (await request.json().catch(() => null)) as
      | {
          name?: string;
          notifyEnabled?: boolean;
        }
      | null;

    const item = await updateSavedSearch({
      userId: user.id,
      id,
      name: payload?.name,
      notifyEnabled: payload?.notifyEnabled,
    });

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить сохранённый поиск.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }
    const { id } = await context.params;
    await deleteSavedSearch(user.id, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось удалить сохранённый поиск.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
