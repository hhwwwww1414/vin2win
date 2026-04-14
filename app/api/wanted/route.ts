import { ListingStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { createWantedListing } from '@/lib/server/marketplace';

export const runtime = 'nodejs';

function parseString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalString(value: unknown): string | undefined {
  const normalized = parseString(value);
  return normalized ? normalized : undefined;
}

function parseOptionalNumber(value: unknown): number | undefined {
  const normalized = parseString(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumber(value: unknown): number {
  const normalized = parseString(value);
  return Number(normalized);
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => parseString(item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeInitialStatus(value: unknown): ListingStatus {
  return value === ListingStatus.DRAFT ? ListingStatus.DRAFT : ListingStatus.PENDING;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const initialStatus = normalizeInitialStatus(payload.initialStatus);
    const authorName = parseString(payload.authorName);
    const contact = parseString(payload.contact);
    const models = parseStringArray(payload.models);
    const budgetMax = parseNumber(payload.budgetMax);

    if (!authorName || !contact || models.length === 0 || !Number.isFinite(budgetMax)) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const listing = await createWantedListing({
      createdByUserId: currentUser.id,
      initialStatus,
      authorName,
      contact,
      models,
      budgetMin: parseOptionalNumber(payload.budgetMin),
      budgetMax,
      yearFrom: parseOptionalNumber(payload.yearFrom),
      mileageMax: parseOptionalNumber(payload.mileageMax),
      engine: parseOptionalString(payload.engine),
      transmission: parseOptionalString(payload.transmission),
      drive: parseOptionalString(payload.drive),
      ownersMax: parseOptionalNumber(payload.ownersMax),
      paintAllowed: parseBoolean(payload.paintAllowed),
      restrictions: parseStringArray(payload.restrictions),
      region: parseOptionalString(payload.region),
      comment: parseOptionalString(payload.comment),
    });

    return NextResponse.json({ id: listing.id, status: listing.status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось создать запрос на подбор.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
