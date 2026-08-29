import { HttpResponse, delay, http } from "msw"
import type {
  AutoFitApplyRequest,
  AutoFitApplyResponse,
  AutoFitRequest,
  AutoFitResponse,
  Block,
  BlockPatchRequest,
  BlockPatchResponse,
  Brief,
  LessonDoc,
  Material,
  PlanPatchRequest,
  PlanPatchResponse,
  RestoreResponse,
  ReviseRequest,
  ReviseResponse,
} from "@/features/lesson-planner/model/types"
import { buildAutoFitProposal, totalMinutes } from "@/features/lesson-planner/model/budget"
import { createPlan, currentDoc, deepCopy, getPlan, nextId, pushVersion } from "../data/store"
import { sseResponse, sleep } from "./sse"
import type { SseSend } from "./sse"

const planNotFound = () => HttpResponse.json({ message: "Nie znaleziono planu" }, { status: 404 })

// ---------------------------------------------------------------------------
// SSE generation choreography (~8–10 s total)
// ---------------------------------------------------------------------------

/** Splits block content into ~4–8 word-boundary chunks for delta streaming. */
function chunkText(text: string, targetChunks = 6): string[] {
  const words = text.split(" ")
  const perChunk = Math.max(1, Math.ceil(words.length / targetChunks))
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += perChunk) {
    const prefix = i > 0 ? " " : ""
    chunks.push(prefix + words.slice(i, i + perChunk).join(" "))
  }
  return chunks
}

/** Streams each block's content in order: start → ~4–8 deltas → done. */
async function runContentProducer(
  send: SseSend,
  doc: LessonDoc,
  signal: AbortSignal
): Promise<void> {
  for (const block of doc.blocks) {
    if (signal.aborted) return
    send({ type: "block.content.start", blockId: block.id })
    const text = block.content.status === "ready" ? block.content.text : ""
    for (const chunk of chunkText(text)) {
      if (signal.aborted) return
      await sleep(160)
      send({ type: "block.content.delta", blockId: block.id, text: chunk })
    }
    send({ type: "block.content.done", blockId: block.id })
  }
}

function readyMaterials(block: Block): Material[] {
  return block.materials.status === "ready" ? block.materials.items : []
}

/**
 * Independent materials subagent: block 2 and block 3 searches start and
 * resolve on their own timelines, interleaved with content deltas.
 */
async function runMaterialsProducer(
  send: SseSend,
  doc: LessonDoc,
  signal: AbortSignal
): Promise<void> {
  const withMaterials = doc.blocks.filter((b) => b.materials.status !== "none")
  const [first, second] = withMaterials
  if (!first) return

  send({ type: "materials.start", blockId: first.id })
  await sleep(800)
  if (signal.aborted) return
  if (second) send({ type: "materials.start", blockId: second.id })
  await sleep(1700) // first resolves ~2.5 s after materials work began
  if (signal.aborted) return
  send({ type: "materials.result", blockId: first.id, items: readyMaterials(first) })
  if (!second) return
  await sleep(2000) // second resolves ~4.5 s in
  if (signal.aborted) return
  send({ type: "materials.result", blockId: second.id, items: readyMaterials(second) })
}

// ---------------------------------------------------------------------------
// Revision simulation
// ---------------------------------------------------------------------------

