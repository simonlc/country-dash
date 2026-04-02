# React Refactor and Bug-Fix Implementation Plan

## Goal

Restructure the React layer so the app is easier to change, less bug-prone, and more maintainable without changing the product unnecessarily.

This plan is based on the current codebase, especially these hotspots:

- `src/features/game/routes/GamePage.tsx`
- `src/features/game/ui/WebGlGlobe.tsx`
- `src/Globe.tsx`
- `src/features/game/ui/GuessInput.tsx`
- `src/features/game/ui/GlobeAdminPanel.tsx`
- `src/app/router.tsx`

## Notes Incorporated

This revision reflects the latest document notes:

1. Remove the SVG renderer instead of preserving it.
2. Remove fallback-to-SVG planning.
3. Flatten the folder structure significantly.
4. Prefer fewer folders and more files.
5. Use broad buckets like `components`, `hooks`, `utils`, and `routes` instead of deep feature nesting where possible.

## Progress

- [x] Phase 1: Remove dead renderer abstraction and gate router devtools
- [x] Phase 2: Slim `GamePage` without changing behavior
- [x] Phase 3: Flatten and reorganize the globe subsystem
- [x] Phase 4: Simplify `GuessInput`
- [x] Phase 5: Make `GlobeAdminPanel` metadata-driven
- [x] Phase 6: Improve WebGL error handling without fallback
- [x] Phase 7: Performance improvements after structural refactor
- [x] Phase 8: Testing plan implementation
- [x] Phase 9: Cleanup and deletion pass

## Primary Outcomes

1. Reduce the size and responsibility of `GamePage`.
2. Break `WebGlGlobe` into smaller renderer-focused modules.
3. Remove dead renderer abstraction and related dead code.
4. Improve maintainability with a flatter source layout.
5. Improve error handling around WebGL without introducing a second renderer path.
6. Add tests around the high-risk refactor points.

## Confirmed Issues To Address

### 1. Dead renderer abstraction

Current state:

- `Globe` accepts `renderer`
- `GamePage` stores a renderer value
- `SvgGlobe` exists
- `Globe` always renders `WebGlGlobe`

Impact:

- misleading API
- dead path rot
- unnecessary branching in the type system and app model

### 2. `GamePage` is overloaded

Current state:

- session setup
- async world-data loading
- reducer orchestration
- HUD rendering
- bottom-panel rendering
- modal orchestration
- theme-specific decorative rendering
- cipher telemetry strings
- admin-panel mounting

Impact:

- harder code review
- harder regression isolation
- higher coupling between state and presentation

### 3. `WebGlGlobe` is too large

Current state:

- 4000+ lines
- owns rendering setup, shader sources, textures, asset loading, overlays, traffic visualization, and runtime scheduling

Impact:

- hard to reason about
- high regression risk
- difficult to test in pieces

### 4. WebGL error handling is weak

Current state:

- WebGL init failure only shows a text message inside the same component
- there is no cleaner boundary between initialization failure and the rest of the app

Impact:

- poor resilience
- noisy renderer responsibility
- future renderer work remains tightly coupled to error UI

### 5. `GuessInput` duplicates submission logic

Current state:

- form submit handler
- Autocomplete `onKeyDown`
- TextField `onKeyDown`
- duplicate input syncing paths

Impact:

- subtle event bugs
- harder keyboard behavior changes

### 6. `GlobeAdminPanel` is schema-fragile

Current state:

- each quality field is manually declared
- each dependency is manually repeated
- patch construction is manual

Impact:

- new fields are easy to forget
- repetitive code

### 7. Router devtools are always mounted

Current state:

- `TanStackRouterDevtools` is rendered unconditionally in `RootLayout`

Impact:

- unnecessary runtime surface unless intentionally desired

### 8. Test coverage is light where risk is highest

Current state:

- good logic tests
- lighter component coverage around refactor-heavy UI and renderer boundaries

Impact:

- refactors are slower and riskier than necessary

## Non-Goals

- rewriting the game rules
- replacing MUI
- changing the visual identity of existing themes
- converting the app to a new routing or state library
- introducing a new renderer
- keeping `SvgGlobe` alive as a supported path

## Success Criteria

The refactor is successful when:

