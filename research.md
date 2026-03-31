# Country Guesser Modernization Research

## Scope

This document is based on a full read of the repository contents on March 31, 2026, plus a quick verification of current official ecosystem baselines for React, Vite, ESLint, `typescript-eslint`, and MUI.

I did not install dependencies because this checkout has no `node_modules` and networked package installation was not available in the current environment. I also could not run the actual Vite or ESLint binaries for that reason. The analysis below is therefore based on source inspection and on attempted script execution from a clean checkout.

## Executive Summary

This project is not an ancient frontend stack, but it is also not in a healthy modern state.

The core runtime stack is already on a mid-2020s baseline:

- React 18.2
- Vite 5
- TypeScript 5.3
- MUI 5
- D3 7

That means the main issue is not "still on Webpack + React 16". The bigger problem is that the repo looks half-migrated:

- package management is old and unpinned
- the install/build workflow is not reproducible from a fresh clone
- linting is declared but not actually configured in the repo
- several packages are in the wrong dependency bucket
- large data files are imported directly into the app bundle
- key React components are weakly typed and contain real maintenance and correctness risks
- documentation and automation are minimal

If the goal is "modern standards", I would treat this as a repo hygiene and architecture upgrade, not just a dependency bump.

## What I Found

### 1. Build and package management are not reproducible

`package.json` is minimal and the repo contains a `yarn.lock`, which implies Yarn Classic, but there is no `packageManager` field and no `engines` field to pin the expected toolchain. See `package.json:1-45`.

Observed issues:

- No `node_modules` directory exists in the checkout.
- `yarn build` fails because `vite` is not installed.
- `yarn lint` fails because `eslint` is not installed.
- The repo does not declare which package manager and version should be used.
- The repo does not declare a supported Node version.

This is the exact failure mode from the current checkout:

- `yarn build` -> `/bin/sh: vite: command not found`
- `yarn lint` -> `/bin/sh: eslint: command not found`

This is normal for a fresh clone with no install step, but a modern repo should make the expected bootstrap path explicit and pinned.

### 2. Linting is declared but appears incomplete

There is a lint script in `package.json:6-10`, but there is no visible ESLint config file in the repository root:

- no `.eslintrc.*`
- no `eslint.config.js`
- no package.json `eslintConfig`

That means even after installing dependencies, linting is likely not in a maintainable "modern standards" state. In 2026, ESLint's flat config is the standard direction, and this repo does not appear to have completed that migration.

### 3. Dependency placement is inconsistent

Several packages that should normally be development-only are in `dependencies` instead of `devDependencies`:

- `prettier` (`package.json:27`)
- `@types/autosuggest-highlight` (`package.json:18`)
- `@types/d3` (`package.json:19`)
- `@types/lodash` (`package.json:20`)
- `@types/topojson-client` (`package.json:21`)

That does not break the app, but it is a sign the dependency graph has not been curated carefully.

There is also stack overlap:

- MUI is present (`package.json:16`)
- `@reach/dialog` is also present (`package.json:17`)
- NiceModal is also present (`package.json:13`)

The app currently mixes three different UI concerns for one modal flow:

- modal orchestration via NiceModal
- dialog rendering via Reach
- form/autocomplete via MUI

That is more surface area than this project needs.

### 4. The repo includes large data assets with weak lifecycle management

Repository data files are large:

- `world.json`: 4.8 MB
- `world-110m.json`: 1.0 MB
- `world-topo.json`: 616 KB
- `world-topo-110m.json`: 106 KB
- `countrymasks.json`: 673 KB

Only the topojson files are used by the app. `countrymasks.json` appears unused, and `world.json` / `world-110m.json` appear to exist as source artifacts rather than runtime inputs.

Problems with the current setup:

- Runtime data is imported directly from project root in `src/App.tsx:4-5`.
- Those imports become part of the JavaScript module graph instead of being handled as explicit static assets.
- The README only contains two data-generation commands (`README.md:1-3`) and does not document the data pipeline, source datasets, or when each file is supposed to be kept.

For a modern build, I would separate:

- source geodata used for preprocessing
- derived runtime assets used by the app
- unused historical artifacts that should be removed

### 5. The app architecture centralizes data in `App.tsx` in a way that couples unrelated components

`App.tsx` exports `land` and `land110m` (`src/App.tsx:15-19`), and other components import from `App`:

- `src/Globe.tsx:14`
- `src/GuessInput.tsx:1`

That creates an avoidable architecture smell:

- `App.tsx` is both the UI root and the data module
- component reuse becomes harder
- module-level work runs at import time

At module load, `App.tsx` also:

- converts topojson to features
- shuffles countries
- derives difficulty buckets
- computes the initial globe rotation

See `src/App.tsx:15-42`.

