# Country Dash Game State Research

## Scope

This document is a deep technical read of the game-state system in `country-dash`, centered on:

- core state model and reducer logic
- session planning and country selection
- scoring and difficulty adaptation
- daily challenge persistence/locking
- UI/controller wiring that drives state transitions
- subtle behaviors, invariants, and edge cases

Primary sources:

- `src/types/game.ts`
- `src/utils/gameLogic.ts`
- `src/hooks/useGamePageState.ts`
- `src/routes/GamePage.tsx`
- `src/components/*` (intro, HUD, status, guess input, menu)
- `src/utils/loadWorldData.ts`
- tests in `src/utils/*.test.ts`, `src/routes/*.test.tsx`, and `src/components/**/*.test.tsx`

---

## 1. Architectural map (who owns what)

### 1.1 State ownership

- **Authoritative game state** lives in a React reducer:
  - `const [gameState, dispatch] = useReducer(gameReducer, ..., createInitialGameState)`
  - owner: `useGamePageState`
- **Reducer implementation** is in `src/utils/gameLogic.ts` (`gameReducer` + helper functions).
- **Page-level orchestrator** is `useGamePageState`, which:
  - loads world data
  - computes derived UI props
  - translates UI events into reducer actions
  - persists daily completion to `localStorage`

### 1.2 Render composition

`GamePage` composes:

- **Globe** (visual focus target)
- **GameHud** (top status, timer, stats, menu)
- **GuessPanel** when `status === 'playing'`
- **GameStatusPanel** otherwise (`intro`, `reviewing`, `gameOver`)

### 1.3 Data domains

- **Geography source**:
  - topology file at runtime (`public/data/world-topo.json`)
  - enrichment metadata from `world.json` and packages (`countries-list`, `country-capitals`, `country-state-city`)
- **Gameplay source**:
  - country familiarity weights (`src/weights.tsx`)
  - mode/difficulty/filter selections from Intro dialog

---

## 2. Canonical data model (`GameState` and related types)

From `src/types/game.ts`.

### 2.1 Session-level types

- `SessionKind`: `'random' | 'daily'`
- `GameMode`: `'classic' | 'threeLives' | 'capitals' | 'streak'`
- `SessionConfig` includes:
  - run identity (`kind`, `seed`, `dateKey`)
  - gameplay profile (`mode`, `selectedDifficulty`, `startingLives`)
  - pool constraints (`regionFilter`, `countrySizeFilter`)
  - round cap (`maxRounds`)

### 2.2 Planned sequence

- `SessionPlan`:
  - `allCountryIds`: ordered pool for this run
  - `countryIdsByDifficulty`: pool partitioned into easy/medium/hard/veryHard
  - `totalRounds`: final round count

### 2.3 Round artifact

`RoundRecord` captures immutable per-round history:

- question identity: `countryId`, `countryName`, `capitalName`
- geo context: `continent`, `region`, `subregion`
- user interaction: `playerGuess`, `answerResult`, `hintsUsed`
- performance: `roundElapsedMs`, `scoreDelta`, `effectiveDifficulty`

### 2.4 `GameState` semantic groups

1. **Lifecycle**
   - `status`: `intro | playing | reviewing | gameOver`
2. **Session identity/config snapshot**
   - `sessionConfig`, `sessionPlan`
3. **Difficulty & mode**
   - `selectedDifficulty`, `effectiveDifficulty`, `mode`
4. **Pool selection memory**
   - `regionFilter`, `countrySizeFilter`
5. **Current position**
   - `currentCountryId`, `roundIndex`
6. **Performance counters**
   - `correct`, `incorrect`, `score`, `streak`, `bestStreak`, `missStreak`
7. **Mode-specific counter**
   - `livesRemaining` (only meaningful in `threeLives`)
8. **History**
   - `rounds`, `lastRound`
9. **Country tracking**
   - `usedCountryIds`, `missedCountryIds`, `reviewQueue`
