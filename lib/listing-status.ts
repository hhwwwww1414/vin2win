export const LISTING_STATUS_VALUES = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED'] as const;

export type ListingStatusValue = (typeof LISTING_STATUS_VALUES)[number];

export const LISTING_STATUS_LABELS: Record<ListingStatusValue, string> = {
  DRAFT: 'Черновик',
  PENDING: 'На модерации',
  PUBLISHED: 'Опубликовано',
  REJECTED: 'Отклонено',
  ARCHIVED: 'В архиве',
};

export const LISTING_STATUS_BADGE_CLASSES: Record<ListingStatusValue, string> = {
  DRAFT: 'border-border bg-background/60 text-muted-foreground',
  PENDING: 'border-warning/30 bg-warning/10 text-warning',
  PUBLISHED: 'border-success/30 bg-success/10 text-success',
  REJECTED: 'border-destructive/30 bg-destructive/10 text-destructive',
  ARCHIVED: 'border-border bg-muted/70 text-muted-foreground',
};

export const LISTING_STATUS_PANEL_CLASSES: Record<ListingStatusValue, string> = {
  DRAFT: 'border-border bg-background/60 text-foreground',
  PENDING: 'border-warning/30 bg-warning/10 text-foreground',
  PUBLISHED: 'border-success/30 bg-success/10 text-foreground',
  REJECTED: 'border-destructive/30 bg-destructive/10 text-foreground',
  ARCHIVED: 'border-border bg-muted/60 text-foreground',
};

export function isPublishedStatus(status: ListingStatusValue | undefined | null) {
  return status === 'PUBLISHED';
}

export function getListingStatusLabel(status: ListingStatusValue | undefined | null) {
  if (!status) {
    return 'Неизвестно';
  }

  return LISTING_STATUS_LABELS[status];
}
