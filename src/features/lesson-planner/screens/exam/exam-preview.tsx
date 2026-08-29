// Read-only preview of the generated exam, rendered below the config so
// the teacher can tweak counts and regenerate without losing context.

import { Fragment } from "react"
import type * as React from "react"
import { Sparkles } from "lucide-react"

import type { Exam, ExamTask } from "../../model/types"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { TASK_TYPE_LABELS } from "./exam-config"

const OPTION_LETTERS = ["a", "b", "c", "d", "e", "f"]

/** `hast` → `a) hast`; leaves options that already carry a letter intact. */
function formatOption(option: string, index: number): string {
  if (/^[a-f]\)/.test(option)) return option
  return `${OPTION_LETTERS[index] ?? "•"}) ${option}`
}

function TaskBody({ task }: { task: ExamTask }) {
  if (task.type === "abcd") {
    return (
      <ul className="space-y-1">
        {(task.options ?? []).map((option, i) => (
          <li key={option} className="text-sm">
            {formatOption(option, i)}
          </li>
        ))}
      </ul>
    )
  }
  if (task.type === "match") {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {(task.pairs ?? []).map((pair) => (
          <Fragment key={`${pair.left}=${pair.right}`}>
            <span className="text-sm">{pair.left}</span>
            <span className="text-sm text-muted-foreground">{pair.right}</span>
          </Fragment>
        ))}
      </div>
    )
  }
  return (
    <p
      className={
        "rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground " +
        (task.type === "long" ? "py-6" : "py-2.5")
      }
    >
      {task.type === "long" ? "Miejsce na dłuższą wypowiedź" : "Miejsce na odpowiedź"}
    </p>
  )
}

export function ExamPreview({ exam, ref }: { exam: Exam; ref?: React.Ref<HTMLElement> }) {
  return (
    // scroll-mt keeps the header (h-12) clear when the CTA scrolls us here.
    <section ref={ref} aria-label="Podgląd sprawdzianu" className="mt-8 scroll-mt-14">
      <header className="flex items-center gap-1.5 px-1">
        <h2 className="font-heading text-base font-medium">
          Sprawdzian · {exam.totalPoints} pkt · ok. {exam.estimatedMinutes} min
        </h2>
        <Sparkles className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">Treść wygenerowana</span>
      </header>
      <ol className="mt-3 space-y-3">
        {exam.tasks.map((task, index) => (
          <li key={task.id}>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground">
                  Zadanie {index + 1} · {TASK_TYPE_LABELS[task.type]}
                </CardTitle>
                <CardAction>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {task.points} pkt
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <p className="text-sm leading-relaxed">{task.prompt}</p>
                <TaskBody task={task} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  )
}
