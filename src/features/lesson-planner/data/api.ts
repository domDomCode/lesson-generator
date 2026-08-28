// Typed API client — the single place where request payloads are built.
// Every function's request/response shape comes verbatim from
// model/types.ts, which the MSW mock backend implements. Screens wrap
// these in useMutation/useQuery as needed; optimistic UI lives in the
// planner store, not here.

import type {
  AutoFitApplyRequest,
  AutoFitApplyResponse,
  AutoFitRequest,
  AutoFitResponse,
  BlockId,
  BlockPatchRequest,
  BlockPatchResponse,
  Chapter,
  ExamGenerateRequest,
  ExamGenerateResponse,
  MaterialMoveRequest,
  MaterialMoveResponse,
  MaterialSearchRequest,
  MaterialSearchResponse,
  MaterialStatusRequest,
  MaterialStatusResponse,
  PlanId,
  PlanPatchRequest,
  PlanPatchResponse,
  RestoreResponse,
  ReviseRequest,
  ReviseResponse,
  Textbook,
  VersionId,
} from "../model/types"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new Error(
      (error as { message?: string } | null)?.message ?? "Coś poszło nie tak. Spróbuj ponownie."
    )
  }
  return res.json()
}

export function searchTextbooks(q: string): Promise<Textbook[]> {
  return request(`/api/textbooks?q=${encodeURIComponent(q)}`)
}

export function getChapters(textbookId: string): Promise<Chapter[]> {
  return request(`/api/textbooks/${textbookId}/chapters`)
}

export function patchPlan(planId: PlanId, body: PlanPatchRequest): Promise<PlanPatchResponse> {
  return request(`/api/plans/${planId}`, { method: "PATCH", body: JSON.stringify(body) })
}

export function patchBlock(
  planId: PlanId,
  blockId: BlockId,
  body: BlockPatchRequest
): Promise<BlockPatchResponse> {
  return request(`/api/plans/${planId}/blocks/${blockId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function requestAutoFit(planId: PlanId, body: AutoFitRequest): Promise<AutoFitResponse> {
  return request(`/api/plans/${planId}/autofit`, { method: "POST", body: JSON.stringify(body) })
}

export function applyAutoFit(
  planId: PlanId,
  body: AutoFitApplyRequest
): Promise<AutoFitApplyResponse> {
  return request(`/api/plans/${planId}/autofit/apply`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function revisePlan(planId: PlanId, body: ReviseRequest): Promise<ReviseResponse> {
  return request(`/api/plans/${planId}/revise`, { method: "POST", body: JSON.stringify(body) })
}

export function restoreVersion(planId: PlanId, versionId: VersionId): Promise<RestoreResponse> {
  return request(`/api/plans/${planId}/versions/${versionId}/restore`, { method: "POST" })
}

export function searchMaterials(
  planId: PlanId,
  body: MaterialSearchRequest
): Promise<MaterialSearchResponse> {
  return request(`/api/plans/${planId}/materials/search`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function setMaterialStatus(
  planId: PlanId,
  materialId: string,
  body: MaterialStatusRequest
): Promise<MaterialStatusResponse> {
  return request(`/api/plans/${planId}/materials/${materialId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function moveMaterial(
  planId: PlanId,
  materialId: string,
  body: MaterialMoveRequest
): Promise<MaterialMoveResponse> {
  return request(`/api/plans/${planId}/materials/${materialId}/move`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function generateExam(
  planId: PlanId,
  body: ExamGenerateRequest
): Promise<ExamGenerateResponse> {
  return request(`/api/plans/${planId}/exam/generate`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}