This is fragile because app state and static data preparation are mixed together in one file.

### 6. There is a real stale-closure bug in round advancement

`updateSelectedCountry` reads `countries`, but its dependency list only includes `countryIndex`:

- definition: `src/App.tsx:59-68`

That means after `onStart` changes the difficulty and replaces the `countries` array (`src/App.tsx:87-91`), the memoized callback can keep using the previous `countries` value until `countryIndex` changes.

In practice, that can make "Next" advance using stale country data after changing difficulty.

This is exactly the kind of issue a stricter modern React + lint setup is supposed to prevent.

### 7. State management is only partially modeled

Several state choices suggest the app grew organically:

- `showGameOver` is `boolean | null` instead of a clearer game-state enum (`src/App.tsx:50`)
- `showAnswer` is a string union in practice but typed as `string | null` (`src/App.tsx:49`)
- `onStart` is untyped (`src/App.tsx:87`)
- the score/timer/game lifecycle is spread across unrelated booleans rather than a single state machine

This is workable for a toy app, but it becomes brittle during refactors.

### 8. Typing is much weaker than the `strict` tsconfig suggests

The TypeScript config enables `strict` (`tsconfig.json:18`), but many public component interfaces are effectively `any` because props are not typed:

- `Globe` props are untyped (`src/Globe.tsx:98`)
- `GuessInput` props are untyped (`src/GuessInput.tsx:32`)
- `AutocompleteHint` props are untyped (`src/GuessInput.tsx:73`)
- `Timer` props are untyped (`src/Timer.tsx:5`)
- modal props are untyped (`src/IntroModal.tsx:12`)
- helper functions in `transformations.tsx` are untyped throughout

There are also several nullability hazards hidden by loose typing:

- `rawCountries` is built with `find`, which can return `undefined` (`src/App.tsx:25-27`)
- `matchingOption` is dereferenced without a guard in the autocomplete Tab handler (`src/GuessInput.tsx:101-108`)
- `newValue` is dereferenced in autocomplete `onChange` without explicit typing or null handling (`src/GuessInput.tsx:94-97`)

This is one of the strongest signals that the repo needs a quality pass beyond version upgrades.

### 9. `GuessInput` contains dead code and duplicated logic

`src/GuessInput.tsx` includes an unused custom hook:

- `useCountryMatch` is defined at `src/GuessInput.tsx:12-30`
- it is not used
- it brings in `useThrottle` solely for dead code

The file also recomputes `countries` on every render (`src/GuessInput.tsx:37`) and has two overlapping matching systems:

- one in the dead hook
- one in `filterOptions`
- one more prefix-match path in `renderInput`

This is not a build-breaker, but it is a maintenance smell.

### 10. `Timer` is not implemented in a modern React style

`src/Timer.tsx` has multiple issues:

- it imports `useModal` and `IntroModal` but does not use them meaningfully (`src/Timer.tsx:1-6`)
- `isPaused` is accepted but ignored (`src/Timer.tsx:5`)
- it mutates DOM text directly through `ref` instead of rendering time through React state (`src/Timer.tsx:10-29`)
- it updates every 10ms, which is high-frequency work for marginal UX value
- `startTime` is never reset when a new game starts (`src/Timer.tsx:8`)

This component is small, but it is not aligned with how the rest of a modern React app should be written.

### 11. `Globe` has the highest concentration of modernization risk

`src/Globe.tsx` is the most complex file in the repo and the most likely source of upgrade pain.

Key issues:

- It mixes React state with imperative D3 DOM/canvas mutation throughout the component.
- Props are untyped (`src/Globe.tsx:98`).
- It queries the first global `canvas` in the document instead of scoping to its own root (`src/Globe.tsx:241-244`).
- The resize effect only depends on `width`, not `height` (`src/Globe.tsx:236-259`).
- The canvas context is scaled by device pixel ratio on reuse without resetting the transform, which can compound scaling across resizes (`src/Globe.tsx:254-255`).
- The drag/zoom effect attaches behaviors but does not explicitly clean them up (`src/Globe.tsx:266-350`).
- The debounced draw function is recreated on each render (`src/Globe.tsx:261-264`).
- The theme has an invalid `rgba(...)` string for `nightShade` because the closing parenthesis is missing (`src/Globe.tsx:67`).

This file is functional but not easy to evolve safely. If there is one place to spend architectural time during modernization, it is here.

### 12. `transformations.tsx` looks like leftover utility code

`src/transformations.tsx` contains multiple helpers with no explicit types, and only `rotateProjectionTo` is currently imported by the app.

Unused exported surface:

- `rotateProjectionBy`
- `throttledRotateProjectionBy`
- `zoomProjectionBy`
- `throttledZoomProjectionBy`

