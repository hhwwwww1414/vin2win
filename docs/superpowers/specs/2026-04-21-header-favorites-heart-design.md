# Header Favorites Heart Design

## Goal

Adjust the heart icon in the marketplace header so its fill color communicates favorites state more clearly.

## Scope

Only the header `Избранное` link changes.

Included:
- desktop header favorites link
- mobile menu favorites link
- heart icon visual state logic
- focused tests for the new visual-state helper/rendering

Excluded:
- listing card favorite buttons
- gallery/detail-page hearts
- favorites API behavior
- favorites counter badge styling

## Approved Behavior

The heart icon in the header has three states:

1. `favoriteCount === 0` and the favorites link is not active
   - keep the current default look
   - no filled heart

2. `favoriteCount > 0` and the favorites link is not active
   - the heart is filled
   - the heart color is the site tiffany/teal accent

3. current location is `/account#favorites`
   - the heart is filled
   - the heart color becomes red
   - this active state overrides the count-based tiffany state

## Route Detection

The active red state must match the actual favorites destination, not the whole account area.

Rules:
- `/account#favorites` => active red heart
- `/account` without `#favorites` => not active
- any other route => not active

Because `usePathname()` does not include the hash fragment, the header must also read the current hash on the client.

## Implementation Shape

Keep the change local to `components/marketplace/header.tsx`.

Recommended structure:
- introduce a tiny helper that derives the heart visual state from:
  - `favoriteCount`
  - `pathname`
  - `hash`
- reuse that logic for both desktop and mobile header variants
- apply `fill-current` only for the tiffany and red states

## Visual Rules

Desktop header:
- preserve the existing button/link layout
- only change the heart icon classes

Mobile menu:
- keep the current row layout and counter badge
- apply the same heart-state colors as desktop

Color intent:
- default: existing muted styling
- filled when count > 0: tiffany/teal accent
- active favorites link: red

## Testing

Add a focused test that covers:
- zero favorites => no fill/default styling
- non-zero favorites => filled tiffany styling
- `/account#favorites` => filled red styling

Testing should stay narrow and avoid unrelated header behavior.

## Risks

Primary risk:
- incorrectly treating all `/account` pages as active favorites

Mitigation:
- compute active state from both pathname and hash, with an exact `/account#favorites` match
