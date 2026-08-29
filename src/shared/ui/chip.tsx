import * as React from "react"
import { cn } from "@/shared/lib/utils"

/**
 * Selectable pill — the app's main input control (class, duration, goals,
 * preferences). 44px tall: comfortably tappable one-handed. Selection is
 * communicated by colour and weight only — no icon, so toggling never
 * shifts the layout; aria-pressed carries the state for AT.
 *
 * The bump to semibold on selection would widen the label by a pixel or
 * two, so an invisible bold copy is always laid out underneath to reserve
 * the wider footprint — the visible label then swaps weight in place.
 */
function Chip({
  className,
  selected = false,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="chip"
      aria-pressed={selected}
      className={cn(
        "inline-grid h-11 shrink-0 place-items-center rounded-full border px-4 text-sm font-medium transition-colors select-none",
        "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-primary/60 bg-primary/10 font-semibold text-primary"
          : "border-border bg-card text-foreground hover:bg-muted",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none invisible col-start-1 row-start-1 flex items-center gap-1.5 font-semibold"
      >
        {children}
      </span>
      <span className="col-start-1 row-start-1 flex items-center gap-1.5">
        {children}
      </span>
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
