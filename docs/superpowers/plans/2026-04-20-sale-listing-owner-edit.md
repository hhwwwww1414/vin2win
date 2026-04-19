# Sale Listing Owner Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner of a sale listing edit the full listing, including media, through the existing `/listing/new` form and resubmit it as `DRAFT` or `PENDING`.

**Architecture:** Reuse the existing sale listing authoring flow by adding an owner-edit mode to `/listing/new`, extending the account listing loader with media and status data, and introducing a dedicated owner update service in `lib/server/marketplace.ts`. The update API accepts `multipart/form-data` plus a final-state `mediaPlan`, synchronizes `ListingMedia` and S3 objects, and resets moderated listings back into the moderation pipeline.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, PostgreSQL, S3 uploads, Node test runner, React 19.

---

### Task 1: Lock Down Server Contract With Failing Tests

**Files:**
- Create: `tests/sale-listing-owner-edit.integration.test.ts`
- Modify: `tests/sale-form.test.ts`
- Reference: `lib/server/marketplace.ts`
- Reference: `app/api/account/listings/[id]/route.ts`

- [ ] **Step 1: Write the failing integration tests for owner edit behavior**

```ts
test('owner edit loader returns status moderation note and media for editable sale listing', async (t) => {
  const payload = await getEditableSaleListingForOwner({ listingId, currentUserId: owner.id });

  assert.equal(payload.status, 'PUBLISHED');
  assert.equal(payload.moderationNote, 'Need clearer photos');
  assert.equal(payload.media.length, 2);
  assert.equal(payload.media[0]?.kind, 'GALLERY');
});

test('owner update moves published listing back to pending and clears moderation note', async (t) => {
  const updated = await updateSaleListingByOwner({
    listingId,
    currentUserId: owner.id,
    targetStatus: 'PENDING',
    values: { description: 'Updated description', price: 2200000 },
    mediaPlan: { gallery: [], video: null },
    uploads: [],
  });

  assert.equal(updated.status, 'PENDING');
  assert.equal(updated.moderationNote, null);
  assert.equal(updated.publishedAt, null);
});

test('owner update writes price history only when price changed', async (t) => {
  await updateSaleListingByOwner({
    listingId,
    currentUserId: owner.id,
    targetStatus: 'DRAFT',
    values: { description: 'Only text changed', price: 2100000 },
    mediaPlan,
    uploads: [],
  });

  const history = await prisma.priceHistory.findMany({ where: { saleListingId: listingId } });
  assert.equal(history.length, 1);
});
```

- [ ] **Step 2: Write the failing unit tests for edit payload helpers**

```ts
test('build sale submission payload keeps edit mode target status', () => {
  const payload = buildSaleSubmissionPayload(
    { ...saleDefaults, make: 'BMW', model: 'X5', year: '2022', city: 'Москва', region: 'Московская область', price: '5000000', bodyType: 'SUV', engine: 'Бензин', transmission: 'АКПП', drive: 'Полный', sellerName: 'Иван', contact: '+7 999 000-00-00', description: 'Text' },
    'PENDING',
  );

  assert.equal(payload.initialStatus, 'PENDING');
});

test('merge editable listing fills form with status-aware owner data', () => {
  const merged = mergeSaleFormWithEditableListing(saleDefaults, {
    status: 'PUBLISHED',
    moderationNote: 'Old note',
    media: [{ id: 'media-1', kind: 'GALLERY', publicUrl: '/one.jpg', sortOrder: 0 }],
    make: 'Audi',
    model: 'A6',
  });

  assert.equal(merged.make, 'Audi');
  assert.equal(merged.model, 'A6');
});
```

- [ ] **Step 3: Run the targeted tests to verify they fail for the right reason**

Run:

```bash
node --import tsx --test tests/sale-listing-owner-edit.integration.test.ts tests/sale-form.test.ts
```

Expected:
- FAIL because `getEditableSaleListingForOwner` / `updateSaleListingByOwner` do not exist yet
- FAIL because editable payload shape does not yet include `status`, `moderationNote`, or `media`

- [ ] **Step 4: Commit the red test baseline**

```bash
git add tests/sale-listing-owner-edit.integration.test.ts tests/sale-form.test.ts
git commit -m "test: add owner sale listing edit coverage"
```

### Task 2: Implement Owner Update Service and API

**Files:**
- Modify: `lib/server/marketplace.ts`
- Modify: `app/api/account/listings/[id]/route.ts`
- Modify: `lib/sale-form.ts`
- Reference: `app/api/listings/route.ts`
- Reference: `lib/server/s3.ts`

- [ ] **Step 1: Extend editable payload types with status and media**

