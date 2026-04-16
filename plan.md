# Country Dash UI Unification + Performance Plan

## 1. Objective

Create a **mobile-first**, high-performance UI system that:

1. unifies visual language across major components,
2. standardizes spacing/radius/typography via tokens,
3. improves responsiveness and readability on mobile and desktop,
4. uses RTL/LTR-safe logical properties consistently,
5. improves a11y and l10n behavior without changing game rules.

---

## 2. Skills to use (a11y + l10n)

I searched for dedicated skills and found strong candidates:

### Accessibility skill

- `addyosmani/web-quality-skills@accessibility`
- Install:

```bash
npx skills add addyosmani/web-quality-skills@accessibility -g -y
```

### Localization / i18n skill

- `sickn33/antigravity-awesome-skills@i18n-localization`
- Install:

```bash
npx skills add sickn33/antigravity-awesome-skills@i18n-localization -g -y
```

### L10n-focused alternative

- `mindrally/skills@localization-l10n`
- Install:

```bash
npx skills add mindrally/skills@localization-l10n -g -y
```

### Installation status

Installed successfully:

1. `addyosmani/web-quality-skills@accessibility`
2. `sickn33/antigravity-awesome-skills@i18n-localization`
3. `mindrally/skills@localization-l10n`

---

## 3. Current UI issues to fix

1. **Token usage is inconsistent**: major components still use hard-coded px values and mixed spacing semantics.
2. **Desktop/mobile visual rhythm differs too much**: cards/panels do not follow one spacing and radius system.
3. **RTL/LTR support is partial**: many styles still use `left/right/pl/pr` instead of logical properties.
4. **Layout complexity on mobile** can create visual noise and perceived jank.
5. **Floating desktop look exists in parts only**, not as a single reusable layout pattern.

---

## 4. Design system expansion (token-first)

## 4.1 Extend tokens in `src/app/designSystem.ts`

Add explicit token groups for layout and component density:

```ts
export const designTokens = {
  // existing groups...
  layout: {
    edgeInset: { mobile: 0, tablet: 8, desktop: 16 },
    panelMaxWidth: {
      hud: 1240,
      status: 860,
      dialog: 960,
    },
    floatingOffset: {
      desktopTop: 16,
      desktopBottom: 24,
    },
  },
  touchTarget: {
    min: 44,
    comfortable: 48,
  },
  componentDensity: {
    mobile: { py: 0.75, px: 0.875 },
    desktop: { py: 1.0, px: 1.25 },
  },
} as const;
```

## 4.2 Token rules

1. No raw numeric radii outside token file.
2. No ad-hoc text sizes in major components.
3. Shared panel padding/radius through tokenized helpers.
4. Use density tokens for mobile vs desktop differences.

---

## 5. RTL/LTR-safe styling strategy (mandatory)

Replace directional properties with logical CSS.

### 5.1 Preferred logical properties

- `paddingInline`, `paddingInlineStart`, `paddingInlineEnd`
- `marginInline`, `marginInlineStart`, `marginInlineEnd`
- `insetInline`, `insetInlineStart`, `insetInlineEnd`
- `borderStartStartRadius`, `borderStartEndRadius`, `borderEndStartRadius`, `borderEndEndRadius`
- text alignment defaults should avoid hard-coded left/right where possible

Avoid MUI directional shorthands in this refactor (`pl`, `pr`, `ml`, `mr`, `left`, `right`) unless there is no logical alternative.

### 5.2 Example conversion

```tsx
// Before
sx={{ pl: 2, pr: 2, left: 0, right: 0 }}

// After
sx={{
  paddingInline: 2,
  insetInlineStart: 0,
  insetInlineEnd: 0,
}}
```

```tsx
// Radius conversion example
// Before
sx={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }}

// After
sx={{
  borderStartStartRadius: designTokens.radius.md,
  borderStartEndRadius: designTokens.radius.md,
}}
```

### 5.3 File pass priority

