import { NextResponse } from 'next/server';
import { attachSessionCookie, authenticateUser, ensureAdminUser, resolveNextPath } from '@/lib/server/auth';

export const runtime = 'nodejs';

function parseString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    await ensureAdminUser();

    const payload = (await request.json()) as Record<string, unknown>;
    const email = parseString(payload.email);
    const password = parseString(payload.password);
    const nextPath = resolveNextPath(parseString(payload.nextPath), '/account');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    const response = NextResponse.json(
      {
        ok: true,
        nextPath,
        user,
      },
      { status: 200 }
    );

    await attachSessionCookie(response, user.id);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить вход.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
