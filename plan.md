# Admin-Only Globe Quality Tuning Plan

## Progress

- [x] Phase 1: Add Quality Types + Theme Defaults
- [x] Phase 2: Add Admin Debug State (Not User Preferences)
- [x] Phase 3: Mount Leva Admin Panel
- [x] Phase 4: Prop Plumbing to WebGL Renderer
- [x] Phase 5: Extend WebGL Resources + Shader Uniforms
- [x] Phase 6: Shader Blend Logic for Day/Night/Water Mask
- [x] Phase 7: Relief Height Control Integration
- [x] Phase 8: Optional Debug Persistence (Admin Only)
- [x] Phase 9: Testing Plan

## Goal

Add **admin/testing controls** for per-theme globe quality parameters in the WebGL renderer, without exposing these controls to regular users.

The admin GUI should control:

1. Relief map enabled/disabled.
2. Relief map height (strength multiplier).
3. Day world imagery enabled/disabled.
4. Night world imagery enabled/disabled.
5. Water mask enabled/disabled (imagery constrained to water areas).

Primary intent: rapid visual testing and tuning of theme quality behavior.

## Key Requirement Change

These are **not user settings**.

- No user-facing settings menu.
- No permanent app preferences UX for quality.
- Controls should be admin/dev only (Leva or dat.gui overlay).

## Non-Goals

- Reworking core game flow or gameplay UI.
- Adding new player-facing options in `ThemeMenu`.
- Replacing current theme system.

## Current State

- Relief texture already exists: `/textures/world-relief.png`.
- Day imagery exists: `/textures/world-imagery.jpg`.
- Night imagery exists: `/textures/world-night.jpg`.
- Water mask exists: `/textures/world-water-mask.png`.
- Current shader supports relief but not day/night/mask blending controls.
- No debug/admin panel currently mounted.

## Target Architecture

### 1. Theme Baseline Quality Profile (Code Defaults)

Each theme gets baseline quality defaults in `theme.ts` for deterministic behavior in production.

### 2. Admin Override Layer (Runtime, Dev/Test)

A debug layer overlays baseline values at runtime when admin GUI is enabled.

- Effective quality = `theme defaults + admin override patch`.
- Override is optional and scoped to testing.

### 3. Renderer Contract

`WebGlGlobe` receives resolved effective quality config and applies it to:

- relief strength,
- day/night imagery usage,
- water mask usage.

## Admin GUI Choice

Use **Leva** for fastest React-native integration.

Why Leva:

- Minimal setup,
- Strong control widgets,
- Easy live updates,
- Works well with React state.

Fallback option: `dat.gui`, but Leva is preferred.

## Visibility and Access Model

Admin GUI should only mount under controlled conditions:

1. `import.meta.env.DEV` OR
2. explicit admin trigger (`?admin=1` query param, local flag, or env gate).

Recommended gate:

- show panel when `import.meta.env.DEV || new URLSearchParams(location.search).has('admin')`.

## Phase 1: Add Quality Types + Theme Defaults

### Files

- `src/app/theme.ts`

### Changes

1. Add quality config type.
2. Add `qualityDefaults` to each `AppThemeDefinition`.
3. Keep conservative defaults to preserve current visuals.

### Snippet

```ts
// src/app/theme.ts
export interface GlobeQualityConfig {
  reliefMapEnabled: boolean;
  reliefHeight: number; // 0..3 multiplier
  dayImageryEnabled: boolean;
  nightImageryEnabled: boolean;
  waterMaskEnabled: boolean;
}

export interface AppThemeDefinition {
  // existing fields...
  globe: GlobePalette;
  qualityDefaults: GlobeQualityConfig;
  preview: ThemePreview;
}
```

## Phase 2: Add Admin Debug State (Not User Preferences)

### Files

- `src/features/game/routes/GamePage.tsx` (or a new hook file)
- `src/features/game/hooks/useGlobeAdminTuning.ts` (new, recommended)