1. `GamePage` becomes an orchestration shell rather than the main UI monolith.
2. All dead SVG-renderer abstractions are removed.
3. `WebGlGlobe` is split into focused modules with stable contracts.
4. WebGL initialization and runtime errors are handled more cleanly.
5. `GuessInput` has a single submission path.
6. `GlobeAdminPanel` derives its controls from shared metadata.
7. All existing tests pass, typecheck passes, and new targeted tests are added.

## Target Source Layout

Keep the structure flatter than the previous draft. Prefer broad top-level buckets and avoid building a mini-filesystem taxonomy.

```text
src/
  app/
    appearance.tsx
    providers.tsx
    router.tsx
    theme.ts

  routes/
    GamePage.tsx

  components/
    Globe.tsx
    WebGlGlobe.tsx
    GuessInput.tsx
    ThemeMenu.tsx
    ThemePreview.tsx
    GlobeAdminPanel.tsx
    IntroDialog.tsx
    AboutDialog.tsx
    GameTimer.tsx
    GameHud.tsx
    GameStatusPanel.tsx
    GameBackground.tsx
    CipherTelemetryPanel.tsx

  hooks/
    useGamePageState.ts
    useDailyShare.ts
    useGlobeAssets.ts
    useGlobeRenderLoop.ts
    useGlobeAdminTuning.ts
    useWindowSize.ts
    useCipherTraffic.ts

  utils/
    gameLogic.ts
    globeShared.ts
    globeShaders.ts
    globeWebGl.ts
    globeDraw.ts
    globeTextures.ts
    globeAtlasTextures.ts
    globeOverlays.ts
    globeCipherOverlays.ts
    globeHydroOverlays.ts
    loadWorldData.ts
    controlStyles.ts

  test/
    render.tsx
    setup.ts
```

### Layout rules

- avoid deep nesting unless a group has several files and a clear boundary
- prefer `globeX.ts` utility modules over `globe/webgl/x/y/z.ts`
- keep route files very thin
- keep reusable UI in `components`
- keep non-React logic in `utils`
- keep stateful orchestration in `hooks`

## Implementation Strategy

Use small, behavior-preserving phases. Do not refactor `GamePage` and `WebGlGlobe` in one sweep.

Recommended sequence:

1. Remove dead and misleading abstractions first.
2. Create flatter module boundaries without changing behavior.
3. Move logic behind those boundaries.
4. Improve error handling around the existing WebGL renderer.
5. Add tests and then delete the stale code.

## Phase 0: Establish Safety Rails

### Work

1. Run and record baseline checks.
2. Add missing smoke tests before larger file movement.
3. Capture a minimal interaction matrix for manual verification.

### Commands

```sh
pnpm typecheck
pnpm test
pnpm test:e2e
```

### Manual verification checklist

- load app
- start daily run
- start random run
- answer correctly
- answer incorrectly
- capitals mode
- theme switching
- refocus action
- retry action
- quit to menu
- WebGL error state

### Deliverables

- stable baseline before refactor
- list of currently passing tests
- note any flaky tests before starting

## Phase 1: Remove Dead Renderer Abstraction

This phase should happen before the larger file moves.

### 1A. Gate router devtools

#### Files

- `src/app/router.tsx`

#### Change

Only render router devtools in development.

#### Snippet

```tsx
function RootLayout() {
  const showDevtools = import.meta.env.DEV;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Outlet />
      {showDevtools ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </Box>
  );
}
```

### 1B. Remove SVG renderer support entirely

#### Files

- `src/Globe.tsx`
- `src/features/game/routes/GamePage.tsx`
- `src/features/game/types.ts`
- `src/features/game/ui/SvgGlobe.tsx`

#### Changes

- delete `SvgGlobe.tsx`
- remove `GlobeRenderer` if it no longer serves any purpose
- remove `renderer` props from `Globe` and `GamePage`
- remove renderer local-storage logic

#### Snippet

```tsx
interface GlobeProps {
  country: CountryFeature;
  mode: GameMode;
  width: number;
  height: number;
  rotation: [number, number];
  focusRequest: number;
  world: FeatureCollectionLike;
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  themeId: AppThemeId;
  onCipherTrafficStateChange?: (state: CipherTrafficState) => void;
}

function GlobeComponent(props: GlobeProps) {
  return <WebGlGlobe {...props} />;
}
```

#### Follow-up cleanup

