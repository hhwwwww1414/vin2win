import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getSessionUser, revokeUserSessionsByAdmin, updateAdminUserSettings } from '@/lib/server/auth';

export const runtime = 'nodejs';

const allowedRoles = new Set<UserRole>([UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN]);

function parseRole(value: unknown): UserRole | undefined {
  return typeof value === 'string' && allowedRoles.has(value as UserRole) ? (value as UserRole) : undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;

    const user = await updateAdminUserSettings({
      actorUserId: currentUser.id,
      userId: id,
      role: parseRole(payload.role),
      isActive: parseBoolean(payload.isActive),
      sellerVerified: parseBoolean(payload.sellerVerified),
    });

    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
        role: user.role,
        isActive: user.isActive,
        sellerVerified: user.sellerProfile?.verified ?? false,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить настройки пользователя.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (payload.action !== 'revokeSessions') {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
    }

    const result = await revokeUserSessionsByAdmin(currentUser.id, id);
    return NextResponse.json({ ok: true, userId: id, revokedSessions: result.count }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось завершить сессии пользователя.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
