import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getSessionUser, revokeUserSessionsByAdmin, updateAdminUserSettings } from '@/lib/server/auth';

export const runtime = 'nodejs';

const allowedRoles = new Set<UserRole>([UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN]);

function parseIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

function parseRole(value: unknown): UserRole | undefined {
  return typeof value === 'string' && allowedRoles.has(value as UserRole) ? (value as UserRole) : undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const userIds = parseIds(payload.userIds);

    if (!userIds.length) {
      return NextResponse.json({ error: 'No users selected.' }, { status: 400 });
    }

    const action = payload.action === 'revokeSessions' ? 'revokeSessions' : payload.action === 'update' ? 'update' : null;
    if (!action) {
      return NextResponse.json({ error: 'Unsupported bulk action.' }, { status: 400 });
    }

    if (action === 'revokeSessions') {
      for (const userId of userIds) {
        await revokeUserSessionsByAdmin(currentUser.id, userId);
      }

      return NextResponse.json({ ok: true, count: userIds.length }, { status: 200 });
    }

    const role = parseRole(payload.role);
    const isActive = parseBoolean(payload.isActive);
    const sellerVerified = parseBoolean(payload.sellerVerified);

    for (const userId of userIds) {
      await updateAdminUserSettings({
        actorUserId: currentUser.id,
        userId,
        role,
        isActive,
        sellerVerified,
      });
    }

    return NextResponse.json({ ok: true, count: userIds.length }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить массовое действие для пользователей.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