Delete or simplify:

- `rendererStorageKey`
- `getStoredRenderer()`
- `GlobeRenderer` type
- renderer writes to local storage
- any tests that imply a dual-renderer design

### 1C. Replace fallback logic with cleaner WebGL error state

Because the SVG renderer is being removed, the plan changes here:

- do not introduce fallback-to-SVG
- instead isolate WebGL failure handling behind a clear boundary

#### Files

- `src/Globe.tsx`
- `src/components/WebGlGlobe.tsx` after move

#### Change

- surface initialization errors into the wrapper or a small boundary component
- render a localized failure state instead of mixing error rendering deep into all renderer logic

#### Snippet

```tsx
function GlobeComponent(props: GlobeProps) {
  const [renderError, setRenderError] = useState<Error | null>(null);

  if (renderError) {
    return <GlobeRenderError message={renderError.message} />;
  }

  return <WebGlGlobe {...props} onRenderError={setRenderError} />;
}
```

## Phase 2: Slim `GamePage` Without Changing Behavior

The goal is to keep `GamePage` as the route entry and orchestration boundary, not the place where all JSX lives.

### Target extractions

Extract these first:

1. `GameBackground`
2. `GameHud`
3. `GameStatusPanel`
4. `CipherTelemetryPanel`
5. `useGamePageState`

### 2A. Create `useGamePageState`

#### Files

- `src/hooks/useGamePageState.ts`
- `src/routes/GamePage.tsx`

#### Move into hook

- world-data loading
- reducer setup
- daily-result persistence
- session start handlers
- refocus/copy/restart/quit handlers
- memoized derived gameplay values

#### Snippet

```ts
export function useGamePageState() {
  const size = useWindowSize();
  const { activeTheme } = useAppearance();
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [gameState, dispatch] = useReducer(
    gameReducer,
    undefined,
    createInitialGameState,
  );

  // move current GamePage logic here

  return {
    size,
    activeTheme,
    worldData,
    loadingError,
    gameState,
    dispatch,
    currentCountry,
    rotation,
    handlers,
    derived,
  };
}
```

### 2B. Extract the top HUD

#### Files

- `src/components/GameHud.tsx`

#### Props

- top metrics
- session labels
- timer state
- refocus handler
- theme surface styles

#### Snippet

```tsx
export function GameHud({
  status,
  sessionModeLabel,
  sessionSummaryLabel,
  score,
  streak,
  correct,
  incorrect,
  livesRemaining,
  elapsedMs,
  runningSince,
  onRefocus,
  panelSurface,
  displaySurface,
  displayAccentSurface,
}: GameHudProps) {
  return (
    <Paper elevation={0} sx={{ ...panelSurface }}>
      {/* move existing HUD JSX here unchanged first */}
    </Paper>
  );
}
```

### 2C. Extract the bottom status panel

#### Files

- `src/components/GameStatusPanel.tsx`

#### Why

This is the most branch-heavy JSX in `GamePage`:

- intro
- playing
- reviewing
- gameOver

#### Snippet

```tsx
export function GameStatusPanel(props: GameStatusPanelProps) {
  switch (props.gameState.status) {
    case 'gameOver':
      return <GameOverView {...props} />;
    case 'reviewing':
      return <ReviewRoundView {...props} />;
    case 'playing':
      return <PlayingView {...props} />;
    default:
      return <IntroHintView {...props} />;
  }
}
```

### 2D. Extract cipher telemetry UI

#### Files

- `src/components/CipherTelemetryPanel.tsx`

#### Why

This logic belongs to the overlay UI layer, not the route coordinator.

### 2E. Extract background presentation

#### Files

- `src/components/GameBackground.tsx`

#### Why

The atlas background treatment is large and visual only. It should not be mixed with game flow.

## Phase 3: Flatten and Reorganize the Globe Subsystem

Status: Completed

This is the highest-value maintainability phase.

Do this by extraction, not rewrite.

### 3A. Move component files to flat locations

#### Moves

