// Segmented time-budget bar — a minimap of the lesson, not a status readout.
// Segments are absolutely positioned from CUMULATIVE minutes so rounding can
// never open seams; the bar doubles as a scroll-position indicator via the
// active-block channel, and each segment is a tap target that scrolls the
// timeline to its block.

import * as React from "react"

import { cn } from "@/shared/lib/utils"

import type { BudgetSummary } from "../../model/budget"
import { useActiveBlockId } from "../../state/active-block"
import type { TimeBudgetBarProps } from "../contracts"

/** Permanent right-hand gutter overflow can extend into — nothing reflows. */
const GUTTER_PX = 56
/** Segments narrower than this hide their minutes digit. */
const MIN_LABEL_PX = 18

/** Polish plural picker: 1 minuta, 2–4 minuty, 5+ minut (and 22, 23, 24…). */
function pluralPl(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  const digit = n % 10
  const tens = n % 100
  if (digit >= 2 && digit <= 4 && (tens < 12 || tens > 14)) return few
  return many
}

function budgetAnnouncement(budget: BudgetSummary): string {
  const base = `${budget.totalMinutes} z ${budget.lessonMinutes} ${
    budget.lessonMinutes === 1 ? "minuty" : "minut"
  }`
  if (budget.state === "spare") {
    return `${base}, ${budget.spareMinutes} ${pluralPl(budget.spareMinutes, "minuta", "minuty", "minut")} zapasu`
  }
  if (budget.state === "overflow") {
    return `${base}, przekroczono o ${budget.overflowMinutes} ${pluralPl(budget.overflowMinutes, "minutę", "minuty", "minut")}`
  }
  return base
}

