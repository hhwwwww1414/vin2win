declare module 'canvas-confetti' {
  export type Options = {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    x?: number;
    y?: number;
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
    colors?: string[];
    origin?: {
      x?: number;
      y?: number;
    };
  };

  export default function confetti(options?: Options): Promise<null> | null;
}