- `src/Globe.tsx` -> `src/components/Globe.tsx`
- `src/features/game/ui/WebGlGlobe.tsx` -> `src/components/WebGlGlobe.tsx`
- `src/features/game/ui/GuessInput.tsx` -> `src/components/GuessInput.tsx`
- `src/features/game/ui/ThemeMenu.tsx` -> `src/components/ThemeMenu.tsx`
- `src/features/game/ui/GlobeAdminPanel.tsx` -> `src/components/GlobeAdminPanel.tsx`
- `src/features/game/ui/IntroDialog.tsx` -> `src/components/IntroDialog.tsx`
- `src/features/game/ui/AboutDialog.tsx` -> `src/components/AboutDialog.tsx`
- `src/features/game/ui/GameTimer.tsx` -> `src/components/GameTimer.tsx`

#### Why

- flatter import surface
- easier discoverability
- fewer micro-directories

### 3B. Extract shader sources

#### Files

- `src/utils/globeShaders.ts`

#### Snippet

```ts
export const vertexShaderSource = `...`;
export const fragmentShaderSource = `...`;
```

### 3C. Extract WebGL init and draw functions

#### Files

- `src/utils/globeWebGl.ts`
- `src/utils/globeDraw.ts`

#### Snippet

```ts
export function initializeWebGl(canvas: HTMLCanvasElement): WebGlResources {
  // existing setup code moved here
}

export function drawGlobeFrame(args: DrawGlobeFrameArgs) {
  // existing drawGlobe logic moved here
}
```

### 3D. Extract texture generation

#### Files

- `src/utils/globeTextures.ts`
- `src/utils/globeAtlasTextures.ts`

#### Modules

- generic texture canvas creation
- atlas-specific watercolor and paper treatment
- hydro texture drawing
- city-lights prepared map generation

### 3E. Extract overlay drawing

#### Files

- `src/utils/globeOverlays.ts`
- `src/utils/globeCipherOverlays.ts`
- `src/utils/globeHydroOverlays.ts`

#### Split rule

- `globeOverlays.ts`: generic selected-country and capital overlays
- `globeCipherOverlays.ts`: traffic, annotations, critical sites
- `globeHydroOverlays.ts`: lakes/rivers glow and motion overlays

### 3F. Extract asset loading into hooks

#### Files

- `src/hooks/useGlobeAssets.ts`

#### Why

`WebGlGlobe` currently contains many repetitive loading effects. Move them behind a declarative hook.

#### Snippet

```ts
export function useGlobeAssets(args: UseGlobeAssetsArgs) {
  const reliefImage = useOptionalImage(
    args.quality.reliefMapEnabled,
    '/textures/world-relief.png',
  );

  const dayImageryImage = useOptionalImage(
    args.quality.dayImageryEnabled,
    '/textures/world-imagery.jpg',
  );

  return {
    reliefImage,
    dayImageryImage,
    // ...
  };
}
```

### 3G. Extract render-loop scheduling

#### Files

- `src/hooks/useGlobeRenderLoop.ts`

#### Why

Animation scheduling is currently mixed into the component. It should be reusable and independently testable.

## Phase 4: Simplify `GuessInput`

Status: Completed

This phase is small and worth doing early.

### Change goals

1. One submit function.
2. One input-sync path.
3. Keep the same UX.

### Refactor shape

#### Before

- submit logic in three places
- hint updates in multiple places

#### After

- `submitCurrentValue()`
- `syncInputValue(nextValue)`
- event handlers delegate into those helpers

#### Snippet

```tsx
function submitCurrentValue() {
  const submittedValue = value?.label ?? inputValue.trim();
  if (!submittedValue) {
    return;
  }
  onSubmit(submittedValue);
}

function syncInputValue(nextInputValue: string) {
  setInputValue(nextInputValue);
  const exactMatch =
    choices.find((option) =>
      option.aliases.some(
        (alias) => normalizeGuess(alias) === normalizeGuess(nextInputValue),
      ),
    ) ?? undefined;

  setValue(exactMatch);
  updateHint(nextInputValue);
  setOpen(nextInputValue.trim().length > 0);
}
```

Then the handlers become thinner:

```tsx
onInputChange={(_event, nextInputValue) => {
  syncInputValue(nextInputValue);
}}

onKeyDown={(event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitCurrentValue();
  }
}}
```

## Phase 5: Make `GlobeAdminPanel` Metadata-Driven

Status: Completed

Do not keep field definitions, diff logic, and dependency lists manually synchronized forever.

### Approach

Define one shared schema that contains:

- key
- type
- label/group
- min/max/step when needed

