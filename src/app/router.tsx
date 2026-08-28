import { createRouter } from "@tanstack/react-router"

import { aboutRoute } from "@/app/routes/about"
import { indexRoute } from "@/app/routes/index"
import { rootRoute } from "@/app/routes/root"

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
