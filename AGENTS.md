# Repository Guidelines

## Project Overview

**CA TRỰC LABO** is a web-based, deterministic time-management simulation game modeling the shift of a clinical laboratory medical technologist (_Kỹ thuật viên xét nghiệm_).

- **Current Milestone**: M3 in progress (M3-1 QC, M3-2 dilution/urine/Δ and M3-3 events E1–E10 + incoming phone calls and M3-7 save code + settings + PWA done; remaining: 8-day chapter config polish, Codex/difficulty polish; M3-5 real art/sound is deliberately dropped from M3 and deferred until the game is stable, art stays CSS/emoji and there is no audio). Playable shifts: `ch0-d1` Reception (2-identifier check, route to Chem/Heme), `ch0-d2` other sample types (urine cup, stool cup, swab, blood-culture bottle, tissue jar) + routing to all 5 departments + aged samples, `ch0-d3` irreplaceable samples (Contact) + leaking jars (biosafety cleanup) + stat rush, `ch1-d1` Clinical Biochemistry, `ch1-d2` hemolysis/aged samples, `ch1-d3` QC, `ch1-d4` critical values + dilution, `ch1-d5` urine strip + Δ (busiest day). The `DESIGN.md` + `stitch-design/` redesign (warm cozy "toycore", Quicksand + Be Vietnam Pro, chunky 3D pill buttons, per-department colors) is applied to all current screens; art is still CSS/emoji, not illustrations. Mockups include features not in the GDD (xu/EXP/level, coffee energy, shop); treat the GDD (`docs/04-GDD.md`) as the source of truth for mechanics. `docs/00-README.md` mentions "M1 next" which is outdated.
- **Current Implementation Scope (Do not assume unimplemented features exist)**:
  - _Implemented_: Deterministic sim core (PRNG, command engine, replay), Trust meter, 4-pillar grading & shift report, post-centrifuge hemolysis/lipemia/icterus, critical values + phone reporting (`callCritical`), dilution (`chem/startDilution` opens the `dilution` minigame, kind `measure`, UI `MeasureGame`: pick ratio → machine re-reads → multiply by factor; `overRange` results show `>max`; seed `analyte|truth`; wasted re-runs add analyzer time, wrong multiply costs trust, release without dilution costs trust), Δ delta check (`Patient.previous`, `AnalyteResult.delta`, `Order.deltaChecked`, thresholds in `content/chem/rules.json`), events E1–E10 and incoming phone (`src/sim/core/events.ts`, data in `content/common/events.json`, per-day `events: [{id, at}]` scheduled deterministically at `createShift`; decision events E3 machine fault and E10 trainee quiz are `ShiftState.pending` and resolved by `resolveEvent`; calls are `ShiftState.phone` answered by `answerPhone`, 3 missed calls cost trust; E6/E9/E3 set `ShiftState.effects` read by `tickChem`; UI `PhoneSheet`/`EventSheet`, phone and event sheets pause the clock), urine strip minigame (`urineStrip`, kind `compare`, `UrineStripGame`; seed `profile|n` ties truth to the sample; reading of normal vs abnormal wrongly released costs trust; content in `content/chem/urine.json`), in-shift QC on day `ch1-d3` (commands `chem/runQC`, `chem/judgeQC`, `chem/qcAction` in `src/sim/departments/chemQc.ts`; scenarios/remedies in `content/chem/qc.json`; analyzer is gated until QC passes; false "Pass" taints results and costs trust at release; UI `QcSheet` with SVG Levey-Jennings chart), Westgard algorithms in `core/qc.ts`, minigame `spillCleanup` (`SequenceGame` hosting `TimingGame` button-hold step; `holdTimer` registered), 21 Codex cards, IndexedDB persistence, debug panel (`?debug=1`), balance bot (`pnpm balance`), Playwright 360/390. Reception chapter (`ch0-d1`–`ch0-d3`): all 5 departments routable (`routeAll` unlock; `routableDepts(day)` in `src/sim/content/load.ts` drives SampleCard + basket stations + engine validation), container kinds `tube|cup|swab|bottle|jar` drawn as inline SVG in `src/ui/components/Tube.tsx` (no real art), per-container aged-sample rules (`timeSensitiveTests`, `timeExemptContainers`, `delayedByContainer` in `content/common/reception-rules.json`), `OrderType.irreplaceable` (tissue jars: defects only roll once the day unlocks `contact`; a defect → expected decision is `contact`, rejecting costs −30), leaking jar (`leak`) rejected or contacted → `spillCleanup` minigame bound to the sample (`ActiveMinigame.sampleId`), tip trigger `irreplaceable`. Tests: `src/sim/departments/receptionDays.test.ts`. Save/settings/PWA (M3-7): `SaveData` v2 (`src/platform/save.ts`: `migrate` v1→v2, `exportCode`/`importCode` = JSON → lz-string → base64url, format `CTL1.<payload>.<crc32>`, strict validation with Vietnamese errors), Settings screen S13 (`src/ui/screens/Settings.tsx`; difficulty moved here from Home, reduced-motion switch → `html.reduce-motion`, export/import code, 2-step reset, about/disclaimer; reachable from Home ⚙ and from the pause menu where only the shift-safe parts show), one-time install/export reminder card on the first `ch0-d3` report (`SaveData.installHintShown`, store `installHint`), PWA (`public/manifest.webmanifest`, icons in `public/icons/`, `vite-plugin-pwa` generateSW precache incl. fonts, registered only in the production build by `src/platform/pwa.ts`; updates are never auto-applied, Home/Settings show `Có bản mới — Tải lại` only outside a shift).
  - _Not Yet Implemented_: outgoing phone calls beyond `callCritical`/contact, equipment effects on events (maintenance contract), shifts after `ch1-d5`, processing Micro/Immuno/Patho samples (Reception only routes to those departments), Hematology department onwards, Free shift / Challenge mode, equipment purchasing (budget increments only, no store spending), audio/sound effects, dark mode toggle, large-text mode, campaign map. Commands from `docs/07-TDD.md` section 4.2 are only partially implemented.
