# Listing Success Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static listing success checkmark with the approved animated SVG treatment and launch teal-led confetti for all success scenarios, with softer celebration for drafts.

**Architecture:** Keep `app/listing/new/page.tsx` as the orchestration point, but extract two narrow pieces: a pure helper for success-celebration mode / confetti presets and a focused success-state component for the visual block. Integrate the new component into the existing success screen and trigger confetti only on fresh success transitions, while honoring reduced motion.

**Tech Stack:** Next.js App Router, React 19 client components, Tailwind utility classes, `canvas-confetti`, Node test runner with `tsx`, Playwright for visual verification.

---

### Task 1: Add Success Celebration Logic And Tests

**Files:**
- Create: `lib/listing-success-feedback.ts`
- Create: `tests/listing-success-feedback.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getListingSuccessCelebrationMode,
  getListingSuccessConfettiBursts,
} from '@/lib/listing-success-feedback';

test('draft status maps to the soft celebration mode', () => {
  assert.equal(getListingSuccessCelebrationMode('DRAFT'), 'soft');
});

test('non-draft success statuses map to the full celebration mode', () => {
  assert.equal(getListingSuccessCelebrationMode('PENDING'), 'full');
  assert.equal(getListingSuccessCelebrationMode('PUBLISHED'), 'full');
});

test('soft confetti preset stays quieter than the full preset', () => {
  const soft = getListingSuccessConfettiBursts('soft');
  const full = getListingSuccessConfettiBursts('full');

  assert.ok(soft.length > 0);
  assert.ok(full.length > 0);
  assert.ok(
    soft.reduce((sum, burst) => sum + burst.particleCount, 0) <
      full.reduce((sum, burst) => sum + burst.particleCount, 0)
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/listing-success-feedback.test.ts`
Expected: FAIL because `@/lib/listing-success-feedback` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { ListingStatusValue } from '@/lib/listing-status';

export type ListingSuccessCelebrationMode = 'soft' | 'full';

type ListingSuccessConfettiBurst = {
  particleCount: number;
  spread: number;
  startVelocity: number;
  scalar?: number;
  decay?: number;
  ticks?: number;
  origin: { x: number; y: number };
  angle?: number;
};

export function getListingSuccessCelebrationMode(
  status: ListingStatusValue | null
): ListingSuccessCelebrationMode {
  return status === 'DRAFT' ? 'soft' : 'full';
}

