'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getBrandLogoUrl } from '@/lib/brand-logos';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  brandName: string;
  className?: string;
  size?: number;
  fallbackClassName?: string;
}

export function BrandLogo({
  brandName,
  className,
  size = 56,
  fallbackClassName,
}: BrandLogoProps) {
  const [error, setError] = useState(false);
  const logoUrl = getBrandLogoUrl(brandName);

  if (!logoUrl || error) {
    return (
      <div
        className={cn(
          'rounded-xl bg-muted dark:bg-surface-3 flex items-center justify-center font-bold text-muted-foreground shrink-0',
          fallbackClassName
        )}
        style={{ width: size, height: size }}
      >
        {brandName.charAt(0)}
      </div>
    );
  }

  return (
    <div
      className={cn('relative rounded-xl overflow-hidden bg-white dark:bg-white/10 shrink-0 flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoUrl}
        alt={`${brandName} logo`}
        fill
        unoptimized
        sizes={`${size}px`}
        className="object-contain p-[7.5%]"
        onError={() => setError(true)}
      />
    </div>
  );
}
