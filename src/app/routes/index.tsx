import { createRoute, redirect } from "@tanstack/react-router"

import { rootRoute } from "@/app/routes/root"

/** The app starts at the brief. */
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/zalozenia-lekcji" })
  },
})