1. `GamePage.tsx`
2. `GameHud.tsx`
3. `GameStatusPanel.tsx`
4. `ThemeMenu.tsx`
5. `IntroDialog.tsx`
6. shared style helpers (`controlStyles.ts`, theme surface helpers)

---

## 6. Layout overhaul (mobile-first + floating desktop)

## 6.1 Mobile layout contract

1. Full-bleed UI at screen edges.
2. No decorative empty gutters around primary cards.
3. Compact hierarchy: globe > top HUD > bottom action panel.
4. Fewer nested wrappers in critical render path.

## 6.2 Desktop layout contract

1. Floating panel look with consistent elevation and edge offset.
2. Constrained readable max-widths for HUD and status.
3. Scales smoothly from laptop to large desktop.

### 6.3 Shared shell snippet

```tsx
<Box
  sx={{
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
  }}
>
  <Box
    sx={{
      position: 'absolute',
      insetInline: 0,
      insetBlockStart: 0,
      paddingInline: { xs: 0, md: 2 },
      paddingBlockStart: { xs: 0, md: 2 },
    }}
  >
    {/* top floating HUD */}
  </Box>

  <Box
    sx={{
      position: 'absolute',
      insetInline: 0,
      insetBlockEnd: 0,
      paddingInline: { xs: 0, md: 2 },
      paddingBlockEnd: { xs: 0, md: 3 },
      display: 'grid',
      placeItems: 'end center',
    }}
  >
    {/* bottom status panel */}
  </Box>
</Box>
```

---

## 7. Component reorganization for readability

## 7.1 `GamePage.tsx`

Refactor layout into clear sections:

1. `GlobeLayer`
2. `OverlayLayer`
3. `TopHudLayer`
4. `BottomPanelLayer`

This keeps reading order intuitive and lowers cognitive load in the route file.

## 7.2 `GameHud.tsx`

1. Normalize chip spacing/radius via tokens.
2. Keep one typography scale map for xs/md.
3. Move repeated `sx` objects to constants.
4. Keep mobile chips 2-row max when possible.

## 7.3 `GameStatusPanel.tsx`

1. Standardize all card sections with shared panel spacing token.
2. Reduce visual weight in review/game-over by using one stats grid style.
3. Ensure action buttons always meet touch target (>=44px).
4. Simplify spacing branches for keyboard-open state.

## 7.4 `ThemeMenu.tsx`

1. Tokenize panel width, gaps, button heights.
2. Ensure logical positioning for menu anchoring and layout.
3. Keep mobile menu compact and scroll-safe.

## 7.5 `IntroDialog.tsx`

1. Normalize selector card spacing/radius.
2. Split sections visually with tokenized rhythm.
3. Keep dense but scannable mobile hierarchy.

---

## 8. Typography and spacing standardization

Adopt one size map per breakpoint for key UI elements:

| Element        | Mobile            | Desktop     |
| -------------- | ----------------- | ----------- |
| HUD title/mode | `subtitle2`       | `h6`        |
| Stat label     | `caption`         | `caption`   |
| Stat value     | `subtitle2/body1` | `subtitle1` |
| Panel heading  | `subtitle2`       | `h6`        |
| Primary action | `body2`           | `body2`     |

Spacing rhythm:

- Mobile: multiples of `0.5` and `0.75` units
- Desktop: multiples of `0.75`, `1`, and `1.5` units

Radius rhythm:

- Mobile primary cards: `radius.sm`
- Desktop floating cards: `radius.md`
- Chips: `radius.pill` by default on desktop and mobile, with guardrails:
  - enforce minimum horizontal padding so chips keep a balanced pill silhouette,
  - cap chip height in compact modes to prevent over-rounded blobs,
  - if a chip wraps or exceeds the height cap, fall back to `radius.sm` automatically.

---

## 9. Performance plan (mobile rendering focus)

1. Reduce frequent recreation of inline `sx` objects in top-level render paths.
2. Hoist static style objects/constants where possible.
3. Avoid redundant wrappers and nested stacks in hot components.
4. Keep expensive conditional branches out of rapidly changing render paths.
5. Preserve current imperative globe rendering strategy (already performance-oriented).
6. Verify keyboard/viewport effects do not trigger unnecessary layout churn.

