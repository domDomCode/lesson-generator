import { useNavigate, useRouterState } from "@tanstack/react-router"

import { ProcessStepper, type StepItem, type StepState } from "@/shared/ui/stepper"
import { selectPlanReady, usePlannerStore } from "../state/store"

/**
 * The app-wide header stepper: `Brief ✓ · Plan · Sprawdzian`.
 * `Sprawdzian` stays locked until an accepted plan (v1) exists.
 */
export function PlannerStepper() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const planReady = usePlannerStore(selectPlanReady)
  const briefStarted = usePlannerStore((s) => s.generation.phase !== "idle")
  const examReady = usePlannerStore((s) => s.exam != null)

  function stateFor(step: "brief" | "plan" | "exam"): StepState {
    const active =
      (step === "brief" && pathname.startsWith("/zalozenia-lekcji")) ||
      (step === "plan" && pathname.startsWith("/plan-lekcji")) ||
      (step === "exam" && pathname.startsWith("/sprawdzian"))
    if (active) return "active"
    if (step === "brief") return briefStarted ? "done" : "available"
    if (step === "plan") return planReady ? "done" : briefStarted ? "available" : "locked"
    if (examReady) return "done"
    return planReady ? "available" : "locked"
  }

  const steps: StepItem[] = [
    {
      key: "brief",
      label: "Brief",
      state: stateFor("brief"),
      onSelect: () => navigate({ to: "/zalozenia-lekcji" }),
    },
    {
      key: "plan",
      label: "Plan",
      state: stateFor("plan"),
      onSelect: () => navigate({ to: "/plan-lekcji" }),
    },
    {
      key: "exam",
      label: "Sprawdzian",
      state: stateFor("exam"),
      onSelect: () => navigate({ to: "/sprawdzian" }),
    },
  ]

  return <ProcessStepper steps={steps} />
}
