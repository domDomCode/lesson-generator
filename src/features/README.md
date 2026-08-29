# Features

Each feature is a self-contained folder named after the domain concept it owns.
There is one feature today — `lesson-planner` — and it is the whole app.

```
features/lesson-planner/
  model/        # domain types + wire DTOs (types.ts), pure helpers
                #   (budget.ts, plural.ts, labels.ts) — no React, no DOM
  state/        # external store: pure reducer + useSyncExternalStore
                #   (store.ts) and the scroll-spy channel (active-block.ts)
  data/         # typed fetch client (api.ts), the SSE generation client
                #   (generation.ts), React Query hooks (textbooks.ts) and
                #   the optimistic material mutations (materials-actions.ts)
  components/   # presentational feature UI: timeline/, time-budget-bar,
                #   planner-stepper — composed from shared/ui primitives
  screens/      # one folder per screen: brief/, plan/, block-sheet/,
                #   materials/, exam/
```

Cross-feature, reusable code (design-system primitives, generic utils) belongs
in `src/shared/`, not here.

## Conventions

- **Imports:** the `@/…` alias is used to cross top-level areas (`src/app`,
  `mock-backend`); imports **within** a feature are relative (`../../model/…`).
- **Files:** kebab-case; one primary component per file, named after it
  (`brief-screen.tsx` → `BriefScreen`). shadcn-style compound primitives
  (`Card` + `CardHeader` + …) stay together in one file. No component lives in
  an `index.*` barrel.
- **`model/` is framework-free** so the MSW mock backend can import the wire
  contract (`model/types.ts`) and the budget math (`model/budget.ts`) from it —
  the mock and the app share one source of truth. This is the only place
  `mock-backend/` reaches into a feature.
