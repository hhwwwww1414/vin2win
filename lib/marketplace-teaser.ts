export const GUEST_LISTING_TEASER_COUNT = 50;

export function getGlobalListingIndex(page: number, limit: number, index: number) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 1;
  const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0;

  return (safePage - 1) * safeLimit + safeIndex;
}

export function isGuestListingTeaserLocked(input: {
  isAuthenticated: boolean;
  page: number;
  limit: number;
  index: number;
}) {
  if (input.isAuthenticated) {
    return false;
  }

  return getGlobalListingIndex(input.page, input.limit, input.index) >= GUEST_LISTING_TEASER_COUNT;
}

export function isGuestListingTeaserLockedByGlobalIndex(input: {
  isAuthenticated: boolean;
  globalIndex: number;
}) {
  if (input.isAuthenticated) {
    return false;
  }

  const safeGlobalIndex = Number.isFinite(input.globalIndex) && input.globalIndex >= 0 ? input.globalIndex : 0;
  return safeGlobalIndex >= GUEST_LISTING_TEASER_COUNT;
}
