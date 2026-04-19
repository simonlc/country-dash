# Globe Rendering Deep Dive

## Scope

This document traces the full globe rendering pipeline in `country-dash`, from geometry/data loading to GPU shading, 2D overlays, CSS layers, and animation scheduling. It focuses on:

- where the globe data comes from
- how the app decides what to center and how to draw it
- every rendering pass and effect currently in the pipeline
- what each effect is trying to look like
- the most meaningful performance costs and structural risks

Primary files:

- `src/routes/GamePage.tsx`
- `src/game/globe/GlobeVertical.tsx`
- `src/components/Globe.tsx`
- `src/components/WebGlGlobe.tsx`
- `src/hooks/useGlobeAssets.ts`
- `src/hooks/useGlobeRenderLoop.ts`
- `src/utils/loadWorldData.ts`
- `src/utils/globeTextures.ts`
- `src/utils/globeAtlasTextures.ts`
- `src/utils/globeHydroOverlays.ts`
- `src/utils/globeOverlays.ts`
- `src/utils/globeCipherOverlays.ts`
- `src/utils/globeWebGl.ts`
- `src/utils/globeShaders.ts`
- `src/utils/globeShared.ts`
- `src/app/theme.ts`
- `src/styles/index.css`

---

## 1. High-level rendering map

At runtime, the globe is not a single renderer. It is a stack of systems:

1. **State/data layer**
   - loads and enriches world geometry
   - chooses the current country
   - computes the target rotation

2. **Theme/config layer**
   - decides which rendering features are enabled
   - supplies palette colors, quality toggles, and effect strengths

3. **Static texture baking layer**
   - uses 2D canvas + D3 projections to paint an equirectangular texture atlas
   - optionally paints separate ocean and country textures for raised-land themes

4. **WebGL base globe layer**
   - draws a sphere mesh
   - maps the baked texture onto it
   - applies lighting, night shading, relief, city lights, atmosphere, scanlines, and other shader effects

5. **2D overlay layer**
   - draws the selected-country highlight, capital pulse, cipher overlays, traffic overlay, and animated hydro accents

6. **DOM/CSS effect layer**
   - atlas-only background paper layers
   - theme background gradients
   - an extra atmosphere glow div above the canvas
   - cipher telemetry/transition panels

Visually, the final globe is the composition of all of those layers.

---

## 2. Source assets and geometry preparation

### 2.1 Base geometry

`loadWorldData()` in `src/utils/loadWorldData.ts` loads `public/data/world-topo.json`, converts the first topology object into GeoJSON with `topojson.feature(...)`, and normalizes IDs with `assignUniqueCountryFeatureIds(...)`.

That gives the renderers a `FeatureCollectionLike` where each feature is a country geometry with a stable `id`.

### 2.2 Metadata enrichment

`loadWorldData()` also merges metadata from `world.json` and country/capital packages:

- localized country names
- continent / region / subregion
- capital name and aliases
- capital coordinates
- semantic tags like `microstate`, `islandNation`, `caribbean`, `middleEast`

Rendering uses only part of that data directly, but two fields matter a lot:

1. **country geometry** drives the texture painter and overlay paths
2. **capitalLongitude/capitalLatitude** changes the camera target in capitals mode

### 2.3 When geometry enters rendering

The first render-facing holder is `worldDataAtom`.

`GamePage` calls `loadWorldDataAtom` on mount. Once world data exists:

- `currentCountryAtom` resolves the current feature
- `GlobeVertical` receives `worldData.world`
- `WebGlGlobe` builds textures and overlay paths from `world.features`

---

## 3. Render entrypoint and control flow

### 3.1 Page-level composition

`GamePage.tsx` builds the main visual stack:

1. root fixed container with theme background image via `--app-background`
2. `<GlobeVertical />`
3. `<CipherTelemetryLayer />`
4. HUD / guess / round-status overlays in a pointer-events-none container

So the globe itself is only one part of the page, but it sits at the bottom of the interactive scene.

### 3.2 GlobeVertical: choosing settings and camera target

`GlobeVertical.tsx` is the main controller for globe rendering. It:

- reads the active theme from `useAppearance()`
- reads viewport size from atoms
- reads `worldData`, `currentCountry`, `roundIndex`, `focusRequest`, and game mode
- merges admin overrides with theme defaults via `useGlobeAdminTuning`
- computes the target rotation

Rotation logic:

