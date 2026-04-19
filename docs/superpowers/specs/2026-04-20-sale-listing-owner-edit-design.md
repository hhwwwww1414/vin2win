# Sale Listing Owner Edit Design

## Summary

Add owner-side editing for sale listings so the owner can reopen a full form, change any field, manage media, and save the listing back through moderation.

The design reuses the existing sale listing creation flow instead of introducing a second editor:

1. The account page gets a `Редактировать` action for each sale listing.
2. The existing `/listing/new` page gains an `edit` mode via `/listing/new?edit=<id>`.
3. Owners can edit all listing fields, including photos and video.
4. Any owner save can target either `DRAFT` or `PENDING`.
5. If a listing was previously `PUBLISHED`, saving changes removes it from the public marketplace and sends it back to moderation.

## Problem

The project already lets users create sale listings, duplicate them, and change some statuses from the account area, but it does not let the owner edit an existing listing in place.

Current gaps:

- no owner-facing `Редактировать` action in account
- no edit mode in the main sale form
- no owner update API for sale listings
- no owner flow for preserving, reordering, deleting, or replacing existing media
- published listings cannot be corrected without creating a separate duplicate

As a result, fixing a live listing is awkward and error-prone, and published content cannot follow a normal moderated edit workflow.

## Goals

- Let the owner open any of their sale listings in a full edit form
- Reuse the existing sale form instead of building a second editing UI
- Support editing of all sale listing fields
- Support full media editing:
  - keep existing photos
  - delete photos
  - reorder photos
  - add new photos
  - keep, remove, or replace video
- Keep `Сохранить как черновик`
- Keep `Сохранить изменения`
- Send edited listings back into moderation through predictable status transitions
- Preserve owner-only access rules

## Non-goals

- Editing wanted listings in this slice
- Introducing listing version tables or moderation revisions
- Building a separate standalone `/listing/[id]/edit` page
- Changing the moderator UI beyond what is required for the existing moderation flow to consume edited listings
- Adding brand-new media kinds or multi-video support

## Existing Context

The current codebase already has the core pieces needed for this feature:

- `/listing/new` already contains the full sale listing form
- `/listing/new?duplicate=<id>` already preloads a sale listing into that form
- `GET /api/account/listings/:id` already validates owner access and returns editable listing data
- `/account` already lists the owner’s sale listings
- `createSaleListing()` already contains the canonical sale listing persistence logic
- moderation/admin update flows already use the same `SaleListing.status`, `publishedAt`, `statusUpdatedAt`, and `moderationNote` fields

This feature should extend those existing patterns instead of creating a second sale listing authoring architecture.

## Final Product Decisions

### Entry point

Each sale listing card on `/account` gets a `Редактировать` action next to `Дублировать`.

The action points to:

- `/listing/new?edit=<listingId>`

### Form surface

The edit flow uses the same page and the same form as sale listing creation.

Edit mode changes:

- page title and submit copy reflect editing rather than creation
- the current listing status is shown
- existing moderation note is shown as context when present
- the bottom action area keeps two actions:
  - `Сохранить как черновик`
  - `Сохранить изменения`

### Status behavior

When the owner edits a listing:

- `Сохранить как черновик` always saves the listing as `DRAFT`
- `Сохранить изменения` always saves the listing as `PENDING`

This rule applies regardless of the previous status.

If the listing was `PUBLISHED`, either save action removes it from public visibility immediately because the listing no longer remains `PUBLISHED`.

### Published listing moderation rule

If a `PUBLISHED` listing is edited:

- it leaves public search immediately on save
- it is resubmitted through moderation
- `publishedAt` is cleared
- `statusUpdatedAt` is refreshed
- prior `moderationNote` is cleared because it belongs to an older reviewed version

## UX Design

### Account page

On `/account`, each owner sale listing card keeps the existing link to the listing and status actions, and also gets:

- `Редактировать`
- `Дублировать`

`Редактировать` should be more prominent than `Дублировать` because edit is the primary maintenance action.

### Listing form edit mode

The current sale form remains the single authoring surface.

In edit mode the page should show:

- heading like `Редактирование объявления`
- current listing status badge
- moderation note block when available
- fully prefilled fields
- existing gallery and video in the media step

Success states:

- after `Сохранить как черновик`: clear message that changes are saved as draft
- after `Сохранить изменения`: clear message that the listing has been sent to moderation

### Media UX

The media step must support mixed existing and new assets.

Required behaviors:

- existing gallery items render immediately from server data
- each existing item can be removed
- gallery items can be reordered together with newly added items
- new uploads preview locally before save
- existing video can be kept, deleted, or replaced

The first version should preserve the current form ergonomics and not force the owner through a separate “media manager” screen.

## Data Model

No schema migration is required for the core edit flow.

The existing `SaleListing` and `ListingMedia` models already support:

- mutable listing fields
- owned media rows
- gallery/video differentiation
- ordered media through `sortOrder`
- moderation status fields
- price history

## API Design

### Existing read endpoint

Extend:

- `GET /api/account/listings/:id`

So it returns enough data for edit mode, including:

- editable field payload already used for duplicate mode
- listing `status`
- `moderationNote`
- media descriptors for current assets:
  - `id`
  - `kind`
  - `publicUrl`
  - `originalName`
  - `sortOrder`

This endpoint already performs owner access checks and should remain the canonical loader for owner edit mode.

### New update endpoint

Add:

- `PATCH /api/account/listings/:id`

Request format:

- `multipart/form-data`
- `payload` JSON with listing fields and target save status
- uploaded files for new media
- `mediaPlan` JSON describing the final desired media state

The endpoint should:

- authenticate the current user
- verify owner access
- validate the form according to the requested target status
- update sale listing fields
- synchronize media to the desired final state
- update status fields
- write price history only when price changed
- return the listing id and new status

### Media plan contract

`mediaPlan` represents the final state of the listing after save.

It must allow the client to express:

- which existing media items remain
- which existing media items are removed
- final gallery ordering
- where new uploads should be inserted
- whether current video remains, is deleted, or is replaced

Server-side validation must ensure:

- every referenced existing media id belongs to the listing being edited
- only supported kinds are accepted
- ordering is deterministic and gap-free after persistence

## Server Persistence Design

### Listing update service

Add a dedicated owner update service in the marketplace server layer rather than putting all update logic directly in the route.

Recommended shape:

- `updateSaleListingByOwner(...)`

Responsibilities:

- load current listing with seller and media
- confirm owner access
- normalize incoming field values
- compute target status
- compute field-level changes
- update `User` and `SellerProfile` name/phone if the listing form is the source of truth, matching the existing create flow
- update listing row
- create `PriceHistory` row only when price changed
- clear stale moderation note on owner edit
- synchronize media rows and S3 objects

### Status write rules

On owner update:

- target `DRAFT` -> `status = DRAFT`
- target `PENDING` -> `status = PENDING`
- `statusUpdatedAt = now`
- `publishedAt = null` unless the target status is explicitly `PUBLISHED`, which owner edit never sets in this slice
- `moderationNote = null`

### Media synchronization

Media sync should be explicit and final-state based.

Algorithm:

1. Read current media rows for the listing.
2. Validate all referenced existing media ids from `mediaPlan`.
3. Upload new files to S3 first.
4. Build the final list of media rows with correct `kind` and `sortOrder`.
5. Insert new rows for uploaded files.
6. Update sort order of retained rows.
7. Delete rows removed by the plan.
8. Delete old S3 objects for removed rows after database changes succeed.

This is intentionally final-state driven, because diff-style “remove X, add Y, move Z” APIs are harder to reason about and easier to corrupt.

### Transaction and failure behavior

The update flow should avoid half-applied edits.

Rules:

- database row updates and media row updates should run in a transaction
- newly uploaded files that fail before persistence should be cleaned up
- files removed from the final state should not be deleted from S3 until the database state is durable

If the request fails, the listing should remain in its previous consistent state.

## Validation Rules

- owner only
- required fields match the current create flow
- `DRAFT` may remain incomplete where the existing create flow already allows draft saves
- `PENDING` requires the same completeness level as normal submission
- if target status is `PENDING`, at least one photo is required
- invalid city/region combinations are rejected exactly as in create flow
- invalid or foreign media ids are rejected

## Permissions

Owner access remains:

- `listing.createdByUserId === currentUser.id`
- or `listing.seller.userId === currentUser.id`

Non-owners receive:

- `401` if unauthenticated
- `403` if authenticated but not owner
- `404` if listing does not exist

Edit mode must never reveal a foreign listing’s form data.

## Testing

### Backend

Add tests for:

- owner can load editable listing data
- non-owner cannot load editable listing data
- owner can update a draft listing
- owner can update a published listing and it becomes `PENDING`
- owner can save edited listing as `DRAFT`
- `publishedAt` is cleared on owner edit save
- `moderationNote` is cleared on owner edit save
- price change creates `PriceHistory`
- unchanged price does not create `PriceHistory`
- media reorder works
- media removal works
- media replacement works
- invalid media ids are rejected

### Frontend

Add tests for:

- account page shows `Редактировать`
- `/listing/new?edit=<id>` loads prefilled values
- edit mode renders existing media
- owner can remove and reorder media in UI state
- submit buttons call update flow, not create flow
- success copy reflects `DRAFT` vs `PENDING`

## Manual smoke tests

1. Open a `DRAFT` listing from account and save it as draft again.
2. Open a `DRAFT` listing and send it to moderation.
3. Open a `PUBLISHED` listing, change text only, save changes, confirm it disappears from public listing page for ordinary viewers.
4. Open a `PUBLISHED` listing, replace photos, save changes, confirm it becomes `PENDING`.
5. Open a listing with moderation note, edit it, save, confirm stale moderation note is no longer displayed as active.
6. Attempt edit as a different user and confirm access is denied.

## Rollout Notes

- No migration is required.
- This feature extends existing account and sale form flows.
- The implementation should prefer adding an owner update service in `lib/server/marketplace.ts` over duplicating admin moderation update logic.
- The account page and sale form should continue to work for create and duplicate flows without behavior changes for users who are not editing an existing listing.