That file also pulls in `lodash` solely for `throttle` (`src/transformations.tsx:2`), which may not be worth carrying if the unused exports are removed or replaced with a small local utility.

### 13. Styling still contains template defaults and ad hoc overrides

`src/index.css` still looks close to Vite starter CSS:

- default font stack (`src/index.css:2`)
- `color-scheme: light dark` (`src/index.css:6`)
- starter button styles (`src/index.css:38-55`)

`src/App.css` then overrides much of that with app-specific styling, including a remote `@font-face` URL to Google-hosted font assets (`src/App.css:1-12`).

The result is not broken, but it is not especially coherent:

- starter defaults remain in the repo
- app styles are layered on top
- some old commented-out CSS remains
- autocomplete styles are heavily customized by class targeting

This is a common sign of a project that never got a final cleanup pass after initial scaffolding.

### 14. Documentation is far below current expectations

The README only documents two data conversion commands (`README.md:1-3`).

Missing documentation:

- how to install dependencies
- required Node version
- which package manager to use
- how to run locally
- how to build
- how to lint
- where the map data comes from
- how to regenerate derived assets
- deployment expectations for the hard-coded Vite `base`

### 15. Deployment configuration is too rigid

`vite.config.ts:5-7` hard-codes:

```ts
base: '/country-guesser/'
```

That may be correct for one GitHub Pages deployment, but it is not portable. A modernized setup should either:

- document this as an intentional deployment constraint, or
- derive it from environment/config for different deploy targets

## Current Stack vs Current Ecosystem Baseline

This repo is behind current majors, but not catastrophically behind.

Repository versions:

- React 18.2 (`package.json:28-29`)
- Vite 5.0 (`package.json:38,43`)
- ESLint 8.53 (`package.json:36-41`)
- `typescript-eslint` 6.14 (`package.json:36-37`)
- MUI 5.15 (`package.json:16`)

Verified current official baselines on March 31, 2026:

- React 19 is the current major line
- Vite 8 is the current major line
- ESLint 9 is the current major line and flat config is the standard config model
- `typescript-eslint` documents flat-config-first setup on its current docs
- MUI 7 is the current major line

That means a modernization pass should target current majors rather than just "latest patch within the old major".

## Recommended Modernization Direction

### Phase 1: Make the repo reproducible

1. Pick and pin a package manager.
2. Add `packageManager` to `package.json`.
3. Add `engines` for Node.
4. Reinstall from scratch and commit a fresh lockfile.
5. Add a real README with setup, run, build, lint, and deploy instructions.

### Phase 2: Fix repo hygiene

1. Move all `@types/*` packages and `prettier` into `devDependencies`.
2. Add ESLint flat config.
3. Add `npm`/`pnpm`/`yarn` scripts for `typecheck`, `format`, and optionally `check`.
4. Remove dead files and dependencies that are truly unused.
5. Expand `.gitignore` beyond just `node_modules` and `yarn-error.log`.

### Phase 3: Untangle architecture

1. Move topojson/data preparation into a dedicated data module.
2. Give all components explicit prop types.
3. Replace ambiguous booleans with a clearer game state model.
4. Fix the stale-closure issue in `App.tsx`.
5. Simplify the modal stack so the app is not mixing MUI, Reach, and NiceModal unnecessarily.

### Phase 4: Refactor the rendering hotspot

1. Isolate D3 globe rendering behind a typed adapter or hook.
2. Fix canvas resize/scaling behavior and cleanup.
3. Remove global DOM selection.
4. Reduce imperative work executed inside React render paths.
5. Add at least a small test surface around game logic and data selection.

### Phase 5: Modernize dependencies intentionally

Suggested upgrade targets:

- React 19
- React DOM 19
- Vite 8
- ESLint 9 with flat config
- current `typescript-eslint`
- MUI 7, or alternatively reduce MUI usage if only autocomplete is needed

I would not do these upgrades blindly. The safer sequence is:

1. repo hygiene
2. typing and architecture cleanup
3. framework/tooling major upgrades
4. verification

## Priority Findings

If I had to rank the most important issues to address first, it would be:

1. Missing reproducible toolchain metadata and incomplete lint setup.
2. Weak typing across core components despite `strict` TypeScript.
3. Real stale-closure bug in `App.tsx`.
4. Fragile imperative canvas/D3 code in `Globe.tsx`.
5. Unclear data asset lifecycle and oversized source artifacts in the repo.

## References

Official ecosystem references checked during this review:

- React blog: https://react.dev/blog
- Vite blog: https://vite.dev/blog/
- ESLint migration docs: https://eslint.org/docs/latest/use/migrate-to-9.0.0
- `typescript-eslint` getting started: https://typescript-eslint.io/getting-started/
- MUI docs: https://mui.com/
