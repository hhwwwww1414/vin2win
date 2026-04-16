import { NextResponse } from 'next/server';
import {
  parseCatalogNumberParam,
  vehicleCatalogJson,
} from '@/lib/server/vehicle-catalog-api';
import { getVehicleCatalogDriveTypes } from '@/lib/server/vehicle-catalog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generationId');
    const fuelTypeId = searchParams.get('fuelTypeId') ?? undefined;
    const bodyTypeId = searchParams.get('bodyTypeId') ?? undefined;
    const year = parseCatalogNumberParam(searchParams.get('year'));

    if (!generationId) {
      return NextResponse.json({ error: 'generationId is required.' }, { status: 400 });
    }

    const items = await getVehicleCatalogDriveTypes({
      generationId,
      fuelTypeId,
      bodyTypeId,
      year,
    });

    return vehicleCatalogJson({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить приводы.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