10. **Timing**
    - `currentRoundStartedAt`, `currentRoundElapsedMs`, `totalElapsedMs`
11. **Hints**
    - `hintsUsedThisRound`
12. **Daily artifact**
    - `dailyResult`

---

## 3. State machine and transitions

Reducer actions in `gameLogic.ts`:

- `START_SESSION`
- `SUBMIT_GUESS`
- `ADVANCE_ROUND`
- `TICK_TIMER`
- `USE_HINT`
- `RETURN_TO_MENU`

### 3.1 Lifecycle graph

1. `intro` → `playing`
   - via `START_SESSION` (if at least one country is available)
2. `playing` → `reviewing`
   - via `SUBMIT_GUESS`
3. `reviewing` → `playing`
   - via `ADVANCE_ROUND` when run continues
4. `reviewing` → `gameOver`
   - via `ADVANCE_ROUND` when termination condition is met
5. any state → `intro`
   - via `RETURN_TO_MENU` (hard reset to initial state)

### 3.2 Transition guard behavior

- `SUBMIT_GUESS` is ignored unless `status === 'playing'` and `sessionConfig` exists.
- `ADVANCE_ROUND` is ignored unless `status === 'reviewing'` and both session config/plan exist.
- `USE_HINT` always increments in reducer; caller (`useGamePageState`) only dispatches it while playing.
- `TICK_TIMER` updates only when `playing` and `currentRoundStartedAt !== null`.

---

## 4. Session creation and planning pipeline

### 4.1 Config generation (`createSessionConfig`)

Defaults:

- `kind`: `'random'`
- `selectedDifficulty`: `'hard'`
- `countrySizeFilter`: `'mixed'`
- `dateKey`: `null`

Mode-derived fields:

- `startingLives = 3` only for `threeLives`
- `maxRounds = 5` only for daily

Seed behavior:

- `seed = dateKey ?? providedSeed`
- daily runs are date-stable

### 4.2 Pool construction (`buildSessionPlan`)

Pipeline order:

1. create seeded RNG from config seed
2. build base pool
   - daily: `shuffleCountries(world.features, seededRng)` (full world)
   - random: `buildCountryPool(world, seededRng)` (weighted list only)
3. apply mode filter
   - `capitals` keeps only countries with `capitalName`
4. apply region filter
5. apply size slicing
   - only for random **without** region filter (`small`/`mixed`/`large`)
6. partition by difficulty bands
7. compute `totalRounds = min(maxRounds ?? poolLength, poolLength)`

### 4.3 Important implications

- **Daily runs always keep global coverage** (no weighted omission).
- **Random runs may exclude countries missing in `weights` map.**
- **Region filter overrides size presets** as a practical selector:
  - if region selected, pool is region-constrained and not sliced by size count.

---

## 5. Country weights and difficulty bands

### 5.1 Weight source

`src/weights.tsx` exports:

- `weights`: map from country code to familiarity weight (roughly 0.1–0.9)
- `weightedShuffle`: random weighted ordering helper

### 5.2 Band thresholds (`difficulties`)

- easy: `>= 0.8`
- medium: `>= 0.5 && < 0.8`
- hard: `>= 0.3 && < 0.5`
- veryHard: `< 0.3`

### 5.3 Dynamic difficulty selection

`resolveNextDifficulty(selectedDifficulty, streak, missStreak)`:

- upward shift:
  - `+1` when streak >= 3
  - `+2` when streak >= 6
- downward shift:
  - `-1` when missStreak >= 1
  - `-2` when missStreak >= 2
- clamped to easy..veryHard rank range

Daily override:

- daily ignores adaptation and stays fixed at `selectedDifficulty`.

---

## 6. Next-country selection strategy

`selectNextCountryId(plan, usedCountryIds, difficulty, sessionKind)`:

### 6.1 Daily

- strict plan order: first unused item from `allCountryIds`

### 6.2 Random

