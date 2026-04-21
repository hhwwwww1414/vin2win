import { cn } from '@/lib/utils';

type SuccessCheckAnimationProps = {
  reducedMotion?: boolean;
  className?: string;
};

export function SuccessCheckAnimation({
  reducedMotion = false,
  className,
}: SuccessCheckAnimationProps) {
  return (
    <div
      data-success-check-animation="true"
      className={cn(
        'relative flex h-22 w-22 items-center justify-center text-teal-accent',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-3 rounded-full bg-[radial-gradient(circle,rgba(129,216,208,0.18),transparent_68%)] blur-xl" />
      <svg viewBox="0 0 32 32" className="relative h-full w-full" aria-hidden="true">
        <circle
          cx="16"
          cy="16"
          r="12"
          className={cn(
            'fill-none stroke-current stroke-[2.75] [stroke-linecap:round]',
            reducedMotion ? '' : 'listing-success-circle'
          )}
        />
        <path
          d="M11 16.5 14.5 20 21.5 12.5"
          className={cn(
            'fill-none stroke-current stroke-[3] [stroke-linecap:round] [stroke-linejoin:round]',
            reducedMotion ? '' : 'listing-success-tick'
          )}
        />
      </svg>
    </div>
  );
}
