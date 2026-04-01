# Gameplay Expansion Plan

Implementation status: Completed

## Goal

Evolve the current single-loop country identification game into a replayable system with:

- multiple game modes
- a real scoring model
- a separate seeded daily challenge plus true-random runs
- adaptive difficulty within a run
- richer answer review and learning feedback
- stronger automated test coverage before and during feature expansion

This plan is written against the current architecture centered in:

- `src/features/game/routes/GamePage.tsx`
- `src/features/game/logic/gameLogic.ts`
- `src/features/game/types.ts`
- `src/features/game/ui/GuessInput.tsx`
- `src/features/game/ui/GameTimer.tsx`

## Current Constraints

The current implementation is intentionally small:

- one main mode
- one round outcome shape: `correct` or `incorrect`
- one progression rule: increment `roundIndex`
- one difficulty rule: filter countries by static familiarity thresholds
- one answer review screen: reveal correct answer and continue
- timer display is local UI state, not part of the game model

This means the first step is not adding UI. The first step is expanding the gameplay state model so new features have somewhere coherent to live.

## Guiding Principles

- Preserve the existing fast loop and globe-first interaction.
- Add mechanics through explicit game rules, not scattered UI conditionals.
- Keep random and seeded sessions deterministic from a shared session config.
- Treat learning feedback as part of gameplay, not a separate afterthought.
- Expand tests at each phase so the loop remains stable while the state model grows.

## Proposed Feature Set

### 1. Game Modes

Introduce a `GameMode` model and support these initial modes:

- `classic`
  - current full-session progression, but upgraded with scoring and review
- `streak`
  - session ends on first miss or after a configured miss count
- `speedrun`
  - fixed number of rounds with score strongly tied to answer speed
- `threeLives`
  - session ends after three incorrect answers

Recommended first rollout order:

1. `classic`
2. `threeLives`
3. `speedrun`
4. `streak`

Reason:

- `classic` is the easiest migration path because it matches the current loop.
- `threeLives` introduces alternate end conditions without radically changing round flow.
- `speedrun` requires timer integration and scoring changes.
- `streak` is small once the new state machine exists.

### 2. Daily Challenge

Treat daily challenge as its own product surface, not just another option inside normal replayable sessions.

Recommended behavior:

- Daily challenge is seeded from a stable day key such as `YYYY-MM-DD`.
- Daily challenge contains exactly 5 countries in sequence.
- Daily challenge is only playable once per day per browser profile.
- Final result is shown as `x/5`.
- The result is saved in local storage so the player can return and view that day's completion state.
- Random play remains fully replayable and reshuffled on each run.

Recommended persistence model in local storage:

- one record keyed by daily date
- stored fields:
  - date
  - seed
  - completedAt
  - correctCount
  - totalCount
  - per-round summary if needed for later recap UI

Recommended launch UX:

- Daily challenge gets its own CTA or card on the intro screen.
- If the player already completed today's daily, show the stored result instead of allowing a replay.
- Daily should not share the same replay affordances as random sessions.

### 3. Scoring Model

Introduce a real score instead of only `correct`, `incorrect`, and `streak`.

Recommended scoring formula for initial rollout:

- base points per correct answer
- time bonus based on round response time
- streak multiplier after consecutive correct answers
- first-try bonus when no hint was used
- hint penalty when the player requested assistance
- incorrect answers never produce negative score

Scoring rule:

- no negative scores anywhere in the product
- penalties can reduce a bonus or award zero for a round, but never subtract from total score

Recommended displayed stats:

- score
- streak
- round time
- average answer time
- correct / incorrect

Keep the raw inputs in state so tuning does not require UI rewrites:

- `roundStartedAt`
- `roundElapsedMs`
- `totalElapsedMs`
- `score`
- `lastScoreDelta`
- `hintsUsedThisRound`

### 4. Adaptive Difficulty

Keep the current static familiarity weights as the baseline, then adapt within the run.

Recommended adaptation rules:

- start from selected difficulty band
- after a configurable correct streak, pull from a harder slice
- after one or more misses, temporarily inject easier countries
- cap adaptation so runs do not whipsaw wildly between extremes

Recommended implementation shape:

- separate `selectedDifficulty` from `effectiveDifficulty`
- derive next-country candidates from a difficulty window, not one fixed bucket
- log the resolved difficulty per round for analytics and debugging

This should stay deterministic under seeded runs:

- the seed determines candidate ordering
- the adaptive rule determines which candidate segment is consumed next

### 5. Region Mode

Add a region-based way to play so the user can focus on a specific geography slice.

Recommended launch options:

- continents:
  - Africa
  - Asia
  - Europe
  - North America
  - South America
  - Oceania
- special collections:
  - micro countries
  - island nations
  - Caribbean
  - Middle East

Recommended product shape:

- region mode is a normal replayable mode or filter within random play
- daily challenge stays separate from this
- selected region constrains the candidate country pool before shuffle and before adaptive difficulty rules

