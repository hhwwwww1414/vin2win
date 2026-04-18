# Seller Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an editable seller profile in account and ship a redesigned public seller page with cover image, circular avatar, description, and stable crop rendering.

**Architecture:** Extend `SellerProfile` with profile media and crop metadata, expose a dedicated authenticated update route, then bind the new contract to both the account editor and the public seller page. Reuse the current S3 upload path and seller page route instead of introducing a second profile/media subsystem.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, PostgreSQL, S3 uploads, Playwright, node:test server-render tests

---

## File Structure

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_seller_profile_redesign/migration.sql`
- Modify: `lib/types.ts`
- Modify: `lib/server/auth.ts`
- Modify: `lib/server/marketplace.ts`
- Create: `app/api/account/seller-profile/route.ts`
- Modify: `app/account/page.tsx`
- Create: `components/account/seller-profile-panel.tsx`
- Create: `components/account/seller-profile-editor.tsx`
- Create: `components/seller/seller-profile-hero.tsx`
- Modify: `app/seller/[id]/page.tsx`
- Create or modify tests around seller/account/profile rendering and route behavior

## Task 1: Extend Seller Profile Contract

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/types.ts`
- Test: `tests/seller-profile-contract.test.ts`

- [ ] Write the failing test for the expanded seller profile shape
- [ ] Run the focused test command and confirm the new fields are missing
- [ ] Add the new nullable Prisma columns and TypeScript fields
- [ ] Run the focused test again and confirm it passes

## Task 2: Map New Seller Profile Fields In Server Loaders

**Files:**
- Modify: `lib/server/marketplace.ts`
- Modify: `lib/server/auth.ts`
- Test: `tests/seller-profile-contract.test.ts`

- [ ] Write a failing test asserting seller profile mapping exposes `about`, media URLs, and crop metadata
- [ ] Run the focused test command and confirm mapping fails for the expected reason
- [ ] Implement minimal server-side mapping changes in marketplace/account loaders
- [ ] Run the focused test again and confirm it passes

## Task 3: Add Authenticated Seller Profile Update Flow

**Files:**
- Modify: `lib/server/auth.ts`
- Create: `app/api/account/seller-profile/route.ts`
- Test: `tests/seller-profile-route.test.ts`

- [ ] Write a failing route/server test for updating `name`, `phone`, `about`, and profile media metadata
- [ ] Run the focused test command and confirm the update flow does not exist yet
- [ ] Implement minimal update logic with `SellerProfile` + `User` synchronization
- [ ] Implement the authenticated `PUT /api/account/seller-profile` route with image-only validation
- [ ] Run the focused test again and confirm it passes

## Task 4: Add Profile Media Upload Support

**Files:**
- Modify: `app/api/account/seller-profile/route.ts`
- Modify: `lib/server/s3.ts` only if a tiny helper is required
- Test: `tests/seller-profile-route.test.ts`

- [ ] Write a failing test covering image validation and persisted avatar/cover metadata
- [ ] Run the focused test command and confirm validation/upload behavior is missing
- [ ] Implement multipart parsing, image-type checks, storage key generation, and safe replacement semantics
- [ ] Run the focused test again and confirm it passes

## Task 5: Build Account Seller Profile Editor

**Files:**
- Create: `components/account/seller-profile-panel.tsx`
- Create: `components/account/seller-profile-editor.tsx`
- Modify: `app/account/page.tsx`
- Test: `tests/account-seller-profile-panel.test.tsx`

- [ ] Write a failing render test for the account profile block and edit action
- [ ] Run the focused test command and confirm the new UI is absent
- [ ] Implement the account profile summary block with current avatar/cover preview
- [ ] Implement the editor dialog with fields for name, phone, about, avatar, and cover
- [ ] Add live avatar circle preview plus simple crop/zoom controls and cover positioning preview
- [ ] Run the focused test again and confirm it passes

## Task 6: Redesign Public Seller Hero

**Files:**
- Create: `components/seller/seller-profile-hero.tsx`
- Modify: `app/seller/[id]/page.tsx`
- Test: `tests/seller-profile-page.test.tsx`

- [ ] Write a failing render test for the new seller hero content and `О продавце` section
- [ ] Run the focused test command and confirm the current page does not satisfy it
- [ ] Implement the new hero component using the agreed `A` layout and the persisted crop metadata
- [ ] Add graceful fallbacks for missing avatar, cover, about, and phone
- [ ] Run the focused test again and confirm it passes

## Task 7: Update Browser Coverage

**Files:**
- Modify: `tests/qa/account-admin.spec.ts`
- Modify: `tests/qa/seller-wanted-detail.spec.ts`

- [ ] Extend QA coverage for the account seller profile entry point
- [ ] Extend QA coverage for the new public seller hero and `О продавце` section
- [ ] Run the relevant Playwright specs and confirm they pass

## Task 8: Full Verification

**Files:**
- None

- [ ] Run the focused node tests for seller profile contract, route, account UI, and seller page
- [ ] Run `npm run typecheck`
- [ ] Run the targeted Playwright specs for account and seller profile
- [ ] Visually inspect the updated account and seller profile UI in browser output and fix one glaring issue if found