1. build band search order by rank distance from target difficulty
2. scan each band for first unused country
3. fallback to full `allCountryIds` scan for any unused
4. return `null` when exhausted

This creates adaptive progression while still guaranteeing completion if any pool items remain.

---

## 7. Round evaluation internals

### 7.1 Guess normalization

`normalizeGuess` applies:

- Unicode NFKD normalization
- diacritic stripping
- punctuation replacement for `.` `'` `’` `(` `)` `-`
- whitespace collapse
- trim + lowercase

### 7.2 Accepted aliases

- country mode: from `getCountryNameCandidates`:
  - localized names, english name, aliases/formal/abbr, ISO2/ISO3
- capitals mode: `capitalAliases` (or canonical capital)

### 7.3 Scoring model

For correct answers:

- base: `100`
- time bonus: `max(0, 90 - floor(roundElapsedMs / 500))`
- streak bonus: `max(0, streak - 1) * 15`
- first-try bonus: `+25` when `hintsUsed === 0`
- hint penalty: `-15 * hintsUsed`
- final clamp: `max(0, total)`

Incorrect answers always score `0`.

### 7.4 What gets written on submit

On `SUBMIT_GUESS`, reducer:

- computes final round elapsed
- determines answer correctness
- updates score/streak/miss/lives counters
- appends `RoundRecord`
- appends missed IDs and reviewQueue on incorrect
- moves to `reviewing`

---

## 8. Mode-specific behavior

| Mode | Run continues until | Special mechanics |
|---|---|---|
| `classic` | rounds exhausted | none |
| `threeLives` | lives reach 0 or rounds exhausted | starts with 3 lives; miss decrements |
| `capitals` | rounds exhausted | pool prefiltered to countries with capitals; answer is capital alias |
| `streak` | first miss or rounds exhausted | miss ends run immediately |

Termination check is centralized in `shouldEndGame`.

---

## 9. Daily challenge system

### 9.1 Identity and timing

- date key from UTC (`getTodayDateKey`)
- storage key format: `country-guesser-daily:<YYYY-MM-DD>`
- daily reset countdown based on next UTC midnight

### 9.2 Daily lock behavior

- `useGamePageState` reads stored result at startup.
- `startDailyGame` early-returns if stored result already exists.
- Intro dialog switches daily card from “start” to “completed/locked” presentation when result exists.

### 9.3 Persisting completion

When reducer sets `gameState.dailyResult` at game over:

- hook writes JSON to localStorage
- updates `storedDailyResult` state asynchronously (timeout 0)

### 9.4 Share text

`useDailyShare` resolves final daily payload from:

1. `gameState.dailyResult` if present
2. fallback synthesized result (if daily gameOver with rounds)
3. stored daily result

Output format from `buildDailyShareText`:

- line 1: title + date
- line 2: score summary
- line 3: emoji trail (`🟢` correct / `⚫` incorrect)

---

## 10. UI controller wiring (`useGamePageState`)

### 10.1 Responsibilities

- load world data once
- derive option counts for Intro dialog
- derive current country object and display name
- compute globe rotation (capital coordinates for capitals mode, centroid otherwise)
- expose handlers for all user actions
- map reducer state to HUD/status panel props

### 10.2 Key handlers and action mapping

- `onSubmit` → `SUBMIT_GUESS`
- `onNextRound` → `ADVANCE_ROUND`
- `onRefocus`:
  - dispatch `USE_HINT` when playing
  - increment `focusRequest` always (forces globe refocus trigger)
- `onReturnToMenu` → `RETURN_TO_MENU`
- `onPlayAgain`:
  - starts **random** run (even if previous run was daily), preserving mode/filter/difficulty profile

### 10.3 Review completion flag

`isReviewComplete` is computed in hook to control Next vs Finish button label:

- streak mode + miss
- three-lives mode + lives <= 0
- final round reached

This mirrors reducer end conditions from `shouldEndGame`.

---

## 11. Guess input subsystem and state effects

`GuessInput` contributes important gameplay behavior:

