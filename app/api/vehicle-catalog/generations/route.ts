import { NextResponse } from 'next/server';
import {
  parseCatalogNumberParam,
  vehicleCatalogJson,
} from '@/lib/server/vehicle-catalog-api';
import { getVehicleCatalogGenerations } from '@/lib/server/vehicle-catalog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const year = parseCatalogNumberParam(searchParams.get('year'));
    const bodyTypeId = searchParams.get('bodyTypeId') ?? undefined;

    if (!modelId || !year) {
      return NextResponse.json({ error: 'modelId and year are required.' }, { status: 400 });
    }

    const items = await getVehicleCatalogGenerations({
      modelId,
      year,
      bodyTypeId,
    });

    return vehicleCatalogJson({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить поколения.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
