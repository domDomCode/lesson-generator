// Ekran 4 — bottom sheet with one block's details. Every edit (czas, metoda,
// forma, treść) is STAGED locally; nothing touches the store or the server
// until „Zapisz". The consequence line under the stepper tells the user what
// a time change does to the whole plan BEFORE she commits it.

import { useState, type FormEvent } from "react"
import { ChevronDown, Loader2, TriangleAlert } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Input } from "@/shared/ui/input"
import { NumberStepper } from "@/shared/ui/number-stepper"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "@/shared/ui/toast"

import type { BlockSheetProps } from "../../components/contracts"
import { patchBlock } from "../../data/api"
import { blockLabel, runMaterialSearch } from "../../data/materials-actions"
import { projectBlockChange } from "../../model/budget"
import type { Block, BlockPatchRequest, LessonDoc } from "../../model/types"
import { dispatch, selectVisibleDoc, usePlannerStore } from "../../state/store"
import { MaterialCard } from "../materials/material-card"

const METHOD_OPTIONS = [
  "Burza mózgów",
  "Wykład z prezentacją",
  "Ćwiczenie praktyczne",
  "Metoda aktywizująca",
  "Utrwalająca",
  "Praca z tekstem",
  "Dyskusja",
]

const FORM_OPTIONS = ["Cała klasa", "Praca w parach", "Grupy 4-osobowe", "Indywidualnie"]

const MIN_MINUTES = 3
const MAX_MINUTES = 45

/** Options list with the block's current value prepended when non-standard. */
function withValue(options: string[], value: string): string[] {
  return options.includes(value) ? options : [value, ...options]
}

// --- Polish plurals for the consequence line -------------------------------

/** 2–4, 22–24, 32–34… (but not 12–14) take the paucal form. */
function isPaucal(n: number): boolean {
  const units = n % 10
  const tens = n % 100
  return units >= 2 && units <= 4 && !(tens >= 12 && tens <= 14)
}

/** Accusative, after „o": 1 minutę / 3 minuty / 5 minut. */
function minutesAcc(n: number): string {
  if (n === 1) return "minutę"
  return isPaucal(n) ? "minuty" : "minut"
}

/** Nominative: 1 minuta / 3 minuty / 5 minut. */
function minutesNom(n: number): string {
  if (n === 1) return "minuta"
  return isPaucal(n) ? "minuty" : "minut"
}

function consequenceText(
  projection: { overflowMinutes: number; spareMinutes: number },
  lessonMinutes: number
): string {
  const { overflowMinutes, spareMinutes } = projection
  if (overflowMinutes > 0) {
    return `przekroczy plan o ${overflowMinutes} ${minutesAcc(overflowMinutes)}`
  }
  if (spareMinutes > 0) {
    const verb = isPaucal(spareMinutes) ? "zostaną" : "zostanie"
    return `zmieści się w planie, ${verb} ${spareMinutes} ${minutesNom(spareMinutes)} zapasu`
  }
  return `plan wypełni dokładnie ${lessonMinutes} min`
}

// --- sheet shell -----------------------------------------------------------

export function BlockSheet({ blockId, onOpenChange }: BlockSheetProps) {
  const doc = usePlannerStore(selectVisibleDoc)
  const block = blockId != null ? (doc?.blocks.find((b) => b.id === blockId) ?? null) : null

  return (
    <Sheet open={blockId != null} onOpenChange={onOpenChange}>
      {doc && block && (
        <BlockSheetContent key={block.id} doc={doc} block={block} onOpenChange={onOpenChange} />
      )}
    </Sheet>
  )
}

