import { createRoute } from "@tanstack/react-router"

import { rootRoute } from "@/app/routes/root"

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">About</h1>
      <p className="text-muted-foreground text-sm">
        This route exists to demonstrate sidebar navigation with TanStack Router —
        nothing else lives here yet.
      </p>
    </div>
  )
}