```ts
export type EditableSaleListingMediaPayload = {
  id: string;
  kind: 'GALLERY' | 'VIDEO';
  publicUrl: string;
  originalName?: string;
  sortOrder: number;
};

export type EditableSaleListingPayload = {
  status?: ListingStatusValue;
  moderationNote?: string | null;
  media?: EditableSaleListingMediaPayload[];
  // existing fields...
};
```

- [ ] **Step 2: Extend the existing owner loader to return status, moderation note, and media**

```ts
return NextResponse.json({
  status: listing.status,
  moderationNote: listing.moderationNote,
  media: listing.media
    .filter((item) => item.kind === 'GALLERY' || item.kind === 'VIDEO')
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      publicUrl: item.publicUrl,
      originalName: item.originalName ?? '',
      sortOrder: item.sortOrder,
    })),
  // existing editable fields...
});
```

- [ ] **Step 3: Add the failing service API surface in `lib/server/marketplace.ts`**

```ts
export async function getEditableSaleListingForOwner(input: {
  listingId: string;
  currentUserId: string;
}) {
  // implemented in next step
}

export async function updateSaleListingByOwner(input: {
  listingId: string;
  currentUserId: string;
  targetStatus: ListingStatusValue;
  values: OwnerSaleListingUpdateInput;
  mediaPlan: OwnerSaleListingMediaPlan;
  uploads: OwnerSaleListingUpload[];
}) {
  // implemented in next step
}
```

- [ ] **Step 4: Implement minimal owner access and listing update logic**

```ts
if (!isOwner) {
  throw new Error('Access denied.');
}

const nextStatus = input.targetStatus === 'DRAFT' ? ListingStatus.DRAFT : ListingStatus.PENDING;

const data: Prisma.SaleListingUpdateInput = {
  make: input.values.make,
  model: input.values.model,
  year: input.values.year,
  price: input.values.price,
  city: input.values.city,
  description: input.values.description,
  status: nextStatus,
  moderationNote: null,
  publishedAt: null,
  statusUpdatedAt: new Date(),
};
```

- [ ] **Step 5: Implement media final-state synchronization**

```ts
const retainedIds = new Set(input.mediaPlan.gallery.filter((item) => item.kind === 'existing').map((item) => item.id));
const removedMedia = current.media.filter((item) => item.kind === 'GALLERY' && !retainedIds.has(item.id));

await prisma.$transaction(async (tx) => {
  await tx.saleListing.update({ where: { id: current.id }, data });
  await tx.listingMedia.deleteMany({ where: { id: { in: removedMedia.map((item) => item.id) } } });
  await tx.listingMedia.createMany({ data: createdMediaRows });
});
```

- [ ] **Step 6: Add the owner edit route using `multipart/form-data`**

```ts
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const formData = await request.formData();
  const payload = JSON.parse(String(formData.get('payload') ?? '{}'));
  const mediaPlan = JSON.parse(String(formData.get('mediaPlan') ?? '{}'));

  const updated = await updateSaleListingByOwner({
    listingId: (await params).id,
    currentUserId: currentUser.id,
    targetStatus: payload.initialStatus,
    values: normalizeOwnerListingPayload(payload),
    mediaPlan,
    uploads: extractUploadedMedia(formData),
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
```

- [ ] **Step 7: Run the owner edit server tests and make them pass**

Run:

```bash
node --import tsx --test tests/sale-listing-owner-edit.integration.test.ts tests/sale-form.test.ts
```

Expected:
- PASS for owner edit loading, status transitions, and price history rules

- [ ] **Step 8: Commit the server implementation**

```bash
git add lib/server/marketplace.ts app/api/account/listings/[id]/route.ts lib/sale-form.ts tests/sale-listing-owner-edit.integration.test.ts tests/sale-form.test.ts
git commit -m "feat: add owner sale listing update flow"
```

### Task 3: Add Edit Mode to the Sale Listing Form

**Files:**
- Modify: `app/listing/new/page.tsx`
- Modify: `app/account/page.tsx`
- Modify: `tests/chat-shell.test.tsx` (only if shared render helpers collide)
- Create: `tests/sale-listing-edit-page.test.tsx`
- Reference: `tests/qa/listing-new-helpers.ts`

- [ ] **Step 1: Write the failing UI test for edit-mode rendering**

```tsx
test('sale listing page enters edit mode and renders edit actions', () => {
  const markup = renderToStaticMarkup(<ListingNewPage searchParams={Promise.resolve({ edit: 'listing-1' })} />);

  assert.match(markup, /Редактирование объявления/);
  assert.match(markup, /Сохранить как черновик/);
  assert.match(markup, /Сохранить изменения/);
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run:

```bash
node --import tsx --test tests/sale-listing-edit-page.test.tsx
```

Expected:
- FAIL because edit-specific copy and mode handling are missing

- [ ] **Step 3: Add edit-mode state and loader plumbing to `/listing/new`**

```ts
const duplicateId = searchParams.get('duplicate');
const editId = searchParams.get('edit');
const isEditMode = Boolean(editId);