Recommended data requirement:

- region metadata must exist on each country record
- special collections like micro countries should be derived from explicit tags or maintained lists, not UI-only labels

### 6. Learning-Focused Answer Screen

Replace the current minimal answer state with a structured round summary.

Recommended content:

- correct country name
- continent / region
- whether the player was correct, incorrect, or close
- player’s submitted answer
- round time
- score delta
- small contextual facts derived locally if available
- optional neighbor or regional context if data is added later

Recommended interaction:

- show immediate outcome feedback
- reveal lightweight educational context
- allow continue to next round after a short delay or immediately via button

Stretch additions:

- “You guessed X, this was Y”
- map pulse or regional outline
- “seen before” and “missed before” indicators
- end-of-run review deck for missed countries

### 7. Exact Typed Submission

The current input flow effectively prefers explicit autocomplete selection.

Change the input behavior so:

- pressing Enter on an exact typed country name submits successfully
- aliases and alternate names can resolve to the canonical country
- autocomplete remains helpful but not mandatory

Recommended matching tiers:

1. exact normalized match against `nameEn`
2. exact normalized match against aliases
3. exact normalized match against ISO shorthand if allowed
4. optional near-miss detection for feedback only, not automatic correctness

## Architecture Changes

## 1. Expand Domain Types

Update `src/features/game/types.ts` to introduce:

- `GameMode`
- `SessionConfig`
- `RoundOutcome`
- `RoundRecord`
- `HintType`
- richer `GameStatus`

Recommended statuses:

- `intro`
- `playing`
- `reviewing`
- `gameOver`

Optional later:

- `paused`
- `dailyComplete`

Recommended `GameState` additions:

- `mode`
- `seed`
- `score`
- `livesRemaining`
- `rounds`
- `regionFilter`
- `currentRoundStartedAt`
- `totalElapsedMs`
- `usedCountryIds`
- `missedCountryIds`
- `reviewQueue`
- `effectiveDifficulty`
- `dailyResult`

## 2. Move Rules into Game Logic

Expand `src/features/game/logic/gameLogic.ts` from helper utilities into gameplay rule functions.

Recommended additions:

- `createSessionConfig`
- `createSeededRng`
- `buildSessionCountryPool`
- `buildRegionCountryPool`
- `startRound`
- `gradeGuess`
- `calculateRoundScore`
- `resolveNextDifficulty`
- `advanceGameState`
- `buildRoundSummary`
- `shouldEndGame`

The route component should orchestrate, not own rule logic.

## 3. Separate Timer UI from Timer State

Refactor the timer so `GamePage` owns elapsed time and the timer component becomes presentational.

Recommended shape:

- `GamePage` stores timing in state or reducer
- `GameTimer` renders formatted values only
- scoring and summaries read from the same canonical elapsed values

This is required for:

- speedrun scoring
- daily comparisons
- answer review stats
- testable deterministic round timing

## 4. Consider a Reducer

The current `useState` updates in `GamePage.tsx` are manageable now, but the planned feature set will outgrow ad hoc object updates.

Recommended migration:

- introduce `useReducer`
- define explicit actions like:
  - `START_SESSION`
  - `START_ROUND`
  - `SUBMIT_GUESS`
  - `USE_HINT`
  - `ADVANCE_ROUND`
  - `TICK_TIMER`
  - `END_SESSION`

This will make game modes and alternative end conditions much easier to reason about and test.

## Delivery Phases

## Phase 1. Tests First

Status: Completed

Goal:

- lock down the existing loop before broadening it

Tasks:

- Add tests for exact typed submit without autocomplete click.
- Add tests for correct and incorrect answer transitions.
- Add tests for advancing through the final round into game over.
- Add tests for replay creating a fresh random session.
- Add tests for timer state ownership once timing is lifted into the route or reducer.

Files likely involved:

- `src/features/game/ui/GuessInput.test.tsx`
- `src/features/game/logic/gameLogic.test.ts`
- new route-level tests for `GamePage`
- `tests/e2e/game.spec.ts`

Exit criteria:

- the current loop is covered at route and logic level, not only component fragments

## Phase 2. Domain Model Upgrade

Status: Completed

Goal:

- create the state and logic structure needed for new mechanics

Tasks:

- Expand game/session types.
- Introduce reducer or equivalent rule-driven state transitions.
- Move score, timer, and end-condition logic into gameplay logic layer.
- Refactor `GameTimer` into presentational UI.

Exit criteria:

- current gameplay still works on top of the new state model
- scoring and timing are stored canonically in state

## Phase 3. Scoring and Answer Review

Status: Completed

Goal:

- make each round feel consequential and informative

Tasks:

- Implement round timing.
- Implement score deltas.
- Ensure score formulas never subtract from total score.
- Replace `answered` screen with `reviewing` summary card.
- Show answer, player guess, time, score delta, streak, and region if available.
- Track round history for end-of-run summary.

