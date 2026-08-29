import { createRouter } from "@tanstack/react-router"

import { RouteError, RouteNotFound } from "@/app/route-fallbacks"
import { briefRoute } from "@/app/routes/brief"
import { examRoute } from "@/app/routes/exam"
import { indexRoute } from "@/app/routes/index"
import { planRoute } from "@/app/routes/plan"
import { rootRoute } from "@/app/routes/root"

const routeTree = rootRoute.addChildren([indexRoute, briefRoute, planRoute, examRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: RouteNotFound,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
