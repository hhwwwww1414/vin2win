import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;

    const listing = await prisma.saleListing.findUnique({
      where: { id },
      include: { seller: true },
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

    return NextResponse.json({
      make: listing.make,
      model: listing.model,
      generation: listing.generation ?? '',
      year: listing.year,
      city: listing.city,
      price: listing.price,
      priceInHand: listing.priceInHand ?? '',
      priceOnResources: listing.priceOnResources ?? '',
      bodyType: listing.bodyType,
      engine: listing.engine,
      engineDisplacementL: listing.engineDisplacementL ?? '',
      power: listing.power,
      transmission: listing.transmission,
      drive: listing.drive,
      mileage: listing.mileage,
      steering: listing.steering,
      color: listing.color,
      trim: listing.trim ?? '',
      owners: listing.owners,
      registrations: listing.registrations ?? '',
      keysCount: listing.keysCount ?? '',
      ptsType: listing.ptsType?.toLowerCase() ?? 'original',
      paintCount: listing.paintCount,
      paintedElements: (listing.paintedElements ?? []).join(', '),
      taxi: listing.taxi ?? false,
      carsharing: listing.carsharing ?? false,
      avtotekaStatus: listing.avtotekaStatus?.toLowerCase() ?? '',
      needsInvestment: listing.needsInvestment ?? false,
      wheelSet: listing.wheelSet,
      extraTires: listing.extraTires,
      glassOriginal: listing.glassOriginal ?? false,
      sellerType: listing.sellerType.toLowerCase(),
      resourceStatus: listing.resourceStatus.toLowerCase().replace(/_/g, '_'),
      description: listing.description,
      sellerName: listing.seller?.name ?? '',
      contact: listing.seller?.phone ?? '',
      vin: listing.vin ?? '',
      videoUrl: listing.videoUrlExternal ?? '',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch listing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
