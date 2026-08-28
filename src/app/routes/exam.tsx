import { createRoute, redirect } from "@tanstack/react-router"

import { rootRoute } from "@/app/routes/root"
import { getPlannerState } from "@/features/lesson-planner/state/store"
import { ExamScreen } from "@/features/lesson-planner/screens/exam/ExamScreen"

export const examRoute = createRoute({
  getParentRoute: () => rootRoute,
  // Sprawdzian is locked until an accepted plan exists.
  beforeLoad: () => {
    const s = getPlannerState()
    if (s.versions.length === 0) {
      throw redirect({ to: s.generation.phase === "idle" ? "/brief" : "/plan" })
    }
  },
  path: "/exam",
  component: ExamScreen,
})
