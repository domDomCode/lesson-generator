// External planner store: one reducer over the whole lesson document,
// subscribed via useSyncExternalStore. This — not TanStack Query — is the
// source of truth; Query is used only as transport at the edges. The
// reducer is also the optimistic layer: local edits land here immediately
// and the matching HTTP mutation runs alongside.
//
// Selector rule: selectors passed to usePlannerStore must return stable
// references (state slices), or useSyncExternalStore will loop. For
// derived arrays use the memoized selectors at the bottom of this file.

import { useSyncExternalStore } from "react"

import type {
  AutoFitPreview,
  Block,
  BlockId,
  Brief,
  Exam,
  LessonDoc,
  LessonVersion,
  Material,
  PlanStreamEvent,
  VersionId,
} from "../model/types"

export type GenerationPhase = "idle" | "structure" | "content" | "done" | "error"

export interface GenerationState {
  phase: GenerationPhase
  /** Linijka statusu fazy 1: "Analizuję Kapitel 3". */
  statusText: string
  error: string | null
}

export interface PlannerState {
  brief: Brief
  doc: LessonDoc | null
  versions: LessonVersion[]
  activeVersionId: VersionId | null
  /** Podgląd starszej wersji (pigułka) — null = widok wersji aktywnej. */
  previewedVersionId: VersionId | null
  /** Niezatwierdzona propozycja „Dopasuj automatycznie". */
  autofit: AutoFitPreview | null
  /**
   * Blok, który użytkownik ostatnio świadomie wydłużył — chroniony
   * (nietykalny) przy „Dopasuj automatycznie".
   */
  lastLengthenedBlockId: BlockId | null
  generation: GenerationState
  exam: Exam | null
}

export const defaultBrief: Brief = {
  topicSource: "textbook",
  textbookId: null,
  chapterIds: [],
  customTopic: null,
  grade: "",
  lessonMinutes: 45,
  goals: [],
  methods: [],
  forms: [],
  equipment: [],
  materialsQuery: null,
}

const initialState: PlannerState = {
  brief: defaultBrief,
  doc: null,
  versions: [],
  activeVersionId: null,
  previewedVersionId: null,
  autofit: null,
  lastLengthenedBlockId: null,
  generation: { phase: "idle", statusText: "", error: null },
  exam: null,
}

export type PlannerAction =
  | { type: "brief/updated"; patch: Partial<Brief> }
  | { type: "generation/started" }
  | { type: "generation/event"; event: PlanStreamEvent }
  | { type: "generation/failed"; message: string }
  /** Optimistic local block edit (also sent as PATCH by the caller). */
  | {
      type: "block/edited"
      blockId: BlockId
      patch: Partial<Pick<Block, "title" | "method" | "form" | "minutes">> & { content?: string }
    }
  | { type: "material/statusChanged"; materialId: string; status: "accepted" | "rejected" }
  | { type: "material/moved"; materialId: string; toBlockId: BlockId }
  | { type: "materials/searchStarted"; blockId: BlockId }
  | { type: "materials/searchResolved"; blockId: BlockId; items: Material[] }
  | { type: "materials/searchFailed"; blockId: BlockId; message: string }
  | { type: "autofit/previewSet"; preview: AutoFitPreview }
  | { type: "autofit/cleared" }
  /** Nowa wersja z serwera (autofit apply / revise / restore) — staje się aktywna. */
  | { type: "version/added"; version: LessonVersion }
  | { type: "version/previewed"; versionId: VersionId | null }
  | { type: "exam/set"; exam: Exam | null }
  /** „Wydłuż lekcję do 60 min" — zmiana budżetu czasu lekcji. */
  | { type: "lesson/minutesChanged"; minutes: number }

function updateBlock(doc: LessonDoc, blockId: BlockId, fn: (b: Block) => Block): LessonDoc {
  return { ...doc, blocks: doc.blocks.map((b) => (b.id === blockId ? fn(b) : b)) }
}

function updateMaterial(
  doc: LessonDoc,
  materialId: string,
  fn: (m: Material) => Material
): LessonDoc {
  return {
    ...doc,
    blocks: doc.blocks.map((b) =>
      b.materials.status === "ready" && b.materials.items.some((m) => m.id === materialId)
        ? {
            ...b,
            materials: {
              status: "ready",
              items: b.materials.items.map((m) => (m.id === materialId ? fn(m) : m)),
            },
          }
        : b
    ),
  }
}

/** Keep the active version's snapshot in sync with in-place doc edits. */
function syncActiveVersion(
  state: PlannerState,
  doc: LessonDoc
): Pick<PlannerState, "doc" | "versions"> {
  return {
    doc,
    versions: state.versions.map((v) => (v.id === state.activeVersionId ? { ...v, doc } : v)),
  }
}

