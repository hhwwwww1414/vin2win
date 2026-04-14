import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getSessionUser, updateUserRole } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';

export const runtime = 'nodejs';

const allowedRoles = new Set<UserRole>([UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN]);

function parseRole(value: unknown): UserRole | null {
  return typeof value === 'string' && allowedRoles.has(value as UserRole) ? (value as UserRole) : null;
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
    const role = parseRole(payload.role);

    if (!role) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    if (currentUser.id === id && role !== UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json({ error: 'The last administrator cannot remove their own admin role.' }, { status: 400 });
      }
    }

    const user = await updateUserRole(id, role, currentUser.id);
    return NextResponse.json({ ok: true, userId: user.id, role: user.role }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить роль пользователя.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
