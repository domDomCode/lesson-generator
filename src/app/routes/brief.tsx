import { createRoute } from "@tanstack/react-router"

import { rootRoute } from "@/app/routes/root"
import { BriefScreen } from "@/features/lesson-planner/screens/brief/brief-screen"

export const briefRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/zalozenia-lekcji",
  component: BriefScreen,
})