- **Domain Fidelity**: Strictly guided by professional laboratory rules ("Labo Xanh", SSOT in `docs/05-noi-dung-chuyen-mon.md` & `content/*.json`). Technologists never diagnose diseases. Critical samples marked as irreplaceable (e.g., CSF, surgical biopsy) must never be rejected outright (require `contact` action).
- **Target Platform**: Client-side static web application with PWA/offline architecture, designed mobile-first (touch-first viewports: 360×640 to 390×844).
  - Responsive: `.app` is a portrait column (max 480px) centered; at ≥600px wide it becomes a rounded frame (height ≤900px) over a decorative background; `100dvh` on html/body/#root. Landscape phone is intentionally unsupported. `tests/responsive.spec.ts` audits overflow, centering and tap targets at 320×568, 360×640, 390×844, 430×932, 768×1024, 1366×768, 1920×1080 (Playwright projects in `playwright.config.ts`).

---

## Architecture & Data Flow

The codebase strictly decouples pure deterministic simulation from user interface and platform APIs into 4 distinct layers:

```
[content/*.json] ──(Zod schema & loadContent)──> [src/sim/content]
                                                         │
                                                         ▼
[User Input] ──> [src/ui] ──(dispatch)──> [src/store (Zustand)] ──(Command)──> [src/sim/core] (Pure Reducer)
                    ▲                             │                                      │
                    │                             ├──────(rAF fixed tick)────────────────┤
                    │                             ▼                                      ▼
                    └──────────(State & SimEvents)◄────────────────────────────── [StepResult]
```

### 1. Content Layer (`content/`)

- Single Source of Truth (SSOT) for all domain rules, shift configurations, order types, reference ranges, codex entries, and Vietnamese localization (`content/i18n/vi.json`).
- Validated at build/test time using Zod (`src/sim/content/schema.ts`) and referential cross-checking (`tools/content-check/index.ts`).
- Never hardcode clinical logic or thresholds into TypeScript.

### 2. Deterministic Simulation Core (`src/sim/`)

- Pure functions, 100% deterministic, zero side-effects.
- **State Reducer Pattern**: `applyCommand(state: ShiftState, cmd: Command, content: Content): StepResult` where `StepResult = { state: ShiftState, events: SimEvent[] }`.
- **Fixed-Timestep Tick**: `advance(state: ShiftState, seconds: number, content: Content): StepResult` evaluates scheduled arrivals, machine countdowns (centrifuge, chemistry analyzer), and timeliness deadlines per integer second.
- **Seeded PRNG**: Mulberry32 initialized from `ShiftState.seed` stored in `ShiftState.rngState`.
- **Architectural Boundary (ESLint-enforced)**: `src/sim/**/*.ts` cannot import from `ui/`, `store/`, `platform/`, `react`, or `zustand`. Forbidden: `Math.random` and `Date.now`.

