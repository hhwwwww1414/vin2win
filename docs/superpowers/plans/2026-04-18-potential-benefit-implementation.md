# Potential Benefit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a DB-managed `potentialBenefit` field for sale listings, expose it in marketplace UI, and support benefit filtering, range search, and descending sort.

**Architecture:** Persist `potentialBenefit` on `SaleListing` via PostgreSQL trigger logic so Prisma can query it like a normal nullable integer. Extend the search pipeline from URL params through server filtering into UI controls and render a shared benefit badge across cards, compact rows, table rows, and listing detail surfaces.

**Tech Stack:** Next.js 16, React 19, Prisma + PostgreSQL, node:test with `tsx`, Playwright

---

### Task 1: Add DB-Managed Benefit Field

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_potential_benefit/migration.sql`
- Modify: `lib/types.ts`

- [ ] **Step 1: Add the failing domain expectation for benefit in the shared type surface**

Add the field and filter keys before implementation so downstream code stops compiling until all consumers are updated:

```ts
export type SaleSearchSortKey =
  | 'date'
  | 'price_asc'
  | 'price_desc'
  | 'mileage'
  | 'year_desc'
  | 'year_asc'
  | 'views'
  | 'benefit_desc';

export interface SaleSearchFilters {
  // ...
  hasBenefit?: boolean;
  benefitMin?: number;
  benefitMax?: number;
}

export interface SaleListing {
  // ...
  potentialBenefit?: number;
}
```

- [ ] **Step 2: Run typecheck to verify the new field breaks expected call sites**

Run: `cmd /c npm run typecheck`
Expected: FAIL with missing `benefit_desc`, `hasBenefit`, `benefitMin`, `benefitMax`, or `potentialBenefit` handling in search/UI files.

- [ ] **Step 3: Add the Prisma field and migration**

Update the model:

```prisma
model SaleListing {
  // ...
  priceInHand      Int?
  priceOnResources Int?
  potentialBenefit Int?
  // ...
}
```

Create migration SQL with:

```sql
ALTER TABLE "SaleListing"
ADD COLUMN "potentialBenefit" INTEGER;

CREATE OR REPLACE FUNCTION public.set_sale_listing_potential_benefit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."resourceStatus" = 'ON_RESOURCES'
     AND NEW."priceInHand" IS NOT NULL
     AND NEW."priceOnResources" IS NOT NULL
     AND NEW."priceOnResources" > NEW."priceInHand" THEN
    NEW."potentialBenefit" := NEW."priceOnResources" - NEW."priceInHand";
  ELSE
    NEW."potentialBenefit" := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sale_listing_set_potential_benefit ON "SaleListing";

CREATE TRIGGER sale_listing_set_potential_benefit
BEFORE INSERT OR UPDATE OF "priceInHand", "priceOnResources", "resourceStatus"
ON "SaleListing"
FOR EACH ROW
EXECUTE FUNCTION public.set_sale_listing_potential_benefit();

UPDATE "SaleListing"
SET "potentialBenefit" = CASE
  WHEN "resourceStatus" = 'ON_RESOURCES'::"ResourceStatus"
   AND "priceInHand" IS NOT NULL
   AND "priceOnResources" IS NOT NULL
   AND "priceOnResources" > "priceInHand"
  THEN "priceOnResources" - "priceInHand"
  ELSE NULL
END;

CREATE INDEX "SaleListing_potentialBenefit_idx"
ON "SaleListing" ("potentialBenefit");
```

- [ ] **Step 4: Regenerate Prisma client and verify schema consistency**

Run: `cmd /c npm run db:generate`
Expected: PASS with regenerated Prisma client and no schema errors.

- [ ] **Step 5: Run typecheck again**

Run: `cmd /c npm run typecheck`
Expected: FAIL only in search/UI paths that still need benefit support, not in Prisma/schema code.


### Task 2: Extend Search Params And Server Search

**Files:**
- Modify: `lib/sale-search.ts`
- Modify: `lib/server/marketplace.ts`
- Modify: `lib/types.ts`
- Test: `tests/potential-benefit-search.test.ts`

- [ ] **Step 1: Write failing search-param and fallback-search tests**

Create tests covering:

```ts
test('parseSaleSearchParams reads benefit filters and benefit sort', () => {
  const params = new URLSearchParams([
    ['hasBenefit', 'true'],
    ['benefitMin', '100000'],
    ['benefitMax', '300000'],
    ['sort', 'benefit_desc'],
  ]);

  const filters = parseSaleSearchParams(params);

  assert.equal(filters.hasBenefit, true);
  assert.equal(filters.benefitMin, 100000);
  assert.equal(filters.benefitMax, 300000);
  assert.equal(filters.sort, 'benefit_desc');
});

