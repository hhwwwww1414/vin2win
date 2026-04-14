import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/auth';
import { countFavorites } from '@/lib/server/favorites';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 200 }
    );
  }

  const favoriteCount = await countFavorites(session.user.id);

  return NextResponse.json(
    {
      authenticated: true,
      user: session.user,
      favoriteCount,
      expiresAt: session.expiresAt.toISOString(),
    },
    { status: 200 }
  );
}
