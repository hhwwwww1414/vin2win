import { NextResponse } from 'next/server';
import { getEffectiveVapidPublicKey } from '@/lib/server/vapid';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      publicKey: getEffectiveVapidPublicKey(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