### 3. State & Game Loop (`src/store/`)

- **Zustand Store (`src/store/game.ts`)**: Holds the current `shift: ShiftState | null`, action history log, and active UI overlays. Mentor tips for QC (`qcRun`, `qcFailed`) go to `inlineTips` and render only inside `QcSheet`; other tips queue in `tips` and hold the clock while shown.
- **Game Loop (`src/store/loop.ts`, hook `useGameLoop` mounted in `src/ui/App.tsx`)**: Runs on `requestAnimationFrame` and calls `tickReal`. Game seconds per real second = `timeScale(shift.duration)` in `src/store/game.ts` (`duration / TARGET_REAL_SECONDS`, ~6 real minutes per shift at Normal, scaled by difficulty). The clock is held while a mentor tip is showing (no overlay) or a minigame is active; paused on `visibilitychange` when the document is hidden.
- **Event Translation**: Translates `SimEvent` outputs into grouped user notifications (`pushToasts`), codex unlock popups, or screen transitions.

### 4. UI Layer (`src/ui/`) & Platform (`src/platform/`)

- React 19 components consuming Zustand state via `useGame()`.
- Pure CSS with design variables (`src/ui/theme/global.css`) following greybox guidelines (touch targets $\ge 44\text{px}$).
- Storage layer: `src/platform/save.ts` is pure (SaveData v2, `migrate`, save codes); `src/platform/storage.ts` saves player progression (IndexedDB key stays `save:v1`, the `version` field inside the data selects the migration) via `idb-keyval` with graceful fallback when storage is denied and old saves read through `migrate`. `src/platform/pwa.ts` registers the service worker (build only), captures `beforeinstallprompt` and exposes update/install state to `src/ui/components/PwaNotices.tsx`.

---

## Key Directories

```
ca-truc-labo/
├── content/               # JSON data: rules, shifts (days/), codex/, tests, i18n
│   ├── common/            # Wards, containers, order types, reception rules
│   ├── chem/              # Biochemistry centrifuge & analyzer rules, tests
│   ├── days/              # Shift definitions (waves, defects, scripts, goals)
│   ├── codex/             # Knowledge handbook cards unlocked during play
│   └── i18n/vi.json       # Vietnamese copy, explanations, defect messages
├── src/
│   ├── sim/               # Pure deterministic simulation engine
│   │   ├── core/          # Engine loop, types, rng, scoring, qc (Westgard)
│   │   ├── departments/   # Dept logic: reception, biochemistry (chem)
│   │   ├── minigames/     # Pure minigame algorithms: generate() & score()
│   │   └── content/       # Bundled content loaders & Zod schemas
│   ├── store/             # Zustand state management, rAF loop, toasts
│   ├── ui/                # React presentation layer
│   │   ├── screens/       # Top-level views (Home, Briefing, Room, Report, Codex)
│   │   ├── components/    # Station overlays, HUD, sample card, debug panel
│   │   ├── minigames/     # Gesture capture wrappers (SequenceGame, TimingGame)
│   │   └── theme/         # Global greybox styling & design tokens
│   └── platform/          # Save data/codes (save.ts), IndexedDB (storage.ts), PWA (pwa.ts)
├── tools/
│   ├── balance-bot/       # Headless simulation bot verifying shift balance
│   ├── icons/             # `pnpm icons`: draws the app icon SVG and renders PNGs into public/icons/
│   └── content-check/     # CLI script validating JSON schemas & references
├── tests/                 # Playwright E2E mobile tests
└── docs/                  # Design docs (GDD), TDD, medical reference, roadmap
```

---

## Development Commands

