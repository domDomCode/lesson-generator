// Domain model + wire DTOs for the lesson planner.
// This file is the single contract shared by the UI (src/) and the MSW
// mock backend (mock-backend/) — change it in one place only.

export type BlockId = string
export type VersionId = string
export type PlanId = string

// ---------------------------------------------------------------------------
// Brief (ekran 1)
// ---------------------------------------------------------------------------

export interface Textbook {
  id: string
  title: string
  publisher: string
  subject: string
  grades: string[]
}

export interface Chapter {
  id: string
  textbookId: string
  title: string
  /** Kod podstawy programowej, np. "II.5.2" — read-only chip w briefie. */
  curriculumCode: string
}

export type LessonGoal =
  | "Poznanie nowego materiału"
  | "Utrwalenie"
  | "Ćwiczenie umiejętności praktycznych"
  | "Przygotowanie do sprawdzianu"
  | "Powtórzenie działu"
  | (string & {})

export interface Brief {
  topicSource: "textbook" | "custom"
  textbookId: string | null
  chapterIds: string[]
  customTopic: string | null
  grade: string
  lessonMinutes: number
  goals: LessonGoal[]
  /** Preferencje — wszystkie opcjonalne. */
  methods: string[]
  forms: string[]
  equipment: string[]
  /** Wolny tekst z sekcji „Materiały z internetu". */
  materialsQuery: string | null
}

// ---------------------------------------------------------------------------
// Plan (ekrany 2–5)
// ---------------------------------------------------------------------------

export type MaterialStatus = "proposed" | "accepted" | "rejected"

export interface Material {
  id: string
  blockId: BlockId
  title: string
  /** Źródło, np. "YouTube", "Goethe-Institut". */
  source: string
  kind: "video" | "pdf" | "worksheet" | "audio" | "link"
  /** Długość/objętość, np. "5:20" albo "1 strona". */
  length: string | null
  /** Jedno zdanie uzasadnienia od subagenta. */
  rationale: string
  status: MaterialStatus
}

export type BlockContent =
  { status: "empty" } | { status: "streaming"; text: string } | { status: "ready"; text: string }

export type MaterialSlot =
  /** Blok bez slotu materiałów (bloki 1, 4, 5) — brak wskaźnika w UI. */
  | { status: "none" }
  /** Blok będzie miał materiały, ale subagent jeszcze nie ruszył (faza 1). */
  | { status: "pending" }
  | { status: "searching" }
  | { status: "ready"; items: Material[] }
  | { status: "error"; message: string }

export interface Block {
  id: BlockId
  index: number
  title: string
  /** Metoda, np. "Burza mózgów". */
  method: string
  /** Forma pracy, np. "Praca w parach". */
  form: string
  minutes: number
  content: BlockContent
  materials: MaterialSlot
}

export interface LessonDoc {
  planId: PlanId
  /** Nagłówek: temat + "Niemiecki · kl. 7 · 45 min". */
  topic: string
  subject: string
  grade: string
  lessonMinutes: number
  blocks: Block[]
  /** Chipsy założeń, np. "45 min", "grupy 4-osobowe", "dostępny rzutnik". */
  assumptions: string[]
  /** Kroki do zwijalnego podsumowania pracy agenta. */
  agentSteps: string[]
}

export type VersionReason = "generated" | "autofit" | "prompt" | "restore"

export interface LessonVersion {
  id: VersionId
  /** Etykieta pigułki: "v1", "v2"… */
  label: string
  createdAt: string
  reason: VersionReason
  doc: LessonDoc
}

/** Niezatwierdzona propozycja dopasowania — nakładka, nigdy kopia dokumentu. */
export interface AutoFitPreview {
  proposalId: string
  protectedBlockId: BlockId | null
  changes: Record<BlockId, { from: number; to: number }>
  resultingMinutes: number
}

// ---------------------------------------------------------------------------
// Sprawdzian (ekran 6)
// ---------------------------------------------------------------------------

export type ExamTaskType = "abcd" | "short" | "long" | "match"

export interface ExamTask {
  id: string
  type: ExamTaskType
  prompt: string
  points: number
  /** Dla typu "abcd". */
  options?: string[]
  /** Dla typu "match" — pary do połączenia. */
  pairs?: { left: string; right: string }[]
}

