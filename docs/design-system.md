# Country Guesser Design System

Version: 1.0  
Status: Active  
Scope: Game UI (intro, gameplay HUD, overlays, menus, dialogs, form controls)

## 1. Purpose

This system exists to enforce one rule above all others:

- Every UI element must communicate its role immediately.

If users cannot tell what is clickable, selectable, or informational at a glance, the system is failing.

## 2. Core Principles

1. Role clarity over decoration.
2. Consistency over novelty.
3. Tokens over ad-hoc values.
4. Interaction only where there is action.
5. Accessibility parity across all themes.

## 3. Role Taxonomy

All UI must map to one of these roles.

### 3.1 Action Controls

Purpose: Trigger an immediate command.

Examples:
- `Play today’s daily`
- `Start <pool>`
- `Next`
- `Main menu`
- Menu actions (`Refocus`, `Retry`, `Quit`, `About`)

Implementation:
- MUI `Button` variants (`contained`, `outlined`, `text`)

Visual behavior:
- Highest emphasis in interactive hierarchy.
- `contained` is primary CTA.
- `outlined` is secondary action.

Do not use:
- For persistent option choices.
- For non-interactive status content.

### 3.2 Selectors

Purpose: Choose one option from a set.

Examples:
- Mode cards (`Classic`, `3 Lives`, etc.)
- Pool/category cards
- Theme options

Implementation:
- Semantic button element with `aria-pressed`
- Shared style helper: `getSelectorCardSx`

Visual behavior:
- Flat, card-like, no CTA elevation.
- Selection conveyed by border and fill change.
- Hover/focus reinforces option targeting, not action priority.

Do not use:
- To submit forms or execute one-off commands.
- With strong shadows or “call-to-action” styling.

### 3.3 Display Surfaces

Purpose: Present information only.

Examples:
- Score/streak/hit/miss panels
- Timer chip
- Review stat blocks
- Daily summary blocks
- About highlight panel

Implementation:
- `getThemeDisplaySurfaceStyles(..., 'neutral' | 'accent')`

Visual behavior:
- No hover affordance.
- No pointer-style affordance.
- Subtle border and fill only.

Do not use:
- For clickable items.
- For selectable options.

### 3.4 Structural Surfaces

Purpose: Group/layout content areas.

Examples:
- Main HUD panel
- Intro dialog sections
- Menu container surface
- Overlay panel shell

Implementation:
- `getThemeSurfaceStyles(..., tone)`

Do not use:
- As substitutes for controls or selectors.

## 4. Decision Matrix

Use this matrix for every new element.

1. Does it execute a command now?
- Yes -> `Action Control`
- No -> continue

2. Does it choose persistent state among options?
- Yes -> `Selector`
- No -> continue

3. Is it informational only?
- Yes -> `Display Surface`
- No -> continue

4. Is it a layout container?
- Yes -> `Structural Surface`

If an element matches multiple categories, split responsibilities into separate sub-elements.

## 5. Design Tokens

Source of truth: [src/app/designSystem.ts](/Users/simonlaroche/Projects/country-guesser/src/app/designSystem.ts)

### 5.1 Typography