function reduceGenerationEvent(state: PlannerState, event: PlanStreamEvent): PlannerState {
  switch (event.type) {
    case "plan.meta":
      return {
        ...initialState,
        brief: state.brief,
        generation: { phase: "structure", statusText: state.generation.statusText, error: null },
        doc: {
          planId: event.planId,
          topic: event.topic,
          subject: event.subject,
          grade: event.grade,
          lessonMinutes: event.lessonMinutes,
          blocks: [],
          assumptions: [],
          agentSteps: [],
        },
      }
    case "status":
      return { ...state, generation: { ...state.generation, statusText: event.text } }
    case "block.created": {
      if (!state.doc) return state
      const block: Block = {
        id: event.blockId,
        index: event.index,
        title: event.title,
        method: event.method,
        form: event.form,
        minutes: event.minutes,
        content: { status: "empty" },
        materials: event.hasMaterials ? { status: "pending" } : { status: "none" },
      }
      return { ...state, doc: { ...state.doc, blocks: [...state.doc.blocks, block] } }
    }
    case "phase":
      return { ...state, generation: { ...state.generation, phase: "content" } }
    case "block.content.start":
      if (!state.doc) return state
      return {
        ...state,
        doc: updateBlock(state.doc, event.blockId, (b) => ({
          ...b,
          content: { status: "streaming", text: "" },
        })),
      }
    case "block.content.delta":
      if (!state.doc) return state
      return {
        ...state,
        doc: updateBlock(state.doc, event.blockId, (b) => ({
          ...b,
          content: {
            status: "streaming",
            text: (b.content.status === "streaming" ? b.content.text : "") + event.text,
          },
        })),
      }
    case "block.content.done":
      if (!state.doc) return state
      return {
        ...state,
        doc: updateBlock(state.doc, event.blockId, (b) => ({
          ...b,
          content: {
            status: "ready",
            text: b.content.status === "streaming" ? b.content.text : "",
          },
        })),
      }
    case "materials.start":
      if (!state.doc) return state
      return {
        ...state,
        doc: updateBlock(state.doc, event.blockId, (b) => ({
          ...b,
          materials: { status: "searching" },
        })),
      }
    case "materials.result":
      if (!state.doc) return state
      return {
        ...state,
        doc: updateBlock(state.doc, event.blockId, (b) => ({
          ...b,
          materials: { status: "ready", items: event.items },
        })),
      }
    case "materials.error":
      if (!state.doc) return state
      return {
        ...state,
        doc: updateBlock(state.doc, event.blockId, (b) => ({
          ...b,
          materials: { status: "error", message: event.message },
        })),
      }
    case "done": {
      if (!state.doc) return state
      const doc: LessonDoc = {
        ...state.doc,
        assumptions: event.assumptions,
        agentSteps: event.agentSteps,
      }
      const version: LessonVersion = {
        id: event.versionId,
        label: "v1",
        createdAt: new Date().toISOString(),
        reason: "generated",
        doc,
      }
      return {
        ...state,
        doc,
        versions: [version],
        activeVersionId: version.id,
        generation: { phase: "done", statusText: "", error: null },
      }
    }
  }
}

