import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/prisma';
import { getRegionForCity } from '@/lib/ru-regions';

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
      catalogBrandId: listing.catalogBrandId ?? '',
      model: listing.model,
      catalogModelId: listing.catalogModelId ?? '',
      generation: listing.generation ?? '',
      catalogGenerationId: listing.catalogGenerationId ?? '',
      year: listing.year,
      region: getRegionForCity(listing.city) ?? '',
      city: listing.city,
      price: listing.price,
      priceInHand: listing.priceInHand ?? '',
      priceOnResources: listing.priceOnResources ?? '',
      bodyType: listing.bodyType,
      catalogBodyTypeId: listing.catalogBodyTypeId ?? '',
      engine: listing.engine,
      catalogFuelTypeId: listing.catalogFuelTypeId ?? '',
      engineDisplacementL: listing.engineDisplacementL ?? '',
      catalogEngineId: listing.catalogEngineId ?? '',
      power: listing.power,
      transmission: listing.transmission,
      catalogTransmissionId: listing.catalogTransmissionId ?? '',
      drive: listing.drive,
      catalogDriveTypeId: listing.catalogDriveTypeId ?? '',
      mileage: listing.mileage,
      steering: listing.steering,
      color: listing.color,
      trim: listing.trim ?? '',
      catalogModificationId: listing.catalogModificationId ?? '',
      catalogTrimId: listing.catalogTrimId ?? '',
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
      conditionNote: listing.conditionNote ?? '',
      wheelSet: listing.wheelSet,
      extraTires: listing.extraTires,
      glassOriginal: listing.glassOriginal ?? false,
      sellerType: listing.sellerType.toLowerCase(),
      resourceStatus: listing.resourceStatus.toLowerCase().replace(/_/g, '_'),
      description: listing.description,
      sellerName: listing.seller?.name ?? '',
      contact: listing.seller?.phone ?? '',
      vin: listing.vin ?? '',
      plateNumber: listing.plateNumber ?? '',
      plateRegion: listing.plateRegion ?? '',
      plateUnregistered: listing.plateUnregistered,
      videoUrl: listing.videoUrlExternal ?? '',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch listing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
