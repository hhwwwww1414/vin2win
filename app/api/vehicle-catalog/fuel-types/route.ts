import { NextResponse } from 'next/server';
import {
  parseCatalogNumberParam,
  vehicleCatalogJson,
} from '@/lib/server/vehicle-catalog-api';
import { getVehicleCatalogFuelTypes } from '@/lib/server/vehicle-catalog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generationId');
    const year = parseCatalogNumberParam(searchParams.get('year'));
    const bodyTypeId = searchParams.get('bodyTypeId') ?? undefined;

    if (!generationId) {
      return NextResponse.json({ error: 'generationId is required.' }, { status: 400 });
    }

    const items = await getVehicleCatalogFuelTypes({
      generationId,
      year,
      bodyTypeId,
    });

    return vehicleCatalogJson({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить типы двигателя.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
