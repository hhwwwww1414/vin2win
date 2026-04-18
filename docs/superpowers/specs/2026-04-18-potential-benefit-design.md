# Potential Benefit Design

## Summary

Add a database-managed `potentialBenefit` field for sale listings and expose it across the marketplace as:

- a visual badge on listing cards and listing detail
- a searchable/filterable value
- a sortable value
- a range filter input

The field represents the positive difference between `priceOnResources` and `priceInHand`. It is only meaningful for listings that are already published on external resources and where the difference is strictly positive.

## Problem

The marketplace already stores:

- `priceInHand`
- `priceOnResources`
- `resourceStatus`

But it does not derive a reusable "potential benefit" value from them. As a result:

- users cannot sort listings by potential arbitrage
- users cannot filter listings that have a positive benefit
- users cannot filter by a benefit range
- the UI cannot show a consistent benefit badge across cards, compact rows, tables, and detail pages

Because this value must participate in filtering and sorting, it should exist as a database-managed field rather than as repeated UI-only calculation.

## Goals

- Store a DB-managed `potentialBenefit` value on `SaleListing`
- Keep the value automatically in sync when relevant listing fields change
- Support:
  - `hasBenefit` toggle
  - `benefitMin` / `benefitMax` range filter
  - `benefit_desc` sort
- Render benefit badges across all listing presentation modes
- Keep marketplace semantics consistent between PostgreSQL-backed search and fixture fallback search

## Non-goals

- Adding ascending benefit sort
- Adding analytics dashboards based on benefit
- Backfilling historical reporting tables
- Changing listing submission UX beyond existing `priceInHand` / `priceOnResources` fields

## Final Product Decisions

### Benefit meaning

`potentialBenefit = priceOnResources - priceInHand`

The value is only stored when all of the following are true:

- `resourceStatus = ON_RESOURCES`
- `priceOnResources IS NOT NULL`
- `priceInHand IS NOT NULL`
- `priceOnResources > priceInHand`

Otherwise `potentialBenefit = NULL`.

Using `NULL` instead of `0` keeps SQL semantics clean:

- `has benefit` is `potentialBenefit IS NOT NULL`
- range filtering naturally excludes non-benefit rows
- sorting by benefit can safely switch to "benefit-only" result sets

### Sort semantics

If the user selects `sort=benefit_desc`, the search result set must automatically be limited to listings where `potentialBenefit IS NOT NULL`.

This is intentional product behavior, not an implementation side effect.

### Filter semantics

If the user enables any of the following:

- `hasBenefit`
- `benefitMin`
- `benefitMax`

then the result set must only include listings with a positive stored benefit.

Users do not need to separately add `resourceStatus=on_resources`; the meaning of benefit already implies it.

## Architecture

### Database layer

Add `potentialBenefit Int?` to `SaleListing`.

Manage the field in PostgreSQL with:

- a SQL function that calculates the normalized value from the row
- a `BEFORE INSERT OR UPDATE` trigger on `SaleListing`
- a backfill statement for existing rows in the migration

Reason for this approach:

- Prisma treats it as a normal nullable integer field
- filtering and sorting stay in the main `SaleListing` query path
- indexing is straightforward
- no extra read-model or `VIEW` pipeline is required

### Trigger rules

The trigger recalculates `potentialBenefit` whenever any of these values change:

- `priceInHand`
- `priceOnResources`
- `resourceStatus`

The trigger must set:

- positive difference -> stored integer value
- any invalid / incomplete state -> `NULL`

### Indexing

Add an index on `potentialBenefit`.

This supports:

- descending sort by benefit
- range filtering
- `IS NOT NULL` constrained result sets

The initial implementation uses a standard index. Partial-index optimization is explicitly out of scope for this change.

## Application Data Model

### Prisma schema

Update `prisma/schema.prisma`:

- add `potentialBenefit Int?` to `SaleListing`

The application does not write this field manually. It is DB-managed.

### Domain types

Update `lib/types.ts`:

- `SaleListing.potentialBenefit?: number`
- `SaleSearchFilters.hasBenefit?: boolean`
- `SaleSearchFilters.benefitMin?: number`
- `SaleSearchFilters.benefitMax?: number`
- extend `SaleSearchSortKey` with `benefit_desc`

## Search Pipeline Changes

### URL/query params

Add support for:

- `hasBenefit=true`
- `benefitMin=<number>`
- `benefitMax=<number>`
- `sort=benefit_desc`

