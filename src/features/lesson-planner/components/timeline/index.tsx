// Vertical lesson timeline: the reading surface of the plan. A left rail
// carries the axis (line + numbered node + minutes), block cards sit to its
// right. The timeline owns the ONE IntersectionObserver that drives the
// scroll-spy channel; the budget bar only subscribes to it.

import * as React from "react"

import { cn } from "@/shared/lib/utils"

import { setActiveBlockFromScroll, useActiveBlockId } from "../../state/active-block"
import type { BlockView } from "../../state/store"
import type { TimelineProps } from "../contracts"
import { BlockCard } from "./block-card"

export { BlockCard } from "./block-card"
export type { BlockCardProps } from "./block-card"
export { MaterialSlotView } from "./material-slot"
export type { MaterialSlotViewProps } from "./material-slot"

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

  // Scroll-spy: one observer over all cards, re-created when the set of
  // blocks changes. IO emits only on change — no scroll listeners.
  React.useEffect(() => {
    const root = listRef.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-block-id]"))
    if (cards.length === 0) return

    const intersecting = new Map<string, HTMLElement>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement
          const id = el.dataset.blockId
          if (!id) continue
          if (entry.isIntersecting) intersecting.set(id, el)
          else intersecting.delete(id)
        }
        let topId: string | null = null
        let topY = Infinity
        for (const [id, el] of intersecting) {
          const y = el.getBoundingClientRect().top
          if (y < topY) {
            topY = y
            topId = id
          }
        }
        if (topId) setActiveBlockFromScroll(topId)
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    )
    for (const card of cards) observer.observe(card)

    // Bottom-edge correction: the last card may never reach the middle band
    // when the page is scrolled all the way down, so the observer alone
    // would leave the previous block active. A passive, rAF-throttled
    // listener flips the last block on when the viewport hits the bottom.
    const lastId = cards[cards.length - 1]?.dataset.blockId ?? null
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const doc = document.documentElement
        const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2
        if (atBottom && lastId) setActiveBlockFromScroll(lastId)
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
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
            isLast ? "h-[22px]" : "bottom-0"
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
