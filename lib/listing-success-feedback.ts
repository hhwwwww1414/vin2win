import type { ListingStatusValue } from '@/lib/listing-status';

export type ListingSuccessCelebrationMode = 'soft' | 'full';

export type ListingSuccessConfettiBurst = {
  particleCount: number;
  spread: number;
  startVelocity: number;
  scalar?: number;
  decay?: number;
  ticks?: number;
  origin: { x: number; y: number };
  angle?: number;
};

export function getListingSuccessCelebrationMode(
  status: ListingStatusValue | null
): ListingSuccessCelebrationMode {
  return status === 'DRAFT' ? 'soft' : 'full';
}

export function getListingSuccessConfettiBursts(
  mode: ListingSuccessCelebrationMode
): ListingSuccessConfettiBurst[] {
  if (mode === 'soft') {
    return [
      {
        particleCount: 36,
        spread: 64,
        startVelocity: 34,
        scalar: 0.92,
        origin: { x: 0.5, y: 0.68 },
      },
      {
        particleCount: 24,
        spread: 42,
        startVelocity: 26,
        scalar: 0.82,
        origin: { x: 0.24, y: 0.74 },
        angle: 62,
      },
      {
        particleCount: 24,
        spread: 42,
        startVelocity: 26,
        scalar: 0.82,
        origin: { x: 0.76, y: 0.74 },
        angle: 118,
      },
    ];
  }

  return [
    {
      particleCount: 56,
      spread: 80,
      startVelocity: 55,
      scalar: 1.02,
      origin: { x: 0.5, y: 0.68 },
    },
    {
      particleCount: 36,
      spread: 60,
      startVelocity: 45,
      scalar: 0.96,
      origin: { x: 0.15, y: 0.75 },
      angle: 60,
    },
    {
      particleCount: 36,
      spread: 60,
      startVelocity: 45,
      scalar: 0.96,
      origin: { x: 0.85, y: 0.75 },
      angle: 120,
    },
    {
      particleCount: 32,
      spread: 120,
      startVelocity: 30,
      scalar: 0.9,
      decay: 0.92,
      origin: { x: 0.5, y: 0.65 },
    },
  ];
}
