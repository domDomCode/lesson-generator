import { HttpResponse, delay, http } from "msw"
import type {
  Block,
  LessonDoc,
  Material,
  MaterialMoveRequest,
  MaterialMoveResponse,
  MaterialSearchRequest,
  MaterialSearchResponse,
  MaterialStatusRequest,
  MaterialStatusResponse,
} from "@/features/lesson-planner/model/types"
import { materialSearchPool } from "../data/lesson-fixtures"
import { currentDoc, getPlan, nextId } from "../data/store"

const planNotFound = () => HttpResponse.json({ message: "Nie znaleziono planu" }, { status: 404 })

const materialNotFound = () =>
  HttpResponse.json({ message: "Nie znaleziono materiału" }, { status: 404 })

function findMaterial(
  doc: LessonDoc,
  materialId: string
): { block: Block; material: Material } | null {
  for (const block of doc.blocks) {
    if (block.materials.status !== "ready") continue
    const material = block.materials.items.find((m) => m.id === materialId)
    if (material) return { block, material }
  }
  return null
}

/** Adds a material to a block's slot, upgrading a "none" slot to "ready". */
function attachToBlock(block: Block, material: Material): void {
  if (block.materials.status === "ready") {
    block.materials.items.push(material)
  } else {
    block.materials = { status: "ready", items: [material] }
  }
}

/** "nic ciekawego" / "brak pomysłów" → empty result, so the UI's empty state is reachable. */
function wantsEmptyResult(query: string): boolean {
  return query
    .toLowerCase()
    .split(/\s+/)
    .some((word) => word === "nic" || word.startsWith("brak"))
}

let searchRotation = 0

export const materialHandlers = [
  // POST /api/plans/:planId/materials/search
  http.post("/api/plans/:planId/materials/search", async ({ params, request }) => {
    await delay(1800)
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()

    const body = (await request.json()) as MaterialSearchRequest
    const doc = currentDoc(plan)
    const block = doc.blocks.find((b) => b.id === body.blockId)
    if (!block) {
      return HttpResponse.json({ message: "Nie znaleziono bloku" }, { status: 404 })
    }

    let items: Material[] = []
    if (!wantsEmptyResult(body.query)) {
      // Rotate through the pool so repeated searches feel fresh; 1–2 results.
      const count = (searchRotation % 2) + 1
      items = Array.from({ length: count }, (_, i) => {
        const seed = materialSearchPool[(searchRotation + i) % materialSearchPool.length]
        if (!seed) throw new Error("materialSearchPool is empty")
        return {
          ...seed,
          id: nextId("mat"),
          blockId: block.id,
          status: "proposed" as const,
        }
      })
      searchRotation += count
      // Keep server-side state consistent: found materials live in the slot.
      for (const item of items) attachToBlock(block, item)
    }

    const response: MaterialSearchResponse = { blockId: block.id, items }
    return HttpResponse.json(response)
  }),

  // PATCH /api/plans/:planId/materials/:materialId — accept/reject.
  http.patch("/api/plans/:planId/materials/:materialId", async ({ params, request }) => {
    await delay(250)
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()

    const found = findMaterial(currentDoc(plan), params.materialId as string)
    if (!found) return materialNotFound()

    const body = (await request.json()) as MaterialStatusRequest
    found.material.status = body.status

    const response: MaterialStatusResponse = { material: found.material }
    return HttpResponse.json(response)
  }),

  // POST /api/plans/:planId/materials/:materialId/move — between blocks' slots.
  http.post("/api/plans/:planId/materials/:materialId/move", async ({ params, request }) => {
    await delay(300)
    const plan = getPlan(params.planId as string)
    if (!plan) return planNotFound()

    const doc = currentDoc(plan)
    const found = findMaterial(doc, params.materialId as string)
    if (!found) return materialNotFound()

    const body = (await request.json()) as MaterialMoveRequest
    const target = doc.blocks.find((b) => b.id === body.toBlockId)
    if (!target) {
      return HttpResponse.json({ message: "Nie znaleziono bloku docelowego" }, { status: 404 })
    }

    if (found.block.materials.status === "ready") {
      found.block.materials.items = found.block.materials.items.filter(
        (m) => m.id !== found.material.id
      )
    }
    found.material.blockId = target.id
    attachToBlock(target, found.material)

    const response: MaterialMoveResponse = { material: found.material }
    return HttpResponse.json(response)
  }),
]
