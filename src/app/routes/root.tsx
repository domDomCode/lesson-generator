import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"

import { PlannerStepper } from "@/features/lesson-planner/components/planner-stepper"
import { Toaster } from "@/shared/ui/toast"

export const rootRoute = createRootRoute({
  component: RootLayout,
})

/**
 * Mobile-first shell: one centred column (390px-first, max 720px on
 * desktop) under a low sticky header that carries only the process
 * stepper. Screens that need sticky elements below the header (the budget
 * bar) pin to top-12 — keep the header height (h-12) in sync with that.
 */
function RootLayout() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[720px] items-center px-4">
          <PlannerStepper />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[720px]">
        <Outlet />
      </main>
      <Toaster />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </div>
  )
}
