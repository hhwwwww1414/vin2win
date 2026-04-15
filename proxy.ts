import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SALE_ROUTE } from '@/lib/routes';

const LEGACY_SALE_QUERY_PARAMS = new Set([
  'make',
  'model',
  'bodyType',
  'transmission',
  'drive',
  'color',
  'city',
  'resourceStatus',
  'sellerType',
  'filter',
  'region',
  'yearFrom',
  'yearTo',
  'priceMin',
  'priceMax',
  'mileageMin',
  'mileageMax',
  'engineDisplacementMin',
  'engineDisplacementMax',
  'powerMin',
  'powerMax',
  'paintCountMax',
  'ownersMax',
  'ptsOriginal',
  'avtotekaStatus',
  'noAccident',
  'noTaxi',
  'noCarsharing',
  'hasPhoto',
  'priceInHand',
  'noInvestment',
  'sort',
  'page',
  'limit',
  'view',
]);

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.next();
  }

  const hasLegacySaleQuery = [...request.nextUrl.searchParams.keys()].some((key) =>
    LEGACY_SALE_QUERY_PARAMS.has(key)
  );

  if (!hasLegacySaleQuery) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = SALE_ROUTE;
  return NextResponse.redirect(url, 307);
}