| Command              | Action                   | Notes                                                                          |
| :------------------- | :----------------------- | :----------------------------------------------------------------------------- |
| `pnpm dev`           | Start Vite dev server    | Hot module reloading at `http://localhost:5173`                                |
| `pnpm build`         | `tsc -b && vite build`   | Typechecks project references, bundles to `dist/`                              |
| `pnpm preview`       | Preview production build | Runs static preview at `http://localhost:4173`                                 |
| `pnpm lint`          | Run ESLint               | Checks code rules & sim boundary constraints                                   |
| `pnpm format`        | Run Prettier write       | Auto-formats code according to `.prettierrc.json`                              |
| `pnpm format:check`  | Run Prettier check       | Verifies format compliance                                                     |
| `pnpm typecheck`     | Run TypeScript check     | `tsc -b` across app and node project references                                |
| `pnpm test`          | Run Vitest unit tests    | Runs in Node environment without DOM mocks                                     |
| `pnpm test:watch`    | Run Vitest in watch mode | Fast feedback loop for engine development                                      |
| `pnpm content:check` | Validate content JSONs   | Runs Zod schema + cross-referential integrity checks                           |
| `pnpm balance`       | Run balance simulation   | Headless Monte Carlo bot testing (`pnpm balance [count]`)                      |
| `pnpm test:e2e`      | Run Playwright tests     | Requires `pnpm exec playwright install chromium` first                         |
| `pnpm icons`         | Regenerate PWA icons     | Renders `tools/icons/generate.ts` with Playwright Chromium; PNGs are committed |

### Pre-Push Quality Gate

Before submitting any code changes, ensure all verification gates pass cleanly:

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm content:check && pnpm test
```

---

## Code Conventions & Common Patterns

### 1. Invariants for `src/sim/` (Simulation Core)

- **Zero Non-Determinism**: Never use `Math.random()` or `Date.now()`. Use `Rng` derived from `ShiftState.rngState` (`src/sim/core/rng.ts`). Track time exclusively through game seconds (`ShiftState.clock`).
- **No External Imports**: Never import React, Zustand, UI components, or browser APIs inside `src/sim/`.
- **Immutability & Pure Functions**: Do not mutate incoming `ShiftState`. Return a fresh state copy and an array of events:
  ```ts
  export function applyCommand(state: ShiftState, cmd: Command, content: Content): StepResult {
    // Pure transformation, no side effects
    return { state: nextState, events: simEvents };
  }
  ```
- **Soft Failures Over Exceptions**: Invalid player actions should produce `{ type: 'invalidCommand', message }` instead of throwing uncaught runtime exceptions.

### 2. Minigame Contract

Every minigame is split cleanly into two halves:

- **Simulation Logic (`src/sim/minigames/`)**: Pure functions:
  ```ts
  generate(seed: string, difficulty: Difficulty): MinigameInput;
  score(input: MinigameInput, actions: PlayerAction[]): MinigameScore;
  ```
- **UI Component (`src/ui/minigames/`)**: Only responsible for rendering visual feedback and capturing user gestures (`tap`, `press`, `release`, `done`), dispatching them via `minigameResult` command.

### 3. Content-Driven Domain Rules

- All medical facts, reference intervals, transport time thresholds, and defect types reside in `content/`.
- Every rejected sample or clinical decision must correlate to an `explanationKey` in `content/i18n/vi.json` and a matching Codex card in `content/codex/`.
- All player-visible UI strings must be in Vietnamese.

### 4. State Management & Game Loop

- Actions dispatched from UI omit `t` timestamp (`CommandInput`); the Zustand store binds `shift.clock`:
  ```ts
  useGame.getState().dispatch({ type: 'acceptSample', sampleId });
  ```
- Toasts with identical content are grouped with an incrementing counter (`×n`) rather than stacked vertically (`pushToasts` in `src/store/game.ts`).

### 5. Formatting & Naming

- TypeScript: `camelCase` for variables and functions, `PascalCase` for types/interfaces/components, `UPPER_SNAKE_CASE` for constants.
- Unused variables or parameters MUST use a leading underscore `_` to satisfy ESLint (`argsIgnorePattern: '^_'`).
- Prettier: Single quotes (`'`), trailing commas (`all`), line width `110`. Relative paths are used for imports (no `@/` path alias configured).

### 6. Extending Features

- **New Command**: Define command type in `src/sim/core/types.ts`, implement transition in `src/sim/core/engine.ts` (and relevant department logic under `src/sim/departments/`).
- **New Minigame**: Implement pure logic `generate()` and `score()` in `src/sim/minigames/`, register in `src/sim/minigames/index.ts`, create React component in `src/ui/minigames/`, and mount in `src/ui/minigames/MinigameHost.tsx`.
- **New Department**: Add department-specific pure logic under `src/sim/departments/`, add rules/tests in `content/`, and connect to `src/sim/core/engine.ts`.