Exit criteria:

- every round produces a structured round record
- player sees more than just correct/incorrect

## Phase 4. Session Variety

Status: Completed

Goal:

- add replayability without overcomplicating the first release

Tasks:

- Add mode selection to intro dialog.
- Add region selection for region mode.
- Implement `classic` and `threeLives`.
- Add random-session reshuffle on every new run.
- Add deterministic daily challenge generation from date seed.
- Add local storage persistence and once-per-day lockout for daily challenge.
- Add region-constrained country pool generation.

Exit criteria:

- players can choose between at least two distinct session rules
- players can start a region-focused run
- daily session is stable for a given date
- daily session can only be completed once per stored day key

## Phase 5. Adaptive Difficulty

Status: Completed

Goal:

- make sessions feel paced instead of flat

Tasks:

- Track effective difficulty per round.
- Raise difficulty after streak milestones.
- Ease difficulty temporarily after misses.
- Add review safeguards so repeated misses do not produce frustrating spirals.

Exit criteria:

- difficulty changes can be observed in state and tested deterministically

## Phase 6. Additional Modes

Status: Completed

Goal:

- extend the framework after the core systems are stable

Tasks:

- Implement `speedrun`
- Implement `streak`
- Tune score formulas per mode
- Tune UI summaries and end conditions per mode

Exit criteria:

- modes differ in rules, not only labels

## Data Requirements

The current dataset includes country names and codes. The requested learning screen wants continent and region.

Need to verify whether that metadata already exists in source assets. If not, add it during the topojson generation pipeline and surface it in `CountryProperties`.

Recommended additions to `CountryProperties` if available:

- `continent`
- `region`
- `subregion`
- `tags`

If geography metadata is not currently present, this should be added before implementing the richer review screen.

Recommended derived tagging for region mode:

- `isMicrostate`
- `isIslandNation`
- `isCaribbean`

These can be precomputed during data generation or derived in app logic from a maintained mapping.

## UI Changes

### Intro Dialog

Extend `IntroDialog` to select:

- difficulty
- mode
- region when relevant

Recommended launch UI:

- difficulty radio group
- mode segmented control or radio group
- region selector that appears only for region mode
- separate daily challenge card or button

Recommended daily UX:

- one self-contained daily panel on the intro surface
- shows:
  - today's status
  - completed or not completed
  - stored `x/5` result when completed
  - action button to start if available

### HUD

Expand top HUD to show:

- score
- mode
- lives if relevant
- streak
- timer

Avoid overloading the center card. The globe should remain dominant.

### Review Card

Replace the minimal answer state with a proper round summary card.

Recommended sections:

- outcome
- answer
- player guess
- region / continent
- round stats
- next action

## Testing Strategy

### Unit Tests

Prioritize deterministic tests around gameplay rules:

- seeded ordering reproducibility
- score calculation
- adaptive difficulty transitions
- end conditions by mode
- answer normalization and alias matching

### Component Tests

Cover interaction behavior:

- exact typed Enter submission
- review screen rendering
- intro dialog mode/session selection
- region selector behavior
- daily challenge locked state after completion
- HUD updates after scoring

### End-to-End Tests

Cover only the critical happy paths at first:

- start a random classic run and submit a guess
- complete a short run into game over
- start a daily challenge and verify 5-round structure
- complete a daily challenge and verify it becomes locked for the same day
- verify replay produces a new random session
- start a region run and verify only countries from that region are used

## Risks

- Expanding `GamePage.tsx` without a reducer will make the file hard to reason about.
- Daily challenge determinism can break if shuffle, adaptation, and timing logic are not separated clearly.
- Daily one-play enforcement is only as strong as local storage in the browser, so it is a product rule rather than a tamper-proof guarantee.
- Adaptive difficulty can feel unfair if the player does not understand why the challenge changed.
- Review-screen ambitions can outpace available country metadata.
- Too many modes too early can slow tuning and weaken the main loop.

## Recommended Immediate Next Steps

Status: Completed

1. Add route-level tests for the current loop, especially exact typed submit and game-over progression.
2. Expand `types.ts` and `gameLogic.ts` for `GameMode`, scoring, daily state, region filters, and round records.
3. Move canonical timing into route/reducer state and make `GameTimer` presentational.
4. Implement `reviewing` state with score delta and player guess.
5. Add `classic`, `threeLives`, and region-constrained runs.
6. Add separate seeded daily challenge with local completion storage and `x/5` result.
7. Add adaptive difficulty after the new round-history model is stable.

## Recommendation on Scope

Do not ship all requested features in one pass.

Best sequence:

1. tests
2. state model
3. scoring + review screen
4. classic + threeLives + region mode
5. daily challenge
6. adaptive difficulty
7. speedrun + streak tuning

That order reduces rewrite risk and gives each layer a clear foundation.
