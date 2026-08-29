// Vertical lesson timeline: the reading surface of the plan. A left rail
// carries the axis (line + numbered node + minutes), block cards sit to its
// right. The timeline owns the scroll-spy ("reading line" over the cards)
// that drives the active-block channel; the budget bar only subscribes.

import * as React from "react"

import { cn } from "@/shared/lib/utils"

import { setActiveBlockFromScroll, useActiveBlockId } from "../../state/active-block"
import type { BlockView } from "../../state/store"
import type { TimelineProps } from "../contracts"
import { BlockCard } from "./block-card"

export function Timeline({
  blocks,
  generationPhase,
  onBlockTap,
  onMaterialAccept,
  onMaterialReject,
}: TimelineProps) {
  const activeBlockId = useActiveBlockId()
  const listRef = React.useRef<HTMLOListElement>(null)
  const idsKey = blocks.map((b) => b.id).join("|")

  // Scroll-spy: a "reading line" that sweeps down the viewport with scroll
  // progress. At the top of the page the line sits at the viewport top, at
  // the bottom it reaches the viewport bottom, and the active block is the
  // card the line passes through (or the nearest one). Unlike a fixed
  // middle-band IntersectionObserver, this is monotonic and visits every
  // block — the first and last included — even when the scrollable range is
  // shorter than the viewport band would need.
  React.useEffect(() => {
    const root = listRef.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-block-id]"))
    if (cards.length === 0) return

    const pickActive = () => {
      const doc = document.documentElement
      const maxScroll = doc.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 1
      const focusY = progress * window.innerHeight

      let bestId: string | null = null
      let bestDistance = Infinity
      for (const card of cards) {
        const id = card.dataset.blockId
        if (!id) continue
        const rect = card.getBoundingClientRect()
        const distance =
          focusY < rect.top ? rect.top - focusY : focusY > rect.bottom ? focusY - rect.bottom : 0
        if (distance < bestDistance) {
          bestDistance = distance
          bestId = id
        }
      }
      if (bestId) setActiveBlockFromScroll(bestId)
    }

    let raf = 0
    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        pickActive()
      })
    }
    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [idsKey])

  return (
    <ol ref={listRef} className="flex flex-col">
      {blocks.map((block, i) => (
        <li
          key={block.id}
          className="relative flex gap-3 pb-5 duration-300 animate-in fade-in-0 slide-in-from-bottom-2 last:pb-0"
        >
          <TimelineRail
            block={block}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
            isActive={block.id === activeBlockId}
          />
          <BlockCard
            block={block}
            generationPhase={generationPhase}
            isActive={block.id === activeBlockId}
            onBlockTap={onBlockTap}
            onMaterialAccept={onMaterialAccept}
            onMaterialReject={onMaterialReject}
          />
        </li>
      ))}
    </ol>
  )
}

/**
 * The axis for one row: a continuous vertical line through all rows, a
 * numbered node and the block's minutes (with the autofit proposal, `12→10`).
 * Purely visual — the card carries the accessible equivalents.
 */
function TimelineRail({
  block,
  isFirst,
  isLast,
  isActive,
}: {
  block: BlockView
  isFirst: boolean
  isLast: boolean
  isActive: boolean
}) {
  return (
    <div className="relative w-11 shrink-0" aria-hidden>
      {!(isFirst && isLast) && (
        <span
          className={cn(
            "absolute left-1/2 w-0.5 -translate-x-1/2 bg-primary/25",
            isFirst ? "top-[22px]" : "top-0",
            // The rail stretches only to the row's content box, so on all
            // but the last row the line reaches down through the row's
            // pb-5 gap to meet the next row's line.
            isLast ? "h-[22px]" : "-bottom-5"
          )}
        />
      )}
      <span
        className={cn(
          "absolute top-2 left-1/2 z-10 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors duration-200",
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-primary/35 bg-background text-primary"
        )}
      >
        {block.index + 1}
      </span>
      <div className="absolute top-10 left-1/2 w-14 -translate-x-1/2 text-center text-[11px] leading-tight text-muted-foreground tabular-nums">
        {block.delta ? (
          <>
            <div>
              <span className="line-through opacity-70">{block.delta.from}</span>
              <span className="text-primary/70">→</span>
              <span className="font-semibold text-primary">{block.delta.to}</span>
            </div>
            <div>min</div>
          </>
        ) : (
          <span>{block.effectiveMinutes} min</span>
        )}
      </div>
    </div>
  )
}
