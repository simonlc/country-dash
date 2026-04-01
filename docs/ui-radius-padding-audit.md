# UI Radius + Padding Audit

Date: 2026-04-01  
Scope: `src/app` + `src/features/game`  
Goal: Inventory every explicit border radius and padding source, and mark inconsistencies.

## Audit Rules Used

1. Only action controls should use pill radius.
2. Short elements (`~34-48px` tall) with large radius must have enough horizontal padding.
3. Display cards should not look like buttons.
4. Same element type should not mix multiple style languages in one group.

## Token Baseline

Source: [designSystem.ts](/Users/simonlaroche/Projects/country-guesser/src/app/designSystem.ts)

- Radius tokens:
  - `xs = 4`
  - `sm = 6`
  - `md = 8`
  - `lg = 10`
  - `xl = 12`
  - `pill = 999`
- Spacing tokens exist, but many component paddings are still numeric `sx` literals.

Assessment:
- Token scale is reasonable.
- Padding token usage is inconsistent (mixed token + raw values).

## Global Theme Defaults

Source: [theme.ts](/Users/simonlaroche/Projects/country-guesser/src/app/theme.ts)

### Dialog System

- `MuiDialogTitle.root`: `paddingTop: 24`, `paddingBottom: 8`  
  Status: `OK`
- `MuiDialogContent.root`: `paddingTop: 8`, `paddingBottom: 24`  
  Status: `OK`
- `MuiDialogActions.root`: `padding: 0 24 24`  
  Status: `OK`

### Buttons

- `MuiButton.root`:
  - `borderRadius: radius.pill`
  - `paddingInline: 22`
  - `paddingBlock: 10`
  - `minHeight: 42`
  Status: `OK` (pill + generous horizontal padding)
- `MuiButton.sizeSmall`:
  - `paddingInline: 16`
  - `paddingBlock: 7`
  - `minHeight: 34`
  Status: `OK`

### Inputs + Lists

- `MuiOutlinedInput.root`:
  - `borderRadius: radius.md (8)`
  Status: `OK`
- `MuiOutlinedInput.input`:
  - `paddingBlock: 14`
  Status: `OK`
- `MuiAutocomplete.option`:
  - `borderRadius: radius.sm (6)`
  Status: `OK`
- `MuiAlert.root`:
  - `borderRadius: radius.md (8)`
  Status: `OK`

### Shape Default

- `shape.borderRadius`: `radius.sm` (atlas) / `radius.md` (others)
  Status: `OK`

## Component Inventory

## 1) Game HUD + Prompt Overlay

Source: [GamePage.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/routes/GamePage.tsx)

- L662-L670 HUD shell:
  - `borderRadius: radius.sm`
  - `p: { md: 1.75, xs: 1.4 }`
  Status: `OK`
- L740-L749 HUD stat chips:
  - `borderRadius: radius.sm`
  - `px: 1.3`, `py: 0.95`
  Status: `Needs Update`  
  Reason: very short height + tight x padding; text feels cramped at smaller widths.
- L767-L776 HUD timer card:
  - `borderRadius: radius.sm`
  - `px: 1.3`, `py: 0.95`
  Status: `Needs Update`  
  Reason: same issue as stat chips; short card with tight horizontal inset.
- L812-L824 Guess prompt overlay shell:
  - `borderRadius: radius.xs`
  - `p: { md: 2.4, xs: 2 }`
  Status: `OK` (non-pill and sufficiently sharp)
- L839-L845 Daily share display card:
  - `borderRadius: radius.md`
  - `p: 1.5`
  Status: `OK`
- L927-L934 Review guess display card:
  - `borderRadius: radius.md`
  - `p: 1.5`
  Status: `OK`
- L970-L977 Review stat cards:
  - `borderRadius: radius.sm`
  - `p: 1.1`
  Status: `OK`

## 2) Intro Dialog

Source: [IntroDialog.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/IntroDialog.tsx)

- L220-L227 Daily panel shell:
  - `borderRadius: radius.md`
  - `p: { md: 2.25, xs: 2 }`
  Status: `OK`