### Changes

1. Introduce optional admin override state.
2. Compute `effectiveQuality` from active theme defaults + overrides.
3. Pass `effectiveQuality` to `Globe`.

### Snippet

```ts
const baseQuality = activeTheme.qualityDefaults;
const [adminOverride, setAdminOverride] = useState<Partial<GlobeQualityConfig>>({});

const effectiveQuality = useMemo(
  () => ({ ...baseQuality, ...adminOverride }),
  [baseQuality, adminOverride],
);
```

No user settings persistence required.

## Phase 3: Mount Leva Admin Panel

### Files

- `src/features/game/ui/GlobeAdminPanel.tsx` (new)
- `src/features/game/routes/GamePage.tsx`

### Changes

1. Add Leva panel component with controls for requested fields.
2. Mount only under admin gate.
3. Keep panel visually unobtrusive and non-blocking.

### Snippet

```tsx
// GlobeAdminPanel.tsx
import { Leva, useControls } from 'leva';

export function GlobeAdminPanel({
  quality,
  onChange,
  visible,
}: {
  quality: GlobeQualityConfig;
  onChange: (patch: Partial<GlobeQualityConfig>) => void;
  visible: boolean;
}) {
  useControls('Globe Quality', {
    reliefMapEnabled: {
      value: quality.reliefMapEnabled,
      onChange: (v: boolean) => onChange({ reliefMapEnabled: v }),
    },
    reliefHeight: {
      value: quality.reliefHeight,
      min: 0,
      max: 3,
      step: 0.05,
      onChange: (v: number) => onChange({ reliefHeight: v }),
    },
    dayImageryEnabled: {
      value: quality.dayImageryEnabled,
      onChange: (v: boolean) => onChange({ dayImageryEnabled: v }),
    },
    nightImageryEnabled: {
      value: quality.nightImageryEnabled,
      onChange: (v: boolean) => onChange({ nightImageryEnabled: v }),
    },
    waterMaskEnabled: {
      value: quality.waterMaskEnabled,
      onChange: (v: boolean) => onChange({ waterMaskEnabled: v }),
    },
  });

  return visible ? <Leva collapsed /> : null;
}
```

## Phase 4: Prop Plumbing to WebGL Renderer

### Files

- `src/Globe.tsx`
- `src/features/game/routes/GamePage.tsx`
- `src/features/game/ui/WebGlGlobe.tsx`

### Changes

1. Add `quality` prop to `Globe` and `WebGlGlobe`.
2. Pass effective admin-resolved quality config from `GamePage`.

### Snippet

```ts
interface GlobeProps {
  // existing props...
  quality: GlobeQualityConfig;
}
```

## Phase 5: Extend WebGL Resources + Shader Uniforms

### Files

- `src/features/game/ui/WebGlGlobe.tsx`

### Changes

1. Add textures:
   - `dayTexture`
   - `nightTexture`
   - `waterMaskTexture`
2. Add uniforms:
   - sampler uniforms for each new texture
   - boolean/float flags for use toggles
3. Bind textures to units 2/3/4.
4. Use 1x1 fallbacks to keep sampler completeness.

### TS Uniform Snippet

```ts
gl.uniform1i(uniforms.texture, 0);
gl.uniform1i(uniforms.reliefTexture, 1);
gl.uniform1i(uniforms.dayTexture, 2);
gl.uniform1i(uniforms.nightTexture, 3);
gl.uniform1i(uniforms.waterMaskTexture, 4);

gl.uniform1f(uniforms.useDayImagery, quality.dayImageryEnabled ? 1 : 0);
gl.uniform1f(uniforms.useNightImagery, quality.nightImageryEnabled ? 1 : 0);
gl.uniform1f(uniforms.useWaterMask, quality.waterMaskEnabled ? 1 : 0);
```

## Phase 6: Shader Blend Logic for Day/Night/Water Mask

