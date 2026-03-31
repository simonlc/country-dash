# Country Guesser Modernization Plan

## Goal

Modernize the project to a maintainable 2026 frontend stack with:

- fast local dev and production builds
- automatic GitHub Pages deployment
- up-to-date React
- a modern UI library
- stronger linting and typechecking
- unit/integration/end-to-end testing
- a cleaner app structure that is easier to extend

## Recommended Target Stack

This is the stack I recommend implementing.

### Core

- React 19
- TypeScript 5.x
- Vite 8
- TanStack Router

### UI

- MUI 7

### Quality

- ESLint 9 flat config
- `typescript-eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y`
- `eslint-plugin-import-x`
- Prettier 3

### Testing

- Vitest
- React Testing Library
- Playwright
- `@vitest/coverage-v8`

### Deployment

- GitHub Actions
- GitHub Pages static deployment

## Why This Stack

### React 19

React 19 is the current stable major line and should be the baseline unless there is a blocker.

### Vite 8

Vite 8 is the highest-leverage build upgrade here. It directly addresses fast builds and fast local feedback loops.

### TanStack Router, not TanStack Start

TanStack Start is interesting, but I do not recommend it for this project right now.

Reasons:

- GitHub Pages is static hosting.
- This app does not need SSR, server actions, or streaming.
- TanStack Start adds framework complexity that does not improve the current deployment target.
- TanStack Router alone gives type-safe routing and a modern app structure without fighting the static host.

If the project later moves off GitHub Pages and needs SSR or server-side data loading, reevaluate TanStack Start then.

### MUI 7

The app already uses MUI. Staying on MUI but upgrading to v7 is the fastest path to a modern UI layer.

Reasons:

- lowest migration cost
- good accessibility baseline
- strong autocomplete support, which this app already uses
- theming and design tokens are mature
- avoids a full UI rewrite

I do not recommend switching to `shadcn/ui` for this project unless the goal is a full design-system rebuild. It is flexible, but it creates more migration work and more ownership burden.

## High-Level Outcome

At the end of this work, the repo should have:

- pinned Node and package manager versions
- reproducible installs
- React 19 and Vite 8
- linting, formatting, and typechecking wired into CI
- unit tests for core game logic
- component tests for UI behavior
- Playwright smoke tests for the deployed app
- automatic deploys from `main` to GitHub Pages
- a clearer app layout with routing and feature modules

## Proposed Project Structure

```text
.
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-pages.yml
├── public/
│   ├── countryguesser.svg
│   └── data/
│       ├── world-topo.json
│       └── world-topo-110m.json
├── src/
│   ├── app/
│   │   ├── providers.tsx
│   │   ├── router.tsx
│   │   └── theme.ts
│   ├── components/
│   ├── features/
│   │   └── game/
│   │       ├── data/
│   │       ├── hooks/
│   │       ├── logic/
│   │       ├── routes/
│   │       ├── ui/
│   │       └── types.ts
│   ├── lib/
│   ├── styles/
│   ├── test/
│   │   ├── setup.ts
│   │   └── render.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   └── e2e/
├── eslint.config.js
├── playwright.config.ts
├── vitest.config.ts
├── vite.config.ts
└── package.json
```

## Implementation Phases

Status: Completed

## Phase 1: Rebuild the Toolchain Baseline (Completed)

### Tasks

1. Completed: Standardized on `pnpm`.
2. Completed: Pinned Node and package manager versions.
3. Completed: Refreshed `package.json` scripts.
4. Completed: Replaced Yarn classic with `pnpm` and removed Yarn-specific artifacts.

### `package.json` direction

```json
{
  "name": "country-guesser",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "packageManager": "pnpm@10.0.0",
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "check": "pnpm typecheck && pnpm lint && pnpm test"
  }
}
```

### Dependency targets

Recommended dependency set:

