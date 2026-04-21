# Header Favorites Heart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the header favorites heart stay default at zero items, fill with tiffany when favorites exist, and turn red on `/account#favorites`.

**Architecture:** Keep the UI change scoped to the marketplace header, but extract the heart-state logic into a tiny focused helper/component so the state mapping is testable without rendering the whole header. The header will keep owning session count updates and route/hash tracking, then pass the derived visual state into the shared heart icon for both desktop and mobile variants.

**Tech Stack:** Next.js App Router client components, React 19, `lucide-react`, Node test runner with `tsx`, ESLint, TypeScript.

---

### Task 1: Add A Testable Header Favorites Heart State Helper

**Files:**
- Create: `components/marketplace/header-favorites-heart.tsx`
- Create: `tests/header-favorites-heart.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  HeaderFavoritesHeartIcon,
  getHeaderFavoritesHeartState,
} from '@/components/marketplace/header-favorites-heart';

test('zero favorites keep the default heart state', () => {
  assert.equal(
    getHeaderFavoritesHeartState({ favoriteCount: 0, pathname: '/sale', hash: '' }),
    'default'
  );
});

test('non-zero favorites use the filled tiffany state', () => {
  assert.equal(
    getHeaderFavoritesHeartState({ favoriteCount: 3, pathname: '/sale', hash: '' }),
    'filled'
  );
});

test('account favorites route overrides count and forces the active red state', () => {
  assert.equal(
    getHeaderFavoritesHeartState({ favoriteCount: 0, pathname: '/account', hash: '#favorites' }),
    'active'
  );
});

test('heart icon render maps filled and active states to the expected classes', () => {
  const filled = renderToStaticMarkup(
    <HeaderFavoritesHeartIcon state="filled" className="mr-1.5 h-3.5 w-3.5" />
  );
  const active = renderToStaticMarkup(
    <HeaderFavoritesHeartIcon state="active" className="mr-1.5 h-3.5 w-3.5" />
  );
  const base = renderToStaticMarkup(
    <HeaderFavoritesHeartIcon state="default" className="mr-1.5 h-3.5 w-3.5" />
  );

  assert.match(filled, /fill-current/);
  assert.match(filled, /text-teal-accent/);
  assert.match(active, /fill-current/);
  assert.match(active, /text-red-500/);
  assert.doesNotMatch(base, /fill-current/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/header-favorites-heart.test.tsx`

Expected: FAIL with `Cannot find module '@/components/marketplace/header-favorites-heart'`.

- [ ] **Step 3: Write the minimal implementation**

```tsx
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HeaderFavoritesHeartState = 'default' | 'filled' | 'active';

export function getHeaderFavoritesHeartState(input: {
  favoriteCount: number;
  pathname: string | null;
  hash: string;
}): HeaderFavoritesHeartState {
  if (input.pathname === '/account' && input.hash === '#favorites') {
    return 'active';
  }

  if (input.favoriteCount > 0) {
    return 'filled';
  }

  return 'default';
}

export function HeaderFavoritesHeartIcon({
  state,
  className,
}: {
  state: HeaderFavoritesHeartState;
  className?: string;
}) {
  return (
    <Heart
      data-favorites-heart-state={state}
      className={cn(
        className,
        state === 'default' && 'text-muted-foreground',
        state === 'filled' && 'fill-current text-teal-accent',
        state === 'active' && 'fill-current text-red-500'
      )}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/header-favorites-heart.test.tsx`

Expected: PASS with 4 passing tests.

### Task 2: Integrate The Heart State Into The Header

**Files:**
- Modify: `components/marketplace/header.tsx`
- Verify: `tests/header-favorites-heart.test.tsx`

- [ ] **Step 1: Update the header to track hash and derive the heart state**

In `components/marketplace/header.tsx`:

- import `useMemo`
- import `HeaderFavoritesHeartIcon` and `getHeaderFavoritesHeartState`
- add `const [currentHash, setCurrentHash] = useState('');`
- sync `currentHash` from `window.location.hash` on mount and on `hashchange`
- refresh `currentHash` when `pathname` changes
- compute `favoritesHeartState` from:

```tsx
const favoritesHeartState = useMemo(
  () =>
    getHeaderFavoritesHeartState({
      favoriteCount,
      pathname,
      hash: currentHash,
    }),
  [currentHash, favoriteCount, pathname]
);
```

- [ ] **Step 2: Replace the desktop heart icon**

Replace:

```tsx
<Heart className="mr-1.5 h-3.5 w-3.5" />
```

with:

```tsx
<HeaderFavoritesHeartIcon
  state={favoritesHeartState}
  className="mr-1.5 h-3.5 w-3.5"
/>
```

- [ ] **Step 3: Replace the mobile heart icon**

Replace:

```tsx
<Heart className="mr-2 h-4 w-4 text-teal-accent" />
```

with:

```tsx
<HeaderFavoritesHeartIcon
  state={favoritesHeartState}
  className="mr-2 h-4 w-4"
/>
```

- [ ] **Step 4: Run focused verification**

Run:

`node --import tsx --test tests/header-favorites-heart.test.tsx`

Expected: PASS

Run:

`npm.cmd run typecheck`

Expected: PASS

Run:

`npx.cmd eslint components/marketplace/header.tsx components/marketplace/header-favorites-heart.tsx tests/header-favorites-heart.test.tsx`

Expected: PASS

## Self-Review

Spec coverage:
- zero favorites default state: Task 1 test + Task 2 integration
- non-zero favorites tiffany fill: Task 1 test + Task 2 integration
- `/account#favorites` red active override: Task 1 test + Task 2 hash-aware integration
- desktop and mobile parity: Task 2 steps 2 and 3

Placeholder scan:
- no `TODO`, `TBD`, or implicit “test later” steps remain

Type consistency:
- one shared `HeaderFavoritesHeartState` type is used for helper and icon rendering