---

## Important Files

| Path                             | Purpose                                                                                   |
| :------------------------------- | :---------------------------------------------------------------------------------------- |
| `src/sim/core/types.ts`          | Central domain types: `ShiftState`, `Command`, `SimEvent`, `Sample`, `Order`, `ChemState` |
| `src/sim/core/engine.ts`         | Engine reducer: `createShift()`, `applyCommand()`, `advance()`, `replay()`, `hashState()` |
| `src/sim/core/rng.ts`            | Deterministic PRNG (`mulberry32`, `cyrb53`) and random sampling helpers                   |
| `src/sim/content/schema.ts`      | Comprehensive Zod schemas for all JSON files in `content/`                                |
| `src/sim/content/load.ts`        | Content loader and cross-reference validation (`crossCheck`)                              |
| `src/store/game.ts`              | Primary Zustand store (`useGame`), time scaling, overlay state, and dispatch logic        |
| `src/store/loop.ts`              | Animation frame loop (`useGameLoop`) with document visibility handling                    |
| `src/platform/save.ts`           | `SaveData` v2, `migrate`, `exportCode`/`importCode` (save codes, validation)              |
| `src/platform/storage.ts`        | IndexedDB persistence wrapper using `idb-keyval` (`save:v1`)                              |
| `src/platform/pwa.ts`            | Service worker registration (build only), install prompt, update-ready state              |
| `src/ui/theme/global.css`        | Greybox design system, CSS variables, typography, and responsive layout                   |
| `tools/content-check/index.ts`   | Content validation script executed by `pnpm content:check`                                |
| `tools/balance-bot/index.ts`     | Automated headless shift simulation bot (`pnpm balance`)                                  |
| `docs/05-noi-dung-chuyen-mon.md` | Authoritative domain handbook ("Labo Xanh") detailing clinical rules and reference tables |
| `docs/07-TDD.md`                 | Technical Design Document specifying command contracts, events, and engine architecture   |

---

## Runtime/Tooling Preferences

- **Package Manager**: `pnpm@10.28.0` (mandated via `packageManager` in `package.json`). Do not use `npm` or `yarn`.
- **Runtime**: Node.js `>= 22` (stipulated in `engines.node`).
- **TypeScript**: `~6.0.3` using Project References (`tsconfig.json` referencing `tsconfig.app.json` and `tsconfig.node.json`). Strict compiler flags enabled (`noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`).
- **Module Format**: ESM (`"type": "module"`).
- **Bundler**: Vite `8.x` with `@vitejs/plugin-react` and `vite-plugin-pwa` 2.x (generateSW, `registerType: 'prompt'`, `injectRegister: false`, manifest hand-written in `public/`; supports Vite 8). Base URL is relative (`./`) for static deployment. The SW exists only in `vite build`/`preview` output (`pnpm dev` never registers it); `skipWaiting` is not automatic so a new version never reloads a shift.

---

## Testing & QA

### 1. Unit & Simulation Testing (Vitest)

- **Configuration**: Managed within `vite.config.ts` (`environment: 'node'`).
- **Scope**: Covers `src/sim/**/*.test.ts` and `tools/**/*.test.ts`.
- **Key Test Suites**:
  - `src/sim/core/engine.test.ts`: Verifies simulation determinism: identical seed + identical command stream produces bit-for-bit identical state (`hashState(replay) === hashState(run.state)`).
  - `src/sim/core/qc.test.ts`: Tests Westgard multi-rule algorithms ($1_{2s}, 1_{3s}, 2_{2s}, R_{4s}, 4_{1s}, 10_x$).
  - `src/sim/core/scoring.test.ts`: Tests 4-pillar grading (TAT, Accuracy, Safety, Efficiency) and star calculation.
  - `src/store/toasts.test.ts`: Toast merging (`×n`, max 2) and per-shift clock pacing (`timeScale`).
  - `src/sim/core/events.test.ts`: each event kind (E1–E10 effects), phone answers/missed calls, quiz, determinism with events. Mechanic tests that must not be disturbed by events build a Content copy with `events: []` (see `chemExtras.test.ts`).
  - `src/sim/departments/chemExtras.test.ts`: dilution minigame (pure scoring, flow, too-small re-run, wrong multiply, premature release), Δ (flag, unverified release), urine strip (pure scoring, flow, misread penalty), bots on `ch1-d4`/`ch1-d5`.
  - `src/sim/departments/chemQc.test.ts`: QC gating, remedies, delayed consequence of a wrong Pass, determinism, bots on `ch1-d3`.
  - `src/sim/content/content.test.ts`: Verifies bundled content integrity via Zod.
  - `src/platform/save.test.ts`: save codes (round-trip, altered/truncated/junk codes, newer versions), save validation, `migrate` v1→v2. Runs in node without mocking IndexedDB (`save.ts` is IO-free).
