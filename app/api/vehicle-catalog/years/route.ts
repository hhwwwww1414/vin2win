import { NextResponse } from 'next/server';
import { vehicleCatalogJson } from '@/lib/server/vehicle-catalog-api';
import { getVehicleCatalogYears } from '@/lib/server/vehicle-catalog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json({ error: 'modelId is required.' }, { status: 400 });
    }

    const items = await getVehicleCatalogYears({ modelId });
    return vehicleCatalogJson({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить годы.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
