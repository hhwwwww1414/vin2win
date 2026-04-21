# Listing Success Animation Design

## Summary

Replace the static success check icon on `/listing/new` with an animated brand-aligned success mark and add celebratory confetti after successful submission.

The existing success screen structure stays intact:

1. keep the same success screen layout and CTA buttons
2. replace only the top success icon block
3. animate the success check with a stroked SVG circle and tick
4. launch confetti for every successful scenario
5. use a softer confetti preset for draft saves and a stronger preset for moderation / successful edit saves

## Problem

The current success state in `app/listing/new/page.tsx` uses a static circular badge with a `Check` icon. It confirms completion, but it does not create a clear emotional transition after a successful action.

This is especially noticeable in the listing flow because:

- the form is long and multi-step
- the success screen appears after a substantial user effort
- draft saves and moderation submissions currently feel visually almost identical
- the existing static icon does not match the premium, motion-aware direction already present elsewhere in the marketplace

## Goals

- Add a distinct success moment to the listing flow without redesigning the entire success screen
- Keep the animation aligned with the marketplace visual language and existing teal-led palette
- Differentiate success intensity between draft saves and moderation / edit saves
- Respect reduced-motion users
- Keep the implementation narrowly scoped to the listing success state

## Non-goals

- Redesigning the overall success screen layout or CTA structure
- Changing submit button copy or submit flow semantics
- Introducing different success screens per scenario
- Adding success animations to unrelated parts of the application
- Creating a generic animation system for every success state in the codebase

## Existing Context

- `app/listing/new/page.tsx` already owns success-state rendering behind `if (submitted)`
- success state already varies copy based on scenario and `submittedStatus`
- the page already uses the project’s teal accents, dark surfaces, muted text, and soft gradients
- the project already uses client-side motion in selected UI surfaces, but the current listing success state is static

This work should extend the existing success screen rather than split it into a new page or abstraction-heavy flow.

## Final Product Decisions

### Visual direction

Use the approved direction `A`:

- no filled circular badge behind the icon
- animated SVG linework only
- brand-led teal / mint / cyan tones taken from the existing site palette
- subtle glow, not a loud neon halo
- premium and restrained, not arcade-like

### Success icon behavior

The static `Check` icon is replaced with a reusable success animation component.

Animation sequence:

1. the circular stroke draws first
2. the tick stroke draws after the circle
3. the final state remains visible after the animation completes

The icon should feel clean and light:

- transparent background
- no solid disk behind the mark
- line color built from the existing `teal-accent` family
- optional soft glow / ring treatment around the SVG, but no second focal element that competes with the text

### Confetti behavior

Confetti launches after every successful scenario shown by the existing success screen.

Presets:

- `soft`: used for `DRAFT`
- `full`: used for `PENDING` and successful edit saves that return the listing to moderation

Color palette:

- teal
- mint
- soft cyan / ice

Do not introduce unrelated celebratory colors such as purple, hot pink, or saturated gold.

### Reduced motion

If the user prefers reduced motion:

- do not fire confetti
- render the success icon directly in its completed state
- avoid long or delayed draw sequences

### Replay rules

The effect should run once per new successful submit transition.

It should not restart on ordinary re-renders of the same success screen.

## UX Design

### Screen structure

Keep the current success layout exactly as the user approved:

- top animation block
- success heading
- success description
- CTA row

No changes to button order, navigation choices, or success-copy structure are required as part of this slice.

### Scenario tone

Draft saves should feel successful but quieter.

That means:

- same success animation component
- same overall screen structure
- softer confetti preset with fewer particles and less spread / velocity

Moderation submission and successful edit save should feel more celebratory:

- same success animation component
- stronger confetti preset
- same teal-led palette, just more energy

## Architecture

### UI layer

Add a small success animation component for the top block of the success screen.

Recommended boundary:

- `SuccessCheckAnimation`

Responsibilities:

- render the animated SVG circle and tick
- switch to static final state for reduced-motion users
- expose only `reducedMotion?: boolean` and `className?: string`

Do not extract the entire success page into a new large component.

### Effects layer

Add a small client helper for confetti launch logic.

Recommended boundary:

- `launchListingSuccessConfetti(mode)`

Where `mode` is one of:

- `soft`
- `full`

Responsibilities:

- encapsulate `canvas-confetti` usage
- own the two presets
- centralize colors and particle settings
- respect reduced motion before launching

### Screen integration

`app/listing/new/page.tsx` remains the orchestration point.

It should:

- compute the success intensity from existing success state
- render the new animation block instead of the current static badge
- launch confetti when the success screen becomes active

## State Mapping

### Intensity rules

Map the current success state to visual intensity as follows:

- `submittedStatus === 'DRAFT'` -> `soft`
- `submittedStatus !== 'DRAFT'` -> `full`

This intentionally covers:

- create + draft
- create + moderation submit
- edit + draft save
- edit + successful save to moderation

### Trigger timing

Confetti should fire after the component enters the success state, not before the API response resolves and not while the submit button is still in loading state.

The success icon animation should be visible immediately when the success screen renders.

## Files Expected To Change

- `app/listing/new/page.tsx`
- `components/listing/success-check-animation.tsx`
- `lib/listing-success-confetti.ts`
- `package.json`
- `package-lock.json`
- `tests/listing-success-motion.test.tsx`
- `tests/listing-success-confetti.test.ts`

## Testing

### Unit / logic tests

Add a focused test for the success-intensity mapping helper so that:

- `DRAFT` resolves to `soft`
- `PENDING` resolves to `full`

If the reduced-motion decision is extracted into helper logic, test that separately as pure logic rather than through a browser-heavy test.

### UI tests

Add a focused test that the success screen renders the new animation component instead of the old static success badge.

The test should verify integration at the success-screen level, not canvas internals.

### Manual smoke tests

1. Submit a new listing to moderation and confirm the stronger confetti preset runs once.
2. Save a new listing as draft and confirm the softer confetti preset runs once.
3. Edit an existing listing successfully and confirm the stronger preset runs once.
4. Re-render the success screen without a new submit and confirm confetti does not relaunch.
5. Enable reduced motion and confirm the success state shows the final icon without confetti.

## Risks And Mitigations

### Risk: effect feels too loud for the existing marketplace tone

Mitigation:

- keep the approved `A` direction
- use teal / mint / cyan only
- keep the icon background transparent
- keep draft preset intentionally lighter

### Risk: confetti replays on re-render

Mitigation:

- tie confetti launch to a success-transition effect, not generic render execution
- guard replay with a dedicated ref that records the last launched success state

### Risk: reduced-motion users still get motion-heavy UI

Mitigation:

- gate confetti on `prefers-reduced-motion`
- render the success icon directly in the completed state for reduced-motion users

### Risk: over-abstraction for a narrow UI change

Mitigation:

- keep only two small reusable pieces
- do not refactor the entire success screen
- do not build a global celebratory framework

## Rollout

This change is safe to ship directly as a UI enhancement to the existing listing success state.

No migration, data change, or backend rollout coordination is required.
