// Ekran 6 — Sprawdzian. Konfiguracja (zadania, poziom, zakres) z żywym
// szacunkiem czasu i punktów; wygenerowany sprawdzian pojawia się pod
// konfiguracją, która pozostaje edytowalna do ponownego wygenerowania.

import { useDeferredValue, useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Download, LoaderCircle } from "lucide-react"

import { generateExam } from "../../data/api"
import type { ExamDifficulty, ExamGenerateRequest } from "../../model/types"
import { dispatch, usePlannerStore } from "../../state/store"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Chip, InfoChip } from "@/shared/ui/chip"
import { NumberStepper } from "@/shared/ui/number-stepper"
import { toast } from "@/shared/ui/toast"
import {
  DEFAULT_COUNTS,
  DIFFICULTIES,
  TASK_TYPES,
  estimateExam,
  formatEstimate,
  type ExamCounts,
} from "./exam-config"
import { ExamPreview } from "./ExamPreview"
import { downloadExamPdf } from "./pdf"

export function ExamScreen() {
  const doc = usePlannerStore((s) => s.doc)
  const versions = usePlannerStore((s) => s.versions)
  const activeVersionId = usePlannerStore((s) => s.activeVersionId)
  const brief = usePlannerStore((s) => s.brief)
  const exam = usePlannerStore((s) => s.exam)
  const navigate = useNavigate()

  // Ten ekran jest właścicielem konfiguracji aż do wygenerowania.
  const [counts, setCounts] = useState<ExamCounts>({ ...DEFAULT_COUNTS })
  const [difficulty, setDifficulty] = useState<ExamDifficulty>("medium")
  // Żywy szacunek — przelicza się przy każdej zmianie; odroczona wartość
  // utrzymuje płynność przy szybkim klikaniu steperów.
  const estimate = estimateExam(counts)
  const estimateLine = useDeferredValue(formatEstimate(estimate))
  const hasTasks = estimate.taskCount > 0

  const previewRef = useRef<HTMLElement>(null)
  const scrollToPreviewPending = useRef(false)

  const generate = useMutation({
    mutationFn: (body: ExamGenerateRequest) => {
      if (!doc) throw new Error("Brak planu lekcji.")
      return generateExam(doc.planId, body)
    },
    onSuccess: (nextExam) => {
      dispatch({ type: "exam/set", exam: nextExam })
      scrollToPreviewPending.current = true
    },
    onError: (error) => toast(error.message),
  })

  // Przewiń do podglądu dopiero po tym, jak React go domaluje.
  useEffect(() => {
    if (scrollToPreviewPending.current && exam) {
      scrollToPreviewPending.current = false
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [exam])

  if (!doc) return null // Route guard nie wpuszcza tu bez planu.

  const versionLabel = versions.find((v) => v.id === activeVersionId)?.label ?? "v1"

  function handleGenerate() {
    if (!activeVersionId || generate.isPending) return
    generate.mutate({
      versionId: activeVersionId,
      counts: { ...counts },
      difficulty,
      // Zakres = wszystkie rozdziały z briefu (sekcja wyboru usunięta).
      chapterIds: brief.chapterIds,
    })
  }

  return (
    <div className="px-4 pt-4">
      {/* Sprzęg z krokiem Plan: skąd pochodzi ten sprawdzian. */}
      <button
        type="button"
        onClick={() => navigate({ to: "/plan-lekcji" })}
        className="group -mx-1 flex min-h-11 items-center rounded-full px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
      >
        <InfoChip className="pointer-events-none gap-1.5 transition-colors group-hover:bg-secondary group-hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden />
          Na podstawie: Plan lekcji {versionLabel}
        </InfoChip>
        <span className="sr-only">— wróć do planu</span>
      </button>

      <div className="mt-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Zadania</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {TASK_TYPES.map(({ type, label }) => (
              <div key={type} className="flex min-h-11 items-center justify-between gap-3">
                <span className="text-sm font-medium">{label}</span>
                <NumberStepper
                  value={counts[type]}
                  onChange={(next) => setCounts((c) => ({ ...c, [type]: next }))}
                  min={0}
                  max={10}
                  label={`Liczba zadań: ${label}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Poziom trudności</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <Chip
                key={d.value}
                selected={difficulty === d.value}
                onClick={() => setDifficulty(d.value)}
              >
                {d.label}
              </Chip>
            ))}
          </CardContent>
        </Card>
      </div>

      {exam && <ExamPreview exam={exam} ref={previewRef} />}

      {/* Jeden przyklejony kontener: żywy szacunek + CTA. */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-sm">
        <p aria-live="polite" className="text-center text-sm">
          {hasTasks ? (
            <span className="font-medium tabular-nums">{estimateLine}</span>
          ) : (
            <span className="text-muted-foreground">Dodaj przynajmniej jedno zadanie</span>
          )}
        </p>
        {exam ? (
          // With a generated exam the download becomes the main action;
          // regeneration steps back to a secondary role.
          <div className="mt-2 flex gap-2">
            <Button className="h-12 flex-1 text-base" onClick={() => downloadExamPdf(exam)}>
              <Download className="size-4" aria-hidden />
              Pobierz PDF
            </Button>
            <Button
              variant="secondary"
              className="h-12"
              disabled={!hasTasks || generate.isPending}
              onClick={handleGenerate}
            >
              {generate.isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Układam…
                </>
              ) : (
                "Wygeneruj ponownie"
              )}
            </Button>
          </div>
        ) : (
          <Button
            className="mt-2 h-12 w-full text-base"
            disabled={!hasTasks || generate.isPending}
            onClick={handleGenerate}
          >
            {generate.isPending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Układam sprawdzian…
              </>
            ) : (
              "Wygeneruj sprawdzian"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
