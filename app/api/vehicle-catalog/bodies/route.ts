import { NextResponse } from 'next/server';
import {
  parseCatalogNumberParam,
  vehicleCatalogJson,
} from '@/lib/server/vehicle-catalog-api';
import { getVehicleCatalogBodies } from '@/lib/server/vehicle-catalog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const year = parseCatalogNumberParam(searchParams.get('year'));

    if (!modelId || !year) {
      return NextResponse.json({ error: 'modelId and year are required.' }, { status: 400 });
    }

    const items = await getVehicleCatalogBodies({ modelId, year });
    return vehicleCatalogJson({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить кузова.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
