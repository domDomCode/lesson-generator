# Planer Lekcji

A mobile-first lesson planner for teachers (Polish UI). React 19 + TypeScript +
Vite, TanStack Router + Query, a shadcn-style Radix UI kit, and MSW for a
realistic mock backend during development.

## Getting started

```bash
pnpm install
cp .env.example .env   # keeps the mock backend on for local dev
pnpm dev
```

Requires Node ≥ 22 and pnpm (see `packageManager` in `package.json`).

The app is a mobile-first (390px-first, max 720px column) lesson planner
for teachers, in Polish: a teacher fills in a brief, a streamed two-phase
generation builds a 45-minute plan on a timeline with a segmented
time-budget bar, blocks and materials are edited in bottom sheets, and the
flow ends with an exam builder. The whole backend is mocked with MSW (see
[Mock backend](#mock-backend) below) — no real API required — but the UI is
fully interactive and sends real, typed HTTP payloads (the wire contract
lives in `src/features/lesson-planner/model/types.ts`).

## Project structure

```
src/
  app/              # app shell: providers, router, route fallbacks, error boundary
  features/
    lesson-planner/ # the app: brief → plan → exam (see src/features/README.md)
      model/        # domain types + wire DTOs, pure helpers (budget, plural, labels)
      state/        # external store (reducer + useSyncExternalStore), scroll-spy
      data/         # typed API client, SSE generation client, query hooks, mutations
      components/   # presentational feature UI: timeline/, time-budget-bar, ...
      screens/      # brief/, plan/, block-sheet/, materials/, exam/
  shared/
    ui/             # Radix UI + Tailwind primitives (see src/shared/README.md)
    lib/            # shared utilities (e.g. cn())
    hooks/          # cross-feature hooks
mock-backend/
  handlers/         # MSW request handlers, one file per feature/resource
  data/             # in-memory mock data used by handlers
  browser.ts        # setupWorker(...handlers) entrypoint used in dev
```

Conventions: kebab-case filenames, one primary component per file (named after
it), no components in `index.*` barrels. The `@/…` alias crosses top-level
areas; imports within a feature are relative. `mock-backend/` imports the wire
contract and budget math from `src/features/lesson-planner/model/` (kept
framework-free) so the mock and the app share one source of truth.

Adding a UI primitive: `pnpm dlx shadcn@latest add <component>` — `components.json`
lands it in `src/shared/ui`.

## Mock backend

Mocking is powered by [MSW](https://mswjs.io/) and toggled with the
`VITE_ENABLE_MOCKS` env var (set in `.env`):

- `VITE_ENABLE_MOCKS=true` — `src/main.tsx` starts the MSW service worker
  before rendering the app, so every `fetch` to `/api/*` is intercepted by
  the handlers in `mock-backend/handlers/`.
- `VITE_ENABLE_MOCKS=false` (or unset) — mocking is skipped and `fetch`
  calls go to a real backend. The MSW code is dynamically imported, so it's
  excluded from the bundle entirely when mocking is off.

To add mocks for a new feature, create a handlers file in
`mock-backend/handlers/`, add matching mock data under `mock-backend/data/`,
and register the handlers in `mock-backend/handlers/index.ts`.

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` — type-check and build for production
- `pnpm preview` — preview the production build locally
- `pnpm typecheck` — `tsc -b` (strict)
- `pnpm lint` — oxlint
- `pnpm format` / `pnpm format:check` — Prettier
