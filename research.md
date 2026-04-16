# Country Dash UI Deep Research Report

## Scope

This report documents a deep UI/UX and implementation review of the current game app in this repository (`src/`), focused on:

- user-facing flows
- visual structure and behavior
- interaction specifics
- responsive/mobile behavior
- theme/localization behavior
- rendering architecture that directly shapes UI
- concrete findings and risks

---

## 1) What the UI is, at a glance

Country Dash is a **single-screen, full-viewport globe quiz game** with layered overlays.

The player:
1. starts from a modal run selector (daily or random run),
2. guesses highlighted countries (or capitals, depending on mode),
3. sees per-round review feedback,
4. continues until run completion rules are met,
5. sees final summary (and daily share tools when applicable).

The game is built around one route-level screen (`GamePage`) plus modal overlays and HUD panels.

---

## 2) Core UI state machine and visible screens

The UI maps directly to game statuses:

- `intro`
- `playing`
- `reviewing`
- `gameOver`

### Loading and error states

Before gameplay is ready:
- full-screen loading spinner (`role="status"`, `aria-busy`)
- if world data fails: inline error alert with failure details

### Intro state (startup gate)

When world data is loaded and status is `intro`, `IntroDialog` is opened via NiceModal.

This is the front door of the app and includes:
- **Daily challenge card** (separate from random setup)
- **Random run configuration panel**
- **How to Play** modal entry

#### Daily card specifics

- Daily run is fixed to:
  - mode: `classic`
  - difficulty: `medium`
  - rounds: `5`
  - seed/date: current UTC date key (`YYYY-MM-DD`)
- Shows live UTC reset countdown (`HH:MM:SS`) updated every second.
- If already completed today (from localStorage), card becomes locked:
  - shows done summary (`correct/total`)
  - removes Start button
  - shows reset countdown until next UTC midnight

#### Random run setup specifics

Mode selector:
- Classic
- Three Lives
- Capitals
- Streak

Pool selector (mutually exclusive strategies):
- Size pools: Quick / Standard / Long (small/mixed/large)
- Region/category pools: Africa, Asia, Europe, North America, South America, Oceania, Micro Countries, Island Nations, Caribbean, Middle East

Selection rules:
- choosing a region sets `countrySizeFilter` back to `mixed`
- choosing a size clears `regionFilter`

Run start CTA text is dynamic: “Start with [selected pool label]”.

---

## 3) Gameplay UI composition (playing/reviewing/game over)

Gameplay screen is layered:

1. full-screen theme background
2. full-screen globe renderer
3. optional technical overlays (cipher telemetry, transition)
4. top HUD strip (`GameHud`)
5. bottom center status/action panel (`GameStatusPanel`)

### Top HUD (`GameHud`)

Shows:
- round label (`Round x/y` or ready label)
- mode + session summary
- optional session metadata labels
- stat chips
- timer chip
- menu controls
- desktop refocus button (when applicable)

Responsive specifics:
- Desktop stats: score, streak, hit, miss (+ lives in three-lives mode)
- Compact/mobile stats: score, streak (+ lives when present)
- keyboard-open compact mode reduces vertical density and typography size

Timer specifics:
- `H:MM:SS.mmm` format
- live updates every 50ms when round is active
- tabular numerals for stable width

### Bottom panel (`GameStatusPanel`) by state

#### A) `playing`

- Prompt changes by mode:
  - country guessing
  - capital guessing
- Renders `GuessInput`

#### B) `reviewing`

Shows round result card:
- Correct/Missed icon + color state
- canonical answer
- metadata line (continent/subregion; in capital mode includes country name)
- player guess box appears for incorrect/blank submissions
- round time and score delta
- Next/Finish button (`Finish` when run-ending condition reached)

#### C) `gameOver`

Common:
- completion header + summary
- best streak / elapsed meta

Random run completion:
- score and total time metric tiles
- Play Again + Main Menu actions

Daily completion:
- share text block (emoji summary)
- Copy Results button with transient states:
  - idle
  - copied
  - failed
- Main Menu action

---

## 4) Guess input UX specifics (`GuessInput`)

The input is a custom-tuned MUI Autocomplete experience with game-specific matching.

