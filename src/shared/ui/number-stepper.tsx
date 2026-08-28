import { Minus, Plus } from "lucide-react"

import { cn } from "@/shared/lib/utils"

/**
 * `− n +` control (exam task counts, block duration). Both buttons are
 * 44px targets; the value is announced as a spinbutton for AT.
 */
function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
  formatValue,
  className,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  /** Accessible name, e.g. "Liczba zadań ABCD". */
  label: string
  /** Optional display formatting, e.g. (v) => `${v} min`. */
  formatValue?: (value: number) => string
  className?: string
}) {
  return (
    <div
      role="spinbutton"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          e.preventDefault()
          onChange(Math.min(max, value + 1))
        } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          e.preventDefault()
          onChange(Math.max(min, value - 1))
        }
      }}
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-11 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums">
        {formatValue ? formatValue(value) : value}
      </span>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex size-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export { NumberStepper }
