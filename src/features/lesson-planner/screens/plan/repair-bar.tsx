// Non-modal overflow repair row under the sticky budget bar. A warning,
// never a blocker — „Przejdź do sprawdzianu" keeps working regardless.

import { useMutation } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/toast"

import { patchPlan, requestAutoFit } from "../../data/api"
import type { PlanId } from "../../model/types"
import { dispatch, getPlannerState } from "../../state/store"
import { formatMinutes } from "../../model/plural"

/** Lesson lengths a teacher can bump to — next step above the current one. */
const LESSON_LENGTH_STEPS = [30, 45, 60, 90]

export function RepairBar({
  planId,
  lessonMinutes,
  overflowMinutes,
}: {
  planId: PlanId
  lessonMinutes: number
  overflowMinutes: number
}) {
  const autofit = useMutation({
    mutationFn: () =>
      requestAutoFit(planId, {
        lessonMinutes,
        // The block the teacher deliberately lengthened stays untouchable.
        protectedBlockId: getPlannerState().lastLengthenedBlockId,
      }),
    onSuccess: (preview) => dispatch({ type: "autofit/previewSet", preview }),
    onError: (err: Error) => toast(err.message),
  })

  const nextLength = LESSON_LENGTH_STEPS.find((m) => m > lessonMinutes)

  const lengthen = (minutes: number) => {
    dispatch({ type: "lesson/minutesChanged", minutes })
    patchPlan(planId, { lessonMinutes: minutes })
      .then(() => toast(`Wydłużono lekcję do ${minutes} min`))
      .catch(() => toast("Nie udało się zapisać zmiany. Spróbuj ponownie."))
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-warning/10 px-3 py-2 text-sm">
      <span className="font-medium text-warning">
        Przekroczono o {formatMinutes(overflowMinutes)}
      </span>
      <Button size="sm" onClick={() => autofit.mutate()} disabled={autofit.isPending}>
        {autofit.isPending && <LoaderCircle className="animate-spin" aria-hidden />}
        Dopasuj automatycznie
      </Button>
      {nextLength != null && (
        <button
          type="button"
          className="min-h-9 text-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => lengthen(nextLength)}
        >
          Wydłuż lekcję do {nextLength} min
        </button>
      )}
    </div>
  )
}
