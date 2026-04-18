# Seller Profile Redesign Design

## Summary

Add a seller-managed public profile that feels close to `auto.ru` while staying in the existing `vin2win` color system.

The feature has two surfaces:

1. `Личный кабинет` gets a new seller profile block with a `Редактировать профиль` action.
2. Public seller pages at `/seller/[id]` get a new hero layout with:
   - wide cover image
   - overlapping circular avatar
   - seller name
   - phone
   - trust/status pills
   - short description
   - tabs above the existing listing/review sections

All editable seller-facing profile fields live on `SellerProfile`.

## Problem

The current seller profile page already exposes listings and reviews, but it does not let sellers present themselves as a recognizable public entity.

Current gaps:

- no editable short bio/about text
- no editable avatar
- no editable cover image
- no seller-controlled display name / phone editing flow in account
- public seller hero is informative but not brand-forward

As a result, seller pages lack the trust and identity layer shown in the `auto.ru` reference.

## Goals

- Let sellers edit their public profile from their account
- Support:
  - display name editing
  - phone editing
  - short description editing
  - avatar upload
  - cover upload
- Redesign the public seller hero to match the agreed `A` layout direction
- Keep existing seller listings and reviews intact under the new hero
- Ensure avatar framing is stable between editor preview and public profile

## Non-goals

- Video support in seller profiles
- Complex image editing workflows
- Multiple gallery images for seller profile
- New review/reputation mechanics
- Reworking listing cards or deal blocks beyond what is needed to surface the new seller hero
- Splitting seller page into a brand-new route structure

## Final Product Decisions

### Layout direction

Use the agreed `A` direction:

- large top cover
- circular avatar overlapping the cover
- compact trust row with pills
- short seller description under the identity row
- tabs before the existing listing/review content

This should read as a clear `auto.ru` reference, not as a generic dashboard panel.

### Editable fields

The seller can edit all of these via `Редактировать профиль`:

- `name`
- `phone`
- `about`
- `avatar`
- `cover`

The public page reads these values directly from `SellerProfile`.

### Image rules

- Only images are allowed
- Video is not supported
- Product UX does not present a strict file-size limit to the user
- The backend may still enforce a technical safety limit for request stability

### Avatar framing rule

The seller must see what portion of the uploaded image lands inside the circular avatar.

To make this deterministic, profile storage must include avatar crop positioning metadata, not just the uploaded image URL.

### Empty-state rule

If profile media is missing:

- avatar falls back to a branded circular placeholder
- cover falls back to a branded hero gradient in `vin2win` colors

If `about` is missing:

- show a short neutral fallback description, not an empty gap

## Data Model

### SellerProfile fields

Extend `SellerProfile` with:

- `about String?`
- `avatarUrl String?`
- `avatarStorageKey String?`
- `coverUrl String?`
- `coverStorageKey String?`
- `avatarCropX Float?`
- `avatarCropY Float?`
- `avatarZoom Float?`
- `coverCropX Float?`
- `coverCropY Float?`

Rationale:

- all seller-facing public profile data stays on the existing seller entity
- one avatar and one cover do not justify a separate profile-media table in this slice
- storage keys allow safe cleanup of replaced assets
- crop coordinates preserve the exact framing selected in the editor

Crop fields are normalized values used by both editor preview and public rendering:

- `avatarCropX`, `avatarCropY` -> avatar focal offset
- `avatarZoom` -> avatar scale
- `coverCropX`, `coverCropY` -> cover focal offset

### User synchronization

When the seller saves profile changes:

- `SellerProfile.name` and `SellerProfile.phone` are updated
- `User.name` and `User.phone` are synchronized in the same flow

This avoids drift between account identity and public seller profile identity.

## Public Page Design

### Hero composition

The new `/seller/[id]` top section should contain:

- wide cover image with graceful fallback
- circular avatar overlapping the cover
- seller name as the primary headline
- pill row for:
  - verification
  - city / geography summary if available
  - years on platform
  - review/rating summary where already supported
- short seller description
- anchor-style tabs above content sections

The current listings and reviews remain below this hero.

### Tabs

Tabs are navigational anchors, not a new client-side state machine.

Initial tab set:

- `Объявления`
- `Отзывы`
- `О продавце`

Implementation can use anchor links to sections already on the page or lightly adjusted sections.

`О продавце` must resolve to a real section on the public page that summarizes:

- seller description
- public phone, if present
- platform tenure / verification / lightweight profile signals

### Existing content reuse

Keep these parts structurally intact:

- listing feed
- reviews section
- reputation/sidebar content, if retained

The redesign should focus on the hero and seller identity layer, not rewrite the whole seller page.

## Account Editing Experience

### Entry point

On `/account`, add a more prominent `Профиль продавца` block with:

- seller profile summary
- current avatar preview
- current cover preview or branded fallback
- `Редактировать профиль` button

### Editor surface

Use a focused editor UI from account for this first version.

Required fields:

- `Имя`
- `Телефон`
- `Кратко о себе`
- `Аватар`
- `Обложка`

### Avatar UX

The editor must show:

- uploaded source image preview
- circular live preview
- simple repositioning controls so the seller can decide what lands inside the circle

The first version does not need a full-featured image editor. It only needs enough control to choose the visible avatar area reliably.

### Cover UX

The editor must show:

- wide preview for the cover area
- simple repositioning within the cover frame

This keeps the public hero predictable after save.

## Media Handling

### Upload path

Reuse the existing S3 upload pipeline patterns already used for listing media.

New profile media uploads should:

- accept image files only
- upload to S3
- store both public URL and storage key on `SellerProfile`

Recommended path pattern:

- `uploads/seller-profiles/<sellerId>/avatar/...`
- `uploads/seller-profiles/<sellerId>/cover/...`

### Replacement semantics

When avatar or cover is replaced:

1. upload and persist the new asset first
2. update profile rows and crop metadata
3. only then delete the old S3 object by previous storage key

This prevents broken profiles if cleanup runs before the new asset is durable.

## API Design

### New account route

Add a dedicated authenticated route for seller profile updates, for example:

- `PUT /api/account/seller-profile`

The route should:

- read the current session user
- resolve their `SellerProfile`
- accept `multipart/form-data`
- validate image types and scalar fields
- persist crop metadata with media URLs

For the first slice, a separate `GET` route is not required. The editor can be hydrated from the server-rendered account payload and save through `PUT`.

### Response shape

The response should return the normalized saved profile state used by both:

- account summary block
- public seller page refresh path

## Error Handling

### Form validation

Validation rules:

- non-image files are rejected
- empty name is rejected
- phone is optional
- `about` remains optional but should be trimmed and normalized

If phone is omitted, the public seller page hides phone pills and call actions rather than showing an error state.

### Save failure behavior

If save fails:

- form values stay in place
- uploaded-but-unsaved UI state is not silently lost where avoidable
- user gets a clear inline error

### Missing data behavior

The public page must not break if one or more of these are absent:

- `about`
- `avatarUrl`
- `coverUrl`
- `phone`

Each missing field gets a graceful fallback.

## Architecture

### Database layer

Add nullable seller profile columns via Prisma migration.

No separate profile-media table is introduced in this slice.

### Server layer

Update seller profile mappers and account overview loaders so the same profile data powers:

- account seller profile summary
- public seller page

### UI layer

Expected change areas:

- `app/account/page.tsx`
- `app/seller/[id]/page.tsx`
- new account profile editor component(s)
- new account profile API route(s)

## Files Expected To Change

### Database / schema

- `prisma/schema.prisma`
- new Prisma migration SQL

### Server / mapping

- `lib/server/auth.ts`
- `lib/server/marketplace.ts`
- `lib/server/s3.ts` if small helpers are needed

### Account UI / API

- `app/account/page.tsx`
- `app/api/account/seller-profile/route.ts`
- new `components/account/*seller-profile*` editor components

### Public seller page

- `app/seller/[id]/page.tsx`

## Testing Strategy

### Unit tests

- seller profile mapping includes new public fields
- crop metadata is preserved in normalized profile payloads
- fallback values are applied correctly for missing avatar/cover/about

### Integration tests

- authenticated seller can update name, phone, about
- authenticated seller can upload avatar and cover
- updating profile synchronizes `User.name` / `User.phone`
- replacing avatar/cover updates URLs and storage keys safely

### QA / browser tests

- account page shows the seller profile entry point
- editor opens and saves successfully
- avatar preview reflects the selected circular framing
- public `/seller/[id]` shows the saved cover, avatar, name, phone, and about text
- public page remains visually correct when avatar or cover is missing

## Risks And Mitigations

### Risk: avatar preview does not match public rendering

Mitigation:

- persist crop coordinates and zoom
- use the same rendering assumptions in editor preview and public avatar

### Risk: account and seller profile names diverge

Mitigation:

- update `User` and `SellerProfile` in one save flow

### Risk: broken profile after media replacement

Mitigation:

- write new media first
- delete old media after successful profile update

### Risk: overbuilding the editor

Mitigation:

- first version only supports simple repositioning for avatar and cover
- no multi-image media manager
- no video

## Rollout

Ship in one implementation slice:

1. schema + migration
2. authenticated seller profile API
3. account profile editor
4. public seller hero redesign
5. regression and browser coverage

This work remains small enough for a single implementation plan and should not be decomposed further at the planning stage.
