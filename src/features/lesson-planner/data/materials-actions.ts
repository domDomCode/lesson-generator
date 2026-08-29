// Shared optimistic mutations for materials, used by both the block sheet
// and the materials review sheet. Pattern: dispatch to the planner store
// first (the UI updates instantly), fire the matching HTTP call alongside,
// confirm with a toast that mirrors the action's name.

import { toast } from "@/shared/ui/toast"

import type { Block, BlockId, PlanId } from "../model/types"
import { dispatch } from "../state/store"
import { moveMaterial, searchMaterials, setMaterialStatus } from "./api"

export function acceptMaterial(planId: PlanId, materialId: string) {
  dispatch({ type: "material/statusChanged", materialId, status: "accepted" })
  toast("Dodano")
  setMaterialStatus(planId, materialId, { status: "accepted" }).catch(() => {
    toast("Nie udało się zapisać zmiany. Spróbuj ponownie.")
  })
}

export function rejectMaterial(planId: PlanId, materialId: string) {
  dispatch({ type: "material/statusChanged", materialId, status: "rejected" })
  toast("Odrzucono")
  setMaterialStatus(planId, materialId, { status: "rejected" }).catch(() => {
    toast("Nie udało się zapisać zmiany. Spróbuj ponownie.")
  })
}

export function moveMaterialToBlock(
  planId: PlanId,
  materialId: string,
  toBlock: Pick<Block, "id" | "index">
) {
  dispatch({ type: "material/moved", materialId, toBlockId: toBlock.id })
  toast(`Przeniesiono do bloku ${toBlock.index + 1}`)
  moveMaterial(planId, materialId, { toBlockId: toBlock.id }).catch(() => {
    toast("Nie udało się zapisać zmiany. Spróbuj ponownie.")
  })
}

/**
 * Search for materials for one block: the slot flips to "searching"
 * immediately, then resolves to "ready" (existing items + new ones) or
 * "error". Fire and forget — state lives in the store.
 */
export async function runMaterialSearch(planId: PlanId, blockId: BlockId, query: string) {
  dispatch({ type: "materials/searchStarted", blockId })
  try {
    const res = await searchMaterials(planId, { blockId, query })
    dispatch({ type: "materials/searchResolved", blockId, items: res.items })
  } catch (err) {
    dispatch({
      type: "materials/searchFailed",
      blockId,
      message:
        err instanceof Error ? err.message : "Nie udało się poszukać materiałów. Spróbuj ponownie.",
    })
  }
}
