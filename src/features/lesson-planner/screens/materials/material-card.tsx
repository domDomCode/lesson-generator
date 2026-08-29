// One material row/card, shared by the block sheet and the materials review
// sheet. Status is communicated by border + icon + label, never colour alone:
// proposed = dashed border, accepted = solid pine border + check, rejected =
// dimmed with an „Odrzucono" chip (and „Dodaj" as the undo path).

import { Check, ChevronDown, FileText, Link, Play, Printer, Volume2 } from "lucide-react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { InfoChip } from "@/shared/ui/chip"

import { blockLabel } from "../../model/labels"
import type { Block, Material } from "../../model/types"

const kindIcon: Record<Material["kind"], typeof Play> = {
  video: Play,
  pdf: FileText,
  worksheet: Printer,
  audio: Volume2,
  link: Link,
}

export function MaterialCard({
  material,
  blocks,
  showRationale = false,
  moveLabel = "Przenieś",
  onAccept,
  onReject,
  onMove,
}: {
  material: Material
  /** All blocks of the doc — the move menu lists every block but the current one. */
  blocks: Block[]
  /** The review sheet shows the one-line rationale; the block sheet stays compact. */
  showRationale?: boolean
  moveLabel?: string
  onAccept: () => void
  onReject: () => void
  onMove: (toBlock: Block) => void
}) {
  const Icon = kindIcon[material.kind]
  const otherBlocks = blocks.filter((b) => b.id !== material.blockId)

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3",
        material.status === "proposed" && "border-dashed border-border",
        material.status === "accepted" && "border-primary/50",
        material.status === "rejected" && "border-border opacity-60"
      )}
    >
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug font-medium">
            {material.status === "accepted" && (
              <Check className="mr-1 inline size-4 align-[-2px] text-primary" aria-hidden />
            )}
            {material.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {material.source}
            {material.length ? ` · ${material.length}` : ""}
          </p>
          {showRationale && (
            <p className="mt-0.5 text-xs text-muted-foreground italic">{material.rationale}</p>
          )}
          {material.status === "accepted" && <InfoChip className="mt-1.5">Dodano</InfoChip>}
          {material.status === "rejected" && <InfoChip className="mt-1.5">Odrzucono</InfoChip>}
        </div>
      </div>
      <div className="mt-1 -mb-1 flex flex-wrap items-center">
        {material.status !== "accepted" && (
          <Button variant="ghost" className="h-11 px-3 text-primary" onClick={onAccept}>
            Dodaj
          </Button>
        )}
        {material.status !== "rejected" && (
          <Button variant="ghost" className="h-11 px-3 text-muted-foreground" onClick={onReject}>
            Odrzuć
          </Button>
        )}
        {otherBlocks.length > 0 && (
          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <Button variant="ghost" className="h-11 px-3 text-muted-foreground">
                {moveLabel}
                <ChevronDown aria-hidden />
              </Button>
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuPrimitive.Portal>
              <DropdownMenuPrimitive.Content
                align="start"
                sideOffset={4}
                collisionPadding={16}
                className="z-[60] max-h-72 min-w-48 max-w-[var(--radix-dropdown-menu-content-available-width)] overflow-y-auto rounded-lg border border-border bg-card p-1 text-card-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              >
                {otherBlocks.map((b) => (
                  <DropdownMenuPrimitive.Item
                    key={b.id}
                    onSelect={() => onMove(b)}
                    className="flex min-h-11 cursor-default items-center rounded-md px-3 py-2 text-sm outline-none select-none data-[highlighted]:bg-muted"
                  >
                    <span className="min-w-0 truncate">
                      {blockLabel(b)} · {b.title}
                    </span>
                  </DropdownMenuPrimitive.Item>
                ))}
              </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
          </DropdownMenuPrimitive.Root>
        )}
      </div>
    </div>
  )
}