- **capitals mode**: use `[-capitalLongitude, -capitalLatitude]`
- **all other modes**: use `getInitialRotation(country)` which returns the negative geographic centroid of the country

That means the globe always rotates so the active target is centered on screen.

### 3.3 Globe: error isolation

`Globe.tsx` is a small wrapper around `WebGlGlobe`.

It creates a `resetKey` from:

- country ID
- focus request
- width / height
- mode
- round index
- theme ID

If WebGL setup fails for the current key, it renders `GlobeRenderError` instead of repeatedly retrying the broken frame.

---

## 4. DOM and layer order

From back to front, the stack is:

| Order | Layer                       | Source                            | Purpose                                            |
| ----- | --------------------------- | --------------------------------- | -------------------------------------------------- |
| 1     | Page background             | `GamePage` + CSS variable         | Theme sky/paper/terminal backdrop                  |
| 2     | Atlas background layers     | `GameBackground`                  | Adds parchment/paper framing only in atlas mode    |
| 3     | Globe shell background      | `.globe-shell[data-theme-id=...]` | Theme-local halo behind the globe itself           |
| 4     | Atmosphere div              | `.globe-atmosphere`               | Extra CSS radial glow over the globe container     |
| 5     | WebGL canvas                | `canvasRef`                       | The sphere itself                                  |
| 6     | Overlay canvas              | `overlayCanvasRef`                | Country highlights, capital blips, cipher overlays |
| 7     | Cipher screen transition    | `CipherTransitionOverlay`         | UI overlay during country-to-country transitions   |
| 8     | Cipher telemetry panel      | `CipherTelemetryLayer`            | Theme-specific telemetry chrome                    |
| 9     | HUD / guess / status panels | `GamePage` overlays               | UI controls and gameplay panels                    |

Important detail: the atmosphere glow is **not** part of the shader. It is a separate DOM layer using `mix-blend-screen`.

---

## 5. Asset loading and caches

`useGlobeAssets()` loads optional assets based on theme quality/render settings.

### 5.1 Image assets

- `/textures/world-relief.png`
- `/textures/world-city-lights.jpg`
- `/textures/world-imagery.jpg`
- `/textures/world-night.jpg`
- `/textures/world-water-mask.png`

These are cached in `imageAssetCache`, keyed by URL.

### 5.2 Vector/data assets

- `/data/ne-110m-lakes.geojson`
- `/data/ne-110m-rivers.geojson`
- `/data/cipher-critical-sites.json`

These are cached in `hydroFeatureCollectionCache` and `criticalSitesCache`.

### 5.3 Derived city-light maps

`prepareCityLightsMaps(...)` precomputes two extra canvases:

- `glow`
- `pollution`

These are cached in `cityLightsMapsCache`.

Those derived canvases are important because the shader expects:

- raw city lights
- blurred city glow
- wider blurred pollution spread

### 5.4 Cipher traffic source

`useCipherTraffic()` currently returns **mock sample data** from `src/data/cipher-traffic-sample.json`. The `endpoint` argument is effectively unused right now.

So the traffic overlay is visually implemented, but the current runtime behavior is a simulated feed, not a live network-backed one.

---

## 6. Texture baking pipeline

The globe texture is built on the CPU with 2D canvas before WebGL ever draws a frame.

The render path splits in two depending on `palette.countryElevation`.

### 6.1 Texture resolution

`getTextureResolution(gl, width, height)` chooses:

- `4096` for very large viewports
- `2048` for medium-large viewports
- `1024` otherwise

Texture size is based on `max(width, height) * devicePixelRatio * 2`, capped by `MAX_TEXTURE_SIZE` and then by `4096`.

### 6.2 Cache key

`WebGlGlobe` caches baked textures in `textureCacheRef`, keyed by:

- theme ID
- palette
- quality
- texture render config
- texture resolution
- presence of lakes/rivers
- raised-country mode flag
- world feature count

Cache size is capped at **12 entries**.

### 6.3 Standard path: one combined texture

If `palette.countryElevation <= 0`, the renderer uses `buildCombinedTextureCanvas(...)`.

Pass order:

1. **Ocean fill**
   - fills the entire atlas with `palette.oceanFill`
   - intended result: base sea color

2. **Atlas watercolor ocean** (atlas theme only)
   - `applyAtlasWatercolorOcean`
   - intended result: washed paper seas, pigment blooms, wavy engraved water movement

