// One block card of the timeline. The whole card is the tap target (a
// stretched title button), material action buttons sit above the overlay.

import { Lock, Sparkles } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { InfoChip } from "@/shared/ui/chip"

import type { BlockId, Material } from "../../model/types"
import { blockCardDomId } from "../../state/active-block"
import type { BlockView, GenerationPhase } from "../../state/store"
import { MaterialSlotView } from "./material-slot-view"

export interface BlockCardProps {
  block: BlockView
  generationPhase: GenerationPhase
  isActive: boolean
  onBlockTap: (blockId: BlockId) => void
  onMaterialAccept: (material: Material) => void
  onMaterialReject: (material: Material) => void
}

export function BlockCard({
  block,
  generationPhase,
  isActive,
  onBlockTap,
  onMaterialAccept,
  onMaterialReject,
}: BlockCardProps) {
  const isGenerating = generationPhase === "structure" || generationPhase === "content"
  const structureOnly = generationPhase === "structure"
  const materials = block.materials
  const showSlot =
    !structureOnly &&
    (materials.status === "searching" ||
      materials.status === "error" ||
      (materials.status === "ready" && materials.items.some((m) => m.status !== "rejected")))

  return (
    <article
      id={blockCardDomId(block.id)}
      data-block-id={block.id}
      className={cn(
        "relative min-w-0 flex-1 rounded-xl bg-card p-4 ring-1 transition-shadow duration-200",
        isActive ? "ring-primary/60" : block.delta ? "ring-primary/50" : "ring-foreground/10"
      )}
    >
      <h3>
        <button
          type="button"
          onClick={() => onBlockTap(block.id)}
          className="w-full text-left font-heading text-base leading-snug font-medium text-card-foreground outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {block.title}
          <span className="sr-only">
            {block.delta
              ? `, proponowana zmiana z ${block.delta.from} do ${block.delta.to} minut`
              : `, ${block.effectiveMinutes} min`}
          </span>
        </button>
      </h3>

      {!structureOnly && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <InfoChip>{block.method}</InfoChip>
          <InfoChip>{block.form}</InfoChip>
          {block.isProtected && (
            <InfoChip className="bg-primary/10 text-primary">
              <Lock className="size-3" aria-hidden />
              Bez zmian
            </InfoChip>
          )}
        </div>
      )}

      {structureOnly ? (
        // Reserved space for the content that is about to stream in —
        // the card must not jump when it arrives.
        <div className="mt-3 min-h-9" aria-hidden />
      ) : (
        <BlockContentView content={block.content} generating={isGenerating} />
      )}

      {showSlot && (
        <div className="mt-3">
          <MaterialSlotView
            slot={materials}
            onAccept={onMaterialAccept}
            onReject={onMaterialReject}
          />
        </div>
      )}
    </article>
  )
}

function BlockContentView({
  content,
  generating,
}: {
  content: BlockView["content"]
  generating: boolean
}) {
  if (content.status === "empty") {
    if (!generating) return null
    return (
      <div className="mt-3 min-h-9 space-y-2" aria-hidden>
        <div className="shimmer h-3.5 w-4/5 rounded" />
        <div className="shimmer h-3.5 w-3/5 rounded" />
      </div>
    )
  }

  const streaming = content.status === "streaming"
  return (
    <div className={cn("mt-3 flex items-start gap-1.5", generating && "min-h-9")}>
      <span className="mt-1 shrink-0 text-primary/60">
        <Sparkles className="size-3" aria-hidden />
        <span className="sr-only">Treść wygenerowana</span>
      </span>
      <span className="min-w-0 flex-1">
        <p
          className={cn("text-sm leading-relaxed text-foreground/90", !streaming && "line-clamp-3")}
        >
          {content.text}
        </p>
        {streaming && <span className="shimmer mt-2 block h-3.5 w-2/5 rounded" aria-hidden />}
      </span>
    </div>
  )
}
