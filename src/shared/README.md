# Shared

Code used by more than one feature.

- `ui/` — shadcn/ui primitives (generated via `pnpm dlx shadcn@latest add <component>`,
  configured in `components.json` to land here).
- `lib/` — generic utilities (e.g. `cn()`).
- `hooks/` — cross-feature hooks.

Nothing feature-specific should live here — if a hook or component is only
used by one feature, it belongs in that feature's own folder instead.