- L237-L244 Daily summary display card:
  - `borderRadius: radius.md`
  - `p: 1.9`
  Status: `OK`
- L268-L274 Daily not-complete display card:
  - `borderRadius: radius.md`
  - `p: 1.9`
  Status: `OK`
- L315-L321 Random panel shell:
  - `borderRadius: radius.md`
  - `p: 2.5`
  Status: `OK`
- L340-L354 Mode selector cards:
  - `borderRadius` comes from selector style (`radius.sm`)
  - `px: 1.5`, `py: 1.1`, `minHeight: 94`
  Status: `OK`
- L456-L477 Pool/category selector cards:
  - `borderRadius` from selector style (`radius.sm`)
  - Size cards: `px: 2`, `py: 1.7`, `minHeight: 124`
  - Category cards: `px: 1.75`, `py: 1.2`, `minHeight: 72`
  Status: `Mostly OK`
  Note: category cards are acceptable; could move to tokenized spacing for stricter consistency.

## 3) Theme Menu

Source: [ThemeMenu.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/ThemeMenu.tsx)

- L152-L159 Menu trigger button:
  - inherits pill radius from button theme
  - `px: 2`, `py: 0.85`
  Status: `OK`
- L166-L172 Menu dropdown shell:
  - `borderRadius: radius.md`
  - `p: 1.5`
  Status: `OK`
- L186-L202 Menu action buttons:
  - explicit `borderRadius: radius.md` override
  - `px: 1.2`, `py: 1.15`, `minHeight: 76`
  Status: `Needs Update`  
  Reason: these are buttons but have non-pill radius override, creating inconsistency with all other buttons.
- L233-L246 Theme selector rows:
  - `borderRadius` from selector style (`radius.sm`)
  - `p: 0.95`
  Status: `OK`

Non-UI decorative preview shapes:
- L69/L107 (`50%`) and custom blob radii in preview artwork
  Status: `Ignore` (illustration-only, not control chrome)

## 4) About Dialog

Source: [AboutDialog.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/AboutDialog.tsx)

- L41-L46 Highlight display block:
  - `borderRadius: radius.md`
  - `p: 2`
  Status: `OK`

## 5) Selector Base Style

Source: [controlStyles.ts](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/controlStyles.ts)

- `borderRadius: radius.sm`
- no internal padding here (set by calling components)
Status: `OK`

## 6) Guess Input

Source: [GuessInput.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/GuessInput.tsx)

- Text input internal padding:
  - `py: 1.5` in input override
  Status: `OK`
- No component-level radius override (uses themed `MuiOutlinedInput`)
  Status: `OK`

## Inconsistency Summary

1. **HUD stat + timer cards were tight on horizontal inset**
- File: [GamePage.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/routes/GamePage.tsx:740)
- Problem: short cards with `px: 1.3` feel visually cramped.
- Resolution: increased to tokenized `componentSpacing.hudChip.px = 1.7`.
- Status: `Resolved`

2. **Menu action buttons did not follow global button radius language**
- File: [ThemeMenu.tsx](/Users/simonlaroche/Projects/country-guesser/src/features/game/ui/ThemeMenu.tsx:195)
- Problem: explicit `radius.md` override conflicts with pill-button rule.
- Resolution: removed local radius override and local compressed horizontal padding.
- Status: `Resolved`

3. **Padding and radius values were partially tokenized, partially hardcoded**
- Across `GamePage.tsx`, `IntroDialog.tsx`, `ThemeMenu.tsx`
- Problem: harder to maintain consistency over time.
- Resolution: added `componentSpacing` tokens and migrated repeated selector/panel/hud/overlay values.
- Status: `Resolved`

## Normalization Pass Status

Completed:

1. HUD stat/timer card horizontal padding increased via token (`hudChip.px`).
2. Menu action button local radius override removed.
3. `componentSpacing` token map created:
- `dialogPanel`
- `hudChip`
- `menuPanel`
- `overlayPanel`
- `selectorCard`
- `selectorCardDense`
- `selectorCardLarge`
4. Repeated numeric literals replaced with token references in core UI surfaces.
