// In-memory state for the mock backend. Everything lives in module-level
// structures mutated by handlers — a page reload resets the "server".
import type {
  AutoFitPreview,
  Brief,
  LessonDoc,
  LessonVersion,
  PlanId,
  VersionReason,
} from "@/features/lesson-planner/model/types"
import { buildDemoDoc } from "./lesson-fixtures"

export interface StoredProposal {
  preview: AutoFitPreview
  /** Target lesson length the proposal was computed for. */
  lessonMinutes: number
}

export interface PlanState {
  planId: PlanId
  versions: LessonVersion[]
  proposals: Map<string, StoredProposal>
}

const plans = new Map<PlanId, PlanState>()

let idCounter = 0

/** Unique-per-session id, e.g. nextId("plan") → "plan-3". */
export function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export function deepCopy<T>(value: T): T {
  return structuredClone(value)
}

export function getPlan(planId: PlanId): PlanState | undefined {
  return plans.get(planId)
}

/** The latest version — the one all CRUD endpoints operate on. */
export function currentVersion(plan: PlanState): LessonVersion {
  const version = plan.versions[plan.versions.length - 1]
  if (!version) throw new Error("plan has no versions")
  return version
}

export function currentDoc(plan: PlanState): LessonDoc {
  return currentVersion(plan).doc
}

export function pushVersion(plan: PlanState, doc: LessonDoc, reason: VersionReason): LessonVersion {
  const version: LessonVersion = {
    id: nextId("ver"),
    label: `v${plan.versions.length + 1}`,
    createdAt: new Date().toISOString(),
    reason,
    doc,
  }
  plan.versions.push(version)
  return version
}

/** Creates a plan with its v1 "generated" version from a brief. */
export function createPlan(brief: Brief): { plan: PlanState; version: LessonVersion } {
  const planId = nextId("plan")
  const doc = buildDemoDoc(planId, brief)
  const plan: PlanState = { planId, versions: [], proposals: new Map() }
  plans.set(planId, plan)
  const version = pushVersion(plan, doc, "generated")
  return { plan, version }
}
