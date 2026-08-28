// Screen-local config contract for ekran 6 (Sprawdzian): task-type labels,
// defaults and the live estimate math. The screen owns these values until
// generation — the server's Exam response is the source of truth afterwards.

import type { ExamDifficulty, ExamTaskType } from "../../model/types"

export type ExamCounts = Record<ExamTaskType, number>

export const TASK_TYPES: { type: ExamTaskType; label: string }[] = [
  { type: "abcd", label: "ABCD" },
  { type: "short", label: "Krótka odpowiedź" },
  { type: "long", label: "Długa odpowiedź" },
  { type: "match", label: "Połącz w pary" },
]

export const TASK_TYPE_LABELS: Record<ExamTaskType, string> = {
  abcd: "ABCD",
  short: "Krótka odpowiedź",
  long: "Długa odpowiedź",
  match: "Połącz w pary",
}

export const DEFAULT_COUNTS: ExamCounts = { abcd: 3, short: 2, long: 1, match: 0 }

export const DIFFICULTIES: { value: ExamDifficulty; label: string }[] = [
  { value: "easy", label: "Łatwy" },
  { value: "medium", label: "Średni" },
  { value: "hard", label: "Trudny" },
]

/** Minutes a pupil needs per task of each type. */
const MINUTES_PER_TASK: ExamCounts = { abcd: 1, short: 2, long: 8, match: 3 }

/** Points awarded per task of each type. */
const POINTS_PER_TASK: ExamCounts = { abcd: 1, short: 2, long: 5, match: 4 }

export interface ExamEstimate {
  taskCount: number
  /** Rounded up to a friendly multiple of 5 (min 5 when any task exists). */
  minutes: number
  points: number
}

export function estimateExam(counts: ExamCounts): ExamEstimate {
  let taskCount = 0
  let rawMinutes = 0
  let points = 0
  for (const { type } of TASK_TYPES) {
    taskCount += counts[type]
    rawMinutes += counts[type] * MINUTES_PER_TASK[type]
    points += counts[type] * POINTS_PER_TASK[type]
  }
  const minutes = taskCount === 0 ? 0 : Math.max(5, Math.ceil(rawMinutes / 5) * 5)
  return { taskCount, minutes, points }
}

/** Polish plural: 1 zadanie · 2–4 zadania (poza 12–14) · 5+ zadań. */
export function taskNoun(n: number): string {
  if (n === 1) return "zadanie"
  const tens = n % 100
  const ones = n % 10
  if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) return "zadania"
  return "zadań"
}

/** `6 zadań · ok. 20 min · 15 pkt` — "pkt" jest nieodmienne. */
export function formatEstimate(e: ExamEstimate): string {
  return `${e.taskCount} ${taskNoun(e.taskCount)} · ok. ${e.minutes} min · ${e.points} pkt`
}