function reduce(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case "brief/updated":
      return { ...state, brief: { ...state.brief, ...action.patch } }
    case "generation/started":
      return {
        ...state,
        doc: null,
        versions: [],
        activeVersionId: null,
        previewedVersionId: null,
        autofit: null,
        exam: null,
        generation: { phase: "structure", statusText: "", error: null },
      }
    case "generation/event":
      return reduceGenerationEvent(state, action.event)
    case "generation/failed":
      return {
        ...state,
        generation: { ...state.generation, phase: "error", error: action.message },
      }
    case "block/edited": {
      if (!state.doc) return state
      const previous = state.doc.blocks.find((b) => b.id === action.blockId)
      const { content, ...rest } = action.patch
      const doc = updateBlock(state.doc, action.blockId, (b) => ({
        ...b,
        ...rest,
        ...(content !== undefined ? { content: { status: "ready" as const, text: content } } : {}),
      }))
      const lengthened =
        previous != null && action.patch.minutes != null && action.patch.minutes > previous.minutes
      return {
        ...state,
        ...syncActiveVersion(state, doc),
        lastLengthenedBlockId: lengthened ? action.blockId : state.lastLengthenedBlockId,
      }
    }
    case "material/statusChanged": {
      if (!state.doc) return state
      const doc = updateMaterial(state.doc, action.materialId, (m) => ({
        ...m,
        status: action.status,
      }))
      return { ...state, ...syncActiveVersion(state, doc) }
    }
    case "material/moved": {
      if (!state.doc) return state
      let moved: Material | null = null
      // Remove from the source slot…
      let doc: LessonDoc = {
        ...state.doc,
        blocks: state.doc.blocks.map((b) => {
          if (b.materials.status !== "ready") return b
          const found = b.materials.items.find((m) => m.id === action.materialId)
          if (!found) return b
          moved = { ...found, blockId: action.toBlockId }
          return {
            ...b,
            materials: {
              status: "ready",
              items: b.materials.items.filter((m) => m.id !== action.materialId),
            },
          }
        }),
      }
      if (!moved) return state
      const material: Material = moved
      // …and add to the target slot, upgrading a slotless block if needed.
      doc = updateBlock(doc, action.toBlockId, (b) => ({
        ...b,
        materials:
          b.materials.status === "ready"
            ? { status: "ready", items: [...b.materials.items, material] }
            : { status: "ready", items: [material] },
      }))
      return { ...state, ...syncActiveVersion(state, doc) }
    }
    case "materials/searchStarted": {
      if (!state.doc) return state
      const doc = updateBlock(state.doc, action.blockId, (b) =>
        // Re-search on a slot that already has materials keeps them visible
        // (the search UI shows its own pending state); only an empty slot
        // switches to the "searching" indicator.
        b.materials.status === "ready" && b.materials.items.length > 0
          ? b
          : { ...b, materials: { status: "searching" } }
      )
      return { ...state, ...syncActiveVersion(state, doc) }
    }
    case "materials/searchResolved": {
      if (!state.doc) return state
      const doc = updateBlock(state.doc, action.blockId, (b) => {
        const existing = b.materials.status === "ready" ? b.materials.items : []
        return { ...b, materials: { status: "ready", items: [...existing, ...action.items] } }
      })
      return { ...state, ...syncActiveVersion(state, doc) }
    }
    case "materials/searchFailed": {
      if (!state.doc) return state
      const doc = updateBlock(state.doc, action.blockId, (b) =>
        // A failed re-search must not wipe materials the block already has —
        // keep the slot as-is; only an empty slot shows the error state.
        b.materials.status === "ready" && b.materials.items.length > 0
          ? b
          : { ...b, materials: { status: "error", message: action.message } }
      )
      return { ...state, ...syncActiveVersion(state, doc) }
    }
    case "autofit/previewSet":
      return { ...state, autofit: action.preview }
    case "autofit/cleared":
      return { ...state, autofit: null }
    case "version/added":
      return {
        ...state,
        doc: action.version.doc,
        versions: [...state.versions, action.version],
        activeVersionId: action.version.id,
        previewedVersionId: null,
        autofit: null,
      }
    case "version/previewed":
      return { ...state, previewedVersionId: action.versionId }
    case "exam/set":
      return { ...state, exam: action.exam }
    case "lesson/minutesChanged": {
      if (!state.doc) return state
      const doc = { ...state.doc, lessonMinutes: action.minutes }
      return { ...state, ...syncActiveVersion(state, doc) }
    }
  }
}

// --- store plumbing -------------------------------------------------------

let state: PlannerState = initialState
const listeners = new Set<() => void>()

export function getPlannerState(): PlannerState {
  return state
}

export function dispatch(action: PlannerAction) {
  const next = reduce(state, action)
  if (next !== state) {
    state = next
    for (const l of listeners) l()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePlannerStore<T>(selector: (s: PlannerState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}

// --- derived, memoized selectors ------------------------------------------

export interface BlockView extends Block {
  /** Minutes with the (uncommitted) autofit preview applied. */
  effectiveMinutes: number
  /** Proposed change, e.g. { from: 12, to: 10 } — null outside a preview. */
  delta: { from: number; to: number } | null
  /** Blok chroniony w podglądzie dopasowania — świadoma decyzja użytkownika. */
  isProtected: boolean
}

/**
 * The doc currently shown: the previewed older version's doc when a version
 * pill is being inspected, otherwise the live doc.
 */
export function selectVisibleDoc(s: PlannerState): LessonDoc | null {
  if (s.previewedVersionId) {
    return s.versions.find((v) => v.id === s.previewedVersionId)?.doc ?? s.doc
  }
  return s.doc
}

let blocksViewCache: {
  doc: LessonDoc | null
  autofit: AutoFitPreview | null
  result: BlockView[]
} | null = null

/** Blocks of the visible doc with the autofit overlay applied. Memoized. */
export function selectBlocksView(s: PlannerState): BlockView[] {
  const doc = selectVisibleDoc(s)
  const autofit = s.previewedVersionId ? null : s.autofit
  if (blocksViewCache && blocksViewCache.doc === doc && blocksViewCache.autofit === autofit) {
    return blocksViewCache.result
  }
  const result: BlockView[] = (doc?.blocks ?? []).map((b) => {
    const delta = autofit?.changes[b.id] ?? null
    return {
      ...b,
      effectiveMinutes: delta?.to ?? b.minutes,
      delta,
      isProtected: autofit != null && b.id === autofit.protectedBlockId,
    }
  })
  blocksViewCache = { doc, autofit, result }
  return result
}

/** Step gating for the process stepper. */
export function selectPlanReady(s: PlannerState): boolean {
  return s.versions.length > 0
}
