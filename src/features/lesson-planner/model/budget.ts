// Pure time-budget math for the segmented budget bar and the autofit flow.
// No DOM, no React — safe to import from both src/ and mock-backend/.

import type { AutoFitPreview, Block, BlockId } from "./types"

export interface BudgetSegment {
  blockId: BlockId
  index: number
  title: string
  minutes: number
  /** Cumulative start, in minutes from lesson start. */
  startMinutes: number
  /** startMinutes + minutes. */
  endMinutes: number
}

export interface BudgetSummary {
  segments: BudgetSegment[]
  totalMinutes: number
  lessonMinutes: number
  /** > 0 when the plan does not fill the lesson. */
  spareMinutes: number
  /** > 0 when the plan runs past the lesson. */
  overflowMinutes: number
  state: "exact" | "spare" | "overflow"
}

export function computeBudget(blocks: Block[], lessonMinutes: number): BudgetSummary {
  let cursor = 0
  const segments: BudgetSegment[] = blocks.map((b) => {
    const startMinutes = cursor
    cursor += b.minutes
    return {
      blockId: b.id,
      index: b.index,
      title: b.title,
      minutes: b.minutes,
      startMinutes,
      endMinutes: cursor,
    }
  })
  const totalMinutes = cursor
  const spareMinutes = Math.max(0, lessonMinutes - totalMinutes)
  const overflowMinutes = Math.max(0, totalMinutes - lessonMinutes)
  return {
    segments,
    totalMinutes,
    lessonMinutes,
    spareMinutes,
    overflowMinutes,
    state: overflowMinutes > 0 ? "overflow" : spareMinutes > 0 ? "spare" : "exact",
  }
}

export function totalMinutes(blocks: Block[]): number {
  return blocks.reduce((sum, b) => sum + b.minutes, 0)
}

/**
 * Consequence line shown at decision time in the block sheet:
 * given a proposed new duration for one block, what happens to the plan?
 * Returns e.g. { totalMinutes: 48, overflowMinutes: 3 }.
 */
export function projectBlockChange(
  blocks: Block[],
  blockId: BlockId,
  newMinutes: number,
  lessonMinutes: number
): { totalMinutes: number; overflowMinutes: number; spareMinutes: number } {
  const total = blocks.reduce((sum, b) => sum + (b.id === blockId ? newMinutes : b.minutes), 0)
  return {
    totalMinutes: total,
    overflowMinutes: Math.max(0, total - lessonMinutes),
    spareMinutes: Math.max(0, lessonMinutes - total),
  }
}

/**
 * Deterministic autofit proposal: shrink the largest non-protected blocks
 * (never below MIN_BLOCK_MINUTES) until the plan fits the lesson.
 * Pure — used by the mock backend; the UI only renders the result.
 * Returns null when the plan already fits or nothing can be shrunk.
 */
export const MIN_BLOCK_MINUTES = 3

export function buildAutoFitProposal(
  blocks: Block[],
  lessonMinutes: number,
  protectedBlockId: BlockId | null,
  proposalId: string
): AutoFitPreview | null {
  let excess = totalMinutes(blocks) - lessonMinutes
  if (excess <= 0) return null

  // Shrink candidates: largest first, protected block untouchable.
  const candidates = blocks
    .filter((b) => b.id !== protectedBlockId)
    .sort((a, b) => b.minutes - a.minutes)

  const changes: AutoFitPreview["changes"] = {}
  const remaining = new Map(candidates.map((b) => [b.id, b.minutes]))

  // Take minutes one at a time from the currently-largest candidate so the
  // cuts spread proportionally instead of gutting a single block.
  while (excess > 0) {
    let bestId: BlockId | null = null
    let bestMinutes = MIN_BLOCK_MINUTES
    for (const [id, mins] of remaining) {
      if (mins > bestMinutes) {
        bestMinutes = mins
        bestId = id
      }
    }
    if (bestId === null) break // nothing left to shrink
    remaining.set(bestId, bestMinutes - 1)
    excess -= 1
  }

  if (excess > 0) return null // cannot fit even after shrinking everything

  for (const b of candidates) {
    const to = remaining.get(b.id)!
    if (to !== b.minutes) changes[b.id] = { from: b.minutes, to }
  }
  if (Object.keys(changes).length === 0) return null

  const resulting = blocks.reduce((sum, b) => sum + (changes[b.id]?.to ?? b.minutes), 0)
  return { proposalId, protectedBlockId, changes, resultingMinutes: resulting }
}
