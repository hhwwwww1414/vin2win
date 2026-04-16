'use client';

import type { HTMLAttributes } from 'react';
import useSpotlightEffect from '@/hooks/use-spotlight';
import { cn } from '@/lib/utils';

interface SpotlightConfig {
  radius?: number;
  brightness?: number;
  color?: string;
  smoothing?: number;
}

interface SpotlightCursorProps extends HTMLAttributes<HTMLCanvasElement> {
  config?: SpotlightConfig;
}

const SpotlightCursor = ({
  config = {},
  className,
  ...rest
}: SpotlightCursorProps) => {
  const spotlightConfig = {
    radius: 248,
    brightness: 0.14,
    color: '#ffffff',
    smoothing: 0.1,
    ...config,
  };

  const canvasRef = useSpotlightEffect(spotlightConfig);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full mix-blend-screen', className)}
      {...rest}
    />
  );
};

export default SpotlightCursor;
