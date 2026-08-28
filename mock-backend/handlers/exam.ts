import { HttpResponse, delay, http } from "msw"
import type {
  Exam,
  ExamGenerateRequest,
} from "@/features/lesson-planner/model/types"
import { buildExamTasks, estimateExamMinutes } from "../data/lesson-fixtures"
import { getPlan, nextId } from "../data/store"

export const examHandlers = [
  // POST /api/plans/:planId/exam/generate
  http.post("/api/plans/:planId/exam/generate", async ({ params, request }) => {
    await delay(2000)
    const plan = getPlan(params.planId as string)
    if (!plan) {
      return HttpResponse.json({ message: "Nie znaleziono planu" }, { status: 404 })
    }

    const body = (await request.json()) as ExamGenerateRequest
    const version = plan.versions.find((v) => v.id === body.versionId)
    if (!version) {
      return HttpResponse.json({ message: "Nie znaleziono wersji planu" }, { status: 404 })
    }

    const tasks = buildExamTasks(body.counts, body.difficulty, () => nextId("task"))
    if (tasks.length === 0) {
      return HttpResponse.json(
        { message: "Wybierz co najmniej jedno zadanie" },
        { status: 400 }
      )
    }

    const exam: Exam = {
      id: nextId("exam"),
      planId: plan.planId,
      versionId: version.id,
      basedOnLabel: version.label,
      tasks,
      totalPoints: tasks.reduce((sum, t) => sum + t.points, 0),
      estimatedMinutes: estimateExamMinutes(body.counts),
    }
    return HttpResponse.json(exam)
  }),
]