Example pattern:

```tsx
const mobileStatChipSx = {
  borderRadius: designTokens.radius.sm,
  py: 0.5,
  px: 0.875,
} as const;
```

---

## 10. a11y plan

1. Ensure all interactive controls are keyboard reachable and clearly labeled.
2. Maintain/expand live-region usage for status changes.
3. Enforce minimum target size (`44x44`) for touch controls.
4. Improve visible focus ring consistency through theme tokens.
5. Validate contrast in all 6 themes for text + controls.
6. Respect reduced-motion preferences for non-essential transitions.
7. Ensure keyboard focus order follows visual reading order after layout changes.
8. Verify form controls preserve accessible names in all locales.

### 10.1 A11y acceptance criteria

- No unintended keyboard traps in menu/dialog/input flows.
- Intentional modal focus traps are allowed where required by UX flow (e.g., Intro dialog startup gate).
- Clear visible focus on all interactive elements
- Buttons and icon buttons meet touch target minimum
- Dynamic game-state announcements are deferred for a later phase and are not a launch blocker for this refactor.

---

## 11. l10n + bidi plan

1. Audit all major components for physical-direction properties.
2. Replace with logical properties throughout.
3. Validate UI in both `dir="ltr"` and `dir="rtl"` manually.
4. Check long translated strings for overflow/truncation in:
   - HUD labels
   - menu actions
   - intro cards
   - game-over summaries
5. Keep locale-dependent formatting centralized (dates/numbers if surfaced).

### 11.1 Bidi acceptance criteria

- No clipped controls in RTL for top HUD, menu, intro, and game-over panels
- Logical spacing mirrors correctly without special-case CSS forks
- Mixed-direction strings (numbers + translated text) remain legible

---

## 12. Implementation phases

## Phase A — Token foundation

- Update `designSystem.ts` with layout/density/touch tokens.
- Add any shared UI helper constants in `controlStyles.ts`.

## Phase B — Layout + RTL pass

- Refactor `GamePage.tsx` layout layers.
- Apply logical properties in all top-level containers.

## Phase C — Major component normalization

- `GameHud.tsx`
- `GameStatusPanel.tsx`
- `ThemeMenu.tsx`
- `IntroDialog.tsx`

## Phase D — a11y + l10n hardening

- focus + semantics pass
- bidi validation pass
- translated content overflow pass

## Phase E — final polish + QA

- responsive tuning (small phone, large phone, tablet, laptop, wide desktop)
- micro-adjust spacing and typography
- run test/lint/typecheck/build and targeted manual checks

## Phase F — a11y/l10n sign-off

- run a keyboard-only pass for all core journeys
- run an RTL direction pass for all major panels and actions
- verify translations with long labels do not break critical layouts

---

## 13. Detailed todo list (execution backlog)

### Phase A — Token foundation

- [x] A1. Audit current token usage and list hard-coded spacing/radius/typography values in major UI components.
- [x] A2. Add `layout` token group (`edgeInset`, `panelMaxWidth`, `floatingOffset`) to `designSystem.ts`.
- [x] A3. Add touch target token group (`min`, `comfortable`) to `designSystem.ts`.
- [x] A4. Add density token group for mobile/desktop component padding.
- [x] A5. Add chip shape guardrail tokens (min horizontal padding, max compact height, fallback radius).
- [x] A6. Add/standardize shared style helpers in `controlStyles.ts` for panel shells and chip shells.
- [x] A7. Update `theme.ts` defaults to consume new tokens (focus ring, panel spacing/radius, action sizing).
- [x] A8. Document token usage rules in this plan section and enforce “no new raw px” in major components.

### Phase B — Layout + RTL pass

