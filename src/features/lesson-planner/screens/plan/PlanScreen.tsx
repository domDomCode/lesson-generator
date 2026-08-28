// Ekrany 2+3: generation is a STATE of this screen, not a separate route.
// Layout top→bottom: header → status line / summary → version pills →
// sticky budget bar (+ repair) → assumption chips → timeline → bottom bar.

import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { LoaderCircle, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { InfoChip } from "@/shared/ui/chip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible"
import { toast } from "@/shared/ui/toast"

import { TimeBudgetBar } from "../../components/budget-bar"
import { Timeline } from "../../components/timeline"
import { restoreVersion, setMaterialStatus } from "../../data/api"
import { startGeneration } from "../../data/generation"
import { computeBudget } from "../../model/budget"
import type { BlockId, LessonDoc, LessonVersion, Material, PlanId, VersionId } from "../../model/types"
import { scrollToBlock } from "../../state/active-block"
import {
  dispatch,
  getPlannerState,
  selectBlocksView,
  selectVisibleDoc,
  usePlannerStore,
} from "../../state/store"
import { BlockSheet } from "../block-sheet/BlockSheet"
import { MaterialsSheet } from "../materials/MaterialsSheet"
import { AutoFitFooter } from "./AutoFitFooter"
import { PromptBar } from "./PromptBar"
import { RepairBar } from "./RepairBar"
import { formatBlocks, formatMaterials } from "./plural"

export function PlanScreen() {
  const doc = usePlannerStore(selectVisibleDoc)
  const blocks = usePlannerStore(selectBlocksView)
  const generation = usePlannerStore((s) => s.generation)
  const autofit = usePlannerStore((s) => s.autofit)
  const versions = usePlannerStore((s) => s.versions)
  const activeVersionId = usePlannerStore((s) => s.activeVersionId)
  const previewedVersionId = usePlannerStore((s) => s.previewedVersionId)
  const briefMinutes = usePlannerStore((s) => s.brief.lessonMinutes)
  const navigate = useNavigate()

  const [openBlockId, setOpenBlockId] = useState<BlockId | null>(null)
  const [materialsOpen, setMaterialsOpen] = useState(false)

  const phase = generation.phase
  const isGenerating = phase === "structure" || phase === "content"
  const isPreview = previewedVersionId != null
  const previewedVersion = isPreview
    ? versions.find((v) => v.id === previewedVersionId) ?? null
    : null

  const planId: PlanId | null = doc?.planId ?? null
  const lessonMinutes = doc?.lessonMinutes ?? briefMinutes

  // Budget from effectiveMinutes so an autofit preview animates the bar.
  const budget = useMemo(
    () => computeBudget(blocks.map((b) => ({ ...b, minutes: b.effectiveMinutes })), lessonMinutes),
    [blocks, lessonMinutes]
  )

  const materialsCount = useMemo(() => countMaterials(doc), [doc])

  const showRepairBar =
    phase === "done" && !isPreview && autofit == null && budget.overflowMinutes > 0 && planId != null

  const changeMaterialStatus = (material: Material, status: "accepted" | "rejected") => {
    if (isPreview || planId == null) return
    dispatch({ type: "material/statusChanged", materialId: material.id, status })
    toast(status === "accepted" ? "Dodano" : "Odrzucono")
    setMaterialStatus(planId, material.id, { status }).catch(() =>
      toast("Nie udało się zapisać zmiany. Spróbuj ponownie.")
    )
  }

  return (
    <div className="px-4 pt-4 pb-40">
      {/* 1. Header */}
      {doc != null ? (
        <header>
          <h1 className="font-heading text-xl text-foreground">{doc.topic}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {doc.subject} · {formatGrade(doc.grade)} · {doc.lessonMinutes} min
          </p>
        </header>
      ) : (
        <header aria-hidden>
          <div className="shimmer h-6 w-3/4 rounded-md" />
          <div className="mt-2 shimmer h-4 w-40 rounded-md" />
        </header>
      )}

      {/* 2. Generation status line / error */}
      {isGenerating && (
        <div className="mt-3 flex min-h-6 items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
          <span
            key={generation.statusText}
            className="animate-in fade-in-0 truncate duration-300"
            aria-live="polite"
          >
            {generation.statusText.length > 0 ? generation.statusText : "Zaczynam układać plan"}
          </span>
        </div>
      )}
      {phase === "error" && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-destructive/10 px-3 py-2.5">
          <p className="text-sm text-destructive">
            {generation.error ?? "Nie udało się ułożyć planu. Spróbuj ponownie."}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => startGeneration(getPlannerState().brief)}
          >
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {/* 3. Summary line (collapsed by default) */}
      {phase === "done" && doc != null && (
        <SummaryLine
          doc={doc}
          materialsCount={materialsCount}
          onOpenMaterials={() => setMaterialsOpen(true)}
        />
      )}

      {/* 4. Version pills + preview banner */}
      {phase === "done" && versions.length > 0 && (
        <VersionPills
          versions={versions}
          shownVersionId={previewedVersionId ?? activeVersionId}
          activeVersionId={activeVersionId}
        />
      )}
      {previewedVersion != null && planId != null && (
        <PreviewBanner planId={planId} version={previewedVersion} />
      )}

      {/* 5+6. Sticky budget bar + repair bar */}
      <div className="sticky top-12 z-30 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm">
        <TimeBudgetBar
          budget={budget}
          disabled={isGenerating}
          preview={isPreview ? null : autofit}
          onSegmentTap={scrollToBlock}
        />
        {showRepairBar && planId != null && (
          <div className="mt-2">
            <RepairBar
              planId={planId}
              lessonMinutes={lessonMinutes}
              overflowMinutes={budget.overflowMinutes}
            />
          </div>
        )}
      </div>

      {/* 7. Assumption chips — edited at the source, in the brief */}
      {phase === "done" && doc != null && doc.assumptions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-sm text-muted-foreground">Założyłem:</span>
          {doc.assumptions.map((assumption) => (
            <button
              key={assumption}
              type="button"
              className="min-h-11 outline-none focus-visible:rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
              onClick={() => navigate({ to: "/zalozenia-lekcji" })}
            >
              <InfoChip className="hover:bg-secondary">{assumption}</InfoChip>
            </button>
          ))}
        </div>
      )}

      {/* 8. Timeline */}
      <div className="mt-3">
        <Timeline
          blocks={blocks}
          generationPhase={phase}
          onBlockTap={isPreview ? noop : setOpenBlockId}
          onMaterialAccept={(m) => changeMaterialStatus(m, "accepted")}
          onMaterialReject={(m) => changeMaterialStatus(m, "rejected")}
        />
      </div>

      {/* 9+10. Sticky bottom bars */}
      {planId != null && autofit != null && !isPreview && (
        <AutoFitFooter planId={planId} preview={autofit} lessonMinutes={lessonMinutes} />
      )}
      {planId != null && phase === "done" && autofit == null && !isPreview && (
        <PromptBar planId={planId} />
      )}

      {/* 11. Sheets */}
      <BlockSheet
        blockId={openBlockId}
        onOpenChange={(open) => {
          if (!open) setOpenBlockId(null)
        }}
      />
      <MaterialsSheet open={materialsOpen} onOpenChange={setMaterialsOpen} />
    </div>
  )
}