3. **Atlas ocean current hatching** (atlas theme only)
   - `applyAtlasOceanCurrentHatching`
   - intended result: old-map current lines

4. **Atlas parchment aging** (atlas theme only)
   - `applyAtlasParchmentAging`
   - intended result: darkened paper edges, folds, warm blotches, worn age marks

5. **Atlas expedition details** (atlas theme only)
   - `drawAtlasExpeditionDetails`
   - intended result: decorative exploration circles and margin-note scribbles

6. **Atlas watercolor land wash** (atlas theme only)
   - `applyAtlasWatercolorLand`
   - intended result: soft tan paper wash clipped to land

7. **Atlas biome watercolor** (atlas theme only)
   - `applyAtlasBiomeWatercolor`
   - intended result: painterly biome hints over landmasses; broad green/desert/tundra color zones

8. **Atlas coastal wash** (atlas theme only)
   - `applyAtlasCoastalWash`
   - intended result: soft shoreline halos to separate land from sea

9. **Graticule**
   - normal mode: solid with `standardGraticuleLineWidth`
   - atlas mode: can be dashed with atlas width/opacity config
   - intended result: latitude/longitude scaffolding

10. **Country shadow**
    - `applyCountryShadow`
    - intended result: depth / subtle emboss shadow under country shapes

11. **Country flat fill** (only when atlas style is off)
    - `drawFeatureFills`
    - intended result: plain filled countries

12. **Hydro texture layers**
    - `drawHydroLayers`
    - intended result: lakes and rivers painted into the map texture, optionally with cipher-style glow treatment

13. **Country strokes**
    - `drawFeatureStrokes`
    - intended result: country borders

14. **Atlas ink coastline** (atlas theme only)
    - `applyAtlasInkCoastline`
    - intended result: dark ink outline with lighter highlight rim

15. **Atlas ink bleed** (atlas theme only)
    - `applyAtlasInkBleed`
    - intended result: slightly fuzzy printed-ink bleed around coasts/borders

16. **Country deboss**
    - `applyCountryDeboss`
    - intended result: engraved edges with light/dark offset strokes

### 6.4 Raised-country path: separate ocean and country textures

If `palette.countryElevation > 0`, the renderer splits into:

- `buildOceanTextureCanvas(...)`
- `buildCountryTextureCanvas(...)`

This is used to draw the sphere twice in WebGL:

1. base globe with ocean texture
2. second pass with a slightly larger `u_surfaceScale`

Intended result: countries sit slightly above the ocean like a relief model.

#### Ocean texture pass order

1. ocean fill
2. optional atlas biome watercolor
3. atlas watercolor ocean
4. atlas ocean hatching
5. atlas parchment aging
6. atlas coastal wash / ink coastline / ink bleed
7. country shadow

This texture deliberately includes shadows and some land-adjacent treatment so the raised country pass appears to cast onto the ocean base.

#### Country texture pass order

1. clear background
2. optional atlas parchment aging
3. atlas expedition details
4. atlas watercolor land
5. atlas biome watercolor
6. atlas coastal wash
7. graticule
8. flat land fill when atlas is off
9. hydro layers
10. border strokes
11. atlas ink coastline
12. atlas ink bleed
13. country deboss

This second texture is what gets drawn during the elevated overlay WebGL pass.

---

## 7. Atlas and hydro effect catalog

### 7.1 Atlas texture effects

| Effect                 | Function                         | What it does                                                      | Intended visual result          |
| ---------------------- | -------------------------------- | ----------------------------------------------------------------- | ------------------------------- |
| Parchment aging        | `applyAtlasParchmentAging`       | radial darkening, warm bloom, stains, fold lines, soft-light veil | aged paper prop                 |
| Biome watercolor       | `applyAtlasBiomeWatercolor`      | blurred radial color regions clipped to land                      | painterly biome tinting         |
| Ocean watercolor       | `applyAtlasWatercolorOcean`      | washes, blots, wave bands, speckles                               | hand-painted seas               |
| Ocean current hatching | `applyAtlasOceanCurrentHatching` | repeated wavering horizontal strokes                              | engraved current directions     |
| Land watercolor        | `applyAtlasWatercolorLand`       | tan wash + blot textures clipped to land                          | soft parchment land fill        |
| Ink bleed              | `applyAtlasInkBleed`             | shadow-blurred strokes on borders                                 | printed ink spread              |
| Ink coastline          | `applyAtlasInkCoastline`         | dark main stroke + warm outer stroke + light highlight stroke     | precise cartographic coastlines |
| Coastal wash           | `applyAtlasCoastalWash`          | wide and narrow shoreline strokes                                 | sea-edge glow / surf halo       |
| Expedition details     | `drawAtlasExpeditionDetails`     | dashed giant circles + margin note scribbles                      | exploration-map ornament        |
| Land hachure           | `applyAtlasLandHachure`          | diagonal hatch clipped to land                                    | unused in current pipeline      |

