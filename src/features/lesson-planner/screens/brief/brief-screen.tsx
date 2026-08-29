// Ekran 1 — Brief. One scrollable column of cards; the planner store is
// the draft (every change dispatches brief/updated immediately), local
// state covers only transient UI: sheet open, collapsed sections, the
// custom-goal text field.

import { useState, type ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Check } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Chip, InfoChip } from "@/shared/ui/chip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible"
import { Input } from "@/shared/ui/input"
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet"
import { Textarea } from "@/shared/ui/textarea"

import { startGeneration } from "../../data/generation"
import { useChapters, useTextbook } from "../../data/textbooks"
import { plural } from "../../model/plural"
import type { Brief, Chapter, LessonGoal, Textbook } from "../../model/types"
import { dispatch, getPlannerState, usePlannerStore } from "../../state/store"
import { TextbookSheet } from "./textbook-sheet"

const GRADES = ["4", "5", "6", "7", "8"]
const DURATIONS = [30, 45, 60, 90]
const GOAL_OPTIONS: LessonGoal[] = [
  "Poznanie nowego materiału",
  "Utrwalenie",
  "Ćwiczenie umiejętności praktycznych",
  "Przygotowanie do sprawdzianu",
  "Powtórzenie działu",
]

/** Cel lekcji — twardy limit wyboru. */
const MAX_GOALS = 3
const METHOD_OPTIONS = [
  "Burza mózgów",
  "Aktywizująca",
  "Utrwalająca",
  "Praca z tekstem",
  "Dyskusja",
]
const FORM_OPTIONS = ["Cała klasa", "Pary", "Grupy", "Indywidualnie"]
const EQUIPMENT_OPTIONS = ["Rzutnik", "Tablica interaktywna", "Brak sprzętu"]

function patchBrief(patch: Partial<Brief>) {
  dispatch({ type: "brief/updated", patch })
}