export function getListingSuccessConfettiBursts(
  mode: ListingSuccessCelebrationMode
): ListingSuccessConfettiBurst[] {
  if (mode === 'soft') {
    return [
      { particleCount: 36, spread: 64, startVelocity: 34, scalar: 0.92, origin: { x: 0.5, y: 0.68 } },
      { particleCount: 24, spread: 42, startVelocity: 26, scalar: 0.82, origin: { x: 0.24, y: 0.74 }, angle: 62 },
      { particleCount: 24, spread: 42, startVelocity: 26, scalar: 0.82, origin: { x: 0.76, y: 0.74 }, angle: 118 } },
    ];
  }

  return [
    { particleCount: 56, spread: 80, startVelocity: 55, scalar: 1.02, origin: { x: 0.5, y: 0.68 } },
    { particleCount: 36, spread: 60, startVelocity: 45, scalar: 0.96, origin: { x: 0.15, y: 0.75 }, angle: 60 },
    { particleCount: 36, spread: 60, startVelocity: 45, scalar: 0.96, origin: { x: 0.85, y: 0.75 }, angle: 120 },
    { particleCount: 32, spread: 120, startVelocity: 30, scalar: 0.9, decay: 0.92, origin: { x: 0.5, y: 0.65 } },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/listing-success-feedback.test.ts`
Expected: PASS with 3 passing tests.

### Task 2: Build The Success Animation UI And Render Test

**Files:**
- Create: `components/listing/success-check-animation.tsx`
- Create: `components/listing/listing-submission-success-state.tsx`
- Create: `tests/listing-submission-success-state.test.tsx`

- [ ] **Step 1: Write the failing render test**

```tsx
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { ListingSubmissionSuccessState } from '@/components/listing/listing-submission-success-state';

test('listing submission success state renders the animated success mark', () => {
  const markup = renderToStaticMarkup(
    <ListingSubmissionSuccessState
      title="Объявление отправлено на модерацию"
      description="После проверки оно появится в ленте."
      primaryHref="/listing/1"
      primaryLabel="Открыть запись"
      secondaryAction={<button type="button">Подать ещё</button>}
      reducedMotion={false}
    />
  );

  assert.match(markup, /data-success-check-animation=\"true\"/);
  assert.match(markup, /Объявление отправлено на модерацию/u);
  assert.doesNotMatch(markup, /bg-success\\/15/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/listing-submission-success-state.test.tsx`
Expected: FAIL because the new success-state component does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SuccessCheckAnimation } from '@/components/listing/success-check-animation';

type ListingSubmissionSuccessStateProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryAction: ReactNode;
  reducedMotion: boolean;
};

export function ListingSubmissionSuccessState(props: ListingSubmissionSuccessStateProps) {
  return (
    <>
      <SuccessCheckAnimation reducedMotion={props.reducedMotion} className="mx-auto mb-6" />
      <h1 className="mb-3 text-2xl font-bold text-foreground">{props.title}</h1>
      <p className="mb-8 text-muted-foreground">{props.description}</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={props.primaryHref}
          className="rounded-lg bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-teal-accent dark:text-[#09090B]"
        >
          {props.primaryLabel}
        </Link>
        {props.secondaryAction}
      </div>
    </>
  );
}
```

`SuccessCheckAnimation` should render:

```tsx
<div data-success-check-animation="true" className={cn('relative flex h-22 w-22 items-center justify-center text-teal-accent', className)}>
  <div className="pointer-events-none absolute inset-3 rounded-full bg-[radial-gradient(circle,rgba(129,216,208,0.18),transparent_68%)] blur-xl" />
  <svg viewBox="0 0 32 32" className="relative h-full w-full" aria-hidden="true">
    <circle className={reducedMotion ? '' : 'listing-success-circle'} cx="16" cy="16" r="12" />
    <path className={reducedMotion ? '' : 'listing-success-tick'} d="M11 16.5 14.5 20 21.5 12.5" />
  </svg>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/listing-submission-success-state.test.tsx`
Expected: PASS with the new success animation marker present in the rendered markup.

### Task 3: Integrate Confetti And Replace The Existing Success Block

**Files:**
- Modify: `app/listing/new/page.tsx`
- Modify: `app/globals.css`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write the integration-oriented failing test**

Extend the Task 1 test file to cover a null status fallback:

```ts
test('missing status still falls back to the full celebration mode', () => {
  assert.equal(getListingSuccessCelebrationMode(null), 'full');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/listing-success-feedback.test.ts`
Expected: FAIL until the helper explicitly handles `null`.

- [ ] **Step 3: Install the runtime dependency**

Run: `npm.cmd install canvas-confetti@1.9.4`
Expected: package files updated with `canvas-confetti`.

- [ ] **Step 4: Implement confetti launch and page integration**

In `app/listing/new/page.tsx`:

- replace `Check` import usage in the success state
- import `ListingSubmissionSuccessState`
- import `getListingSuccessCelebrationMode` and `launchListingSuccessConfetti`
- track `prefers-reduced-motion`
- launch confetti in an effect keyed to a fresh success transition
- render the new success-state component inside the existing success screen

In `app/globals.css`:

- add `@keyframes` and utility classes for the circle/tick draw animation
- add a reduced-motion media rule that disables those animations

In `lib/listing-success-feedback.ts`:

- add `launchListingSuccessConfetti(mode)` that loops through the burst presets and calls `canvas-confetti` with the teal / mint / ice palette

- [ ] **Step 5: Run focused verification**

Run:

`node --import tsx --test tests/listing-success-feedback.test.ts tests/listing-submission-success-state.test.tsx`

Expected: PASS

Run:

`npm.cmd run typecheck`

Expected: PASS

Run:

`npx.cmd eslint app/listing/new/page.tsx app/globals.css lib/listing-success-feedback.ts components/listing/success-check-animation.tsx components/listing/listing-submission-success-state.tsx tests/listing-success-feedback.test.ts tests/listing-submission-success-state.test.tsx`

Expected: PASS

Run visual verification with the local app and capture one screenshot or confirm via a manual browser pass that:

- the success block uses the animated mark
- the layout is unchanged apart from the top visual
- draft celebration looks quieter than the moderation success state