### Search parsing

Update `lib/sale-search.ts` to:

- parse the new fields from URL params
- serialize them back into query strings
- include the new sort label in `SALE_SEARCH_SORT_OPTIONS`
- include benefit filters in active filter detection and summary logic

### PostgreSQL-backed search

Update `lib/server/marketplace.ts`:

- map `potentialBenefit` from Prisma rows into domain listings
- extend the SQL/Prisma `where` conditions
- extend sorting logic

Required search rules:

- `hasBenefit` -> `potentialBenefit: { not: null }`
- `benefitMin` -> `potentialBenefit >= benefitMin`
- `benefitMax` -> `potentialBenefit <= benefitMax`
- `sort=benefit_desc` -> add a benefit-only constraint and order by `potentialBenefit desc`

Recommended ordering for `benefit_desc`:

1. `potentialBenefit desc`
2. `publishedAt desc`
3. `createdAt desc`

### Fixture fallback search

The fallback marketplace logic must reproduce the same semantics:

- only positive benefit counts
- sort by benefit is benefit-only
- range filtering excludes non-benefit rows

This prevents local and DB-backed behavior from diverging.

## UI Design

### Badge variants

Use a shared benefit badge surface with multiple density variants.

#### Cards

Show a full badge below the pricing block:

`Возможная выгода 150 000 ₽`

This variant uses the existing marketplace pulse animation pattern.

#### Compact rows

Show a shortened inline badge:

`Выгода 150 000 ₽`

It should stay visually strong but avoid breaking compact density.

#### Table

Add a dedicated `Выгода` column.

The cell contains only the amount in a compact badge form:

`150 000 ₽`

No long explanatory text in table cells.

#### Listing detail

Show the full badge inside the pricing area of the deal block on both desktop and mobile layouts:

`Возможная выгода 150 000 ₽`

### Advanced filters

Add a new `Выгода` block to advanced filters with:

- checkbox: `Есть выгода`
- min input
- max input

If the user fills either min or max, the state is interpreted as benefit-only search even if the checkbox was not manually toggled first.

### Sort UI

Add `По выгоде` to sort options.

When this sort is selected, the UI should reflect that the result set is intentionally restricted to listings with benefit so this behavior does not feel accidental.

### Result summaries

Active filter count and summary pills should include:

- `Есть выгода`
- benefit min/max range

## Files Expected To Change

### Database / schema

- `prisma/schema.prisma`
- new Prisma migration SQL

### Search and domain model

- `lib/types.ts`
- `lib/sale-search.ts`
- `lib/server/marketplace.ts`

### Marketplace UI

- `components/marketplace/advanced-filters.tsx`
- `components/marketplace/home-page-client.tsx`
- `components/marketplace/listing-card-view.tsx`
- `components/marketplace/listing-compact-row.tsx`
- `components/marketplace/listings-table.tsx`
- `components/listing/deal-block.tsx`

## Testing Strategy

### Unit tests

- search param parsing/serialization for:
  - `hasBenefit`
  - `benefitMin`
  - `benefitMax`
  - `benefit_desc`
- fallback marketplace filtering and sorting semantics
- badge rendering in each density variant

### Integration / DB tests

- inserting a listing with valid on-resource spread sets `potentialBenefit`
- updating prices recalculates `potentialBenefit`
- switching `resourceStatus` away from `ON_RESOURCES` clears `potentialBenefit`
- non-positive spread clears `potentialBenefit`

### QA / browser tests

- advanced filters expose the new controls
- applying benefit toggle filters out listings without benefit
- applying benefit range narrows result set correctly
- selecting `По выгоде` sorts by descending benefit and excludes non-benefit listings
- cards, compact rows, table, and detail page show the correct badge variant

## Risks And Mitigations

### Dirty data or inconsistent historic rows

Mitigation:

- perform backfill in migration
- rely on trigger for future consistency

### UI/DB semantic drift

Mitigation:

- only render badges from stored `potentialBenefit`
- keep search rules centralized in server search and fallback search

### Unexpected user confusion when sorting by benefit hides rows

Mitigation:

- explicitly encode this as product behavior
- expose the active sort clearly in the UI
- show benefit-oriented filter state in summaries when applicable

## Rollout

Ship in one slice:

1. DB field + migration + trigger + backfill
2. Prisma/domain/search support
3. UI badges and advanced filter controls
4. QA coverage

This work is intentionally scoped to a single implementation plan and does not require decomposition into separate feature tracks.
