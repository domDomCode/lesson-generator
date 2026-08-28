# edu-app-quantica

React + TypeScript + Vite, with TanStack Query for data fetching, shadcn/ui
for the design system, and MSW for a realistic mock backend during
development.

## Getting started

```bash
pnpm install
pnpm dev
```

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
  app/              # app shell: providers (QueryClientProvider, etc.)
  features/
    lesson-planner/ # the app: brief → plan → exam
      model/        # domain types + wire DTOs (types.ts), pure budget math
      state/        # external store (reducer + useSyncExternalStore), scroll-spy
      data/         # typed API client, SSE generation client, query hooks
      components/   # timeline + segmented time-budget bar (signature elements)
      screens/      # brief/, plan/, block-sheet/, materials/, exam/
  shared/
    ui/             # shadcn/ui primitives (see src/shared/README.md)
    lib/            # shared utilities (e.g. cn())
    hooks/          # cross-feature hooks
mock-backend/
  handlers/         # MSW request handlers, one file per feature/resource
  data/             # in-memory mock data used by handlers
  browser.ts        # setupWorker(...handlers) entrypoint used in dev
```

Anything shared across features (design-system primitives, generic utils)
lives in `src/shared/`, not inside a feature folder.

Adding a shadcn component: `pnpm dlx shadcn@latest add <component>` — it's
configured (via `components.json`) to land in `src/shared/ui` automatically.

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
