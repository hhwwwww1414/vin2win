import {
  getListingSuccessConfettiBursts,
  type ListingSuccessCelebrationMode,
} from '@/lib/listing-success-feedback';

export type ListingSuccessConfettiFireOptions = {
  particleCount: number;
  spread: number;
  startVelocity: number;
  scalar?: number;
  decay?: number;
  ticks?: number;
  origin: { x: number; y: number };
  angle?: number;
  zIndex: number;
  gravity: number;
  disableForReducedMotion: boolean;
  colors: string[];
};

type ListingSuccessConfettiLaunchOptions = {
  reducedMotion: boolean;
  fire?: (options: ListingSuccessConfettiFireOptions) => Promise<unknown> | unknown;
};

const LISTING_SUCCESS_CONFETTI_COLORS = ['#81D8D0', '#9FE5DE', '#67E8F9', '#D9FFFB'];

async function fireCanvasConfetti(options: ListingSuccessConfettiFireOptions) {
  const { default: confetti } = (await import('canvas-confetti')) as {
    default: (opts: ListingSuccessConfettiFireOptions) => Promise<unknown> | unknown;
  };

  return confetti(options);
}

export async function launchListingSuccessConfetti(
  mode: ListingSuccessCelebrationMode,
  options: ListingSuccessConfettiLaunchOptions
) {
  if (options.reducedMotion) {
    return;
  }

  const fire = options.fire ?? fireCanvasConfetti;

  for (const burst of getListingSuccessConfettiBursts(mode)) {
    await fire({
      zIndex: 9999,
      gravity: 1,
      disableForReducedMotion: true,
      colors: LISTING_SUCCESS_CONFETTI_COLORS,
      ...burst,
    });
  }
}