```json
{
  "dependencies": {
    "@emotion/react": "^11",
    "@emotion/styled": "^11",
    "@mui/material": "^7",
    "@tanstack/react-router": "^1",
    "@tanstack/react-router-devtools": "^1",
    "autosuggest-highlight": "^3",
    "d3": "^7",
    "match-sorter": "^8",
    "react": "^19",
    "react-dom": "^19",
    "solar-calculator": "^0.3",
    "topojson-client": "^3"
  },
  "devDependencies": {
    "@playwright/test": "^1",
    "@testing-library/jest-dom": "^6",
    "@testing-library/react": "^16",
    "@testing-library/user-event": "^14",
    "@types/node": "^24",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitest/coverage-v8": "^4",
    "@vitejs/plugin-react": "^5",
    "eslint": "^9",
    "eslint-config-prettier": "^10",
    "eslint-plugin-import-x": "^4",
    "eslint-plugin-jsx-a11y": "^6",
    "eslint-plugin-react-hooks": "^7",
    "playwright": "^1",
    "prettier": "^3",
    "typescript": "^5",
    "typescript-eslint": "^8",
    "vite": "^8",
    "vitest": "^4"
  }
}
```

### Packages to remove

These should likely be removed during the migration:

- `@reach/dialog`
- `@uidotdev/usehooks`
- `lodash`
- `@types/lodash`
- `@types/d3`
- `@types/topojson-client`
- `@types/autosuggest-highlight`

Keep:

- `@ebay/nice-modal-react`

Reason:

- Reach Dialog should be replaced by MUI `Dialog`.
- `@ebay/nice-modal-react` should stay if modal state remains centrally orchestrated outside individual page components.
- the hook usage is minimal
- lodash usage is tiny and replaceable
- many type packages are no longer necessary or can be avoided with better local typing

## Phase 2: Upgrade Build and Deploy Configuration (Completed)

### Goals

- Completed: fast builds
- Completed: stable base path handling for GitHub Pages
- Completed: one-command deploy via GitHub Actions

### `vite.config.ts`

Use an environment-driven base so local dev stays clean and Pages deploys work.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoName = 'country-guesser';
const isPagesBuild = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  plugins: [react()],
  base: isPagesBuild ? `/${repoName}/` : '/',
  build: {
    sourcemap: true,
  },
});
```

### Data asset move

Move runtime JSON assets out of the source import graph:

- from repo root
- into `public/data/`

Then fetch them at runtime instead of bundling them directly into JS.

Example:

```ts
export async function loadWorldData() {
  const [highRes, lowRes] = await Promise.all([
    fetch(`${import.meta.env.BASE_URL}data/world-topo.json`).then((r) =>
      r.json(),
    ),
    fetch(`${import.meta.env.BASE_URL}data/world-topo-110m.json`).then((r) =>
      r.json(),
    ),
  ]);

  return { highRes, lowRes };
}
```

This reduces bundle coupling and makes geodata lifecycle easier to understand.

## Phase 3: Add Routing and App Shell (Completed)

Even if the app has one screen today, add TanStack Router now so future expansion has structure.

### Recommended route shape

- `/` for the main game
- `/about` for instructions/about
- `/settings` for game preferences later

### `src/app/router.tsx`

```tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { GamePage } from '@/features/game/routes/GamePage';
import { AboutPage } from '@/features/game/routes/AboutPage';

function RootLayout() {
  return <Outlet />;
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: GamePage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

export const router = createRouter({
  routeTree,
});
```

### `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './app/router';
import { AppProviders } from './app/providers';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
```

## Phase 4: Modernize the Modal Stack Around NiceModal + MUI (Completed)

The current stack uses NiceModal + Reach Dialog + MUI. That should be simplified, not flattened completely.

Target:

- NiceModal for state management
- MUI `Dialog`
- MUI `Button`
- MUI theme provider

End state:

- keep NiceModal for modal registration and lifecycle management
- remove `@reach/dialog`
- render modal UI with MUI components only

### Example intro dialog

```tsx
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { useState } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard' | 'veryHard';

interface IntroDialogProps {
  open: boolean;
  onStart: (difficulty: Difficulty) => void;
}

export function IntroDialog({ open, onStart }: IntroDialogProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Country Guesser</DialogTitle>
      <DialogContent>
        <RadioGroup
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as Difficulty)}
        >
          <FormControlLabel value="easy" control={<Radio />} label="American" />
          <FormControlLabel
            value="medium"
            control={<Radio />}
            label="Tourist"
          />
          <FormControlLabel
            value="hard"
            control={<Radio />}
            label="GeoGuessr enjoyer"
          />
          <FormControlLabel
            value="veryHard"
            control={<Radio />}
            label="Impossible"
          />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onStart(difficulty)}>
          Start
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## Phase 5: Separate Game Logic from Rendering (Completed)