`applyAtlasLandHachure(...)` is notable because it exists but is not called by the active globe texture builders.

### 7.2 Hydro texture effects

`drawHydroLayers(...)` handles baked lakes/rivers.

#### Lakes

When enabled:

1. optional cipher glow pass
   - screen composite
   - blurred lake fill
   - clipped gradient wash
   - diagonal line texture
   - bright outline stroke
   - intended result: energized / glowing inland water

2. standard lake fill
   - fill each lake polygon
   - intended result: visible lake bodies

#### Rivers

When enabled:

1. optional cipher glow stroke
   - wide blurred screen stroke
   - intended result: luminous river channels

2. normal river stroke
   - opaque rounded line stroke
   - intended result: readable river network

3. optional secondary glow accent
   - thinner brighter screen stroke
   - intended result: electric edge highlight

### 7.3 Country surface depth effects

| Effect         | Function             | Result                                                   |
| -------------- | -------------------- | -------------------------------------------------------- |
| Country shadow | `applyCountryShadow` | soft drop shadow or radial blur halo under land          |
| Country deboss | `applyCountryDeboss` | engraved border edges with light and dark offset strokes |

---

## 8. WebGL initialization and GPU state

`initializeWebGl(canvas)` does all one-time GPU setup.

### 8.1 Context configuration

It requests:

- `webgl`
- `alpha: true`
- `antialias: true`
- `desynchronized: true`
- `powerPreference: 'high-performance'`

### 8.2 Mesh

`createSphereMesh(96, 192)` builds:

- sphere positions
- UVs
- triangle indices

That is a UV-mapped sphere fine enough for smooth curves without being extremely dense.

### 8.3 Textures allocated

The renderer allocates:

- base texture
- overlay texture
- relief texture
- city lights texture
- city lights glow texture
- city lights pollution texture
- day imagery texture
- night imagery texture
- water mask texture

Before real assets arrive, most of them are initialized with solid 1x1 pixels so the shader can run immediately.

### 8.4 Uniform model

Uniforms cover:

- lighting and sun direction
- atmosphere, rim light, aurora, specular
- relief strength and texel size
- city light and pollution controls
- scanlines and noise
- texture use toggles
- rotation and sphere scale

This is a fairly feature-rich shader for a simple globe app; much of the final look is driven by uniforms rather than separate passes.

---

## 9. Shader pipeline: every major effect

The base GPU look is in `src/utils/globeShaders.ts`.

### 9.1 Vertex shader

The vertex shader is simple:

1. rotate sphere positions with `u_rotationMatrix`
2. optionally scale the surface with `u_surfaceScale`
3. apply aspect-correct screen scaling with `u_scale`
4. pass UV, rotated normal, and original surface normal to the fragment shader

Intended result:

- the globe rotates
- raised-country themes can draw a slightly expanded second shell

### 9.2 Fragment shader effect order

The fragment shader is where most of the live lighting happens.

#### 1. Sample base textures

It samples:

- baked base texture
- day imagery
- night imagery
- water mask

Intended result: establish the raw material for day/night blending.

#### 2. Relief sampling and normal perturbation

If relief is enabled:

- sample west/east/north/south texels from the relief texture
- estimate slope
- build a perturbed normal
- blend it in only where relief brightness says terrain exists

Intended result: fake terrain normal mapping without real geometry displacement.

#### 3. Day/night separation

Using `u_sunDirection`, it computes:

- direct light
- twilight blend
- night-side mask
- umbra darkness

Intended result: moving daylight, twilight band, and dark night hemisphere.

#### 4. Day/night imagery mixing

- mixes baked color with day imagery when enabled
- uses the water mask to bias imagery more strongly over water
- mixes in fallback night tint or night imagery on the dark side

Intended result: optional photographic enhancement, especially for oceans/night if those maps are enabled.

#### 5. Paper/surface distortion

- computes `paperFiber` and `paperTooth` from FBM noise
- perturbs the normal slightly using east/north tangent directions

