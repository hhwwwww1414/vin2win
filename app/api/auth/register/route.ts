import { NextResponse } from 'next/server';
import { attachSessionCookie, registerUser, resolveNextPath } from '@/lib/server/auth';

export const runtime = 'nodejs';

function parseString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const name = parseString(payload.name);
    const email = parseString(payload.email);
    const password = parseString(payload.password);
    const phone = parseString(payload.phone);
    const nextPath = resolveNextPath(parseString(payload.nextPath), '/account');

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
    }

    const user = await registerUser({
      name,
      email,
      password,
      phone: phone || undefined,
    });

    const response = NextResponse.json(
      {
        ok: true,
        nextPath,
        user,
      },
      { status: 201 }
    );

    await attachSessionCookie(response, user.id);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось зарегистрировать аккаунт.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