- [x] B1. Refactor `GamePage.tsx` into explicit visual layers (`GlobeLayer`, `OverlayLayer`, `TopHudLayer`, `BottomPanelLayer`).
- [x] B2. Convert top-level layout spacing to logical properties (`paddingInline`, `insetInline*`, `insetBlock*`).
- [x] B3. Convert safe-area + keyboard inset handling to logical equivalents where feasible.
- [x] B4. Ensure mobile is full-bleed (no decorative edge gaps at xs).
- [x] B5. Implement desktop floating offsets and max-width constraints from tokens.
- [x] B6. Remove/replace directional shorthands (`pl/pr/ml/mr/left/right`) in `GamePage.tsx`.
- [x] B7. Confirm layout order follows reading order for keyboard and screen reader semantics.
- [x] B8. Validate no visual regressions in loading/error states after shell changes.

### Phase C — Major component normalization

- [x] C1. `GameHud.tsx`: extract repeated `sx` blocks into tokenized constants.
- [x] C2. `GameHud.tsx`: unify chip spacing/radius/typography scales across breakpoints.
- [x] C3. `GameHud.tsx`: apply pill guardrails (padding, height cap, fallback radius when wrapping).
- [x] C4. `GameStatusPanel.tsx`: standardize spacing and radius across intro/playing/review/gameOver branches.
- [x] C5. `GameStatusPanel.tsx`: consolidate action button sizing and minimum touch target usage.
- [x] C6. `GameStatusPanel.tsx`: simplify keyboard-open spacing branches using shared constants.
- [x] C7. `ThemeMenu.tsx`: normalize widths/gaps/button sizing and convert to logical properties.
- [x] C8. `ThemeMenu.tsx`: keep compact/mobile menu scroll-safe with predictable max height.
- [x] C9. `IntroDialog.tsx`: normalize selector card spacing/radius and section rhythm via tokens.
- [x] C10. `IntroDialog.tsx`: verify dense mobile layout remains readable and touch-friendly.
- [x] C11. `styles/index.css`: keep global-only primitives; remove component-like drift from global CSS.
- [x] C12. Confirm all major components now pull from tokens for spacing/radius/text size.

### Phase D — a11y + l10n hardening

- [x] D1. Verify accessible names and labels for all interactive controls in core journeys.
- [x] D2. Ensure intentional modal focus trap behavior in Intro dialog; prevent unintended traps elsewhere.
- [x] D3. Verify focus visibility on all buttons, icon buttons, inputs, and menu items.
- [x] D4. Confirm keyboard navigation order remains logical after layout refactor.
- [x] D5. Audit major components for physical-direction CSS and replace with logical properties.
- [x] D6. Validate long translated labels do not overflow critical action surfaces.
- [x] D7. Validate bidi rendering for mixed text + numbers (scores/timers/round labels).
- [x] D8. Defer dynamic live announcements intentionally (document non-blocking scope).

### Phase E — Final polish + QA

- [x] E1. Tune mobile spacing at 320x568 and 390x844.
- [x] E2. Tune tablet/desktop floating balance at 768x1024, 1366x768, 1920x1080.
- [x] E3. Ensure desktop floating cards preserve hierarchy without crowding globe view.
- [x] E4. Validate chip readability and shape behavior in compact modes.
- [x] E5. Run existing checks: typecheck, lint, unit tests, E2E.
- [x] E6. Add/adjust tests for responsive layout behavior in critical components.
- [x] E7. Add/adjust tests for RTL/LTR behavior in major UI surfaces.
- [x] E8. Add/adjust keyboard interaction tests for intro/menu/status flows.
- [x] E9. Add optional a11y test tooling only if a strict gap remains after test design.
- [x] E10. Re-run full QA matrix and capture final pass/fail notes.

### Phase F — a11y/l10n sign-off

- [x] F1. Execute keyboard-only walkthrough for all core journeys.
- [x] F2. Execute explicit RTL walkthrough for HUD, status panel, intro, and menu.
- [x] F3. Confirm no clipped or mirrored incorrectly-positioned controls in RTL.
- [x] F4. Confirm long-string locale resilience in key flows (intro/menu/game-over).
- [x] F5. Confirm focus traps are intentional only (intro modal gate) and documented.
- [x] F6. Produce final sign-off checklist and mark launch blockers vs deferred items.