Intended result: surface texture that feels less perfectly smooth and more material-like.

#### 6. Rim light

- based on surface facing angle
- amplified by day visibility

Intended result: halo on the sphere edge, stronger in glow-heavy themes.

#### 7. Specular highlight

- reflect-based specular using `u_specularPower` and `u_specularStrength`

Intended result: glossy or glassy sheen depending on theme.

#### 8. Vellum sheen / fresnel

- extra highlight from half-vector and fresnel terms

Intended result:

- atlas themes: subtle paper sheen
- cipher/glacier themes: extra polished edge brightness

#### 9. Grid lines

- UV-based longitude and latitude lines
- scaled by `u_gridStrength`

Intended result: holographic or technical grid, mainly visible in cipher.

#### 10. Fast scanlines

- sine wave along `v_uv.y`
- controlled by `u_scanlineDensity` and `u_scanlineStrength`

Intended result: CRT / HUD scan shimmer.

#### 11. Slow scanline sweep

- sweeping band along a tilted axis
- built from core, glow, and tail masks

Intended result: a broad radar sweep traveling across the globe surface.

#### 12. Aurora

- sine-based band modulated by rim and daylight

Intended result: faint polar glow in themes that enable it.

#### 13. Grain and parchment speckle

- hash grain
- FBM paper speckle

Intended result:

- subtle analog noise
- paper tooth / material grain

#### 14. Relief highlight and relief shadow

- compares relief-normal light with base-normal light

Intended result: terrain catches more light on lit slopes and darkens in recesses.

#### 15. Atmosphere tint

- simple additive tint based on direct light and rim

Intended result: soft atmospheric haze around the lit globe.

#### 16. City lights

If enabled:

- sample raw city lights map
- sample glow and pollution maps
- compress radiance
- threshold city core signal
- add city emission only on the night side

Intended result: bright urban lights visible only where sunlight is absent.

#### 17. Light pollution

- uses wider pollution map
- scaled by facing angle and atmosphere path

Intended result: broad urban glow bloom extending beyond city cores.

#### 18. Final composition

Adds together:

- shaded base color
- atmosphere
- grid and scanlines
- slow scanline glow
- rim light and aurora
- specular
- vellum/fresnel accents
- relief highlight/shadow
- speckle and grain
- pollution
- city emission

Then clamps to `[0, 1]`.

---

## 10. Base draw call behavior

`drawGlobe(...)` is the per-frame WebGL entrypoint.

Each base frame:

1. resizes the canvas backing store to `width * DPR` / `height * DPR` if needed
2. computes aspect-correct sphere scale
3. writes the rotation matrix
4. rotates the cached sun direction into globe space
5. resolves palette/quality colors into numeric uniforms
6. binds textures
7. draws the sphere mesh

If `palette.countryElevation > 0`, it then performs a **second draw**:

- disables atmosphere/city-light/grid/specular extras
- sets `u_surfaceScale = 1 + countryElevation`
- binds `overlayTexture`
- enables alpha blending
- draws the sphere again

Intended result: elevated land sitting above the ocean.

---

## 11. Overlay canvas pipeline

The overlay is fully separate from WebGL and is drawn by `drawSelectedCountryOverlay(...)` in `src/utils/globeOverlays.ts`.

### 11.1 Common setup

Every overlay frame:

1. resize the overlay canvas to DPR-scaled size if needed
2. clear it
3. build a fresh `geoOrthographic()` projection using:
   - current width/height
   - current zoom
   - current rotation
4. create a path from that projection
5. clip drawing to the sphere

The overlay therefore always matches the current camera.

### 11.2 Pass order

Inside the clipped sphere, pass order is:

1. **Cipher hydro overlay** if enabled
2. **Cipher traffic overlay** if enabled
3. **Mode-specific target overlay**
   - capitals mode: capital dot + radar rings
   - non-capitals: either cipher overlays or plain selected-country highlight
4. **Cipher map annotations** if enabled

### 11.3 Capitals mode effect

When the current country has capital coordinates:

- draw a solid center dot at the capital
- draw two expanding pulse rings offset by phase

Intended result: clear radar-like target marker for capitals gameplay.

### 11.4 Standard selected-country effect

If no cipher special overlay is active, the app:

1. fills and strokes the country in `palette.selectedFill`
2. optionally draws extra circle rings for compact or fragmented countries via `getCountryHighlightRings(...)`

