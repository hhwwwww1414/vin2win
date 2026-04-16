import { NextResponse } from 'next/server';
import { vehicleCatalogJson } from '@/lib/server/vehicle-catalog-api';
import { getVehicleCatalogModels } from '@/lib/server/vehicle-catalog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required.' }, { status: 400 });
    }

    const items = await getVehicleCatalogModels({
      brandId,
      query: searchParams.get('query') ?? undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    });

    return vehicleCatalogJson({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить модели.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