function noop() {}

function formatGrade(grade: string): string {
  return /kl/i.test(grade) ? grade : `kl. ${grade}`
}

/** Every proposed/accepted/rejected material across all blocks. */
function countMaterials(doc: LessonDoc | null): number {
  if (doc == null) return 0
  return doc.blocks.reduce(
    (sum, b) => sum + (b.materials.status === "ready" ? b.materials.items.length : 0),
    0
  )
}

// --- 3. collapsed summary --------------------------------------------------

function SummaryLine({
  doc,
  materialsCount,
  onOpenMaterials,
}: {
  doc: LessonDoc
  materialsCount: number
  onOpenMaterials: () => void
}) {
  // Opener from the first work step, e.g. "Przeanalizowałem Kapitel 3
  // podręcznika Das ist Deutsch! 2" → "Przeanalizowałem Kapitel 3".
  const firstStep = doc.agentSteps[0]
  const opener =
    firstStep?.startsWith("Przeanalizowałem") === true
      ? firstStep.split(" podręcznika")[0]
      : "Przeanalizowałem temat"
  const line = `${opener} · ułożyłem ${formatBlocks(doc.blocks.length)} · znalazłem ${formatMaterials(materialsCount)}`
  return (
    <Collapsible className="mt-3 rounded-lg bg-card px-3 ring-1 ring-foreground/5">
      <CollapsibleTrigger>
        <span className="truncate text-sm text-muted-foreground">{line}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col gap-1.5 pt-0.5 text-sm text-muted-foreground">
          {doc.agentSteps.map((step) => (
            <li key={step} className="flex gap-2">
              <span className="text-primary" aria-hidden>
                ·
              </span>
              {step}
            </li>
          ))}
        </ul>
        <div className="py-1.5">
          <Button size="sm" variant="ghost" className="-ml-2 text-primary" onClick={onOpenMaterials}>
            Przejrzyj materiały ({materialsCount})
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// --- 4. version pills + preview banner -------------------------------------

function VersionPills({
  versions,
  shownVersionId,
  activeVersionId,
}: {
  versions: LessonVersion[]
  shownVersionId: VersionId | null
  activeVersionId: VersionId | null
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {versions.map((v) => {
        const active = v.id === shownVersionId
        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={active}
            className={cn(
              "inline-flex h-8 min-w-11 items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors outline-none select-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
              active
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
            onClick={() => {
              // Tapping the active version exits preview; an older one enters it.
              dispatch({
                type: "version/previewed",
                versionId: v.id === activeVersionId ? null : v.id,
              })
            }}
          >
            {v.label}
          </button>
        )
      })}
    </div>
  )
}

function PreviewBanner({ planId, version }: { planId: PlanId; version: LessonVersion }) {
  const restore = useMutation({
    mutationFn: () => restoreVersion(planId, version.id),
    onSuccess: (res) => {
      dispatch({ type: "version/added", version: res.version })
      toast("Przywrócono")
    },
    onError: (err: Error) => toast(err.message),
  })

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent px-3 py-2">
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-accent-foreground">
        Podgląd wersji {version.label}
      </p>
      <Button size="sm" onClick={() => restore.mutate()} disabled={restore.isPending}>
        {restore.isPending && <LoaderCircle className="animate-spin" aria-hidden />}
        Przywróć tę wersję
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Zamknij podgląd"
        onClick={() => dispatch({ type: "version/previewed", versionId: null })}
      >
        <X aria-hidden />
      </Button>
    </div>
  )
}
