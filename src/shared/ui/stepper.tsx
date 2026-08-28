import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export type StepState = "done" | "active" | "available" | "locked"

export interface StepItem {
  key: string
  label: string
  state: StepState
  /** Called for "done"/"available" steps — navigation back to that step. */
  onSelect?: () => void
}

/**
 * One-line process indicator: `Brief ✓ · Plan · Sprawdzian`. Deliberately
 * low and quiet — a wayfinding line in the header, not a hero component.
 * Done steps are tappable, the active step carries the accent, locked
 * steps are greyed out and inert.
 */
function ProcessStepper({ steps, className }: { steps: StepItem[]; className?: string }) {
  return (
    <nav aria-label="Etapy planowania" className={cn("flex items-center gap-1 text-sm", className)}>
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          {i > 0 && (
            <span aria-hidden className="px-0.5 text-muted-foreground/60">
              ·
            </span>
          )}
          {step.state === "done" || step.state === "available" ? (
            <button
              type="button"
              onClick={step.onSelect}
              className="flex h-11 items-center gap-1 rounded-md px-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {step.state === "done" && <Check className="size-3.5 text-primary" aria-hidden />}
              {step.label}
            </button>
          ) : (
            <span
              aria-current={step.state === "active" ? "step" : undefined}
              className={cn(
                "flex h-11 items-center px-1.5 font-medium",
                step.state === "active" ? "text-primary" : "text-muted-foreground/50"
              )}
            >
              {step.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export { ProcessStepper }
