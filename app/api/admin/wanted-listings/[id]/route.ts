import { ListingStatus, UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { LISTING_STATUS_VALUES } from '@/lib/listing-status';
import { getSessionUser } from '@/lib/server/auth';
import { deleteWantedListingByAdmin, updateWantedListingByAdmin } from '@/lib/server/moderation';

export const runtime = 'nodejs';

function parseStatus(value: unknown): ListingStatus | null {
  return typeof value === 'string' && LISTING_STATUS_VALUES.includes(value as (typeof LISTING_STATUS_VALUES)[number])
    ? (value as ListingStatus)
    : null;
}

function parseNote(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function parseNullableString(value: unknown) {
  return typeof value === 'string' ? value : value === null ? null : undefined;
}

function parseInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
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
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR)) {
      return NextResponse.json({ error: 'Moderator access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const status = parseStatus(payload.status);

    if (!status) {
      return NextResponse.json({ error: 'Invalid listing status.' }, { status: 400 });
    }

    const listing = await updateWantedListingByAdmin({
      actorUserId: currentUser.id,
      id,
      status,
      moderationNote: parseNote(payload.moderationNote),
      models: Array.isArray(payload.models)
        ? payload.models.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
        : undefined,
      budgetMin: parseInteger(payload.budgetMin) ?? (payload.budgetMin === null ? null : undefined),
      budgetMax: parseInteger(payload.budgetMax),
      region: parseNullableString(payload.region),
      comment: parseNullableString(payload.comment),
    });

    return NextResponse.json(
      {
        ok: true,
        id: listing.id,
        status: listing.status,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить запрос на подбор.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR)) {
      return NextResponse.json({ error: 'Moderator access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    await deleteWantedListingByAdmin({
      actorUserId: currentUser.id,
      id,
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось удалить запрос на подбор.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