### Files

- `src/features/game/ui/WebGlGlobe.tsx` (fragment shader string)

### Changes

1. Sample day/night imagery and water mask.
2. Apply day imagery before night shading blend.
3. Blend to night imagery in night region (`twilight`/umbra weighting).
4. Apply water mask multiplier when enabled.

### GLSL Snippet

```glsl
float mask = (u_useWaterMask > 0.5)
  ? texture2D(u_waterMaskTexture, v_uv).r
  : 1.0;

vec3 dayTex = texture2D(u_dayTexture, v_uv).rgb;
vec3 nightTex = texture2D(u_nightTexture, v_uv).rgb;

vec3 dayColor = mix(baseColor.rgb, dayTex, (u_useDayImagery > 0.5 ? 0.6 : 0.0) * mask);
vec3 nightTarget = mix(u_nightColor, nightTex, (u_useNightImagery > 0.5 ? 1.0 : 0.0) * mask);
vec3 shaded = mix(dayColor, nightTarget, clamp(twilight, 0.0, 1.0));
```

## Phase 7: Relief Height Control Integration

### Files

- `src/features/game/ui/WebGlGlobe.tsx`

### Changes

1. Compute relief strength from quality config.
2. Respect `reliefMapEnabled` hard off state.

### Snippet

```ts
const baseRelief = isAtlas ? 16 : 0;
const reliefStrength = quality.reliefMapEnabled
  ? baseRelief * quality.reliefHeight
  : 0;
```

## Phase 8: Optional Debug Persistence (Admin Only)

This is optional but useful for testing sessions.

If enabled:

- Persist admin overrides in `localStorage` under a debug key.
- Keep this separate from user-facing app preferences.
- Clear overrides with a panel reset action.

### Snippet

```ts
const debugKey = `country-guesser-admin-quality:${activeTheme.id}`;
```

## Phase 9: Testing Plan

### Unit

- Merge logic for `effectiveQuality` from defaults + overrides.
- Admin gate behavior (`DEV` / query param).

### Component

- Admin panel control changes emit expected patches.
- Panel hidden when admin gate is off.

### Integration

- Switching themes changes baseline profile while keeping admin control functional.
- Renderer updates without crashing on rapid toggles.

### Manual Visual QA Checklist

1. Relief on/off works.
2. Relief height responds across range.
3. Day imagery toggle visibly changes day hemisphere.
4. Night imagery toggle visibly changes night hemisphere.
5. Water mask constrains imagery to water when enabled.
6. All toggles work while rotating/zooming.

## Dependencies

Add:

```bash
pnpm add leva
```

(Use `dat.gui` only if you prefer a non-React control surface.)

## File-by-File Change List

1. `src/app/theme.ts`
   - Add `GlobeQualityConfig` and `qualityDefaults` per theme.
2. `src/features/game/hooks/useGlobeAdminTuning.ts` (new, optional)
   - Admin override state + effective quality calculation.
3. `src/features/game/ui/GlobeAdminPanel.tsx` (new)
   - Leva controls.
4. `src/features/game/routes/GamePage.tsx`
   - Admin gate + panel mount + pass `quality` to `Globe`.
5. `src/Globe.tsx`
   - Add `quality` prop passthrough.
6. `src/features/game/ui/WebGlGlobe.tsx`
   - Add textures/uniforms/image loading + shader blending + relief mapping from quality config.

## Rollout Sequence

1. PR 1: Theme defaults + renderer prop plumbing.
2. PR 2: Shader/texture work.
3. PR 3: Admin panel integration.
4. PR 4: Tests + visual tuning pass.

## Acceptance Criteria

1. No player-facing quality settings UI exists.
2. Admin panel is available only under admin/dev gate.
3. Admin panel controls all five requested quality parameters.
4. Renderer reflects live changes instantly.
5. No WebGL errors during theme switches or rapid control updates.
