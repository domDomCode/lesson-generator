// Ekran 5 — bulk review of every proposed material, grouped under the block
// each one belongs to (a material never floats free). Near full-height sheet;
// the sticky footer lets the user ask for more materials for a chosen block.

import { useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Input } from "@/shared/ui/input"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"

import type { MaterialsSheetProps } from "../../components/contracts"
import { blockLabel, runMaterialSearch } from "../../data/materials-actions"
import type { Block, BlockId } from "../../model/types"
import { selectVisibleDoc, usePlannerStore } from "../../state/store"
import { MaterialCard } from "./material-card"

/** Blocks shown as groups: a slot with items, or one being searched. */
function isVisibleGroup(block: Block): boolean {
  return (
    (block.materials.status === "ready" && block.materials.items.length > 0) ||
    block.materials.status === "searching"
  )
}

export function MaterialsSheet({ open, onOpenChange }: MaterialsSheetProps) {
  const doc = usePlannerStore(selectVisibleDoc)
  const [query, setQuery] = useState("")
  const [searchPending, setSearchPending] = useState(false)
  const [pickedBlockId, setPickedBlockId] = useState<BlockId | null>(null)

  if (!doc) {
    return <Sheet open={open} onOpenChange={onOpenChange} />
  }

  const groups = doc.blocks.filter(isVisibleGroup)
  const defaultBlock =
    doc.blocks.find((b) => b.materials.status !== "none") ?? doc.blocks[0] ?? null
  const targetBlock =
    (pickedBlockId != null ? doc.blocks.find((b) => b.id === pickedBlockId) : null) ??
    defaultBlock

  async function submitSearch(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || !targetBlock || !doc) return
    setQuery("")
    setSearchPending(true)
    await runMaterialSearch(doc.planId, targetBlock.id, trimmed)
    setSearchPending(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[92svh]" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Materiały</SheetTitle>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-5 pt-1">
          {groups.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-10">
              <p className="max-w-60 text-center text-sm text-muted-foreground">
                Nie mam jeszcze żadnych propozycji. Napisz, czego poszukać.
              </p>
            </div>
          ) : (
            groups.map((block) => (
              <section key={block.id} className="flex flex-col gap-2">
                <h3 className="font-heading text-sm font-medium">
                  {blockLabel(block)} · {block.title}
                </h3>
                {block.materials.status === "searching" ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Szukam materiałów…
                  </div>
                ) : (
                  block.materials.status === "ready" &&
                  block.materials.items.map((material) => (
                    <MaterialCard
                      key={material.id}
                      planId={doc.planId}
                      material={material}
                      blocks={doc.blocks}
                      showRationale
                    />
                  ))
                )}
              </section>
            ))
          )}
        </SheetBody>

        <SheetFooter className="flex-col items-stretch gap-2">
          <p className="text-sm font-medium">Poszukaj czegoś jeszcze</p>
          <div className="flex flex-wrap gap-2 py-0.5">
            {doc.blocks.map((block) => (
              <Chip
                key={block.id}
                selected={targetBlock?.id === block.id}
                onClick={() => setPickedBlockId(block.id)}
                aria-label={`${blockLabel(block)} · ${block.title}`}
              >
                {blockLabel(block)}
              </Chip>
            ))}
          </div>
          <form onSubmit={submitSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Czego poszukać? np. ćwiczeń na tablicę"
              aria-label="Czego poszukać"
              className="h-11 flex-1"
            />
            <Button
              type="submit"
              className="h-11"
              disabled={!query.trim() || targetBlock == null || searchPending}
            >
              {searchPending ? "Szukam…" : "Poszukaj"}
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
