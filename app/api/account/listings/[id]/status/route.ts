import { ListingStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';

const ALLOWED_TRANSITIONS: Record<string, ListingStatus[]> = {
  PUBLISHED: [ListingStatus.ARCHIVED],
  DRAFT: [ListingStatus.PENDING],
  REJECTED: [ListingStatus.PENDING],
  ARCHIVED: [ListingStatus.PENDING],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as { status?: string };
    const nextStatus = body.status as ListingStatus | undefined;

    if (!nextStatus || !Object.values(ListingStatus).includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const listing = await prisma.saleListing.findUnique({
      where: { id },
      select: { id: true, status: true, createdByUserId: true, sellerId: true, seller: { select: { userId: true } } },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const isOwner =
      listing.createdByUserId === currentUser.id ||
      listing.seller?.userId === currentUser.id;

    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const allowed = ALLOWED_TRANSITIONS[listing.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Cannot change from ${listing.status} to ${nextStatus}.` },
        { status: 400 },
      );
    }

    const updated = await prisma.saleListing.update({
      where: { id },
      data: {
        status: nextStatus,
        statusUpdatedAt: new Date(),
        ...(nextStatus === ListingStatus.PUBLISHED ? { publishedAt: new Date() } : {}),
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update listing status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
