# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"El Sembrador" — a Spanish-language poultry farm management app for tracking pullet (pollita BB) rearing batches from Day 0 to Week 16. Built from a Google AI Studio template (see `metadata.json`, `README.md`). It is a **client-only React SPA**: there is no backend/API layer in `src/`, and all data lives in the browser via `localStorage`. The `express`/`dotenv` deps and `.env.example` (`GEMINI_API_KEY`, `APP_URL`) are AI Studio scaffolding left over from the template — no code in `src/` currently reads them or calls the Gemini API.

All UI copy, comments, and domain terms in this codebase are in Spanish (e.g. "Lote" = batch, "Recría" = rearing, "Pollita BB" = day-old pullet chick). Keep new code/UI text consistent with this.

## Commands

- `npm run dev` — start Vite dev server on port 3000 (`vite --port=3000 --host=0.0.0.0`)
- `npm run build` — production build (`vite build`)
- `npm run preview` — preview the production build
- `npm run lint` — type-check only, no emit (`tsc --noEmit`); there is no separate lint tool (no ESLint) and **no test suite/runner** configured in this repo
- `npm run clean` — removes `dist/` and `server.js`

There is no single-test command since there are no tests. Use `npm run lint` to verify TypeScript correctness after changes.

## Architecture

### State and persistence
`src/App.tsx` is the single source of truth for all app state (batches, records, PIN, active tab, dark mode, accessibility mode, milestone settings). There is no state management library, no context, and no router — everything is `useState` + prop drilling from `App.tsx` down into view/modal components. Each piece of state is mirrored to `localStorage` via a dedicated `useEffect` keyed on that state (keys: `sembrador_pin`, `sembrador_batches`, `sembrador_records`, `sembrador_accessibility`, `sembrador_darkmode`, `sembrador_milestones`). When adding new persisted state, follow this same load-on-init + effect-to-save pattern.

### Data model (`src/types.ts`)
Two core entities:
- `Batch` — a "Lote" (rearing batch) with `startDate`, `initialCount`, `initialCostPerPullet`, etc.
- `OperationRecord` — a dated operational entry belonging to a batch, tagged with a `CategoryType` (`alimento` | `mortalidad` | `vacunas` | `calefaccion` | `otros`) carrying a `cost` and optional `quantity`/`unit`.

Nothing else is persisted directly — all farm metrics are *derived* on every render from `batches` + `records` via `src/utils/calculations.ts`:
- `calculateBatchSummary(batch, records)` → per-batch `BatchSummary` (age in days/weeks, mortality rate/count, live count, total/unit cost, projected cost at week 16, costs broken out by category). Mortality is critical at ≥2.0% (`isCriticalMortality`). Rearing target is `TARGET_DAYS = 112` (16 weeks).
- `calculateFarmConsolidated(summaries)` → farm-wide `FarmConsolidated` totals across active batches only.
- `formatCurrency` formats numbers as ARS-style currency (`es-AR` locale, `$` prefix).

`App.tsx` recomputes `summaries` and `consolidated` on every render by mapping over `batches`/`records` — there's no memoization, so keep this in mind if these arrays grow large.

### View flow
`App.tsx` renders one of the four tab views (`dashboard` | `consolidated` | `health` | `settings`) in `src/components/`, unless `selectedBatchId` is set, in which case `BatchDetailView` takes over the main content area regardless of active tab. Selecting/deselecting a batch and switching tabs are independent bits of state — components must handle both (see `Header.tsx`'s nav buttons, which clear `selectedBatchId` before switching tabs).

Two modals (`OperationModal` for adding an `OperationRecord` of a given `CategoryType`, `NewBatchModal` for creating a `Batch`) are rendered at the bottom of `App.tsx` and driven by state lifted into `App.tsx` (`isNewBatchOpen`, `isRecordModalOpen`, `activeRecordCategory`, `targetBatchForRecord`).

Access is gated by a 4-digit PIN (`PinScreen`), stored in plaintext in `localStorage` (`sembrador_pin`, default `'1234'`) — this is a lightweight screen lock, not real auth.

`src/utils/sampleData.ts` provides `INITIAL_BATCHES`/`INITIAL_RECORDS` (used as the default/seed data and by "reset to sample data" in Settings) and `VACCINE_SCHEDULE`, the fixed vaccination calendar (by week/day) that `HealthScheduleView` cross-references against each batch's current age to show due/upcoming vaccines.

### Import/export
`SettingsBackupView` implements the only data portability: exports `{ version, appName, exportDate, pin, batches, records }` as a downloaded JSON file, and imports by parsing an uploaded JSON file and calling back into `App.tsx`'s `handleImportData`/`onUpdatePin`. There is no schema validation beyond checking `parsed.batches && parsed.records` exist.

### Styling and themes
Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.js` — v4 is CSS-first). Dark mode and high-accessibility mode are **not** implemented with Tailwind's `dark:` variant; instead `App.tsx` conditionally adds `dark-theme` / `high-accessibility` classes to the root div, and `src/index.css` overrides specific Tailwind utility classes (e.g. `.dark-theme .bg-white`) with `!important`. When adding new components, be aware that only the utility classes already listed in `src/index.css` get dark/accessibility treatment — using a new `bg-*`/`text-*` color not covered there will not adapt to dark mode or accessible mode and may need a corresponding override added.

Path alias `@/*` maps to the repo root (see `tsconfig.json` and `vite.config.ts`).