- **Pattern**: Pure function tests without mocks or browser shims.

### 2. End-to-End Testing (Playwright)

- **Configuration**: `playwright.config.ts`.
- **Viewports**: Focuses on mobile screen dimensions:
  - `phone-360`: Galaxy S9+ ($360 \times 640$) Chromium.
  - `phone-390`: iPhone 13 ($390 \times 844$) Chromium.
- **Web Server**: Auto-launches production preview on port 4173 (`pnpm build && pnpm preview --port 4173 --strictPort`).
- **Save/PWA spec** (`tests/save-pwa.spec.ts`): export → reset → import round-trip, wrong codes, reduced-motion switch, install reminder (once), settings from pause menu, manifest validity, service worker ready + offline reload on `vite preview`. `tests/responsive.spec.ts` also audits the Settings screen.
- **Debug Assistance**: E2E tests navigate with query parameter `?debug=1` to expose the Debug Panel (`Bảng debug`), allowing instant shift completion (`Kết thúc ca ngay`) without waiting for real-time timers.

### 3. Balance Bot Testing (`pnpm balance`)

- Runs Monte Carlo simulations using 3 player archetypes:
  - `expert`: Skilled player making optimal decisions; expected $\ge 4$ stars.
  - `novice`: Imperfect player making typical beginner errors.
  - `idle`: Passive player performing no actions; expected 1 star.
- Generates statistical distribution of star ratings, score averages, and trust floors across configured shifts.

### 4. Coverage Caveat

- Passing test suites does not guarantee total absence of UI bugs: current tests only cover the Day 0.1 reception flow and opening the centrifuge in Day 1.1. Other edge cases and interactive paths should be verified manually or through expanded tests.

---

## Design Decisions (open questions)

- **Clock vs. open sheets**: the shift clock is held only for mentor tips, full-screen minigames and the QC sheet (GDD §4: big decision screens pause time). Centrifuge, post-spin tray, results and sample-card sheets keep the clock running on purpose: they are the workspace, and pausing there would remove the time-management pressure (pillar 2). Decided against pausing more. Revisit only if M3-8 playtests show new players losing trust just by reading sheets; preferred remedy then is slowing the clock (about ×0.25) while a sheet is open, not pausing.
- Tips and toasts share one bottom container (`.floaters`, above the bottom bar) so they never cover the HUD or tray; tips tied to a sheet (`qcRun`, `qcFailed`, `eventDecision`) go to `inlineTips` and render inside that sheet.
- Minigames pause the clock (GDD §4 says they run it); done because minigame screens show no clock. Revisit if a clock chip is added to the minigame frame.

---

## Workflow Rules (bắt buộc)

Áp dụng sau mỗi phase hoặc task lớn:

1. **Cập nhật AGENTS.md**: nếu thay đổi nhiều (mốc, phạm vi đã/chưa triển khai, kiến trúc, lệnh, quy ước), sửa lại file này trước khi kết thúc.
2. **Test thực tế bằng subagent + OMP relay**: dùng `task` để giao subagent điều khiển Chrome qua OMP Browser Relay (`browser.open({ app: { relay: true } })`; Chrome phải đang mở ít nhất một tab, dev server chạy sẵn). Subagent tự chơi, kiểm tra hành vi và UI/UX, chụp ảnh (390×844 và 360×640) rồi báo cáo; người dùng chỉ xem kết quả. Không sửa code trong lượt test. Nếu relay không nối được, báo lỗi nguyên văn thay vì đổi sang trình duyệt khác.
3. **Commit, push, merge**: xong phase/task lớn thì chạy cổng kiểm tra (`pnpm lint && pnpm format:check && pnpm typecheck && pnpm content:check && pnpm test`), commit, rồi `git push` lên GitHub. Xong một nhánh thì merge vào `main` và push `main`.

