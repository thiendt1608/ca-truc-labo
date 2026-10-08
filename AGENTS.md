# Repository Guidelines

## Project Overview

**CA TRỰC LABO** is a web-based, deterministic time-management simulation game modeling the shift of a clinical laboratory medical technologist (_Kỹ thuật viên xét nghiệm_).

- **Current Milestone**: M2 Greybox, merged into `main` (branch `claude/m2-hop-xam`). Playable shifts: `ch0-d1` Reception, `ch1-d1` Clinical Biochemistry and `ch1-d3` Biochemistry QC (ch1-d2 not written yet, so the campaign list jumps 1.1 → 1.3). Visuals are greybox blocks and text; the redesign in `DESIGN.md` + `stitch-design/` (warm cozy "toycore", Quicksand + Be Vietnam Pro, chunky 3D pill buttons, per-department colors) is applied at M3. Mockups include features not in the GDD (xu/EXP/level, coffee energy, shop); treat the GDD (`docs/04-GDD.md`) as the source of truth for mechanics. `docs/00-README.md` mentions "M1 next" which is outdated.
- **Current Implementation Scope (Do not assume unimplemented features exist)**:
  - _Implemented_: Deterministic sim core (PRNG, command engine, replay), Trust meter, 4-pillar grading & shift report, post-centrifuge hemolysis/lipemia/icterus, critical values + phone reporting (`callCritical`), in-shift QC on day `ch1-d3` (commands `chem/runQC`, `chem/judgeQC`, `chem/qcAction` in `src/sim/departments/chemQc.ts`; scenarios/remedies in `content/chem/qc.json`; analyzer is gated until QC passes; false "Pass" taints results and costs trust at release; UI `QcSheet` with SVG Levey-Jennings chart), Westgard algorithms in `core/qc.ts`, minigame `spillCleanup` (`SequenceGame` hosting `TimingGame` button-hold step; `holdTimer` registered), 21 Codex cards, IndexedDB persistence, debug panel (`?debug=1`), balance bot (`pnpm balance`), Playwright 360/390.
  - _Not Yet Implemented_: sample dilution, urine dipsticks, Delta check ($\Delta$), random events E1–E10, phone calls, shifts `ch0-d2+` / `ch1-d2+`, Hematology department onwards, Free shift / Challenge mode, equipment purchasing (budget increments only, no store spending), PWA service worker, audio/sound effects, save codes, dark mode toggle, campaign/settings map. Commands from `docs/07-TDD.md` section 4.2 are only partially implemented.
- **Domain Fidelity**: Strictly guided by professional laboratory rules ("Labo Xanh", SSOT in `docs/05-noi-dung-chuyen-mon.md` & `content/*.json`). Technologists never diagnose diseases. Critical samples marked as irreplaceable (e.g., CSF, surgical biopsy) must never be rejected outright (require `contact` action).
- **Target Platform**: Client-side static web application with PWA/offline architecture, designed mobile-first (touch-first viewports: 360×640 to 390×844).

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

- **Zustand Store (`src/store/game.ts`)**: Holds the current `shift: ShiftState | null`, action history log, and active UI overlays.
- **Game Loop (`src/store/loop.ts`, hook `useGameLoop` mounted in `src/ui/App.tsx`)**: Runs on `requestAnimationFrame` and calls `tickReal`. Game seconds per real second = `timeScale(shift.duration)` in `src/store/game.ts` (`duration / TARGET_REAL_SECONDS`, ~6 real minutes per shift at Normal, scaled by difficulty). The clock is held while a mentor tip is showing (no overlay) or a minigame is active; paused on `visibilitychange` when the document is hidden.
- **Event Translation**: Translates `SimEvent` outputs into grouped user notifications (`pushToasts`), codex unlock popups, or screen transitions.

### 4. UI Layer (`src/ui/`) & Platform (`src/platform/`)