const [editStatus, setEditStatus] = useState<ListingStatusValue | null>(null);
const [editModerationNote, setEditModerationNote] = useState<string | null>(null);
const [existingMedia, setExistingMedia] = useState<EditableSaleListingMediaPayload[]>([]);
```

- [ ] **Step 4: Reuse the account loader for edit prefill**

```ts
const editableId = editId ?? duplicateId;
const response = await fetch(`/api/account/listings/${editableId}`);
const data = (await response.json()) as EditableSaleListingPayload;

setSale((current) => mergeSaleFormWithEditableListing(current, data));
setEditStatus(data.status ?? null);
setEditModerationNote(data.moderationNote ?? null);
setExistingMedia(data.media ?? []);
```

- [ ] **Step 5: Switch submit behavior between create and edit**

```ts
const endpoint = isEditMode ? `/api/account/listings/${editId}` : '/api/listings';
const method = isEditMode ? 'PATCH' : 'POST';

const body = new FormData();
body.append('payload', JSON.stringify(buildSaleSubmissionPayload(sale, mode)));
body.append('mediaPlan', JSON.stringify(buildMediaPlan(existingMedia, photos, videoFile)));
```

- [ ] **Step 6: Add account-page `Редактировать` action**

```tsx
<Link
  href={`/listing/new?edit=${listing.id}`}
  className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-teal-accent"
>
  Редактировать
</Link>
```

- [ ] **Step 7: Make the UI tests pass**

Run:

```bash
node --import tsx --test tests/sale-listing-edit-page.test.tsx tests/sale-form.test.ts
```

Expected:
- PASS for edit-mode render and helper expectations

- [ ] **Step 8: Commit the form-mode implementation**

```bash
git add app/listing/new/page.tsx app/account/page.tsx tests/sale-listing-edit-page.test.tsx
git commit -m "feat: add sale listing edit mode to form"
```

### Task 4: Verify Media UX and Access Control End-to-End

**Files:**
- Create: `tests/qa/sale-listing-owner-edit.spec.ts`
- Modify: `tests/qa/listing-new-helpers.ts`
- Modify: `tests/sale-listing-owner-edit.integration.test.ts`

- [ ] **Step 1: Add a manual-browser-style smoke spec for the owner flow**

```ts
test('owner edits published sale listing and it returns to moderation', async ({ page }) => {
  await loginAsSeedUser(page, 'owner');
  await page.goto('/account');
  await page.getByRole('link', { name: /Редактировать/i }).first().click();
  await page.getByLabel(/Описание/i).fill('Обновленное описание');
  await page.getByRole('button', { name: /Сохранить изменения/i }).click();
  await expect(page.getByText(/отправлено на модерацию/i)).toBeVisible();
});
```

- [ ] **Step 2: Run focused verification**

Run:

```bash
node --import tsx --test tests/sale-listing-owner-edit.integration.test.ts tests/sale-form.test.ts tests/sale-listing-edit-page.test.tsx
npm run typecheck
```

Expected:
- PASS

- [ ] **Step 3: Run optional browser smoke when local seeded auth is available**

Run:

```bash
npx playwright test tests/qa/sale-listing-owner-edit.spec.ts
```

Expected:
- PASS in a seeded local environment

- [ ] **Step 4: Commit verification coverage**

```bash
git add tests/qa/sale-listing-owner-edit.spec.ts tests/qa/listing-new-helpers.ts tests/sale-listing-owner-edit.integration.test.ts
git commit -m "test: cover owner sale listing edit flow"
```

### Task 5: Final Build Verification and Delivery Notes

**Files:**
- Modify: `docs/superpowers/plans/2026-04-20-sale-listing-owner-edit.md`

- [ ] **Step 1: Run final verification suite**

Run:

```bash
node --import tsx --test tests/sale-listing-owner-edit.integration.test.ts tests/sale-form.test.ts tests/sale-listing-edit-page.test.tsx
npm run typecheck
npm run build
```

Expected:
- all targeted tests PASS
- typecheck PASS
- build PASS

- [ ] **Step 2: Update the plan checkboxes and note any deviations**

```md
- [x] Implemented owner update endpoint at `app/api/account/listings/[id]/route.ts`
- [x] Added edit-mode form flow in `app/listing/new/page.tsx`
- [x] Added server coverage in `tests/sale-listing-owner-edit.integration.test.ts`
```

- [ ] **Step 3: Commit final verification-only changes if needed**

```bash
git add docs/superpowers/plans/2026-04-20-sale-listing-owner-edit.md
git commit -m "docs: record owner sale listing edit execution"
```