---

## Mobile Web UI Rules (verified; follow when designing, coding and testing UI)

Verified against MDN, web.dev, W3C WCAG and WebKit docs. Where a commonly circulated rule is wrong for this game, the corrected rule is given.

1. **Viewport.** Keep `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` (already in `index.html`). **Do NOT add `maximum-scale=1` / `user-scalable=no`**: it breaks WCAG 1.4.4 (resize text, level AA) and iOS Safari ignores it since iOS 10 anyway (WebKit blog "New Interaction Behaviors in iOS 10"). Stop accidental double-tap zoom with `touch-action: manipulation` (set on every `button`).
2. **Height.** Use `100dvh` (with `100%` fallback), never bare `100vh` for full-screen shells (`html, body, #root` already do). Prefer `inset: 0` / `100%` over `100vw` (includes scrollbar width on desktop). Only the shell clips (`.app { overflow: hidden }`); every screen/sheet scrolls internally with `overflow-y: auto`. Never put `overflow: hidden` on content that can exceed the viewport at 320×568.
3. **Safe areas.** `viewport-fit=cover` is required (present). `.app` pads top/left/right with `env(safe-area-inset-*, 0px)` on phones; bottom bars add `env(safe-area-inset-bottom)`. HUD must not touch the notch edge; footers/controls must not sit under the Home bar. New fixed/sticky bars MUST include the bottom inset.
4. **Orientation.** Portrait only, but **no landscape overlay** (product decision). If one is ever added, do NOT use `innerWidth > innerHeight`: it would also hide the game on desktop. Gate by `(pointer: coarse) and (orientation: landscape)` and a small height.
5. **Gestures.** `overscroll-behavior: none` on `body` (stops pull-to-refresh/bounce). **Do NOT set `touch-action: none` on the whole app**: it would kill scrolling of screens and sheets (this game is DOM UI, not a canvas). Use `touch-action: none` only on drag/hold surfaces (`.holdbtn`, future drag minigames); use `pan-y` for scrollers that sit inside such surfaces.
6. **Touch artifacts.** `-webkit-tap-highlight-color: transparent` (on `:root`). `user-select: none` + `-webkit-touch-callout: none` apply to `button` and to `.mg` (minigames), and `.mg` blocks `contextmenu` (press-and-hold buttons need long-press). **Do NOT disable text selection on reading content** (Codex cards, report, sheets): players copy/quote terms and it is an accessibility regression.
7. **Targets and spacing.** Minimum 44×44 CSS px for every interactive element (Apple HIG 44pt, WCAG 2.5.5 enhanced 44px; WCAG 2.5.8 AA floor is only 24px, so 44 is our stricter project rule). Primary actions (Nhận, Vào ca, Giữ) SHOULD be ≥48px (Material 48dp). Keep ≥8px between adjacent targets.
8. **Audio (when added).** Browsers block audio until a user gesture. Create/resume the `AudioContext` (`ctx.resume()`) inside the first tap/click handler, again on `visibilitychange` return, and never autoplay BGM before that. iOS also mutes Web Audio with the silent switch; sounds must never be the only feedback (always pair with visual).
9. **Responsive coverage.** Layout MUST hold at 320×568, 360×640, 390×844, 430×932 (and the desktop frame at 768×1024, 1366×768, 1920×1080). `tests/responsive.spec.ts` audits overflow, centering and tap targets; extend it when adding screens.

### UI test checklist (for relay/Playwright testers; report each item PASS/FAIL with evidence)

- No horizontal scroll; nothing cut off or overlapping at 320×568 and 360×640; text is wrapped, not clipped.
- Every button/tab/chip ≥44×44 and ≥8px from neighbors (query computed rects); body text ≥14px (SVG tube-cap letters excepted).
- Pinch/double-tap does not zoom the page by accident; pull-down does not refresh; no rubber-band bounce.
- Bottom controls are fully visible with the browser toolbar shown and hidden (`100dvh`), and clear of the Home bar (safe-area).
- Long-press on a button or inside a minigame shows no browser menu and selects no text; long-press on reading text (Codex, report) still selects.
- Scrolling still works in every sheet/screen (no `touch-action: none` leaks).
- Hold-and-release minigame control keeps working through a 2s long-press.
- Sheets, toasts and tips never cover the HUD or the primary action.