- `fontSize`: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl`, `overline`
- `fontWeight`: `regular`, `medium`, `semibold`, `bold`
- `lineHeight`: `tight`, `base`, `relaxed`

Rules:
- Use MUI typography variants first.
- Inline font sizing/weights only for documented exceptions.

### 5.2 Shape

- `radius`: `xs`, `sm`, `md`, `lg`, `xl`, `pill`

Rules:
- Controls/selectors use `sm`/`md`.
- Panels use `lg`.
- `pill` is reserved for intentional pill UI, not broad default usage.

### 5.3 Motion

- `motion.fast`, `motion.base`

Rules:
- Motion must be subtle and role-consistent.
- Non-interactive surfaces must not animate like controls.

### 5.4 Spacing

- `spacing.xs` to `spacing.xxl`

Rules:
- Use spacing scale to maintain rhythm.
- Avoid introducing off-scale spacing values without clear need.

## 6. Component Specifications

## 6.1 Button (Action Control)

Source: [src/app/theme.ts](/Users/simonlaroche/Projects/country-guesser/src/app/theme.ts)

Required:
- Semantic button element
- Visible hover and focus states
- Clear primary/secondary hierarchy

Forbidden:
- Styling non-actions to visually mimic button hierarchy.

## 6.2 Selector Card

Source: [src/features/game/ui/controlStyles.ts](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/controlStyles.ts)

Required:
- `aria-pressed` for selected state
- Flat treatment
- Strong selected vs unselected differentiation

Forbidden:
- CTA shadows/elevation
- Strong “press me now” semantics

## 6.3 Display Card

Source: `getThemeDisplaySurfaceStyles` in [src/app/theme.ts](/Users/simonlaroche/Projects/country-guesser/src/app/theme.ts)

Required:
- Passive styling
- Readability priority
- Stable visual weight

Forbidden:
- Hover transforms
- Pointer affordance
- Selection affordance

## 6.4 Input + Autocomplete

Source:
- [src/app/theme.ts](/Users/simonlaroche/Projects/country-guesser/src/app/theme.ts)
- [src/features/game/ui/GuessInput.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/GuessInput.tsx)

Required:
- Consistent label/input typography
- Focus ring and border transitions
- Option list typography aligned to token scale

Forbidden:
- One-off input skinning that diverges from theme defaults.

## 7. Color System Rules

Base palette is theme-specific (`appThemes`), but usage semantics are fixed.

- `primary`: action emphasis and selected-state accents.
- `secondary`: complementary accent only; not a replacement primary.
- `text.primary` / `text.secondary`: semantic text hierarchy only.
- `display.accent`: informational emphasis only, not interactive emphasis.

Do:
- Keep interactive emphasis stronger than informational emphasis.

Do not:
- Use informational accent blocks to compete visually with primary action buttons.

## 8. Typography Hierarchy Rules

- `h2`: top-level screen title
- `h5`/`h6`: section and in-context headings
- `body1`: primary body copy
- `body2`: supporting contextual copy
- `caption`/`overline`: metadata and labels

Do:
- Use variant semantics consistently.

Do not:
- Override font weight/size repeatedly in local `sx` when a variant already exists.

## 9. Accessibility Requirements

Mandatory:
- Visible `:focus-visible` for all interactive controls.
- `aria-pressed` on toggle-like selectors.
- Clear contrast between selected/unselected selector states.
- Click targets remain touch-safe (min target size policy via component sizing).

## 10. Current Implementation Map

- Tokens: [src/app/designSystem.ts](/Users/simonlaroche/Projects/country-guesser/src/app/designSystem.ts)
- Theme foundations + component defaults: [src/app/theme.ts](/Users/simonlaroche/Projects/country-guesser/src/app/theme.ts)
- Selectors: [src/features/game/ui/controlStyles.ts](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/controlStyles.ts)
- Intro role application: [src/features/game/ui/IntroDialog.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/IntroDialog.tsx)
- Menu role application: [src/features/game/ui/ThemeMenu.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/ThemeMenu.tsx)
- Gameplay HUD/overlay role application: [src/features/game/routes/GamePage.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/routes/GamePage.tsx)
- Input consistency: [src/features/game/ui/GuessInput.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/GuessInput.tsx)
- About display block: [src/features/game/ui/AboutDialog.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/AboutDialog.tsx)

## 11. Anti-Patterns (Rejected)

1. Non-interactive cards styled like action buttons.
2. Selectors with CTA elevation/shadows.
3. Overuse of large radii that flatten hierarchy.
4. Unbounded local typography overrides.
5. Multiple visual languages for the same role.

## 12. PR Review Checklist

1. Does every new element have a single clear role from Section 3?
2. Are token values used instead of ad-hoc values?
3. Are buttons only used for commands?
4. Do selectors avoid CTA styling?
5. Do display surfaces look passive?
6. Are focus and selected states accessible and obvious?
7. Is theme compatibility preserved across all shipped themes?