The ring logic is specifically trying to help with tiny or scattered geographies that would otherwise be too hard to spot.

### 11.5 Cipher selected-country overlay

`drawCipherSelectedCountryOverlay(...)` adds a much richer highlight:

1. clip to the selected country
2. fill with a diagonal gradient wash
3. draw a screen-blended grid inside the country bounds
4. draw a moving sweep beam across the country
5. stroke the border with glow
6. pulse a centroid beacon
7. draw static and dashed highlight rings

Intended result: "locked target in tactical HUD" rather than a simple fill.

### 11.6 Cipher map annotations

`drawCipherMapAnnotations(...)` draws:

- dashed leader line from country to side label
- dark HUD label box
- status text like lock/redacted labels
- blinking status block

Intended result: spy-console annotation card anchored to the selected country.

### 11.7 Cipher country transition overlay

During round changes, `drawCipherCountryTransitionOverlay(...)` animates:

1. a global radial field tint
2. dashed outline on previous country
3. glowing outline on next country
4. three curved route variants between centroids
5. traveling "packet" rectangles along the primary route
6. endpoint rings around source and destination

Intended result: the target "handoff" from one country to the next, with data-transfer semantics.

### 11.8 Cipher hydro overlay

`drawCipherHydroOverlay(...)` adds live animated water effects on top of the baked hydro texture.

For lakes:

- lattice of blinking horizontal glyphs clipped to visible lakes
- animated dashed perimeter tracers on up to 18 visible lakes

For rivers:

- several layered dashed strokes with different widths and speeds

Intended result: animated data-flow / power-grid styling over waterways.

### 11.9 Cipher traffic overlay

`drawCipherTrafficOverlay(...)` draws:

1. critical-site markers
   - pulsing red rings and crosshairs
   - labels like power/water short tags

2. aircraft markers
   - arrowhead marker rotated to heading
   - ping ring around each track

3. track labels
   - callsign / velocity for up to 8 tracks

Tracks are filtered to the visible hemisphere, sorted by display priority, and animated forward from their last sample using heading and velocity.

Intended result: active tactical airspace.

---

## 12. Animation and interaction scheduling

### 12.1 Interaction model

`useGlobeInteraction(...)` handles:

- pointer drag rotation
- pinch zoom + pan
- wheel zoom
- inertial decay after release
- delayed focus snap after round changes

It does not rely on React state updates for every frame in this usage; `WebGlGlobe` passes `useStateUpdates: false`, so the draw path uses refs and manual callbacks for lower render overhead.

### 12.2 Focus behavior

`focusRequest` is incremented:

- when a session starts
- when the user explicitly refocuses

That triggers the globe to animate back to the target rotation.

In cipher theme, `cipherFocusDelayMs` delays that recentering on later rounds, which gives the transition overlay time to play before the camera settles.

### 12.3 Render loop

`useGlobeRenderLoop(...)` uses:

- `setTimeout(..., 1000 / 12)`
- then `requestAnimationFrame(...)`

So ambient and overlay animations run at about **12 FPS**, not full 60 FPS.

This is an explicit tradeoff:

- lower CPU/GPU cost
- but visibly stepped animation for pulses, scanlines, and traffic markers

### 12.4 What counts as animation

Base redraw loop runs when `hasAmbientAnimation(palette)` is true, which currently means any of:

- `auroraStrength > 0`
- `gridStrength > 0`
- `noiseStrength > 0`
- `scanlineStrength > 0`

Overlay redraw loop runs when any of:

- capitals pulse is active
- cipher hydro overlay is enabled
- cipher map annotations are enabled
- cipher selected-country overlay is enabled
- cipher country transition is active
- cipher traffic overlay is active

### 12.5 Visibility handling

When the document becomes hidden, the loop stops scheduling frames. On visibility return, it draws one fresh frame and resumes.

---

## 13. Theme-specific rendering behavior

### 13.1 Default-style themes

Themes like `daybreak`, `midnight`, `ember` mostly rely on:

- baked flat texture
- shader lighting
- small amounts of atmosphere/noise/rim light
- no special atlas/cipher overlays

Their globe look mainly comes from palette and shader uniform differences.

### 13.2 Atlas theme

Atlas turns on nearly all atlas texture passes:

- watercolor ocean
- watercolor land
- biome watercolor
- coastal wash
- ocean current hatching
- parchment aging
- ink coastline
- ink bleed
- expedition details