export interface Exam {
  id: string
  planId: PlanId
  versionId: VersionId
  basedOnLabel: string
  tasks: ExamTask[]
  totalPoints: number
  estimatedMinutes: number
}

export type ExamDifficulty = "easy" | "medium" | "hard"

// ---------------------------------------------------------------------------
// Wire DTOs — request/response bodies. Handlers in mock-backend/ must match
// these exactly; the UI must send exactly these shapes.
// ---------------------------------------------------------------------------

/** GET /api/textbooks?q= → Textbook[] */
/** GET /api/textbooks/:id/chapters → Chapter[] */

/** POST /api/plans/generate — body: Brief; response: SSE stream (PlanStreamEvent). */

/** PATCH /api/plans/:planId — np. „Wydłuż lekcję do 60 min". */
export interface PlanPatchRequest {
  lessonMinutes: number
}
export interface PlanPatchResponse {
  lessonMinutes: number
}

/** PATCH /api/plans/:planId/blocks/:blockId */
export interface BlockPatchRequest {
  title?: string
  method?: string
  form?: string
  minutes?: number
  content?: string
}
export interface BlockPatchResponse {
  block: Block
  totalMinutes: number
}

/** POST /api/plans/:planId/autofit — returns a preview, mutates nothing. */
export interface AutoFitRequest {
  lessonMinutes: number
  protectedBlockId: BlockId | null
}
export type AutoFitResponse = AutoFitPreview

/** POST /api/plans/:planId/autofit/apply */
export interface AutoFitApplyRequest {
  proposalId: string
}
export interface AutoFitApplyResponse {
  version: LessonVersion
}

/** POST /api/plans/:planId/revise — pasek "Napisz, co poprawić…". */
export interface ReviseRequest {
  prompt: string
}
export interface ReviseResponse {
  version: LessonVersion
}

/** POST /api/plans/:planId/versions/:versionId/restore */
export interface RestoreResponse {
  version: LessonVersion
}

/** POST /api/plans/:planId/materials/search */
export interface MaterialSearchRequest {
  blockId: BlockId
  query: string
}
export interface MaterialSearchResponse {
  blockId: BlockId
  items: Material[]
}

/** PATCH /api/plans/:planId/materials/:materialId */
export interface MaterialStatusRequest {
  status: Extract<MaterialStatus, "accepted" | "rejected">
}
export interface MaterialStatusResponse {
  material: Material
}

/** POST /api/plans/:planId/materials/:materialId/move */
export interface MaterialMoveRequest {
  toBlockId: BlockId
}
export interface MaterialMoveResponse {
  material: Material
}

/** POST /api/plans/:planId/exam/generate */
export interface ExamGenerateRequest {
  versionId: VersionId
  counts: Record<ExamTaskType, number>
  difficulty: ExamDifficulty
  chapterIds: string[]
}
export type ExamGenerateResponse = Exam

// ---------------------------------------------------------------------------
// SSE stream events — POST /api/plans/generate
// Wire format: named SSE events, `id:` is a monotonic sequence number.
//   event: block.created
//   data: {"blockId":"b1",...}
// ---------------------------------------------------------------------------

export type PlanStreamEvent =
  | {
      type: "plan.meta"
      planId: PlanId
      versionId: VersionId
      lessonMinutes: number
      topic: string
      subject: string
      grade: string
    }
  | { type: "status"; text: string }
  | {
      type: "block.created"
      blockId: BlockId
      index: number
      title: string
      minutes: number
      method: string
      form: string
      hasMaterials: boolean
    }
  | { type: "phase"; phase: "content" }
  | { type: "block.content.start"; blockId: BlockId }
  | { type: "block.content.delta"; blockId: BlockId; text: string }
  | { type: "block.content.done"; blockId: BlockId }
  | { type: "materials.start"; blockId: BlockId }
  | { type: "materials.result"; blockId: BlockId; items: Material[] }
  | { type: "materials.error"; blockId: BlockId; message: string }
  | {
      type: "done"
      planId: PlanId
      versionId: VersionId
      totalMinutes: number
      assumptions: string[]
      agentSteps: string[]
    }

export type PlanStreamEventType = PlanStreamEvent["type"]