function BlockSheetContent({
  doc,
  block,
  onOpenChange,
}: {
  doc: LessonDoc
  block: Block
  onOpenChange: (open: boolean) => void
}) {
  const planId = doc.planId
  const lessonMinutes = doc.lessonMinutes
  const originalContent = block.content.status === "empty" ? "" : block.content.text

  // Staged edits — committed only via „Zapisz".
  const [minutes, setMinutes] = useState(block.minutes)
  const [method, setMethod] = useState(block.method)
  const [form, setForm] = useState(block.form)
  const [content, setContent] = useState(originalContent)
  const [editingContent, setEditingContent] = useState(false)
  const [openPicker, setOpenPicker] = useState<"method" | "form" | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchPending, setSearchPending] = useState(false)

  const contentDirty = content !== originalContent
  const dirty =
    minutes !== block.minutes || method !== block.method || form !== block.form || contentDirty

  const projection =
    minutes !== block.minutes
      ? projectBlockChange(doc.blocks, block.id, minutes, lessonMinutes)
      : null

  function save() {
    if (!dirty) return
    const patch: BlockPatchRequest = {}
    if (minutes !== block.minutes) patch.minutes = minutes
    if (method !== block.method) patch.method = method
    if (form !== block.form) patch.form = form
    if (contentDirty) patch.content = content
    dispatch({ type: "block/edited", blockId: block.id, patch })
    patchBlock(planId, block.id, patch).catch(() => {
      toast("Nie udało się zapisać zmiany. Spróbuj ponownie.")
    })
    toast("Zapisano")
    onOpenChange(false)
  }

  async function submitSearch(e: FormEvent) {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    setSearchQuery("")
    // Local pending: a re-search on a slot that already has materials keeps
    // them visible (the slot doesn't flip to "searching"), so the button
    // carries the progress signal.
    setSearchPending(true)
    await runMaterialSearch(planId, block.id, query)
    setSearchPending(false)
  }

  const slot = block.materials
  const visibleItems =
    slot.status === "ready" ? slot.items.filter((m) => m.status !== "rejected") : []

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{block.title}</SheetTitle>
        <SheetDescription>
          {blockLabel(block)} · {minutes} min
        </SheetDescription>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-5 pt-1">
        {/* Treść bloku */}
        <section className="flex flex-col gap-1.5">
          {editingContent ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32"
              aria-label="Treść bloku"
              autoFocus
            />
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
              <Button
                variant="link"
                className="h-11 self-start px-0 text-sm"
                onClick={() => setEditingContent(true)}
              >
                Edytuj ręcznie
              </Button>
            </>
          )}
        </section>

        {/* Metoda / forma / czas */}
        <section className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Metoda</p>
            {openPicker === "method" ? (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {withValue(METHOD_OPTIONS, method).map((option) => (
                  <Chip
                    key={option}
                    selected={option === method}
                    onClick={() => {
                      setMethod(option)
                      setOpenPicker(null)
                    }}
                  >
                    {option}
                  </Chip>
                ))}
              </div>
            ) : (
              <Chip
                className="mt-1.5"
                aria-label={`Metoda: ${method}. Zmień`}
                onClick={() => setOpenPicker("method")}
              >
                {method}
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
              </Chip>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Forma pracy</p>
            {openPicker === "form" ? (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {withValue(FORM_OPTIONS, form).map((option) => (
                  <Chip
                    key={option}
                    selected={option === form}
                    onClick={() => {
                      setForm(option)
                      setOpenPicker(null)
                    }}
                  >
                    {option}
                  </Chip>
                ))}
              </div>
            ) : (
              <Chip
                className="mt-1.5"
                aria-label={`Forma pracy: ${form}. Zmień`}
                onClick={() => setOpenPicker("form")}
              >
                {form}
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
              </Chip>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Czas</p>
            <NumberStepper
              className="mt-1.5"
              value={minutes}
              onChange={setMinutes}
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              label="Czas trwania bloku"
              formatValue={(v) => `${v} min`}
            />
            {projection && (
              <p
                className={cn(
                  "mt-1.5 flex items-center gap-1.5 text-sm",
                  projection.overflowMinutes > 0 ? "text-warning" : "text-muted-foreground"
                )}
              >
                {projection.overflowMinutes > 0 && (
                  <TriangleAlert className="size-4 shrink-0" aria-hidden />
                )}
                <span>
                  {block.minutes} → {minutes} min · {consequenceText(projection, lessonMinutes)}
                </span>
              </p>
            )}
          </div>
        </section>

        {/* Materiały — every block can get one via search or move. */}
        <section className="flex flex-col gap-2">
            <h3 className="font-heading text-sm font-medium">
              Materiały przypisane do tego bloku
            </h3>

            {slot.status === "searching" ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Szukam materiałów…
              </div>
            ) : (
              <>
                {slot.status === "error" && (
                  <p className="text-sm text-warning">
                    {slot.message} Poszukaj jeszcze raz poniżej.
                  </p>
                )}
                {visibleItems.map((material) => (
                  <MaterialCard
                    key={material.id}
                    planId={planId}
                    material={material}
                    blocks={doc.blocks}
                    moveLabel="Przenieś do innego bloku"
                  />
                ))}
                <p className="text-sm text-muted-foreground">
                  {slot.status === "none" ||
                  (slot.status === "ready" && visibleItems.length === 0)
                    ? "Nie znalazłem materiałów do tego bloku. Napisz, czego szukać."
                    : "Poszukaj materiału do tego bloku"}
                </p>
                <form onSubmit={submitSearch} className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Napisz, czego szukać"
                    aria-label="Poszukaj materiału do tego bloku"
                    className="h-11 flex-1"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="h-11"
                    disabled={!searchQuery.trim() || searchPending}
                  >
                    {searchPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    {searchPending ? "Szukam…" : "Poszukaj"}
                  </Button>
                </form>
              </>
            )}
        </section>

      </SheetBody>

      <SheetFooter>
        <SheetClose asChild>
          <Button variant="ghost" className="h-11 flex-1">
            Anuluj
          </Button>
        </SheetClose>
        <Button className="h-11 flex-[2]" disabled={!dirty} onClick={save}>
          Zapisz
        </Button>
      </SheetFooter>
    </SheetContent>
  )
}