This is the most important code cleanup after the toolchain update.

### Extract pure game logic

Move all of this out of `App.tsx`:

- data normalization
- weighted country selection
- difficulty filtering
- answer validation
- round advancement

Put it in pure, testable modules.

### Example type definitions

```ts
export type Difficulty = 'easy' | 'medium' | 'hard' | 'veryHard';

export interface CountryFeature {
  id: string;
  properties: {
    nameEn: string;
    name?: string;
    isocode: string;
    isocode3: string;
    abbr?: string | null;
    formalName?: string | null;
    nameAlt?: string | null;
  };
}

export interface GameState {
  difficulty: Difficulty;
  roundIndex: number;
  correct: number;
  incorrect: number;
  streak: number;
  status: 'intro' | 'playing' | 'answered' | 'gameOver';
}
```

### Example pure helpers

```ts
export function isCorrectGuess(input: string, answer: string) {
  return input.trim().toLowerCase() === answer.trim().toLowerCase();
}

export function nextRoundIndex(current: number, total: number) {
  return current + 1 < total ? current + 1 : null;
}
```

### Why this matters

This makes the app testable without rendering the globe or wiring D3 into every assertion.

## Phase 6: Refactor the Globe Renderer (Completed)

Do not rewrite the D3 globe first. Stabilize it.

### Target approach

1. Move topojson loading into a dedicated data module.
2. Define explicit prop types.
3. Scope DOM selection to the component root only.
4. Reset canvas transform on resize.
5. Clean up drag/zoom listeners on effect teardown.
6. Replace render-time mutable setup with refs and effects.

### Example prop typing

```ts
interface GlobeProps {
  country: CountryFeature;
  width: number;
  height: number;
  rotation: [number, number];
}
```

### Example canvas reset on resize

```ts
const dpr = window.devicePixelRatio || 1;
canvas.width = width * dpr;
canvas.height = height * dpr;

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D context unavailable');

ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.scale(dpr, dpr);
```

### Example scoped selection

```ts
const root = select(rootRef.current);
const canvas = root.select('canvas');
```

The key goal is not "React-ify every D3 line". The key goal is to make the D3 boundary explicit and safe.

## Phase 7: Modern Theme and UI Foundation (Completed)

### Theme provider

Create one MUI theme and stop mixing starter CSS with app CSS.

### `src/app/theme.ts`

```ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#0b6bcb',
        },
        secondary: {
          main: '#ff8a00',
        },
        background: {
          default: '#eef6ff',
          paper: '#ffffff',
        },
      },
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
  },
});
```

### Provider

```tsx
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

### Styling rules

- remove starter Vite CSS
- use MUI theme tokens first
- keep global CSS minimal
- use CSS modules or feature-local CSS only where MUI styling is not enough

## Phase 8: Better Linting and Typechecking (Completed)

### ESLint flat config

Use ESLint 9 with flat config.

### `eslint.config.js`

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'import-x': importX,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'jsx-a11y/alt-text': 'error',
      'import-x/no-duplicates': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  prettier,
];
```

### TypeScript config direction

Tighten the config, especially after typing the app properly.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noEmit": true,
    "types": ["vite/client"]
  }
}
```

## Phase 9: Add Testing (Completed)

### Testing strategy

Use three layers:

1. pure logic tests with Vitest
2. component tests with React Testing Library
3. browser smoke tests with Playwright

### Vitest config

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

### `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
```

### Example logic test

```ts
import { describe, expect, it } from 'vitest';
import { isCorrectGuess, nextRoundIndex } from './gameLogic';

describe('gameLogic', () => {
  it('matches guesses case-insensitively', () => {
    expect(isCorrectGuess('canada', 'Canada')).toBe(true);
  });

  it('returns null when the game is over', () => {
    expect(nextRoundIndex(4, 5)).toBe(null);
  });
});
```

### Example component test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntroDialog } from './IntroDialog';

it('starts with the selected difficulty', async () => {
  const user = userEvent.setup();
  const onStart = vi.fn();

  render(<IntroDialog open onStart={onStart} />);

  await user.click(screen.getByLabelText(/Impossible/i));
  await user.click(screen.getByRole('button', { name: /Start/i }));

  expect(onStart).toHaveBeenCalledWith('veryHard');
});
```

### Playwright config

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm preview --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

