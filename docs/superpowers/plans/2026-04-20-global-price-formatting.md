# Global Price Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all prices and budgets display with grouped thousands and make all price inputs show the same grouping while users type and edit values.

**Architecture:** Add one shared formatting utility for grouped numbers and ruble values, then route existing render paths through it. Introduce one shared formatted-input behavior for price and budget fields so forms keep digit-only state while showing grouped display text.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Node test runner, existing app UI components.

---

### Task 1: Lock Down Shared Formatting With Failing Tests

**Files:**
- Create: `tests/price-formatting.test.ts`
- Reference: `lib/marketplace-data.ts`
- Reference: `app/listing/new/page.tsx`

- [ ] **Step 1: Write failing tests for grouped number formatting and input normalization**
- [ ] **Step 2: Run `node --import tsx --test tests/price-formatting.test.ts` and confirm the helpers do not exist yet**
- [ ] **Step 3: Implement the minimal shared helper API**
- [ ] **Step 4: Re-run the same test and confirm it passes**

### Task 2: Add Reusable Formatted Price Input

**Files:**
- Create: `components/ui/formatted-number-input.tsx`
- Modify: `tests/price-formatting.test.ts`

- [ ] **Step 1: Extend the failing test suite with a formatted-input behavior test**
- [ ] **Step 2: Run the test to confirm the component is missing**
- [ ] **Step 3: Implement the minimal input wrapper with digit stripping and grouped display**
- [ ] **Step 4: Re-run the test and confirm it passes**

### Task 3: Migrate Rendering Paths To Shared Price Formatting

**Files:**
- Modify: `lib/marketplace-data.ts`
- Modify: `app/account/page.tsx`
- Modify: `app/listing/[id]/page.tsx`
- Modify: `components/messages/chat-shell.tsx`
- Modify: `components/listing/price-history-chart.tsx`
- Modify: `components/admin/sale-listing-admin-board.tsx`
- Modify: `components/admin/wanted-listing-admin-board.tsx`
- Modify: `lib/sale-search.ts`
- Modify: any additional files found with inline ruble formatting

- [ ] **Step 1: Replace direct price/budget `toLocaleString('ru-RU')` output with the shared helpers**
- [ ] **Step 2: Run targeted tests for affected screens**
- [ ] **Step 3: Fix any remaining local formatters that bypass the shared helper**

### Task 4: Migrate Price Inputs To Shared Formatted Input

**Files:**
- Modify: `app/listing/new/page.tsx`
- Modify: `components/admin/sale-listing-admin-board.tsx`
- Modify: `components/admin/wanted-listing-admin-board.tsx`
- Modify: any additional admin or filter price inputs found during implementation

- [ ] **Step 1: Replace raw price/budget text/number inputs with the formatted input wrapper**
- [ ] **Step 2: Keep form state digit-only and submission parsing unchanged where possible**
- [ ] **Step 3: Add or adjust tests for create/edit/admin form behavior**

### Task 5: Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-04-20-global-price-formatting.md`

- [ ] **Step 1: Run `node --import tsx --test tests/price-formatting.test.ts`**
- [ ] **Step 2: Run any additional targeted test files covering affected screens**
- [ ] **Step 3: Run `npm run typecheck`**
- [ ] **Step 4: Mark completed checkboxes in this plan if desired**