Key behaviors:
- Variant switch:
  - `country` mode uses localized country names + aliases
  - `capital` mode uses capital aliases
- Matching is **prefix constrained**, then ranked with `matchSorter`
- Result count capped at **4** suggestions
- “No matches” appears when none match
- Dropdown is manually controlled (`open` state), not open-on-focus
- Enter behavior:
  - highlighted option + Enter: select+submit
  - otherwise submit typed value
- Tab behavior:
  - accepts first hint/autocomplete suggestion if available
- Arrow keys move highlighted option explicitly
- Inline ghost hint suffix overlay appears when there is a forward completion

Input hygiene:
- disables browser autocorrect/autocapitalize/spellcheck
- search input mode and done enterKeyHint

Mobile-specific:
- suggestion popper placement flips to top-start
- list max-height uses visual viewport CSS variable for keyboard-safe behavior

---

## 5) Menu and auxiliary dialogs

## Theme/Menu panel (`ThemeMenu`)

Top-right controls:
- Menu toggle button
- Language globe icon button

Menu actions:
- Refocus
- Retry (restart run)
- Quit (with confirmation dialog)
- About

Other menu content:
- Theme chooser grid using visual `ThemePreview` cards

Behavior specifics:
- click-away closes menu panel
- menu panel height is mobile-capped with visual viewport aware max-height
- quit action opens explicit confirm dialog before returning to intro

## Language selector

- Uses locales from Paraglide runtime
- Displays native + English language names
- Active locale is check-marked
- Locale change is runtime (no full page reload)

## About and How To Play

- Both are NiceModal dialogs
- Full-screen on compact layouts
- Themed accent surfaces
- How To Play is reachable from Intro dialog header action

---

## 6) Themes and visual identities

There are 6 selectable themes:

1. Daybreak
2. Midnight
3. Ember
4. Atlas
5. Cipher
6. Glacier

Theme selection persists in localStorage.

### Theming system specifics

- Theme definition includes:
  - app background gradients
  - panel surfaces/borders/shadows
  - typography tuning
  - globe palette
  - quality defaults
  - render feature flags
- MUI component styles are deeply customized per theme (buttons, dialogs, inputs, autocomplete, alerts, etc.)

### Atlas specifics

Atlas is not just colors. It enables a distinct style pipeline:
- parchment/map aesthetic overlays
- atlas-specific globe render options
- atlas-themed typography choices
- extra decorative background layers (`GameBackground`)

### Cipher specifics

Cipher activates an alternate tactical visual language:
- screen transition overlay with staged status text
- selected country cipher overlays
- map annotations
- hydro overlays
- traffic overlays
- telemetry panel/ticker
- stronger scanline/noise/rim-light atmosphere in globe render config

---

## 7) Globe interaction and rendering specifics

The globe is rendered via `WebGlGlobe` with a second 2D overlay canvas.

### Interaction

- pointer drag with inertia
- pinch zoom + pan
- wheel zoom
- latitude clamp and normalized longitude handling
- animated refocus to current target on round changes
- optional focus delay (Cipher uses this via render config)

### Rendering structure

- Main WebGL canvas: base globe shading and texture pipeline
- Overlay canvas: selected-country/capital/cipher/traffic annotations
- Optional DOM transition overlay panel (`CipherTransitionOverlay`)

### Performance strategy

- frame-critical values held in refs (not React state)
- draw loop only runs when needed (ambient or overlay animations)
- loop throttled around ~12fps for ambient overlay redraw paths
- document visibility pause/resume handling
- texture cache with bounded size (eviction after limit)

### Overlay behavior by mode/theme

- Capitals mode: animated pulsing capital marker/rings
- Non-capitals mode:
  - default selected-country fill + rings
  - Cipher can replace with special selection + transition effects
- Cipher traffic overlay can draw tracks and critical sites

### Notable implementation specificity

`useCipherTraffic` currently returns **mock sample traffic data** when enabled (and disabled state otherwise).  
The endpoint parameter exists in plumbing, but live fetch behavior is not active in the current hook implementation.

---

## 8) Rules that visibly shape UI behavior

These gameplay rules are crucial to understanding why UI branches behave as they do:

- Daily challenge:
  - fixed 5 rounds
  - one completion per UTC day (lockout via stored result)
- Mode endings:
  - Classic: until planned rounds complete
  - Three Lives: ends when lives reach 0
  - Streak: ends on first incorrect answer
  - Capitals: answer matching targets capital aliases
- Scoring:
  - base 100 for correct
  - time bonus (faster is higher)
  - streak bonus
  - first-try bonus if no hints used
  - hint penalty per hint
  - incorrect = 0
- Hint currently tracked in reducer is `refocus`; this affects score math.

---

## 9) Responsive/mobile/keyboard handling specifics

This app is engineered as a fixed, app-like viewport:

- `html/body/#root` fixed and overflow hidden
- explicit scroll lock in `GamePage` (window + visualViewport)

Keyboard and viewport handling:
- `useWindowSize` combines:
  - layout viewport
  - visual viewport offsets/heights
  - virtual keyboard geometry when available
- Publishes CSS vars:
  - `--keyboard-fallback-inset`
  - `--visual-viewport-height`
  - `--visual-viewport-offset-left`
  - `--visual-viewport-offset-top`
- HUD/status paddings include safe-area + keyboard-aware calculations

Result: mobile keyboards and notch/safe-area devices are handled with unusual care for a game UI.

---

## 10) Localization specifics

Localization stack:
- Paraglide runtime + message files
- language selector in UI
- HTML `lang` and `dir` updated on locale changes

Supported locale set is broad (22 locales in runtime config), including:
- en, fr, de, es, it, pt, ru, ja, ko, zh, zh-hant, and others

Localization touches:
- almost all visible labels and prompts
- geography labels (continent/subregion display in review cards)
- theme labels
- mode/pool labels
- daily share labels

Country name behavior:
- display names resolve by exact locale, then language fallback, then English.

---

## 11) Persistence and session memory

Observed persistent keys:

- Theme choice: `country-guesser-theme`
- Daily result lock/share source: `country-guesser-daily:${dateKey}`
- Dev admin overrides per theme: `country-guesser-admin-theme:${themeId}`
- Locale (Paraglide): runtime-managed locale storage/cookie strategy

Daily share output:
- multiline string with title + score + emoji per round (`🟢` correct / `⚫` incorrect)

---

## 12) Accessibility and UX quality notes

Strong points:
- live status regions (`role="status"`, `aria-live="polite`) in key states
- explicit ARIA labels for sensitive actions (e.g., refocus)
- combobox/listbox semantics via Autocomplete
- clear icon+text pairing in state transitions

Potential UX caveat:
- Intro dialog behaves as a startup gate (not a casually dismissible modal), which is intentional but opinionated.

---

## 13) Main findings

### Strengths

1. **Clear state-driven UI flow**: intro -> playing -> reviewing -> gameOver is clean and consistent.
2. **Excellent mobile viewport engineering**: keyboard, visual viewport, safe area, and fixed-layout behavior are thoughtfully handled.
3. **Rich theming beyond palette swaps**: Atlas and Cipher are genuinely distinct UX personalities.
4. **Strong interaction model for globe**: smooth drag/pinch/inertia with renderer-friendly architecture.
5. **Guess input quality is high**: forgiving aliases, keyboard controls, controlled autocomplete behavior.

### Risks / complexity hotspots

1. **Rendering complexity concentration**: `WebGlGlobe` is a major maintenance hotspot due to breadth of concerns.
2. **Cipher traffic currently mocked**: UI implies live tactical telemetry, but hook behavior is sample-data based right now.
3. **Large orchestrator surface**: `useGamePageState` + GamePage composition centralizes many concerns; effective but heavy.

---

## Final assessment

Country Dash’s UI is highly polished and more sophisticated than a typical geography quiz interface.  
Its strongest qualities are the **state clarity**, **responsive engineering**, and **theme-driven visual identities** (especially Atlas/Cipher).  

The main tradeoff is complexity concentration in the globe/rendering stack and orchestration layer. Functionally, the UI is coherent and feature-rich; architecturally, the biggest long-term pressure is maintainability of the rendering subsystem and adjacent orchestration logic.