### Example e2e smoke test

```ts
import { expect, test } from '@playwright/test';

test('loads the game and starts a round', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Country Guesser')).toBeVisible();
  await page.getByRole('button', { name: /Start/i }).click();
  await expect(page.getByRole('button', { name: /Guess/i })).toBeVisible();
});
```

## Phase 10: CI and GitHub Pages Deployment (Completed)

### CI workflow

Run on every PR and push:

- install
- typecheck
- lint
- test
- build

### `.github/workflows/ci.yml`

```yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20.19.0
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

### GitHub Pages deploy workflow

This should publish on push to `main`.

### `.github/workflows/deploy-pages.yml`

```yml
name: Deploy Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20.19.0
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Repository settings required

In GitHub repository settings:

1. Enable GitHub Pages.
2. Set source to `GitHub Actions`.
3. Confirm the repo name matches the Vite `base` logic.

## Migration Order

Status: Completed

Implement in this order to reduce risk.

### Step 1

Completed:

- replaced Yarn classic with `pnpm`
- installed React 19, Vite 8, TypeScript, ESLint 9, Vitest, and Playwright
- got `pnpm build` green before finalizing the refactor

### Step 2

Completed:

- added ESLint flat config
- added `typecheck`
- added CI workflow

### Step 3

Completed:

- removed Reach Dialog
- kept NiceModal

### Step 4

Completed:

- added TanStack Router and a new app shell

### Step 5

Completed:

- extracted weighted shuffle
- extracted difficulty filtering
- extracted guess validation
- extracted round progression

### Step 6

Completed:

- added typing
- fixed resize correctness
- added effect cleanup
- moved to explicit data loading

### Step 7

Completed: Moved geodata into `public/data` and documented regeneration.

### Step 8

Completed: Enabled GitHub Pages deploy after `build` stabilized.

## Acceptance Criteria

The migration is complete when all of the following are true:

- `pnpm install` works from a clean checkout
- `pnpm build` succeeds locally and in CI
- `pnpm lint` succeeds
- `pnpm typecheck` succeeds
- `pnpm test` succeeds
- `pnpm test:e2e` succeeds locally and in CI when configured
- pushing to `main` deploys automatically to GitHub Pages
- the app loads correctly from `https://<user>.github.io/country-guesser/`
- there are no imports from `App.tsx` into other feature modules
- game logic has unit tests
- the intro/start flow has component or e2e coverage

## Risks and Mitigations

### Risk: React 19 compatibility issues

Mitigation:

- upgrade React first
- keep app behavior stable
- do not refactor globe rendering in the same commit as the React/Vite upgrade

### Risk: GitHub Pages asset path breakage

Mitigation:

- use an environment-aware Vite `base`
- verify all asset URLs use `import.meta.env.BASE_URL`

### Risk: D3 globe regressions

Mitigation:

- add screenshot-based manual verification during migration
- keep the rendering API stable while internal cleanup happens

### Risk: Too much framework churn at once

Mitigation:

- use TanStack Router only
- defer TanStack Start unless deployment requirements change

## Optional Enhancements After the Main Migration

- add visual regression checks with Playwright screenshots
- add bundle analysis via `rollup-plugin-visualizer`
- add `lefthook` or Husky for pre-commit checks
- add route-level code splitting with TanStack Router
- add persistent user settings with local storage
- add a proper data-generation script for topojson assets

## Final Recommendation

Implement this as a Vite-first React 19 static app, not as a full-stack framework migration.

The shortest clean path is:

1. React 19 + Vite 8
2. TanStack Router
3. NiceModal + MUI 7
4. ESLint 9 + TypeScript strictness improvements
5. Vitest + React Testing Library + Playwright
6. GitHub Actions Pages deployment

That gets you modern dependencies, fast builds, a cleaner UI stack, strong quality gates, and automatic deploys without overengineering the app for needs it does not currently have.

## References

- React versions: <https://react.dev/versions>
- Vite 8 announcement: <https://vite.dev/blog/announcing-vite8>
- TanStack Start overview: <https://tanstack.com/start/docs/overview>
- TanStack Start React docs: <https://tanstack.com/start/latest/docs/framework/react/>
- Vitest docs: <https://vitest.dev/>
- Playwright docs: <https://playwright.dev/>
- MUI versions: <https://mui.com/versions/>