### Files

- `src/utils/globeQualitySchema.ts`
- `src/components/GlobeAdminPanel.tsx`

#### Snippet

```ts
type NumericControl = {
  key: keyof GlobeQualityConfig;
  kind: 'number';
  min: number;
  max: number;
  step: number;
};

type BooleanControl = {
  key: keyof GlobeQualityConfig;
  kind: 'boolean';
};

export const globeQualityControls: Array<NumericControl | BooleanControl> = [
  { key: 'reliefMapEnabled', kind: 'boolean' },
  { key: 'reliefHeight', kind: 'number', min: 0, max: 3, step: 0.05 },
  { key: 'dayImageryEnabled', kind: 'boolean' },
];
```

Then build controls from metadata:

```ts
const levaConfig = Object.fromEntries(
  globeQualityControls.map((control) => {
    if (control.kind === 'boolean') {
      return [control.key, { value: quality[control.key] as boolean }];
    }

    return [
      control.key,
      {
        value: quality[control.key] as number,
        min: control.min,
        max: control.max,
        step: control.step,
      },
    ];
  }),
);
```

## Phase 6: Improve WebGL Error Handling Without Fallback

Status: Completed

Since SVG is being removed, error handling needs to focus on containment and clarity instead of alternate rendering.

### 6A. Add a localized renderer error boundary

Recommended:

- keep renderer failure local to the globe surface
- do not let the whole page collapse if WebGL fails

### 6B. Add a focused error component

#### Files

- `src/components/GlobeRenderError.tsx`

#### Snippet

```tsx
export function GlobeRenderError({ message }: { message: string }) {
  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Typography variant="h6">Globe unavailable</Typography>
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </Paper>
  );
}
```

### 6C. Keep the rest of the page interactive if possible

Desired behavior:

- menu still opens
- theme switch still works
- user can quit or restart
- renderer failure is visible but localized

## Phase 7: Performance Improvements After Structural Refactor

Status: Completed

Do not optimize blindly. Optimize after boundaries are clearer.

### 7A. Reduce unnecessary object recreation in `GamePage`

Candidates:

- grouped props objects passed into child sections
- theme-derived surface style objects

### 7B. Use component boundaries instead of premature memoization

Preferred:

- smaller components with stable props

Avoid:

- adding `useMemo` and `useCallback` everywhere without measurement

### 7C. Cache heavy offscreen texture generation inputs

When texture generation is moved into utility modules, add explicit cache keys where it matters:

- theme id
- quality hash
- texture resolution
- hydro-layer presence

#### Snippet

```ts
const textureCacheKey = JSON.stringify({
  themeId,
  quality,
  textureResolution,
  hasLakes: Boolean(lakesData),
  hasRivers: Boolean(riversData),
});
```

### 7D. Avoid duplicate asset fetch/setup work

Once asset loading moves into hooks, centralize:

- image loading
- geojson loading
- conditional load gates

## Phase 8: Testing Plan

Status: Completed

This plan is incomplete unless tests are added alongside the refactor.

### Required automated coverage

#### 1. `Globe` wrapper behavior

Test:

- renders the WebGL path
- renders the localized error state when the renderer reports an error

#### Snippet

```tsx
it('shows a localized error state when WebGlGlobe reports an error', async () => {
  render(<Globe {...baseProps} />);
  // mock WebGlGlobe failure
  expect(screen.getByText(/globe unavailable/i)).toBeInTheDocument();
});
```

#### 2. `GameStatusPanel`

Test:

- intro branch
- playing branch
- reviewing branch
- gameOver branch

#### 3. `GuessInput`

Test:

- Enter submits once
- Tab accepts hint
- capital mode uses capital options

#### 4. `useGamePageState`

Test:

- starting session creates session plan
- daily share state updates correctly
- refocus increments request id

#### 5. Smoke tests for extracted renderer hooks

Test:

- `useGlobeAssets` skips disabled assets
- `useGlobeRenderLoop` pauses on hidden document

### Regression commands

