// Sticky bottom bar shown while an uncommitted autofit proposal is on
// screen. Nothing is recomputed silently — only „Zastosuj" commits.

import { useMutation } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/toast"

import { applyAutoFit } from "../../data/api"
import type { AutoFitPreview, PlanId } from "../../model/types"
import { dispatch } from "../../state/store"
import { formatBlocks } from "./plural"

export function AutoFitFooter({
  planId,
  preview,
  lessonMinutes,
}: {
  planId: PlanId
  preview: AutoFitPreview
  lessonMinutes: number
}) {
  const apply = useMutation({
    mutationFn: () => applyAutoFit(planId, { proposalId: preview.proposalId }),
    onSuccess: (res) => {
      dispatch({ type: "version/added", version: res.version })
      toast("Zastosowano")
    },
    onError: (err: Error) => toast(err.message),
  })

  const shortenedCount = Object.keys(preview.changes).length

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-[720px] border-t bg-background px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <p className="text-sm text-muted-foreground">
          Propozycja: skrócę {formatBlocks(shortenedCount)}, plan zmieści się w {lessonMinutes} min
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => apply.mutate()}
            disabled={apply.isPending}
          >
            {apply.isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            Zastosuj
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => dispatch({ type: "autofit/cleared" })}
            disabled={apply.isPending}
          >
            Anuluj
          </Button>
        </div>
      </div>
    </div>
  )
}