/** Applies a small deterministic-but-plausible change based on the prompt. */
function applyRevision(doc: LessonDoc, prompt: string): void {
  const p = prompt.toLowerCase()
  if (p.includes("krótsz") || p.includes("krotsz") || p.includes("skróć") || p.includes("skroc")) {
    // "make it shorter" — shave 2 minutes off the longest block
    const longest = doc.blocks.reduce((a, b) => (b.minutes > a.minutes ? b : a))
    longest.minutes = Math.max(3, longest.minutes - 2)
    return
  }
  if (p.includes("grup")) {
    // "more group work" — flip the first non-group block to group form
    const target = doc.blocks.find((b) => b.form !== "Grupy 4-osobowe")
    if (target) target.form = "Grupy 4-osobowe"
    return
  }
  // Default: refresh the closing quiz into a Kahoot version.
  const quiz = doc.blocks[doc.blocks.length - 1]
  if (!quiz) return
  quiz.title = "Kahoot: quiz ze słownictwa"
  quiz.method = "Gra dydaktyczna"
  quiz.content = {
    status: "ready",
    text: 'Uczniowie dołączają do Kahoota na telefonach lub tabletach i rozwiązują quiz ze słownictwa rodzinnego: der Vater, die Mutter, die Geschwister. Pytania obejmują też formy czasownika haben, np. „Ich ___ einen Bruder". Wyniki pojawiają się na rzutniku, a najlepsza trójka zbiera brawa klasy.',
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const planHandlers = [
  // POST /api/plans/generate — body: Brief; response: SSE stream.
  http.post("/api/plans/generate", async ({ request }) => {
    const brief = (await request.json()) as Brief
    const { plan, version } = createPlan(brief)
    const doc = version.doc
    const signal = request.signal

    return sseResponse(signal, async (send) => {
      send({
        type: "plan.meta",
        planId: plan.planId,
        versionId: version.id,
        lessonMinutes: doc.lessonMinutes,
        topic: doc.topic,
        subject: doc.subject,
        grade: doc.grade,
      })
      send({
        type: "status",
        text: brief.topicSource === "custom" ? "Analizuję temat" : "Analizuję Kapitel 3",
      })
      await sleep(600)
      send({ type: "status", text: "Buduję strukturę lekcji" })

      for (const block of doc.blocks) {
        if (signal.aborted) return
        await sleep(350)
        send({
          type: "block.created",
          blockId: block.id,
          index: block.index,
          title: block.title,
          minutes: block.minutes,
          method: block.method,
          form: block.form,
          hasMaterials: block.materials.status !== "none",
        })
      }

      send({ type: "phase", phase: "content" })
      // Two independent producers over the same stream: content streams
      // block by block while the materials subagent resolves on its own.
      await Promise.all([
        runContentProducer(send, doc, signal),
        runMaterialsProducer(send, doc, signal),
      ])
      if (signal.aborted) return

      send({
        type: "done",
        planId: plan.planId,
        versionId: version.id,
        totalMinutes: totalMinutes(doc.blocks),
        assumptions: doc.assumptions,
        agentSteps: doc.agentSteps,
      })
    })
  }),

  // PATCH /api/plans/:planId — np. „Wydłuż lekcję do 60 min". Edits the
  // current version's lessonMinutes in place; no new version is created.
  http.patch("/api/plans/:planId", async ({ params, request }) => {
    await delay(300)
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()

    const body = (await request.json()) as PlanPatchRequest
    const doc = currentDoc(plan)
    doc.lessonMinutes = body.lessonMinutes

    const response: PlanPatchResponse = { lessonMinutes: doc.lessonMinutes }
    return HttpResponse.json(response)
  }),

  // PATCH /api/plans/:planId/blocks/:blockId — edits the current version in place.
  http.patch("/api/plans/:planId/blocks/:blockId", async ({ params, request }) => {
    await delay(300)
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()
    const doc = currentDoc(plan)
    const block = doc.blocks.find((b) => b.id === params.blockId)
    if (!block) {
      return HttpResponse.json({ message: "Nie znaleziono bloku" }, { status: 404 })
    }

    const patch = (await request.json()) as BlockPatchRequest
    if (patch.title !== undefined) block.title = patch.title
    if (patch.method !== undefined) block.method = patch.method
    if (patch.form !== undefined) block.form = patch.form
    if (patch.minutes !== undefined) block.minutes = patch.minutes
    if (patch.content !== undefined) {
      block.content = { status: "ready", text: patch.content }
    }

    const response: BlockPatchResponse = {
      block,
      totalMinutes: totalMinutes(doc.blocks),
    }
    return HttpResponse.json(response)
  }),

  // POST /api/plans/:planId/autofit — computes a preview, mutates nothing.
  http.post("/api/plans/:planId/autofit", async ({ params, request }) => {
    await delay(600) // it "thinks"
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()

    const body = (await request.json()) as AutoFitRequest
    const preview = buildAutoFitProposal(
      currentDoc(plan).blocks,
      body.lessonMinutes,
      body.protectedBlockId,
      nextId("prop")
    )
    if (!preview) {
      return HttpResponse.json(
        { message: "Plan mieści się w czasie lekcji — nie ma czego dopasowywać." },
        { status: 409 }
      )
    }
    plan.proposals.set(preview.proposalId, {
      preview,
      lessonMinutes: body.lessonMinutes,
    })
    const response: AutoFitResponse = preview
    return HttpResponse.json(response)
  }),

  // POST /api/plans/:planId/autofit/apply — applies a stored proposal as a new version.
  http.post("/api/plans/:planId/autofit/apply", async ({ params, request }) => {
    await delay(400)
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()

    const body = (await request.json()) as AutoFitApplyRequest
    const stored = plan.proposals.get(body.proposalId)
    if (!stored) {
      return HttpResponse.json(
        { message: "Nie znaleziono propozycji dopasowania" },
        { status: 404 }
      )
    }

    const doc = deepCopy(currentDoc(plan))
    for (const [blockId, change] of Object.entries(stored.preview.changes)) {
      const block = doc.blocks.find((b) => b.id === blockId)
      if (block) block.minutes = change.to
    }
    doc.lessonMinutes = stored.lessonMinutes
    plan.proposals.delete(body.proposalId)

    const version = pushVersion(plan, doc, "autofit")
    const response: AutoFitApplyResponse = { version }
    return HttpResponse.json(response)
  }),

  // POST /api/plans/:planId/revise — prompt-driven revision as a new version.
  http.post("/api/plans/:planId/revise", async ({ params, request }) => {
    await delay(1500) // long enough for the pending state to show
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()

    const body = (await request.json()) as ReviseRequest
    const doc = deepCopy(currentDoc(plan))
    applyRevision(doc, body.prompt)

    const version = pushVersion(plan, doc, "prompt")
    const response: ReviseResponse = { version }
    return HttpResponse.json(response)
  }),

  // POST /api/plans/:planId/versions/:versionId/restore
  http.post("/api/plans/:planId/versions/:versionId/restore", async ({ params }) => {
    await delay(400)
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()
    const source = plan.versions.find((v) => v.id === params.versionId)
    if (!source) {
      return HttpResponse.json({ message: "Nie znaleziono wersji" }, { status: 404 })
    }

    const version = pushVersion(plan, deepCopy(source.doc), "restore")
    const response: RestoreResponse = { version }
    return HttpResponse.json(response)
  }),
]
