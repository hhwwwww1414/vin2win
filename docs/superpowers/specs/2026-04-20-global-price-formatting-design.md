# Global Price Formatting Design

## Summary

Unify all price and budget formatting across the project so the UI always shows grouped thousands with spaces, for example `11500000 -> 11 500 000`, and all price inputs show the same grouping while the user types and edits values.

The design introduces one shared formatting layer for display plus one shared formatted-input behavior for forms. Stored and submitted values remain digit-only integers.

## Problem

The project currently formats prices in several inconsistent ways:

- shared `formatPrice(...)` in marketplace screens
- ad-hoc `toLocaleString('ru-RU')` calls in account, listing, admin, chat, filters, and charts
- raw numeric inputs in create/edit flows that show ungrouped values while typing

This leads to inconsistent output and forces users to read and edit long sums without thousand separators.

## Goals

- Render all prices and budgets with grouped thousands everywhere in the UI
- Show grouped thousands directly inside input fields during typing, paste, and edit flows
- Keep submission payloads integer-only with digits only
- Reuse one formatting implementation instead of page-level custom logic
- Apply the same behavior to sale prices, price-in-hand, price-on-resources, and wanted budgets

## Non-goals

- Decimal support
- Currency conversion
- Changing non-price numeric fields like mileage or year unless they already use separate formatting rules
- Reworking data storage or API contracts beyond input normalization

## Product Decisions

### Display format

- Plain number format: `11 500 000`
- Ruble format: `11 500 000 ₽`
- No decimals, dots, or commas

### Input behavior

- Price inputs switch from raw numeric display to formatted text display
- Allowed user content is digits only; any spaces or non-digits are stripped during normalization
- The field shows grouped thousands immediately after typing or paste
- Caret behavior should remain usable for normal append/delete/edit flows; exact native-number semantics are not required

### Scope

Apply the shared behavior everywhere prices or budgets are rendered or edited:

- listing creation
- listing editing
- wanted creation
- account screens
- listing detail / wanted detail / seller detail
- marketplace cards, rows, tables, compare tray, filter summaries
- chats and snapshots
- admin sale and wanted boards
- charts or stats blocks that show prices

## Technical Design

### Shared helpers

Add a shared numeric formatting utility layer with:

- `formatGroupedNumber(value)` -> `11 500 000`
- `formatPrice(value)` -> `11 500 000 ₽`
- `stripToDigits(value)` -> `11500000`
- `parseFormattedInteger(value)` -> `11500000`

The display formatter should explicitly normalize `ru-RU` non-breaking spacing into regular spaces so the rendered output matches the requested site format.

### Shared formatted input

Add one reusable price-input component or helper wrapper that:

- receives a string digit state from forms
- renders a grouped display value
- emits normalized digit-only strings back to form state
- uses `type="text"` and `inputMode="numeric"`

This keeps existing form payload builders mostly unchanged because they already convert string state into numbers near submission.

### Migration strategy

Replace existing ad-hoc price formatting in place with the shared helpers rather than rewriting unrelated view logic.

For forms:

- sale `price`
- sale `priceInHand`
- sale `priceOnResources`
- wanted `budgetMin`
- wanted `budgetMax`
- admin editable price/budget fields
- any other price form fields found during implementation

## Validation and Testing

Add regression coverage for:

- grouped number formatting uses spaces
- ruble formatting uses the shared helper
- formatted input strips non-digits and preserves grouped display
- at least one representative screen test verifies shared output in rendered markup

Manual smoke:

1. Type `11500000` into create/edit price fields and confirm the field shows `11 500 000`
2. Save a listing and confirm the persisted value is unchanged numerically
3. Check account/listing/chat/admin screens and confirm prices display with grouped thousands

## Risks

- Caret jumps are the main UX risk when formatting during typing
- Some screens may use local helper functions that shadow the shared formatter
- `Intl.NumberFormat('ru-RU')` can emit non-breaking spaces, so normalization must be explicit
