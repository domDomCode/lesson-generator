import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/shared/lib/utils"

/**
 * Selectable pill — the app's main input control (class, duration, goals,
 * preferences, exam scope). 44px tall: comfortably tappable one-handed.
 * Selection is communicated by colour AND the check mark, not colour alone.
 */
function Chip({
  className,
  selected = false,
  showCheck = true,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean
  /** Hide the check for chips acting as plain toggles/links. */
  showCheck?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="chip"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors select-none",
        "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:bg-muted",
        className
      )}
      {...props}
    >
      {selected && showCheck && <Check className="size-4" aria-hidden />}
      {props.children}
    </button>
  )
}

/** Static informational pill (e.g. „Podstawa programowa: II.5.2"). */
function InfoChip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="info-chip"
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Chip, InfoChip }
