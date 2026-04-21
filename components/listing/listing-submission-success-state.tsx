import type { ReactNode } from 'react';
import Link from 'next/link';

import { SuccessCheckAnimation } from '@/components/listing/success-check-animation';

type ListingSubmissionSuccessStateProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryAction: ReactNode;
  reducedMotion: boolean;
};

export function ListingSubmissionSuccessState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryAction,
  reducedMotion,
}: ListingSubmissionSuccessStateProps) {
  return (
    <>
      <SuccessCheckAnimation reducedMotion={reducedMotion} className="mx-auto mb-6" />
      <h1 className="mb-3 text-2xl font-bold text-foreground">{title}</h1>
      <p className="mb-8 text-muted-foreground">{description}</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={primaryHref}
          className="rounded-lg bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-teal-accent dark:text-[#09090B]"
        >
          {primaryLabel}
        </Link>
        {secondaryAction}
      </div>
    </>
  );
}
