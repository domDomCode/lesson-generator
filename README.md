# edu-app-quantica

React + TypeScript + Vite, with TanStack Query for data fetching, shadcn/ui
for the design system, and MSW for a realistic mock backend during
development.

## Getting started

```bash
pnpm install
pnpm dev
```

The app opens with a demo "Posts" feature backed entirely by mocked network
requests (see [Mock backend](#mock-backend) below) — no real API required.

## Project structure

```
src/
  app/              # app shell: providers (QueryClientProvider, etc.)
  features/
    posts/          # example feature — see src/features/README.md
      components/
      hooks/
      queries/
      mutations/
  shared/
    ui/             # shadcn/ui primitives (see src/shared/README.md)
    lib/            # shared utilities (e.g. cn())
    hooks/          # cross-feature hooks
mock-backend/
  handlers/         # MSW request handlers, one file per feature/resource
  data/             # in-memory mock data used by handlers
  browser.ts        # setupWorker(...handlers) entrypoint used in dev
```

New features follow the same `components/ hooks/ queries/ mutations/`
pattern — copy `src/features/posts` as a starting point. Anything shared
across features (design-system primitives, generic utils) lives in
`src/shared/`, not inside a feature folder.

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
