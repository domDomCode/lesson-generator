// Prop contracts for the signature components, so the plan screen (stream C)
// and the timeline/budget bar (stream B) can be built in parallel against
// the same signatures. Stream B owns the implementations in
// components/timeline/ and components/budget-bar/.

import type { BudgetSummary } from "../model/budget"
import type { AutoFitPreview, BlockId, Material } from "../model/types"
import type { BlockView, GenerationPhase } from "../state/store"

export interface TimeBudgetBarProps {
  budget: BudgetSummary
  /**
   * Generation in progress: bar is greyed out, shows no numbers, and fills
   * in one motion when this flips back to false.
   */
  disabled?: boolean
  /** Uncommitted autofit preview — bar renders proposed segment widths. */
  preview?: AutoFitPreview | null
  /** Tap = scroll timeline to block + highlight (use scrollToBlock()). */
  onSegmentTap: (blockId: BlockId) => void
}

export interface TimelineProps {
  blocks: BlockView[]
  generationPhase: GenerationPhase
  /** Opens the block bottom sheet. */
  onBlockTap: (blockId: BlockId) => void
  onMaterialAccept: (material: Material) => void
  onMaterialReject: (material: Material) => void
  /**
   * Implementation notes for stream B:
   * - each card's root element must carry id={blockCardDomId(block.id)}
   *   (from state/active-block.ts) so tap-to-scroll can target it
   * - the timeline owns the IntersectionObserver (rootMargin
   *   "-45% 0px -45% 0px") and calls setActiveBlockFromScroll
   * - material slot renders only when block.materials.status !== "none"
   *   ("pending" renders nothing yet, "searching" the indicator)
   */
}

// --- bottom sheets (stream D) ---------------------------------------------

export interface BlockSheetProps {
  /** Block to show; null = sheet closed. */
  blockId: BlockId | null
  onOpenChange: (open: boolean) => void
}

export interface MaterialsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
