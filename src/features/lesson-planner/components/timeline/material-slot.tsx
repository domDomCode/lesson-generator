// Material slot of a block card: the subagent's search indicator and the
// proposed/accepted material rows. Rendered only for blocks that have a
// slot at all (materials.status !== "none") — that asymmetry is deliberate.

import {
  Check,
  FileText,
  Link,
  Loader2,
  Play,
  Printer,
  Volume2,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import type { Material, MaterialSlot } from "../../model/types"

const kindIcon: Record<Material["kind"], LucideIcon> = {
  video: Play,
  pdf: FileText,
  worksheet: Printer,
  audio: Volume2,
  link: Link,
}

export interface MaterialSlotViewProps {
  slot: MaterialSlot
  onAccept: (material: Material) => void
  onReject: (material: Material) => void
}

export function MaterialSlotView({ slot, onAccept, onReject }: MaterialSlotViewProps) {
  if (slot.status === "none" || slot.status === "pending") return null

  if (slot.status === "searching") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin text-primary/70" aria-hidden />
        Szukam materiałów…
      </div>
    )
  }

  if (slot.status === "error") {
    return <p className="text-xs text-muted-foreground">Nie udało się poszukać materiałów</p>
  }

  const items = slot.items.filter((m) => m.status !== "rejected")
  if (items.length === 0) return null

  return (
    <ul className="flex flex-col gap-2">
      {items.map((material) => (
        <MaterialRow
          key={material.id}
          material={material}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </ul>
  )
}

function MaterialRow({
  material,
  onAccept,
  onReject,
}: {
  material: Material
  onAccept: (material: Material) => void
  onReject: (material: Material) => void
}) {
  const proposed = material.status === "proposed"
  const Icon = kindIcon[material.kind]

  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2",
        proposed ? "border-dashed border-border" : "border-border bg-muted/40"
      )}
    >
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{material.title}</span>
        <span className="block text-xs text-muted-foreground">
          {material.source}
          {material.length ? ` · ${material.length}` : null}
        </span>
      </span>
      {proposed ? (
        <span className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-label={`Dodaj: ${material.title}`}
            className="relative z-10 h-8 bg-primary/10 px-3 text-primary hover:bg-primary/15"
            onClick={(e) => {
              e.stopPropagation()
              onAccept(material)
            }}
          >
            Dodaj
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label={`Odrzuć: ${material.title}`}
            className="relative z-10 h-8 px-3 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onReject(material)
            }}
          >
            Odrzuć
          </Button>
        </span>
      ) : (
        <span className="shrink-0 text-primary">
          <Check className="size-4" aria-hidden />
          <span className="sr-only">Dodano do planu</span>
        </span>
      )}
    </li>
  )
}
