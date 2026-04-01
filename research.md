# WebGL Globe Notifications Research

## Scope and method

This document is a source-level analysis of how notifications work in the current `country-guesser` codebase, with an emphasis on the WebGL globe pipeline and its interaction with gameplay state.

Code inspected:

- `src/features/game/ui/WebGlGlobe.tsx`
- `src/features/game/ui/globeShared.ts`
- `src/features/game/routes/GamePage.tsx`
- `src/features/game/logic/gameLogic.ts`
- `src/features/game/types.ts`
- `src/app/theme.ts`
- `src/Globe.tsx`
- tests in `src/features/game/routes/GamePage.test.tsx` and `tests/e2e/game.spec.ts`

The term notification is used in this document for all user-facing feedback signals, including:

1. Visual globe targeting cues (highlight fill, rings, pulsing capital marker).
2. In-panel semantic alerts (`Correct` / `Incorrect`, load failures).
3. Operational fallback messages (`WebGL unavailable`).
4. Short-lived status messaging (`Copied` / `Copy failed`).

## Executive summary

The system uses **two parallel notification channels** that are synchronized by game state:

1. **Globe-channel notifications** (WebGL + 2D overlay canvas):
   - Country mode: selected country fill + optional helper rings.
   - Capitals mode: animated pulsing marker on the capital.
2. **UI-channel notifications** (MUI panel):
   - Round result alert (`Correct`/`Incorrect`) during `reviewing` state.
   - Error alert for world-data loading failure.
   - Copy-status label for daily share text.

The critical architecture detail is that the WebGL globe uses a **base WebGL canvas** and a **separate overlay 2D canvas** for notifications. This isolates high-frequency notification rendering from expensive texture regeneration.

## 1. Notification taxonomy and where each is rendered

### 1.1 Globe visual notifications (target cues)

- Implemented in `drawSelectedCountryOverlay(...)` in `WebGlGlobe.tsx` (lines 1573-1690).
- Render target: `overlayCanvasRef` canvas layered above the WebGL canvas (lines 2101-2111).
- Notification types:
  - `classic`, `threeLives`, `streak`: selected country fill + optional ring(s) for small/fragmented countries.
  - `capitals`: center dot + two animated expanding wave rings.

### 1.2 Gameplay result alert (semantic text alert)

- Implemented in `GamePage.tsx` review block (lines 898-912).
- Rendered only when `gameState.status === 'reviewing'` and `lastRound` exists.
- Severity mapping:
  - `correct` -> `success`
  - `incorrect` -> `error`

### 1.3 Load/runtime alerts

- World-data load error:
  - `GamePage.tsx` lines 486-490, `Alert severity="error"`.
- WebGL initialization fallback:
  - `WebGlGlobe.tsx` lines 1893-1906 sets `errorMessage`.
  - Rendered as plain overlay text `WebGL unavailable` (lines 2112-2123), not MUI `Alert`.

### 1.4 Copy status notification

- Daily-share copy action uses button label as notification surface:
  - `Copy results` -> `Copied` or `Copy failed` (lines 865-869).
- State auto-resets to `idle` after 2s (lines 472-484).

## 2. End-to-end control flow for answer notifications

### 2.1 Submit path

1. User submits via `GuessInput` while `playing`.
2. `GamePage.handleSubmit` dispatches `SUBMIT_GUESS` with country + guess + timestamp (lines 398-409).
3. `gameReducer` computes correctness, score delta, round record, and transitions to `status: 'reviewing'` (gameLogic lines 594-660).

### 2.2 Notification state produced by reducer

On `SUBMIT_GUESS`, reducer updates:

- `status = 'reviewing'` (line 631)
- `lastRound = roundRecord` (line 659)
- score/streak/lives/hints fields (lines 632-658)

This is the direct trigger for UI alert visibility and review panel content.

### 2.3 Review notification rendering

When in `reviewing`:

- MUI alert text shows `Correct` or `Incorrect` (GamePage lines 900-912).
- Context details show target country/capital and "You guessed" value (lines 913-947).
- Performance summary cards show time/score/hints (lines 957-993).
- CTA button shows `Next` or `Finish` based on end-of-run evaluation (lines 1004-1005).