function toggleItem(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function isBriefValid(brief: Brief): boolean {
  const topicOk =
    brief.topicSource === "textbook"
      ? brief.textbookId != null && brief.chapterIds.length > 0
      : (brief.customTopic ?? "").trim().length > 0
  return topicOk && brief.grade !== "" && brief.lessonMinutes > 0
}

/** "a", "a i b", "a, b i c" */
function joinPolish(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} i ${items[items.length - 1]}`
}

/** Quiet helper naming what's still missing — an invitation, not an error. */
function missingHint(brief: Brief): string | null {
  const picks: string[] = []
  if (brief.topicSource === "textbook") {
    if (!brief.textbookId) picks.push("podręcznik")
    else if (brief.chapterIds.length === 0) picks.push("rozdział")
  }
  if (!brief.grade) picks.push("klasę")
  if (!brief.lessonMinutes) picks.push("czas trwania")
  const needsTopic = brief.topicSource === "custom" && (brief.customTopic ?? "").trim() === ""
  if (!needsTopic && picks.length === 0) return null
  if (needsTopic && picks.length > 0) return `Wpisz temat i wybierz jeszcze ${joinPolish(picks)}`
  if (needsTopic) return "Wpisz jeszcze temat lekcji"
  return `Wybierz jeszcze ${joinPolish(picks)}`
}

/** "1 wybrana", "2 wybrane", "5 wybranych" — Preferencje trigger count. */
function selectedCountLabel(count: number): string {
  return `${count} ${plural(count, { one: "wybrana", few: "wybrane", many: "wybranych" })}`
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="text-sm font-medium">{children}</p>
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip key={option} selected={selected.includes(option)} onClick={() => onToggle(option)}>
          {option}
        </Chip>
      ))}
    </div>
  )
}

export function BriefScreen() {
  const brief = usePlannerStore((s) => s.brief)
  const generationPhase = usePlannerStore((s) => s.generation.phase)
  const navigate = useNavigate()

  const [sheetOpen, setSheetOpen] = useState(false)
  // Immediate label for the picker field right after choosing; useTextbook
  // covers remounts (e.g. coming back from /plan).
  const [pickedTextbook, setPickedTextbook] = useState<Textbook | null>(null)

  const textbookQuery = useTextbook(brief.topicSource === "textbook" ? brief.textbookId : null)
  const chaptersQuery = useChapters(brief.topicSource === "textbook" ? brief.textbookId : null)

  const chosenTextbookTitle = brief.textbookId
    ? ((pickedTextbook?.id === brief.textbookId ? pickedTextbook.title : null) ??
      textbookQuery.data?.title ??
      null)
    : null
  const selectedChapters = (chaptersQuery.data ?? []).filter((c) => brief.chapterIds.includes(c.id))
  const [curriculumChapter, setCurriculumChapter] = useState<Chapter | null>(null)

  // Custom goal — anything in brief.goals outside the predefined list.
  const customGoal = brief.goals.find((goal) => !GOAL_OPTIONS.includes(goal)) ?? ""
  const [customGoalOpen, setCustomGoalOpen] = useState(customGoal !== "")
  const [customGoalText, setCustomGoalText] = useState(customGoal)
  const customGoalSelected = customGoalOpen || customGoal !== ""

  // Cel lekcji: at most 3 — an open „Inny…" consumes a slot even while empty,
  // so typing a custom goal can never sneak past the limit.
  const predefinedGoalCount = GOAL_OPTIONS.filter((goal) => brief.goals.includes(goal)).length
  const goalSlots = predefinedGoalCount + (customGoalSelected ? 1 : 0)
  const atGoalLimit = goalSlots >= MAX_GOALS

  const prefsCount = brief.methods.length + brief.forms.length + brief.equipment.length

  const hasPlan = generationPhase !== "idle"
  const valid = isBriefValid(brief)
  const hint = missingHint(brief)

  function handleCustomGoalChange(value: string) {
    setCustomGoalText(value)
    const predefined = brief.goals.filter((goal) => GOAL_OPTIONS.includes(goal))
    patchBrief({ goals: value.trim() === "" ? predefined : [...predefined, value.trim()] })
  }

  function handleCustomGoalToggle() {
    if (customGoalSelected) {
      setCustomGoalOpen(false)
      setCustomGoalText("")
      patchBrief({ goals: brief.goals.filter((goal) => GOAL_OPTIONS.includes(goal)) })
    } else {
      setCustomGoalOpen(true)
    }
  }

  function handleSubmit() {
    startGeneration(getPlannerState().brief)
    navigate({ to: "/plan-lekcji" })
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      {hasPlan && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted px-4 py-1.5">
          <p className="text-sm text-muted-foreground">Masz już plan tej lekcji</p>
          <Button variant="link" className="px-0" onClick={() => navigate({ to: "/plan-lekcji" })}>
            Wróć do planu
          </Button>
        </div>
      )}

      {/* 1. Klasa i czas — pierwsze, bo wybór podręcznika zależy od klasy */}
      <Card>
        <CardHeader>
          <CardTitle>Klasa i czas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <GroupLabel>Klasa</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((grade) => (
                <Chip
                  key={grade}
                  selected={brief.grade === grade}
                  onClick={() => patchBrief({ grade })}
                  className="min-w-11 justify-center"
                >
                  {grade}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <GroupLabel>Czas trwania</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((minutes) => (
                <Chip
                  key={minutes}
                  selected={brief.lessonMinutes === minutes}
                  onClick={() => patchBrief({ lessonMinutes: minutes })}
                >
                  {minutes} min
                </Chip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Temat lekcji */}
      <Card>
        <CardHeader>
          <CardTitle>Temat lekcji</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="group">
            <button
              type="button"
              aria-pressed={brief.topicSource === "textbook"}
              onClick={() => patchBrief({ topicSource: "textbook" })}
              className={cn(
                "h-11 rounded-lg text-sm font-medium transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50",
                brief.topicSource === "textbook"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Z podręcznika
            </button>
            <button
              type="button"
              aria-pressed={brief.topicSource === "custom"}
              onClick={() => patchBrief({ topicSource: "custom" })}
              className={cn(
                "h-11 rounded-lg text-sm font-medium transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50",
                brief.topicSource === "custom"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Własny temat
            </button>
          </div>

          {brief.topicSource === "textbook" ? (
            <>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              >
                <span className={cn(!chosenTextbookTitle && "text-muted-foreground")}>
                  {chosenTextbookTitle ?? "Wybierz podręcznik"}
                </span>
                <span aria-hidden className="text-muted-foreground">
                  ›
                </span>
              </button>

              {brief.textbookId && (
                <div className="flex flex-col gap-1">
                  <GroupLabel>Rozdziały</GroupLabel>
                  {chaptersQuery.isPending ? (
                    <div className="flex flex-col gap-2" aria-hidden>
                      <div className="shimmer h-11 rounded-lg" />
                      <div className="shimmer h-11 rounded-lg" />
                    </div>
                  ) : (
                    <ul className="flex flex-col">
                      {(chaptersQuery.data ?? []).map((chapter) => {
                        const selected = brief.chapterIds.includes(chapter.id)
                        return (
                          <li key={chapter.id}>
                            <button
                              type="button"
                              aria-pressed={selected}
                              onClick={() =>
                                patchBrief({ chapterIds: toggleItem(brief.chapterIds, chapter.id) })
                              }
                              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input"
                                )}
                              >
                                {selected && <Check className="size-3.5" />}
                              </span>
                              <span className="text-sm">{chapter.title}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {selectedChapters.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedChapters.map((chapter) => (
                        <button
                          key={chapter.id}
                          type="button"
                          className="min-h-11 outline-none focus-visible:rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
                          onClick={() => setCurriculumChapter(chapter)}
                        >
                          <InfoChip className="hover:bg-secondary">
                            Podstawa programowa: {chapter.curriculumCode}
                          </InfoChip>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Input
              value={brief.customTopic ?? ""}
              onChange={(event) =>
                patchBrief({ customTopic: event.target.value === "" ? null : event.target.value })
              }
              placeholder={'Np. Rodzina — słownictwo i czasownik „haben"'}
              className="h-11 px-3"
            />
          )}
        </CardContent>
      </Card>

      {/* 3. Cel lekcji */}
      <Card>
        <CardHeader>
          <CardTitle>Cel lekcji</CardTitle>
          <CardDescription>Wybierz najwyżej {MAX_GOALS}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((goal) => {
              const selected = brief.goals.includes(goal)
              return (
                <Chip
                  key={goal}
                  selected={selected}
                  disabled={atGoalLimit && !selected}
                  onClick={() => patchBrief({ goals: toggleItem(brief.goals, goal) })}
                >
                  {goal}
                </Chip>
              )
            })}
            <Chip
              selected={customGoalSelected}
              disabled={atGoalLimit && !customGoalSelected}
              onClick={handleCustomGoalToggle}
            >
              Inny…
            </Chip>
          </div>
          {atGoalLimit && (
            <p className="animate-in fade-in-0 text-sm text-muted-foreground duration-200">
              Wybrano {MAX_GOALS} z {MAX_GOALS} — odznacz cel, aby wybrać inny.
            </p>
          )}
          {customGoalSelected && (
            <Input
              value={customGoalText}
              onChange={(event) => handleCustomGoalChange(event.target.value)}
              placeholder="Np. przygotowanie do konkursu"
              className="h-11 px-3"
            />
          )}
        </CardContent>
      </Card>

      {/* 4. Preferencje */}
      <Card>
        <Collapsible>
          <CollapsibleTrigger className="px-(--card-spacing)">
            <span className="flex items-baseline gap-2">
              <span className="font-heading text-base leading-snug font-medium">Preferencje</span>
              {prefsCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedCountLabel(prefsCount)}
                </span>
              )}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="flex flex-col gap-4 pt-3">
              <div className="flex flex-col gap-2">
                <GroupLabel>Metody</GroupLabel>
                <ChipGroup
                  options={METHOD_OPTIONS}
                  selected={brief.methods}
                  onToggle={(value) => patchBrief({ methods: toggleItem(brief.methods, value) })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <GroupLabel>Formy pracy</GroupLabel>
                <ChipGroup
                  options={FORM_OPTIONS}
                  selected={brief.forms}
                  onToggle={(value) => patchBrief({ forms: toggleItem(brief.forms, value) })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <GroupLabel>Wyposażenie</GroupLabel>
                <ChipGroup
                  options={EQUIPMENT_OPTIONS}
                  selected={brief.equipment}
                  onToggle={(value) =>
                    patchBrief({ equipment: toggleItem(brief.equipment, value) })
                  }
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 5. Materiały z internetu */}
      <Card>
        <Collapsible defaultOpen={(brief.materialsQuery ?? "") !== ""}>
          <CollapsibleTrigger className="px-(--card-spacing)">
            <span className="font-heading text-base leading-snug font-medium">
              Materiały z internetu
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-3">
              <Textarea
                value={brief.materialsQuery ?? ""}
                onChange={(event) =>
                  patchBrief({
                    materialsQuery: event.target.value === "" ? null : event.target.value,
                  })
                }
                placeholder="Czego mam poszukać? np. krótkich filmów i animacji dla klasy 7"
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2 px-4 pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))]">
          {!valid && hint && <p className="text-center text-sm text-muted-foreground">{hint}</p>}
          <Button className="h-12 w-full text-base" disabled={!valid} onClick={handleSubmit}>
            {hasPlan ? "Zaplanuj od nowa" : "Zaplanuj lekcję"}
          </Button>
        </div>
      </div>

      <CurriculumSheet
        chapter={curriculumChapter}
        onOpenChange={(open) => {
          if (!open) setCurriculumChapter(null)
        }}
      />
      <TextbookSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSelect={(textbook) => {
          setPickedTextbook(textbook)
          patchBrief({ textbookId: textbook.id, chapterIds: [] })
          setSheetOpen(false)
        }}
      />
    </div>
  )
}

/**
 * Prosty podgląd wpisu podstawy programowej dla rozdziału. Treść jest
 * przykładowa (mock) — ten sam szablon dla każdego kodu.
 */
function CurriculumSheet({
  chapter,
  onOpenChange,
}: {
  chapter: Chapter | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={chapter != null} onOpenChange={onOpenChange}>
      <SheetContent>
        {chapter != null && (
          <>
            <SheetHeader>
              <SheetTitle>Podstawa programowa {chapter.curriculumCode}</SheetTitle>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">
                Język obcy nowożytny · II etap edukacyjny · wymaganie szczegółowe{" "}
                {chapter.curriculumCode}
              </p>
              <p>
                Uczeń posługuje się podstawowym zasobem środków językowych (leksykalnych,
                gramatycznych, ortograficznych i fonetycznych) w zakresie tematu:{" "}
                <span className="font-medium">{chapter.title}</span>.
              </p>
              <ul className="flex list-disc flex-col gap-1.5 pl-5">
                <li>rozumie proste wypowiedzi ustne i pisemne dotyczące tego tematu,</li>
                <li>tworzy krótkie, spójne wypowiedzi ustne i pisemne,</li>
                <li>reaguje językowo w typowych sytuacjach życia codziennego,</li>
                <li>stosuje podstawowe struktury gramatyczne poznane w rozdziale.</li>
              </ul>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