It also adds:

- eight DOM atlas background layers
- softer atmosphere glow
- muted lighting

Net result: a prop-like printed antique globe/map hybrid.

### 13.3 Cipher theme

Cipher turns on:

- scanlines
- stronger grid / rim / atmosphere / aurora
- city lights + pollution
- hydro texture effect
- hydro overlay
- selected-country overlay
- transition overlay
- map annotations
- traffic overlay
- telemetry layer

Net result: the most animated and computationally heavy theme by far.

### 13.4 Glacier theme

Glacier is the notable **raised-country** theme:

- `countryElevation > 0`
- large shadow blur
- dual-pass sphere draw

Net result: frosted relief globe with elevated land.

---

## 14. Performance findings

### 14.1 Highest-impact issues

| Severity    | Issue                                                                 | Where                                                                 | Why it is expensive                                                                                       | Likely impact                                                                        |
| ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| High        | Ambient redraw is almost always on                                    | `hasAmbientAnimation()`                                               | `noiseStrength > 0` counts as animation, and most themes have non-zero noise                              | Constant 12 FPS redraw even when globe looks static                                  |
| High        | Texture cache can retain very large canvases                          | `textureCacheRef` in `WebGlGlobe`                                     | Up to 12 cached entries, each potentially `4096x2048`; raised themes may store two canvases per entry     | Large memory footprint, especially on desktop/high-DPR or during theme/admin changes |
| High        | City-light preprocessing is multi-pass and synchronous on main thread | `prepareCityLightsMaps()` / `buildCityLightsCompositeTextureCanvas()` | Multiple blur passes, multiple temporary canvases, wrapped triple-width canvases                          | Noticeable jank when first enabling or retuning city-light effects                   |
| High        | Glacier raised-country shadow generation is extremely heavy           | `applyCountryShadow()`                                                | In raised mode it uses up to 56 radial steps and redraws every feature each step                          | Slow texture bake for glacier-like themes                                            |
| Medium-High | Overlay path work repeats every animated frame                        | `drawSelectedCountryOverlay()` and helpers                            | Rebuilds orthographic projection, reprojects hydro/traffic features, redraws complex overlays every frame | CPU load in cipher and capitals modes                                                |
| Medium      | Country-transition routes are recomputed every frame                  | `drawCipherCountryTransitionOverlay()`                                | Rebuilds three 40-point interpolated routes on each overlay frame                                         | Unnecessary per-frame CPU during transitions                                         |
| Medium      | Full GPU texture uploads repeat on dependency changes                 | texture-update effect in `WebGlGlobe`                                 | `texImage2D` uploads all relevant textures again after resize/theme/asset changes                         | Expensive on mobile or during layout changes                                         |
| Medium      | Derived city-light cache is unbounded                                 | `cityLightsMapsCache`                                                 | No eviction; each glow/spread combination creates more canvases                                           | Memory growth if admin tuning is used heavily                                        |
| Low-Medium  | Atlas background uses many full-screen blended layers                 | `GameBackground` + CSS                                                | Multiple radial gradients, masks, mix-blends, inset shadows                                               | Extra compositing cost in atlas theme                                                |

### 14.2 Detailed notes

### A. Ambient redraw is broader than it looks

The current gate is:

- aurora
- grid
- noise
- scanlines

The surprising part is **noise**. Very small `noiseStrength` values still keep the globe on a permanent 12 FPS loop.

That means themes that visually look mostly static still consume steady GPU/CPU time.

### B. Texture cache memory can get very large

At `4096 x 2048`, one RGBA canvas is about:

- `4096 * 2048 * 4 ~= 33.6 MB`

Worst-case cache pressure:

- 12 cached base textures ~= 403 MB raw backing-store memory
- raised-country entries can also keep a second country texture, pushing worst-case raw memory far higher

That is only the JS-side canvas memory; it does not include corresponding GPU texture memory after upload.

### C. City-light prep is one of the heaviest CPU steps

`prepareCityLightsMaps()` builds:

- one glow map
- one pollution map

Each uses several blur passes, and each pass creates temporary canvases. Because wrapping is simulated by drawing the source image three times side-by-side, some temporary canvases are **triple width**.

This is visually sound, but it is costly.

### D. Glacier/raised-country mode multiplies bake cost

Raised-country rendering is expensive because it does all of the following:

1. builds two separate texture atlases
2. runs `applyCountryShadow()` in raised mode
3. draws the sphere twice in WebGL every frame

