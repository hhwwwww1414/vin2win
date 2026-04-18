'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react';
import type { SaleListing, SaleSearchSortKey } from '@/lib/types';
import { formatPrice, formatMileage } from '@/lib/marketplace-data';
import { formatPaintCountValue, getListingTitle, SELLER_LABELS } from '@/lib/listing-utils';
import { CompareToggle } from './compare-toggle';
import { FavoriteToggle } from './favorite-toggle';
import { ListingBenefitBadge } from './listing-benefit-badge';
import { cn } from '@/lib/utils';

const TABLE_COLUMNS = [
  { key: 'photo', label: '', width: '68px' },
  { key: 'auto', label: 'Авто', width: '190px' },
  { key: 'year', label: 'Год', width: '70px', sortable: ['year_desc', 'year_asc'] as SaleSearchSortKey[] },
  { key: 'price', label: 'Цена', width: '116px', sortable: ['price_desc', 'price_asc'] as SaleSearchSortKey[] },
  { key: 'inHand', label: 'В руки', width: '96px' },
  { key: 'city', label: 'Город', width: '108px' },
  { key: 'mileage', label: 'Пробег', width: '88px', sortable: ['mileage'] as SaleSearchSortKey[] },
  { key: 'views', label: 'Просм.', width: '82px', sortable: ['views'] as SaleSearchSortKey[] },
  { key: 'engine', label: 'Дв. / КПП', width: '120px', mdOnly: true },
  { key: 'owners', label: 'Влад.', width: '56px' },
  { key: 'paint', label: 'Окрашено', width: '112px' },
  { key: 'status', label: 'Продавец', width: '104px' },
  { key: 'resources', label: 'Ресурсы', width: '94px' },
] as const;

const BENEFIT_TABLE_COLUMN = {
  key: 'benefit',
  label: 'Выгода',
  width: '104px',
  sortable: ['benefit_desc'] as SaleSearchSortKey[],
} as const;

const TABLE_COLUMNS_WITH_BENEFIT: Array<(typeof TABLE_COLUMNS)[number] | typeof BENEFIT_TABLE_COLUMN> = [
  ...TABLE_COLUMNS.slice(0, 5),
  BENEFIT_TABLE_COLUMN,
  ...TABLE_COLUMNS.slice(5),
];

interface ListingsTableProps {
  listings: SaleListing[];
  sortKey: SaleSearchSortKey;
  onSortChange: (sort: SaleSearchSortKey) => void;
  priorityIndices?: Set<number>;
  isAuthenticated?: boolean;
  loginHref?: string;
  className?: string;
}

interface ListingTableRowProps {
  listing: SaleListing;
  sortKey: SaleSearchSortKey;
  priority?: boolean;
  isAuthenticated?: boolean;
  loginHref?: string;
}

const CELL_CLASS = 'px-3 py-2 align-middle whitespace-nowrap overflow-hidden text-ellipsis';
const CELL_LINK = 'block w-full min-w-0 transition-colors hover:text-teal-accent';
const RESOURCE_BADGE_CLASS = 'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium';

function getNextSort(currentSort: SaleSearchSortKey, sortable?: readonly SaleSearchSortKey[]) {
  if (!sortable?.length) {
    return null;
  }

  if (sortable.length === 1) {
    return sortable[0];
  }

  return currentSort === sortable[0] ? sortable[1] : sortable[0];
}

function isSortedColumn(columnKey: string, sortKey: SaleSearchSortKey) {
  return sortKey.startsWith(columnKey);
}

function SortIndicator({
  activeSort,
  currentSort,
}: {
  activeSort?: readonly SaleSearchSortKey[];
  currentSort: SaleSearchSortKey;
}) {
  if (!activeSort?.length) {
    return null;
  }

  if (!activeSort.includes(currentSort)) {
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />;
  }

  return currentSort.endsWith('_asc') ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
}

