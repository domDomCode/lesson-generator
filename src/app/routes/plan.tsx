import { createRoute, redirect } from "@tanstack/react-router"

import { rootRoute } from "@/app/routes/root"
import { getPlannerState } from "@/features/lesson-planner/state/store"
import { PlanScreen } from "@/features/lesson-planner/screens/plan/PlanScreen"

export const planRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plan-lekcji",
  // Nothing to plan yet — back to the brief.
  beforeLoad: () => {
    if (getPlannerState().generation.phase === "idle") {
      throw redirect({ to: "/zalozenia-lekcji" })
    }
  },
  component: PlanScreen,
})
