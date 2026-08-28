# Features

Each feature is a self-contained folder named after the domain concept it owns
(e.g. `posts`, `users`). Inside a feature folder:

```
features/<feature>/
  components/   # feature-specific UI (composed from shared/ui primitives)
  hooks/        # feature-local hooks (form state, derived state, etc.)
  queries/      # TanStack Query `useQuery` hooks + fetch functions + types
  mutations/    # TanStack Query `useMutation` hooks + fetch functions
```

Cross-feature, reusable code (design-system primitives, generic utils) belongs
in `src/shared/`, not here. See `src/features/posts` for a full example wired
up to the MSW mock backend in `mock-backend/`.
