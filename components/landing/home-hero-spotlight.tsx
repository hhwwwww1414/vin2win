'use client';

import dynamic from 'next/dynamic';

const SpotlightCursor = dynamic(() => import('@/components/spotlight-cursor'), {
  ssr: false,
});

export function HomeHeroSpotlight() {
  return (
    <SpotlightCursor
      aria-hidden="true"
      config={{
        radius: 256,
        brightness: 0.15,
        color: '#ffffff',
        smoothing: 0.1,
      }}
      className="z-20 opacity-90"
    />
  );
}