The most expensive part is `applyCountryShadow()`, because it loops multiple blur steps and repaints all features each time.

### E. Cipher overlay is CPU-heavy by design

The cipher theme layers many CPU-side 2D effects:

- hydro overlay
- traffic overlay
- selected-country HUD overlay
- route transition overlay
- map annotations

Those are not shader effects; they are canvas path work executed on the main thread.

The traffic overlay in particular:

- filters visible tracks
- animates projected positions
- reprojects them
- draws markers
- draws labels

That is reasonable for the current mocked data size, but it is the most likely area to grow badly if live data volume increases later.

### F. Transition route computation is currently wasteful

`drawCipherCountryTransitionOverlay()` rebuilds the same three route coordinate arrays every overlay frame, even though:

- the start country is fixed
- the end country is fixed
- the route geometry is fixed for the life of the transition

This work should be precomputed once per transition and reused.

### G. Uploading textures after every significant dependency change is safe but expensive

The main texture effect re-uploads:

- base texture
- overlay texture if present
- relief map
- city lights
- city glow / pollution maps
- day/night imagery
- water mask

This is fine when changes are infrequent, but viewport changes or admin tuning can make it expensive.

### H. A few caches hold onto data indefinitely

Not all caches evict:

- `cityLightsMapsCache` has no cap
- hydro and critical-site caches never clear

That is mostly acceptable for static assets, but the derived city-light cache can grow if many parameter combinations are explored.

---

## 15. Rendering quirks and noteworthy observations

### 15.1 The atmosphere is split across shader and CSS

There are two separate "atmosphere" concepts:

1. **shader atmosphere**
   - additive tint around lit areas

2. **CSS atmosphere div**
   - radial gradient DOM element with `mix-blend-screen`

The shader gives physical-ish globe glow; the CSS layer gives extra compositing punch.

### 15.2 Traffic is visually live but logically mocked

The cipher traffic overlay is architected as if it were live, but `useCipherTraffic()` currently returns memoized mock data when enabled.

So:

- the projection, filtering, animation, and labeling are real
- the feed itself is not live yet

### 15.3 Small-country highlighting is intentionally adaptive

`getCountryHighlightRings()` only adds circle markers for:

- compact countries
- fragmented tiny multi-part countries

That is a gameplay readability feature, not just styling.

### 15.4 Atlas land hachure exists but is inactive

`applyAtlasLandHachure()` looks like a valid atlas effect but is not called by the active texture builders.

It is effectively dormant code in the current globe pipeline.

---

## 16. End-to-end lifecycle walkthrough

1. `GamePage` mounts and loads world data.
2. `loadWorldData()` converts topology to features and enriches metadata.
3. `currentCountryAtom` resolves the active feature.
4. `GlobeVertical` picks theme settings and computes target rotation.
5. `Globe` passes props into `WebGlGlobe`.
6. `useGlobeAssets()` loads optional textures, hydro data, and cipher assets.
7. `WebGlGlobe` initializes WebGL if needed.
8. It chooses a texture resolution and either:
   - reads a baked texture set from cache, or
   - bakes a new one with 2D canvas passes
9. The baked canvases are uploaded as GPU textures.
10. `drawGlobe()` renders the sphere with the fragment shader.
11. `drawSelectedCountryOverlay()` renders the 2D overlay canvas on top.
12. `useGlobeRenderLoop()` keeps ambient and overlay animation running at about 12 FPS when required.
13. User interaction updates rotation/zoom through `useGlobeInteraction()`, which triggers redraws directly through refs.
14. On round changes, focus snaps, transition overlays, and mode-specific target effects update the scene.

---

## 17. Bottom line

The globe renderer is a layered system with three distinct personalities:

- **standard themes**: mostly shader-driven globe lighting with a baked political texture
- **atlas**: heavily CPU-baked painterly/cartographic textures plus parchment-style DOM framing
- **cipher**: shader-heavy base globe plus substantial CPU-driven animated overlays and tactical UI chrome

The biggest performance risks are not the shader alone. They are the combination of:

- always-on ambient redraws triggered by tiny noise values
- very large baked texture caches
- expensive city-light preprocessing
- raised-country shadow generation
- repeated CPU-side overlay/path work in cipher mode

Architecturally, the pipeline is clear and well separated, but the app is paying for a lot of its look with CPU-side canvas work and persistent texture memory rather than with a minimal static globe.