- React 19 components consuming Zustand state via `useGame()`.
- Pure CSS with design variables (`src/ui/theme/global.css`) following greybox guidelines (touch targets $\ge 44\text{px}$).
- Storage layer (`src/platform/storage.ts`) saves player progression (`save:v1`) into IndexedDB via `idb-keyval` with graceful fallback when storage is denied.

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
│   └── platform/          # IndexedDB persistence (idb-keyval)
├── tools/
│   ├── balance-bot/       # Headless simulation bot verifying shift balance
│   └── content-check/     # CLI script validating JSON schemas & references
├── tests/                 # Playwright E2E mobile tests
└── docs/                  # Design docs (GDD), TDD, medical reference, roadmap
```

---

## Development Commands

| Command              | Action                   | Notes                                                     |
| :------------------- | :----------------------- | :-------------------------------------------------------- |
| `pnpm dev`           | Start Vite dev server    | Hot module reloading at `http://localhost:5173`           |
| `pnpm build`         | `tsc -b && vite build`   | Typechecks project references, bundles to `dist/`         |
| `pnpm preview`       | Preview production build | Runs static preview at `http://localhost:4173`            |
| `pnpm lint`          | Run ESLint               | Checks code rules & sim boundary constraints              |
| `pnpm format`        | Run Prettier write       | Auto-formats code according to `.prettierrc.json`         |
| `pnpm format:check`  | Run Prettier check       | Verifies format compliance                                |
| `pnpm typecheck`     | Run TypeScript check     | `tsc -b` across app and node project references           |
| `pnpm test`          | Run Vitest unit tests    | Runs in Node environment without DOM mocks                |
| `pnpm test:watch`    | Run Vitest in watch mode | Fast feedback loop for engine development                 |
| `pnpm content:check` | Validate content JSONs   | Runs Zod schema + cross-referential integrity checks      |
| `pnpm balance`       | Run balance simulation   | Headless Monte Carlo bot testing (`pnpm balance [count]`) |
| `pnpm test:e2e`      | Run Playwright tests     | Requires `pnpm exec playwright install chromium` first    |

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
| `src/platform/storage.ts`        | IndexedDB persistence wrapper using `idb-keyval` (`save:v1`)                              |
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
- **Bundler**: Vite `8.x` with `@vitejs/plugin-react`. Base URL is relative (`./`) for static deployment.

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
  - `src/sim/departments/chemQc.test.ts`: QC gating, remedies, delayed consequence of a wrong Pass, determinism, bots on `ch1-d3`.
  - `src/sim/content/content.test.ts`: Verifies bundled content integrity via Zod.
- **Pattern**: Pure function tests without mocks or browser shims.

### 2. End-to-End Testing (Playwright)

- **Configuration**: `playwright.config.ts`.
- **Viewports**: Focuses on mobile screen dimensions:
  - `phone-360`: Galaxy S9+ ($360 \times 640$) Chromium.
  - `phone-390`: iPhone 13 ($390 \times 844$) Chromium.
- **Web Server**: Auto-launches production preview on port 4173 (`pnpm build && pnpm preview --port 4173 --strictPort`).
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

## Workflow Rules (bắt buộc)

Áp dụng sau mỗi phase hoặc task lớn:

1. **Cập nhật AGENTS.md**: nếu thay đổi nhiều (mốc, phạm vi đã/chưa triển khai, kiến trúc, lệnh, quy ước), sửa lại file này trước khi kết thúc.
2. **Test thực tế bằng subagent + OMP relay**: dùng `task` để giao subagent điều khiển Chrome qua OMP Browser Relay (`browser.open({ app: { relay: true } })`; Chrome phải đang mở ít nhất một tab, dev server chạy sẵn). Subagent tự chơi, kiểm tra hành vi và UI/UX, chụp ảnh (390×844 và 360×640) rồi báo cáo; người dùng chỉ xem kết quả. Không sửa code trong lượt test. Nếu relay không nối được, báo lỗi nguyên văn thay vì đổi sang trình duyệt khác.
3. **Commit, push, merge**: xong phase/task lớn thì chạy cổng kiểm tra (`pnpm lint && pnpm format:check && pnpm typecheck && pnpm content:check && pnpm test`), commit, rồi `git push` lên GitHub. Xong một nhánh thì merge vào `main` và push `main`.
