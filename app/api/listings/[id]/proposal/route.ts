import { NextResponse } from 'next/server';
import { getListingProposalDownloadFilename } from '@/lib/listing-proposal';
import { createListingProposalPdf } from '@/lib/server/listing-proposal-pdf';
import type { SaleListing } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isMissingServerEnvError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.startsWith('Missing required environment variable:')
  );
}

async function getListingForProposal(id: string): Promise<SaleListing | null> {
  try {
    const [{ getSessionUser }, { getSaleListingById }] = await Promise.all([
      import('@/lib/server/auth'),
      import('@/lib/server/marketplace'),
    ]);
    const sessionUser = await getSessionUser();

    return getSaleListingById(
      id,
      sessionUser ? { userId: sessionUser.id, role: sessionUser.role } : undefined
    );
  } catch (error) {
    if (!isMissingServerEnvError(error)) {
      throw error;
    }

    const { saleListings } = await import('@/lib/marketplace-data');
    return saleListings.find((listing) => listing.id === id) ?? null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await getListingForProposal(id);

    if (!listing) {
      return NextResponse.json({ error: 'Объявление не найдено.' }, { status: 404 });
    }

    const pdfBytes = await createListingProposalPdf(listing, {
      origin: new URL(request.url).origin,
    });
    const fileName = getListingProposalDownloadFilename(listing);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Не удалось сформировать коммерческое предложение.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
