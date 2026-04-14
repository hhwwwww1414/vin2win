import { ListingStatus, UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { LISTING_STATUS_VALUES } from '@/lib/listing-status';
import { getSessionUser } from '@/lib/server/auth';
import { bulkUpdateSaleListings } from '@/lib/server/moderation';

export const runtime = 'nodejs';

function parseStatus(value: unknown): ListingStatus | null {
  return typeof value === 'string' && LISTING_STATUS_VALUES.includes(value as (typeof LISTING_STATUS_VALUES)[number])
    ? (value as ListingStatus)
    : null;
}

function parseIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR)) {
      return NextResponse.json({ error: 'Moderator access required.' }, { status: 403 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const action = payload.action === 'delete' ? 'delete' : payload.action === 'setStatus' ? 'setStatus' : null;
    const ids = parseIds(payload.ids);

    if (!action || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid bulk action payload.' }, { status: 400 });
    }

    const result = await bulkUpdateSaleListings({
      actorUserId: currentUser.id,
      ids,
      action,
      status: action === 'setStatus' ? parseStatus(payload.status) ?? undefined : undefined,
      moderationNote: typeof payload.moderationNote === 'string' ? payload.moderationNote : undefined,
    });

    return NextResponse.json({ ok: true, count: result.count }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить массовое действие для объявлений о продаже.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
