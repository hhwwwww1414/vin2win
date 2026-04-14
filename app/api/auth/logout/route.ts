import { NextResponse } from 'next/server';
import { clearSessionCookie, revokeCurrentSession } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST() {
  await revokeCurrentSession();
  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearSessionCookie(response);
  return response;
}
