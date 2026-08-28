// Normal-mode sticky bottom bar: the „Napisz, co poprawić…" prompt field
// plus the primary path forward to the exam.

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { LoaderCircle, Mic, SendHorizontal } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/toast"

import { revisePlan } from "../../data/api"
import type { PlanId } from "../../model/types"
import { dispatch } from "../../state/store"

export function PromptBar({ planId }: { planId: PlanId }) {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState("")

  const revise = useMutation({
    mutationFn: (text: string) => revisePlan(planId, { prompt: text }),
    onSuccess: (res) => {
      dispatch({ type: "version/added", version: res.version })
      toast("Poprawiono plan")
      setPrompt("")
    },
    onError: (err: Error) => toast(err.message),
  })

  const submit = () => {
    const text = prompt.trim()
    if (text.length === 0 || revise.isPending) return
    revise.mutate(text)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto flex max-w-[720px] flex-col gap-2 border-t bg-background px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex h-11 items-center gap-1 rounded-full border border-input bg-card pr-1.5 pl-4 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Napisz, co poprawić…"
            aria-label="Napisz, co poprawić"
            disabled={revise.isPending}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:opacity-60 md:text-sm"
          />
          {revise.isPending ? (
            <span className="flex shrink-0 items-center gap-1.5 pr-2 text-xs text-muted-foreground">
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
              Poprawiam plan…
            </span>
          ) : (
            <>
              {prompt.trim().length > 0 && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0 rounded-full text-primary"
                  aria-label="Wyślij"
                  onClick={submit}
                >
                  <SendHorizontal aria-hidden />
                </Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                className="shrink-0 rounded-full"
                aria-label="Dyktuj"
                onClick={() => toast("Dyktowanie będzie dostępne wkrótce")}
              >
                <Mic aria-hidden />
              </Button>
            </>
          )}
        </div>
        <Button size="lg" className="w-full" onClick={() => navigate({ to: "/exam" })}>
          Przejdź do sprawdzianu
        </Button>
      </div>
    </div>
  )
}