### 2.4 Exit from notification state

`ADVANCE_ROUND` transitions either:

- to `gameOver` (lines 667-672), or
- back to `playing` with a new country and fresh round timer (lines 695-705).

So the result alert is intentionally a **single-state notification** (reviewing only), never shown during active play.

## 3. WebGL globe notification architecture

## 3.1 Renderer composition

`WebGlGlobe` composes three visual layers:

1. Background/haze `<div>` (lines 2068-2091).
2. Main WebGL `<canvas>` for globe shading and textures (lines 2092-2100).
3. Overlay `<canvas>` for notification cues (lines 2101-2111).

This split is fundamental: notifications do not require rebuilding the large texture unless theme/assets change.

### 3.2 Why this matters

The main globe path (`drawGlobe`) handles mesh transforms, uniforms, and texture sampling (lines 1412-1571). Notification indicators are drawn in 2D overlay (`drawSelectedCountryOverlay`) every frame or interaction tick. This is cheaper and simpler than baking active notifications into the globe texture.

## 4. Country highlight notification logic (non-capitals modes)

In non-capitals modes (branch at lines 1664-1686):

1. Build ring geometries from `getCountryHighlightRings(country)`.
2. Draw selected country geometry filled with `palette.selectedFill` (lines 1669-1677).
3. Draw ring strokes in `palette.smallCountryCircle` (lines 1679-1685).

### 4.1 Ring generation intricacies

`getCountryHighlightRings` (`globeShared.ts` lines 118-158) uses geographic heuristics:

- If perimeter is tiny (`geoLength < 0.02`), return one ring at centroid radius 1 (lines 121-127).
- Else, only consider MultiPolygon countries with at least 3 parts (lines 130-133).
- Skip rings if total area or largest part area exceeds thresholds (lines 144-149).
- Otherwise return up to 3 rings over meaningful fragments (lines 151-157).

Interpretation: rings are not generic decoration; they are an adaptive discoverability aid for tiny/fragmented geographies.

### 4.2 Projection and clipping behavior

- Overlay projection is orthographic with current rotation/zoom (lines 1616-1621).
- Everything is clipped to visible sphere before drawing (lines 1623-1626).
- This ensures notification cues stay inside globe silhouette and track camera transforms exactly.

## 5. Capital pulse notification logic (capitals mode)

Capitals mode branch (lines 1628-1663):

- Requires numeric `capitalLongitude` and `capitalLatitude` (lines 1629-1632).
- Projects point into current globe view (lines 1633-1636).
- Draws a solid center dot (radius 3, alpha 0.95) (lines 1644-1648).
- Draws 2 animated wave rings, 180 degrees out of phase (`wave * 0.5`) (lines 1650-1660).

Animation details:

- Cycle = `1.6s` (line 1640).
- Ring radius = `4 + phase * 28` (line 1652).
- Ring alpha decays as `0.6 * (1 - phase)` (line 1653).
- Ring width shrinks as `2 - phase * 0.8` (line 1659).

This creates continuous pulse behavior, even when the player is not dragging.

## 6. Notification frame scheduling and performance model

### 6.1 Interaction-driven updates

`useGlobeInteraction` drives camera updates and calls `onFrame` (globeShared lines 319-322). In WebGL mode this callback updates refs and draws immediately (WebGlGlobe lines 1736-1744).

### 6.2 Ambient/idle updates

A separate idle loop runs at `ambientAnimationFps = 12` (line 77; scheduler lines 2029-2033) when either:

- palette has ambient animation properties (`hasAmbientAnimation`) or
- mode is `capitals` (`hasCapitalBlipAnimation`, line 1753).

Because capitals mode enables this unconditionally, pulse notifications animate even at rest.

### 6.3 Visibility throttling

On tab hidden, loop scheduling halts; on visible, it forces redraw then resumes (lines 2041-2048). This avoids background churn for notifications.

## 7. Interaction hooks that influence notification timing

`useGlobeInteraction` (`globeShared.ts` lines 194-504) affects how quickly notification cues settle after input:

- Pointer drag updates target rotation and inertia (lines 382-410).
- Wheel updates zoom target with clamped velocity (lines 434-446).
- Refocus (`focusRequest`) starts smooth interpolation toward target rotation (lines 450-467).
- Animation stops only after rotation/zoom/velocity thresholds settle (lines 324-347).

Implication: notification markers are always camera-locked and naturally eased, not jumpy.

## 8. Theme coupling for notification visuals

Notification colors are theme-driven via `GlobePalette` fields:

- `selectedFill`
- `smallCountryCircle`
- `nightShade`
- atmosphere/grid/rim/specular values used by shader

Interface is defined in `theme.ts` lines 10-45.

UI semantic alert styling is also theme-customized via MUI overrides (`MuiAlert`) in `theme.ts` lines 796-815.

This means both globe and panel notifications are visually coherent per theme, but their implementations are independent (canvas vs MUI).

## 9. WebGL resource lifecycle relevant to notifications

### 9.1 Initialization and fallback

- `initializeWebGl` allocates buffers/textures/program; throws on failure (WebGlGlobe lines 1294-1388).
- Failure sets `errorMessage`; overlay text `WebGL unavailable` is shown (lines 1893-1906 and 2112-2123).

### 9.2 Texture upload strategy

When resources/theme/assets change:

- Base texture uploaded to `resources.texture` (lines 1947-1957).
- Overlay terrain texture for raised-country mode uploaded to `resources.overlayTexture` (lines 1959-1970).
- Relief map uploaded to texture unit 1 (lines 1973-1985).

Notably, initialization path passes `targetFeature: null` to texture builders (lines 1927-1930, 1938-1939), so active-target notification is intentionally delegated to the live 2D overlay pass.

## 10. Non-globe notification state machine details

### 10.1 Game status enum

`GameStatus = 'intro' | 'playing' | 'reviewing' | 'gameOver'` (`types.ts` line 11).

### 10.2 Notification visibility by status

- `intro`: no result alert.
- `playing`: prompt only (`Guess the highlighted country` / `Guess the capital city`, lines 1009-1013).
- `reviewing`: result alert + round details (lines 898-1006).
- `gameOver`: completion summary, share controls (lines 830-897).

### 10.3 Hint notification behavior

There is no transient toast for hints; hint usage is surfaced in review summary (`Hints` stat and `Hint penalty applied`, lines 969-997). Hint action increments reducer counter (`gameLogic.ts` lines 721-725).

## 11. Verified test coverage of notifications

### 11.1 Unit/integration

`GamePage.test.tsx` asserts incorrect-answer alert presence by role and text (lines 205-223).

### 11.2 E2E

`tests/e2e/game.spec.ts` verifies alert role on incorrect answer (line 30), plus copy-status behavior in daily flow (`Copied`, lines 50-54).

Coverage note: globe visual notification rendering (rings/pulses) is not asserted in tests.

## 12. Important intricacies and caveats

1. `Globe` receives `renderer` prop but ignores it; always returns `WebGlGlobe` (`src/Globe.tsx` lines 24-30). So all notification behavior discussed here is effectively the only runtime path.
2. `reviewQueue` and `missedCountryIds` are populated in reducer (gameLogic lines 647-654) but currently not surfaced as dedicated user notifications.
3. Capitals mode relies on capital coordinates being present and numeric; otherwise no marker appears (WebGlGlobe lines 1629-1632).
4. WebGL failure notification is plain text overlay, not semantically marked as ARIA alert.
5. Notification visuals are repainted from mutable refs (`targetFeatureRef`, `paletteRef`, `frameStateRef`) for performance; this reduces React render pressure but makes behavior strongly imperative.

## 13. Practical "how notifications work" model

If you need to reason quickly about this system, use this model:

1. **Game logic decides notification state** by transitioning `playing -> reviewing` and storing `lastRound`.
2. **Panel notifications** are pure React conditional rendering off `gameState.status` + `lastRound`.
3. **Globe notifications** are imperative canvas draws every frame using current camera state.
4. **Interaction and animation loop** determines notification motion smoothness and refresh cadence.
5. **Theme tokens** determine notification color/contrast consistently across both channels.

That is the core architecture and every current notification mechanism fits into it.