test('buildSaleSearchParams serializes benefit filters and benefit sort', () => {
  const query = buildSaleSearchParams({
    ...createDefaultSaleSearchFilters(),
    hasBenefit: true,
    benefitMin: 100000,
    benefitMax: 300000,
    sort: 'benefit_desc',
  }).toString();

  assert.match(query, /hasBenefit=true/);
  assert.match(query, /benefitMin=100000/);
  assert.match(query, /benefitMax=300000/);
  assert.match(query, /sort=benefit_desc/);
});

test('fixture fallback keeps only positive-benefit listings when sorting by benefit', async () => {
  const result = await searchPublishedSaleListings({
    ...createDefaultSaleSearchFilters(),
    sort: 'benefit_desc',
  });

  assert.ok(result.items.length > 0);
  assert.ok(result.items.every((item) => (item.potentialBenefit ?? 0) > 0));
  assert.deepEqual(
    [...result.items].map((item) => item.potentialBenefit),
    [...result.items].map((item) => item.potentialBenefit).sort((left, right) => (right ?? 0) - (left ?? 0))
  );
});
```

- [ ] **Step 2: Run the focused test file and confirm red**

Run: `node --import tsx --test tests/potential-benefit-search.test.ts`
Expected: FAIL due to missing sort option, missing filter fields, and missing benefit logic in search.

- [ ] **Step 3: Implement search-param support**

Update `lib/sale-search.ts` with:

```ts
export const SALE_SEARCH_SORT_OPTIONS = [
  { value: 'date', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
  { value: 'mileage', label: 'Меньше пробег' },
  { value: 'year_desc', label: 'По году: новее' },
  { value: 'year_asc', label: 'По году: старше' },
  { value: 'views', label: 'По просмотрам' },
  { value: 'benefit_desc', label: 'По выгоде' },
];

filters.hasBenefit = parseBooleanParam(source, 'hasBenefit');
filters.benefitMin = parseOptionalPositiveInt(source, 'benefitMin');
filters.benefitMax = parseOptionalPositiveInt(source, 'benefitMax');

if (filters.hasBenefit) params.set('hasBenefit', 'true');
if (filters.benefitMin) params.set('benefitMin', String(filters.benefitMin));
if (filters.benefitMax) params.set('benefitMax', String(filters.benefitMax));
```

- [ ] **Step 4: Implement PostgreSQL search and fallback search support**

Add mapping:

```ts
potentialBenefit: record.potentialBenefit ?? undefined,
```

Add search conditions:

```ts
const requiresBenefit = filters.hasBenefit || filters.benefitMin || filters.benefitMax || filters.sort === 'benefit_desc';

if (requiresBenefit) {
  andConditions.push({
    potentialBenefit: {
      not: null,
      gte: filters.benefitMin,
      lte: filters.benefitMax,
    },
  });
}
```

Add sorting:

```ts
case 'benefit_desc':
  return [{ potentialBenefit: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
```

Mirror the same `requiresBenefit` logic in fixture filtering/sorting.

- [ ] **Step 5: Re-run the focused tests**

Run: `node --import tsx --test tests/potential-benefit-search.test.ts`
Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `cmd /c npm run typecheck`
Expected: FAIL only in UI files that still need benefit wiring/rendering.


### Task 3: Add Benefit Controls To Marketplace UI

**Files:**
- Modify: `components/marketplace/advanced-filters.tsx`
- Modify: `components/marketplace/home-page-client.tsx`
- Modify: `components/marketplace/listings-table.tsx`
- Test: `tests/advanced-filters-header.test.tsx`
- Test: `tests/potential-benefit-search.test.ts`

- [ ] **Step 1: Extend failing UI tests for header pills and filter count**

Add assertions like:

```ts
test('advanced filters header includes benefit pill labels', () => {
  const filters = createDefaultSaleSearchFilters();
  filters.hasBenefit = true;
  filters.benefitMin = 100000;

  const pills = getAdvancedFilterHeaderPills(filters);

  assert.ok(pills.some((pill) => /Есть выгода/u.test(pill)));
  assert.ok(pills.some((pill) => /100(?:\s|\u00A0)000/u.test(pill)));
});
```

- [ ] **Step 2: Run the UI-focused tests and confirm red**

Run:

```bash
node --import tsx --test tests/advanced-filters-header.test.tsx
node --import tsx --test tests/potential-benefit-search.test.ts
```

Expected: FAIL because header pills, counts, and table UI do not yet include benefit.

- [ ] **Step 3: Add filter controls, summary state, and sort option wiring**

Update advanced filters with a new section:

```tsx
<SectionShell>
  <SectionTitle eyebrow="Выгода" title="Возможная выгода на ресурсах" icon={<TrendingUp className="h-4 w-4" />} />
  <div className="grid gap-4 sm:grid-cols-2">
    <CheckboxRow
      checked={Boolean(draft.hasBenefit || draft.benefitMin || draft.benefitMax)}
      label="Есть выгода"
      onChange={(checked) =>
        setDraft((current) => ({
          ...current,
          hasBenefit: checked || current.benefitMin || current.benefitMax ? true : undefined,
          benefitMin: checked ? current.benefitMin : undefined,
          benefitMax: checked ? current.benefitMax : undefined,
        }))
      }
    />
    <Field label="Диапазон выгоды">
      <div className="grid grid-cols-2 gap-3">
        <input className={textInputClassName()} inputMode="numeric" placeholder="100000" />
        <input className={textInputClassName()} inputMode="numeric" placeholder="300000" />
      </div>
    </Field>
  </div>
</SectionShell>
```

Update home-page summary and active filter count to include `hasBenefit`, `benefitMin`, and `benefitMax`.

- [ ] **Step 4: Add benefit column to table mode**

Insert a new table column definition and render compact badge content:

```tsx
{ key: 'benefit', label: 'Выгода', width: '104px' }
```

```tsx
<td className={`${CELL_CLASS} text-right`}>
  <Link href={`/listing/${listing.id}`} className={CELL_LINK}>
    {listing.potentialBenefit ? (
      <span className="inline-flex items-center rounded border border-emerald-300/24 bg-emerald-950/88 px-1.5 py-0.5 text-[10px] font-medium text-emerald-50">
        {formatPrice(listing.potentialBenefit)}
      </span>
    ) : (
      <span className="text-xs text-muted-foreground/50">—</span>
    )}
  </Link>
</td>
```

- [ ] **Step 5: Re-run the UI-focused tests**

Run:

```bash
node --import tsx --test tests/advanced-filters-header.test.tsx
node --import tsx --test tests/potential-benefit-search.test.ts
```

Expected: PASS


### Task 4: Render Benefit Badge In Cards And Listing Detail

**Files:**
- Create: `components/marketplace/listing-benefit-badge.tsx`
- Modify: `components/marketplace/listing-card-view.tsx`
- Modify: `components/marketplace/listing-compact-row.tsx`
- Modify: `components/listing/deal-block.tsx`
- Test: `tests/deal-block-seller-profile.test.tsx`
- Create: `tests/listing-benefit-badge.test.tsx`
- Test: `tests/qa/listing-detail.spec.ts`

- [ ] **Step 1: Add failing render tests for badge variants**

Create:

```ts
test('listing benefit badge renders full card/detail text for card variant', () => {
  const markup = renderToStaticMarkup(<ListingBenefitBadge amount={150000} variant="card" />);
  assert.match(markup, /Возможная выгода/);
  assert.match(markup, /150(?:\s|&nbsp;)000/u);
});

test('listing benefit badge renders compact text for compact variant', () => {
  const markup = renderToStaticMarkup(<ListingBenefitBadge amount={150000} variant="compact" />);
  assert.match(markup, /Выгода/);
  assert.doesNotMatch(markup, /Возможная выгода/);
});
```

Extend deal block render test with a listing that has `resourceStatus: 'on_resources'`, `priceInHand`, `priceOnResources`, and `potentialBenefit`.

- [ ] **Step 2: Run the render tests and confirm red**

Run:

```bash
node --import tsx --test tests/listing-benefit-badge.test.tsx
node --import tsx --test tests/deal-block-seller-profile.test.tsx
```

Expected: FAIL because shared badge component and detail rendering do not exist yet.

- [ ] **Step 3: Implement shared badge and wire all four surfaces**

Create:

```tsx
interface ListingBenefitBadgeProps {
  amount: number;
  variant: 'card' | 'compact' | 'table' | 'detail';
}

export function ListingBenefitBadge({ amount, variant }: ListingBenefitBadgeProps) {
  const label = variant === 'compact' ? 'Выгода' : variant === 'table' ? null : 'Возможная выгода';
  return (
    <span className={cn(/* variant classes */, variant !== 'table' && 'status-badge-pulse status-badge-pulse-success')}>
      {label ? `${label} ${formatPrice(amount)}` : formatPrice(amount)}
    </span>
  );
}
```

Use it in:

- `listing-card-view.tsx` under the price block
- `listing-compact-row.tsx` next to the compact price line
- `listings-table.tsx` for the new benefit cell
- `deal-block.tsx` inside the pricing surface on desktop and mobile

Render only when `listing.potentialBenefit` is truthy.

- [ ] **Step 4: Add QA coverage for listing detail**

Extend `tests/qa/listing-detail.spec.ts` with:

```ts
test('listing detail shows potential benefit badge when listing has positive on-resource spread', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/listing/2');
  await expect(page.locator('main')).toContainText(/Возможная выгода/i);

  await assertClean();
});
```

- [ ] **Step 5: Run render, QA, and final verification**

Run:

```bash
node --import tsx --test tests/listing-benefit-badge.test.tsx
node --import tsx --test tests/deal-block-seller-profile.test.tsx
node --import tsx --test tests/advanced-filters-header.test.tsx tests/potential-benefit-search.test.ts
cmd /c npm run typecheck
cmd /c npx playwright test tests/qa/listing-detail.spec.ts --project=chromium-desktop
```

Expected:

- all node tests PASS
- `typecheck` PASS
- Playwright listing-detail QA PASS

- [ ] **Step 6: Commit the implementation**

```bash
git add prisma/schema.prisma prisma/migrations docs/superpowers/specs/2026-04-18-potential-benefit-design.md docs/superpowers/plans/2026-04-18-potential-benefit-implementation.md lib/types.ts lib/sale-search.ts lib/server/marketplace.ts components/marketplace/advanced-filters.tsx components/marketplace/home-page-client.tsx components/marketplace/listing-benefit-badge.tsx components/marketplace/listing-card-view.tsx components/marketplace/listing-compact-row.tsx components/marketplace/listings-table.tsx components/listing/deal-block.tsx tests/potential-benefit-search.test.ts tests/listing-benefit-badge.test.tsx tests/advanced-filters-header.test.tsx tests/deal-block-seller-profile.test.tsx tests/qa/listing-detail.spec.ts
git commit -m "feat: add searchable potential benefit for sale listings"
```

## Self-Review

- Spec coverage: DB field, trigger, search params, server filtering/sorting, badge variants, advanced filters, summary state, and QA coverage are all mapped to tasks above.
- Placeholder scan: no TODO/TBD markers remain in this plan.
- Type consistency: the plan consistently uses `potentialBenefit`, `hasBenefit`, `benefitMin`, `benefitMax`, and `benefit_desc`.