export function TimeBudgetBar({
  budget,
  disabled = false,
  preview = null,
  onSegmentTap,
}: TimeBudgetBarProps) {
  const activeBlockId = useActiveBlockId()
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [trackPx, setTrackPx] = React.useState(0)
  // false = segments sit at left 0 / width 0; flipping to true lets the
  // left/width transition carry them to their real geometry in one motion.
  const [entered, setEntered] = React.useState(false)

  React.useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => setTrackPx(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hasSegments = budget.segments.length > 0

  // Re-arm the entrance when generation starts again (render-phase reset).
  const [wasDisabled, setWasDisabled] = React.useState(disabled)
  if (wasDisabled !== disabled) {
    setWasDisabled(disabled)
    if (disabled) setEntered(false)
  }

  React.useEffect(() => {
    if (disabled || !hasSegments || entered) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let inner = 0
    const outer = requestAnimationFrame(() => {
      // Reduced motion: jump straight to the final geometry, no fill motion.
      if (reduced) {
        setEntered(true)
        return
      }
      inner = requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [disabled, hasSegments, entered])

  const pxPerMinute = budget.lessonMinutes > 0 ? trackPx / budget.lessonMinutes : 0
  const totalPx = Math.round(budget.totalMinutes * pxPerMinute)
  const showSegments = !disabled && hasSegments
  const overflowing = budget.state === "overflow"
  const clampedEndPx = Math.min(totalPx, trackPx + GUTTER_PX)
  const overflowClipped = totalPx > trackPx + GUTTER_PX

  return (
    <div role="group" aria-label="Budżet czasu lekcji" className="w-full select-none">
      <div className="flex items-end gap-3">
        {/* Clip wrapper: its right padding IS the gutter, so segments may
            extend into it and are hard-clipped exactly at trackPx + GUTTER_PX. */}
        <div
          className="min-w-0 flex-1 overflow-hidden pt-5"
          style={{ paddingRight: GUTTER_PX }}
        >
          <div ref={trackRef} className="relative h-7">
            {/* Base track — the lesson itself. Full grey while generating. */}
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-md transition-colors duration-300",
                disabled ? "bg-muted" : "bg-muted/50"
              )}
            />

            {/* Spare state: the unplanned remainder of the lesson. */}
            {showSegments && budget.state === "spare" && trackPx > 0 && (
              <div
                aria-hidden
                className="absolute inset-y-0.5 rounded-[5px] border border-dashed border-border transition-[left,width] duration-300 ease-out"
                style={{
                  left: (entered ? totalPx : 0) + 2,
                  width: Math.max(0, trackPx - (entered ? totalPx : 0) - 4),
                }}
              />
            )}

            {budget.segments.map((seg) => {
              if (!showSegments) return null
              const startPx = Math.round(seg.startMinutes * pxPerMinute)
              const endPx = Math.round(seg.endMinutes * pxPerMinute)
              const widthPx = endPx - startPx
              const isActive = seg.blockId === activeBlockId
              const isChanged = preview != null && seg.blockId in preview.changes
              const runsOver = seg.endMinutes > budget.lessonMinutes
              const showLabel = entered && widthPx >= MIN_LABEL_PX
              return (
                <button
                  key={seg.blockId}
                  type="button"
                  aria-label={`Blok ${seg.index + 1}: ${seg.title}, ${seg.minutes} ${pluralPl(seg.minutes, "minuta", "minuty", "minut")}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSegmentTap(seg.blockId)}
                  className="absolute inset-y-0 rounded-[5px] outline-none transition-[left,width] duration-300 ease-out before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] focus-visible:z-20 focus-visible:outline-2 focus-visible:-outline-offset-2"
                  style={{
                    left: entered ? startPx : 0,
                    width: entered ? widthPx : 0,
                  }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-px inset-y-0 rounded-[5px] transition-[background-color,transform] duration-200",
                      runsOver
                        ? isActive
                          ? "bg-destructive"
                          : "bg-destructive/80"
                        : isActive
                          ? "scale-y-110 bg-primary"
                          : isChanged
                            ? "bg-primary/80 ring-1 ring-primary/60 ring-inset"
                            : "bg-primary/65"
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-x-0 -top-[18px] text-center text-[11px] font-medium tabular-nums transition-opacity duration-200",
                      isActive ? "text-foreground" : "text-muted-foreground",
                      showLabel ? "opacity-100" : "opacity-0"
                    )}
                  >
                    {seg.minutes}
                  </span>
                </button>
              )
            })}

            {/* Overflow: hatch over exactly the outside portion + a marker at
                the end of the lesson — spatial, not colour-only. */}
            {showSegments && overflowing && entered && trackPx > 0 && (
              <>
                <div
                  aria-hidden
                  className="hatch-overflow pointer-events-none absolute inset-y-0 rounded-r-[5px]"
                  style={{
                    left: trackPx,
                    width: Math.max(0, clampedEndPx - trackPx),
                    ...(overflowClipped
                      ? { maskImage: "linear-gradient(to right, black 65%, transparent)" }
                      : {}),
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-y-1 w-0.5 rounded-full bg-foreground/60"
                  style={{ left: trackPx - 1 }}
                />
              </>
            )}
          </div>

          {/* Caption row is always reserved so states never shift the layout. */}
          <div className="mt-1.5 h-4 text-right text-xs text-muted-foreground">
            {showSegments && budget.state === "spare"
              ? `${budget.spareMinutes} min zapasu`
              : null}
          </div>
        </div>

        <p className="mb-[26px] w-[5.5rem] shrink-0 text-right text-sm whitespace-nowrap tabular-nums">
          {disabled ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <>
              <span
                className={cn(
                  "font-medium",
                  overflowing ? "text-destructive" : "text-foreground"
                )}
              >
                {budget.totalMinutes}
              </span>
              <span className="text-muted-foreground">{` / ${budget.lessonMinutes} min`}</span>
            </>
          )}
        </p>
      </div>

      <div aria-live="polite" className="sr-only">
        {showSegments ? budgetAnnouncement(budget) : ""}
      </div>
    </div>
  )
}