```sh
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Phase 9: Cleanup and Deletion Pass

Status: Completed

Only do this after all new boundaries are working.

### Remove dead or outdated code

Candidates:

- renderer local-storage code
- `GlobeRenderer` type if unused
- `SvgGlobe.tsx`
- dead props related to renderer selection
- old import paths after file moves
- duplicated helpers left behind in `GamePage` or `WebGlGlobe`

### Verify no stale modules remain

Commands:

```sh
rg "rendererStorageKey|getStoredRenderer|GlobeRenderer|SvgGlobe" src
rg "TODO|FIXME" src
```

## Suggested Execution Order By PR

To reduce merge risk, split the work into small PRs.

### PR 1

- gate router devtools
- remove SVG renderer support
- remove renderer local-storage drift
- introduce localized WebGL error state

### PR 2

- extract `GameHud`
- extract `GameStatusPanel`
- extract `CipherTelemetryPanel`
- extract `GameBackground`
- keep orchestration in `GamePage`

### PR 3

- add `useGamePageState`
- move orchestration logic out of `GamePage`

### PR 4

- move flat component files into `src/components`
- move route file into `src/routes`
- update imports only, no behavior changes

### PR 5

- extract `globeShaders.ts`
- extract `globeWebGl.ts`
- extract `globeDraw.ts`

### PR 6

- extract `globeTextures.ts`
- extract `globeAtlasTextures.ts`
- extract `globeOverlays.ts`
- extract `globeCipherOverlays.ts`
- extract `globeHydroOverlays.ts`
- extract `useGlobeAssets`
- extract `useGlobeRenderLoop`

### PR 7

- simplify `GuessInput`
- metadata-drive `GlobeAdminPanel`

### PR 8

- add or expand tests
- delete remaining stale code
- final cleanup

## Risks and Mitigations

### Risk: Renderer refactor breaks visual behavior

Mitigation:

- extract code first, preserve function signatures where possible
- validate with before/after screenshots when possible

### Risk: `GamePage` refactor changes gameplay flow

Mitigation:

- keep reducer logic untouched
- extract presentation first, orchestration second

### Risk: Flat structure becomes messy

Mitigation:

- use strong file naming conventions
- group by file prefix where needed, for example `globeX.ts`
- keep logic placement rules strict: components in `components`, hooks in `hooks`, non-React logic in `utils`

### Risk: Too much movement in one PR

Mitigation:

- sequence by boundary
- move code without rewriting where possible

## Example End-State Route Composition

After refactor, `GamePage` should look closer to this:

```tsx
export function GamePage() {
  const state = useGamePageState();

  if (state.loadingError) {
    return <GameLoadError message={state.loadingError} />;
  }

  if (!state.worldData || !state.currentCountry) {
    return <GameLoadingScreen />;
  }

  return (
    <Box sx={{ backgroundImage: state.activeTheme.background.app }}>
      <GameBackground theme={state.activeTheme} />

      <Globe
        country={state.currentCountry}
        mode={state.currentMode}
        focusRequest={state.focusRequest}
        height={state.size.height}
        palette={state.activeTheme.globe}
        quality={state.effectiveQuality}
        rotation={state.rotation}
        themeId={state.activeTheme.id}
        width={state.size.width}
        world={state.worldData.world}
        onCipherTrafficStateChange={state.handlers.onCipherTrafficStateChange}
      />

      <ThemeMenu
        onAbout={state.handlers.openAbout}
        onQuit={state.handlers.quitToMenu}
        onRefocus={state.handlers.refocus}
        onRestart={state.handlers.playAgain}
      />

      <GameHud {...state.hudProps} />
      <GameStatusPanel {...state.statusPanelProps} />
      {state.showCipherTelemetry ? (
        <CipherTelemetryPanel {...state.cipherTelemetryProps} />
      ) : null}
      {state.showAdminPanel ? (
        <GlobeAdminPanel {...state.adminPanelProps} />
      ) : null}
    </Box>
  );
}
```

That is the standard to aim for:

- route stays readable
- orchestration stays centralized
- presentation is delegated
- renderer complexity is isolated

## Final Recommendation

Start with the structural cleanup, not the large file moves.

Best first implementation sequence:

1. gate devtools
2. remove SVG renderer support
3. introduce a localized WebGL error state
4. extract `GameStatusPanel`
5. extract `GameHud`
6. extract `useGamePageState`
7. split `WebGlGlobe` by subsystem
8. flatten file placement after the boundaries are stable

That order respects the latest notes and gives the biggest stability and maintainability gains early, while keeping each refactor small enough to verify.