- prefix-filtered suggestions from aliases
- `Enter` submits typed text or highlighted option
- `Tab` applies best completion without auto-submitting
- exact-match canonicalization:
  - if typed variant exactly matches alias, submitted value is normalized to canonical label

This means reducer receives a cleaned semantic guess, not necessarily raw keystrokes.

---

## 12. Timing model nuance

Two timer paths coexist:

1. **Reducer timer fields**
   - `currentRoundElapsedMs`, `totalElapsedMs`
   - `TICK_TIMER` action exists but is not dispatched by current UI code
2. **HUD live timer**
   - `GameTimer` computes `liveElapsedMs = totalElapsedMs + (now - runningSince)`
   - updates every 250ms in component state

Practical outcome:

- user sees live clock during round
- reducer’s per-round live tick is currently unused in runtime flow
- authoritative elapsed added to score is computed at submit time

---

## 13. Geography enrichment and why it matters to game state

`loadWorldData` enriches features with data consumed by state logic:

- localized country names (`localizedNames`)
- continent/region/subregion
- capital aliases and canonical capital
- capital coordinates
- semantic tags (`microstate`, `islandNation`, `caribbean`, `middleEast`)

These fields directly power:

- answer validation (country/capital aliases)
- region/category filtering in session planning
- capitals mode eligibility
- globe rotation in capitals mode
- review metadata labels

---

## 14. Invariants and subtle behaviors

### 14.1 Strong invariants

- `usedCountryIds` always includes the currently active country when playing.
- Round index increments only on successful `ADVANCE_ROUND` continuation.
- `dailyResult` is set only on transition to `gameOver`.
- `scoreDelta` is never negative by current formula.

### 14.2 Subtle-but-important behaviors

- `reviewQueue` and `missedCountryIds` are tracked but currently not consumed by UI flow.
- `handlePlayAgain` intentionally converts previous run into random-kind replay.
- region-selected random runs force selected difficulty to medium in controller config creation.
- `currentCountry` in hook falls back to first pool entry when no current ID, preventing blank render while intro is shown.

### 14.3 Potentially surprising design choices

- The reducer exposes `TICK_TIMER`, but the production UI currently relies on component-local timer updates.
- Random runs are constrained by `weights` map membership; daily runs are not, which intentionally broadens daily coverage.

---

## 15. Test-backed confidence map

The existing tests validate many critical state behaviors:

- deterministic seeded planning and daily round count
- daily includes unweighted countries
- difficulty band partition behavior
- daily result derivation and persistence shape
- daily fixed difficulty across rounds
- storage key/date logic and UTC boundary behavior
- intro flow interaction and pool selector semantics
- guess input single-submit and keyboard interaction guarantees

Areas with lighter coverage:

- `TICK_TIMER` runtime integration path (not currently used by hook)
- downstream usage of `reviewQueue`
- long-run adaptive difficulty distribution quality in real-world data

---

## 16. End-to-end lifecycle walkthrough (single run)

1. App loads world data and enters `intro`.
2. Intro dialog collects mode + pool choice.
3. Controller builds `SessionConfig` and deterministic `SessionPlan`.
4. Reducer `START_SESSION` sets first country and status `playing`.
5. User submits guess; reducer computes correctness, score, and round record, then enters `reviewing`.
6. User clicks Next/Finish; reducer either:
   - advances to next country (`playing`), or
   - seals run (`gameOver`) and, for daily, writes `dailyResult`.
7. For daily game over, share text becomes available and result is persisted.
8. Menu actions can refocus (hint increment), retry (new random run), or quit (return to intro reset).

---

## 17. Bottom line

The game-state system is structured as a clean reducer-driven domain model with deterministic session planning, mode-aware termination rules, and robust answer normalization. Its most notable intricacies are the split between weighted random vs full-world daily pools, the adaptive non-daily difficulty ladder, and the daily completion lock/persistence pipeline that ties reducer state, local storage, and Intro dialog UX together.