export function ListingsTable({
  listings,
  sortKey,
  onSortChange,
  priorityIndices = new Set(),
  isAuthenticated = false,
  loginHref,
  className,
}: ListingsTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card/95 backdrop-blur-sm dark:bg-surface-elevated/90', className)}>
      <div className="max-h-[calc(100vh-16rem)] overflow-x-auto overflow-y-auto">
        <table className="min-w-[1180px] w-full table-fixed border-collapse text-sm">
          <colgroup>
            {TABLE_COLUMNS_WITH_BENEFIT.map((col) => (
              <col key={col.key} style={{ width: col.width, minWidth: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b-2 border-border">
              {TABLE_COLUMNS_WITH_BENEFIT.map((col) => {
                const sortable = 'sortable' in col ? col.sortable : undefined;
                const isNumericCol =
                  col.key === 'year' ||
                  col.key === 'price' ||
                  col.key === 'inHand' ||
                  col.key === 'benefit' ||
                  col.key === 'mileage' ||
                  col.key === 'views' ||
                  col.key === 'owners';

                return (
                  <th
                    key={col.key}
                    className={cn(
                      'sticky top-0 z-10 bg-muted/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm dark:bg-surface-3',
                      isNumericCol ? 'text-right' : 'text-left',
                      'mdOnly' in col && col.mdOnly ? 'hidden md:table-cell' : ''
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => {
                          const nextSort = getNextSort(sortKey, sortable);
                          if (nextSort) {
                            onSortChange(nextSort);
                          }
                        }}
                        className={cn('inline-flex items-center gap-1.5 transition-colors hover:text-foreground', isNumericCol && 'ml-auto')}
                      >
                        <span>{col.label}</span>
                        <SortIndicator activeSort={sortable} currentSort={sortKey} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {listings.map((listing, index) => (
              <ListingTableRow
                key={listing.id}
                listing={listing}
                sortKey={sortKey}
                priority={priorityIndices.has(index)}
                isAuthenticated={isAuthenticated}
                loginHref={loginHref}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListingTableRow({
  listing,
  sortKey,
  priority = false,
  isAuthenticated = false,
  loginHref,
}: ListingTableRowProps) {
  const title = getListingTitle(listing);
  const sellerLabel = SELLER_LABELS[listing.sellerType] ?? listing.sellerType;
  const onResources = listing.resourceStatus === 'on_resources';
  const engineTrans = `${listing.engine} / ${listing.transmission}`;
  const coverImage = listing.images.find(Boolean);
  const paintLabel = formatPaintCountValue(listing.paintCount);

  return (
    <tr className="border-b border-border/50 transition-colors duration-150 hover:bg-muted/40 dark:hover:bg-white/[0.06]">
      <td className={`${CELL_CLASS} w-[72px]`}>
        <Link href={`/listing/${listing.id}`} className="block">
          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
                sizes="56px"
                priority={priority}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">Без фото</div>
            )}
          </div>
        </Link>
      </td>

      <td className={CELL_CLASS}>
        <div className="flex items-start justify-between gap-2">
          <Link href={`/listing/${listing.id}`} className={`${CELL_LINK} truncate font-medium text-foreground`}>
            {title}
          </Link>
          <div className="flex items-center gap-1">
            <CompareToggle listingId={listing.id} compact />
            <FavoriteToggle
              listingId={listing.id}
              initialActive={listing.isFavorite}
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
              compact
            />
          </div>
        </div>
      </td>

      <td data-col="year" className={cn(CELL_CLASS, 'text-right tabular-nums text-muted-foreground', isSortedColumn('year', sortKey) && 'bg-teal-accent/[0.04] dark:bg-teal-accent/[0.06]')}>
        <Link href={`/listing/${listing.id}`} className={CELL_LINK}>
          {listing.year}
        </Link>
      </td>

      <td data-col="price" className={cn(CELL_CLASS, 'text-right tabular-nums font-medium text-foreground', isSortedColumn('price', sortKey) && 'bg-teal-accent/[0.04] dark:bg-teal-accent/[0.06]')}>
        <Link href={`/listing/${listing.id}`} className={CELL_LINK}>
          {formatPrice(listing.price)}
        </Link>
      </td>

      <td className={`${CELL_CLASS} text-right text-xs text-muted-foreground tabular-nums`}>
        <Link href={`/listing/${listing.id}`} className={CELL_LINK}>
          {listing.priceInHand ? formatPrice(listing.priceInHand) : '—'}
        </Link>
      </td>

      <td
        data-col="benefit"
        className={cn(
          CELL_CLASS,
          'text-right text-xs text-muted-foreground tabular-nums',
          isSortedColumn('benefit', sortKey) && 'bg-teal-accent/[0.04] dark:bg-teal-accent/[0.06]'
        )}
      >
        <Link href={`/listing/${listing.id}`} className="flex w-full justify-end">
          <ListingBenefitBadge amount={listing.potentialBenefit} variant="table" />
          {!listing.potentialBenefit ? <span className="text-xs text-muted-foreground/50">вЂ”</span> : null}
        </Link>
      </td>

      <td className={`${CELL_CLASS} text-xs text-muted-foreground`}>
        <Link href={`/listing/${listing.id}`} className={`${CELL_LINK} truncate`}>
          {listing.city}
        </Link>
      </td>

      <td data-col="mileage" className={cn(CELL_CLASS, 'text-right text-xs text-muted-foreground tabular-nums', isSortedColumn('mileage', sortKey) && 'bg-teal-accent/[0.04] dark:bg-teal-accent/[0.06]')}>
        <Link href={`/listing/${listing.id}`} className={CELL_LINK}>
          {formatMileage(listing.mileage)}
        </Link>
      </td>

      <td data-col="views" className={cn(CELL_CLASS, 'text-right text-xs text-muted-foreground', isSortedColumn('views', sortKey) && 'bg-teal-accent/[0.04] dark:bg-teal-accent/[0.06]')}>
        <Link href={`/listing/${listing.id}`} className="inline-flex w-full items-center justify-end gap-1">
          <Eye className="h-3.5 w-3.5 shrink-0 opacity-60" />
          {listing.viewCount.toLocaleString('ru-RU')}
        </Link>
      </td>

      <td className={`${CELL_CLASS} hidden text-xs text-muted-foreground md:table-cell`}>
        <Link href={`/listing/${listing.id}`} className={`${CELL_LINK} truncate`}>
          {engineTrans}
        </Link>
      </td>

      <td className={`${CELL_CLASS} text-right text-xs text-muted-foreground tabular-nums`}>
        <Link href={`/listing/${listing.id}`} className={CELL_LINK}>
          {listing.owners}
        </Link>
      </td>

      <td className={`${CELL_CLASS} text-xs text-muted-foreground`}>
        <Link href={`/listing/${listing.id}`} className={CELL_LINK}>
          <span className={cn(listing.paintCount === 0 ? 'text-success' : 'text-warning')}>
            {paintLabel}
          </span>
        </Link>
      </td>

      <td className={`${CELL_CLASS} text-xs text-muted-foreground`}>
        <Link href={`/listing/${listing.id}`} className={`${CELL_LINK} truncate`}>
          {sellerLabel}
        </Link>
      </td>

      <td className={CELL_CLASS}>
        <Link href={`/listing/${listing.id}`} className={CELL_LINK}>
          {onResources ? (
            <span className={cn(RESOURCE_BADGE_CLASS, 'border-teal-accent/20 bg-teal-accent/10 text-teal-accent')}>На ресурсах</span>
          ) : listing.resourceStatus === 'pre_resources' ? (
            <span className={cn(RESOURCE_BADGE_CLASS, 'border-warning/20 bg-warning/10 text-warning')}>До ресурсов</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </Link>
      </td>
    </tr>
  );
}