#### Final sign-off checklist

- [x] Mobile-first full-bleed shell and desktop floating panel constraints are applied through tokens.
- [x] Major UI surfaces use logical-direction properties across layout and component internals.
- [x] Keyboard interaction paths are covered in existing flows and test coverage.
- [x] RTL behavior is covered for menu interactions and logical positioning.
- [x] Existing lint, typecheck, unit tests, and production build are green.

---

## 14. File-level implementation map

- `src/app/designSystem.ts` — token expansion
- `src/app/theme.ts` — unified component-level spacing/radius/focus defaults
- `src/routes/GamePage.tsx` — mobile-first shell + floating desktop layers + logical properties
- `src/components/GameHud.tsx` — tokenized metric bar + responsive simplification
- `src/components/GameStatusPanel.tsx` — tokenized state panels + action layouts
- `src/components/ThemeMenu.tsx` — compact menu spacing and logical positioning
- `src/components/IntroDialog.tsx` — standardized selector spacing + readability
- `src/styles/index.css` — only global primitives, avoid component-specific drift

---

## 15. QA matrix

## Viewports

1. 320x568
2. 390x844
3. 768x1024
4. 1366x768
5. 1920x1080

## Directions/locales

1. English LTR
2. Arabic/Hebrew-style RTL simulation (direction check)
3. Long-string locale (e.g., German) overflow check

## Core journeys

1. Intro -> random run -> review -> game over
2. Intro -> daily run -> completion -> copy result -> return to menu
3. Menu actions (refocus/retry/quit/about/theme switch/language switch)
4. Expand regression coverage so this UI pass does not regress.

## Testing strategy and tooling

1. Primary stack (already in repo):
   - unit/component: Vitest + Testing Library
   - end-to-end: Playwright
2. Add missing coverage for:
   - token-driven visual contract (spacing/radius/typography assertions where stable)
   - RTL/LTR layout behavior in major components
   - keyboard-only navigation for intro/menu/status interactions
   - mobile and desktop breakpoint behavior for core panels
3. Library additions:
   - only add new testing libraries if a strict gap is found after test design.
   - likely candidates (if needed): `vitest-axe` for component a11y checks and/or `@axe-core/playwright` for E2E a11y checks.

## Interaction quality checks

1. Keyboard-only navigation (Tab/Shift+Tab/Enter/Escape)
2. Focus visibility and order after every panel transition
3. RTL rendering parity for HUD, status panel, intro dialog, and menu

---

## 16. Deliverables

1. Unified tokenized spacing/radius/typography across major UI components.
2. Clean mobile full-bleed UI with reduced visual clutter.
3. Floating desktop UI that scales well across widths.
4. RTL/LTR-safe styling pass on major surfaces.
5. Documented a11y/l10n checks and resolved issues.

---

## 17. Post-implementation regression fixes (completed)

- [x] Refactor overlay positioning to a shared base layer component for top and bottom HUD/status alignment.
- [x] Encode explicit edge-attachment corner rules in shared style helpers:
  - top-attached mobile panels: top corners always square
  - bottom-attached mobile panels: bottom corners always square
- [x] Stabilize shared overlay layer alignment using a single flex-based positioning primitive for top/bottom HUD surfaces.
- [x] Apply conditional bottom-attachment radius rules so only mobile bottom-docked states use square screen-edge corners.
- [x] Restore desktop floating behavior for top HUD with consistent token-driven offsets and rounded panel shell.
- [x] Remove fixed-height constraints from top HUD chips/timer shells and harden text wrapping to prevent mobile overflow.
- [x] Align post-guess mobile panel behavior with the playing panel by docking review/game-over states to the bottom safe area.
- [x] Update timer formatting to seconds-only output (no millisecond decimals).
- [x] Refactor menu interaction model:
  - icon-only menu trigger button
  - language selection moved inside the menu actions
  - language options displayed in a dedicated modal dialog
- [x] Re-run full quality suite after regression fixes (typecheck, lint, unit tests, build, E2E).
