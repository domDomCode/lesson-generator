// Lightweight scroll-spy channel, separate from the document store so the
// timeline doesn't re-render on every intersection tick. Only the budget
// bar segments and block-card headers subscribe.

import { useSyncExternalStore } from "react"

import type { BlockId } from "../model/types"

let activeBlockId: BlockId | null = null
/** While a tap-triggered smooth scroll is in flight, the spy stays quiet. */
let suppressSpyUntil = 0

const listeners = new Set<() => void>()

function emit(next: BlockId | null) {
  if (next === activeBlockId) return
  activeBlockId = next
  for (const l of listeners) l()
}

/** Called by the timeline's IntersectionObserver. */
export function setActiveBlockFromScroll(blockId: BlockId | null) {
  if (Date.now() < suppressSpyUntil) return
  emit(blockId)
}

/**
 * Called on budget-bar segment tap (and block-card tap): highlights the
 * block immediately and suppresses the spy long enough for the programmatic
 * smooth scroll to land without fighting it.
 */
export function setActiveBlockFromTap(blockId: BlockId) {
  suppressSpyUntil = Date.now() + 700
  emit(blockId)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useActiveBlockId(): BlockId | null {
  return useSyncExternalStore(subscribe, () => activeBlockId)
}

/** id of a block card's DOM element — used for tap-to-scroll targeting. */
export function blockCardDomId(blockId: BlockId): string {
  return `block-card-${blockId}`
}

/** Scrolls the timeline to a block and highlights it (mobile tap = both). */
export function scrollToBlock(blockId: BlockId) {
  setActiveBlockFromTap(blockId)
  const el = document.getElementById(blockCardDomId(blockId))
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" })
}
