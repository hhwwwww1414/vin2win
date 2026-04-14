import { NextResponse } from 'next/server';
import { incrementSaleListingViewCount } from '@/lib/server/marketplace';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewCount = await incrementSaleListingViewCount(id);

    if (viewCount === null) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    return NextResponse.json({ viewCount }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось обновить просмотры.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
