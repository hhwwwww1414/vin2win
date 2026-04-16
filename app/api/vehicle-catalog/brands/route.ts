import { NextResponse } from 'next/server';
import { vehicleCatalogJson } from '@/lib/server/vehicle-catalog-api';
import { getVehicleCatalogBrands } from '@/lib/server/vehicle-catalog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const items = await getVehicleCatalogBrands({
      query: searchParams.get('query') ?? undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    });

    return vehicleCatalogJson({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить марки.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
