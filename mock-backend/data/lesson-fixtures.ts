// Demo fixture data for the lesson-planner mock backend.
// Lesson: Język niemiecki, klasa 7 — "Das ist Deutsch! 2", Kapitel 3.
import type {
  Block,
  Brief,
  Chapter,
  ExamDifficulty,
  ExamTask,
  ExamTaskType,
  LessonDoc,
  Material,
  PlanId,
  Textbook,
} from "@/features/lesson-planner/model/types"

// ---------------------------------------------------------------------------
// Textbooks + chapters (search data)
// ---------------------------------------------------------------------------

export const DAS_IST_DEUTSCH_ID = "tb-das-ist-deutsch-2"

export const textbooks: Textbook[] = [
  {
    id: DAS_IST_DEUTSCH_ID,
    title: "Das ist Deutsch! 2",
    publisher: "Nowa Era",
    subject: "Język niemiecki",
    grades: ["7", "8"],
  },
  {
    id: "tb-matematyka-z-plusem-7",
    title: "Matematyka z plusem 7",
    publisher: "GWO",
    subject: "Matematyka",
    grades: ["7"],
  },
  {
    id: "tb-nowe-slowa-na-start-7",
    title: "Nowe Słowa na start! 7",
    publisher: "Nowa Era",
    subject: "Język polski",
    grades: ["7"],
  },
  {
    id: "tb-puls-zycia-7",
    title: "Biologia — Puls życia 7",
    publisher: "Nowa Era",
    subject: "Biologia",
    grades: ["7"],
  },
  {
    id: "tb-wczoraj-i-dzis-7",
    title: "Historia — Wczoraj i dziś 7",
    publisher: "Nowa Era",
    subject: "Historia",
    grades: ["7"],
  },
  {
    id: "tb-deutschtour-fit-7",
    title: "Deutschtour FIT 7",
    publisher: "Nowa Era",
    subject: "Język niemiecki",
    grades: ["7"],
  },
]

export const chapters: Chapter[] = [
  {
    id: "ch-did2-1",
    textbookId: DAS_IST_DEUTSCH_ID,
    title: "Kapitel 1 — Meine Ferien",
    curriculumCode: "II.5.1",
  },
  {
    id: "ch-did2-2",
    textbookId: DAS_IST_DEUTSCH_ID,
    title: "Kapitel 2 — Meine Schule",
    curriculumCode: "II.4.1",
  },
  {
    id: "ch-did2-3",
    textbookId: DAS_IST_DEUTSCH_ID,
    title: 'Kapitel 3 — Meine Familie (słownictwo rodzinne + czasownik „haben")',
    curriculumCode: "II.5.2",
  },
  {
    id: "ch-did2-4",
    textbookId: DAS_IST_DEUTSCH_ID,
    title: "Kapitel 4 — Essen und Trinken",
    curriculumCode: "II.6.1",
  },
  // A few chapters for the other textbooks so their pickers aren't empty.
  {
    id: "ch-mzp7-1",
    textbookId: "tb-matematyka-z-plusem-7",
    title: "Rozdział 1 — Liczby i działania",
    curriculumCode: "I.1.1",
  },
  {
    id: "ch-mzp7-2",
    textbookId: "tb-matematyka-z-plusem-7",
    title: "Rozdział 2 — Procenty",
    curriculumCode: "V.5.2",
  },
  {
    id: "ch-nsns7-1",
    textbookId: "tb-nowe-slowa-na-start-7",
    title: "Rozdział 1 — W kręgu tradycji",
    curriculumCode: "I.1.2",
  },
  {
    id: "ch-pz7-1",
    textbookId: "tb-puls-zycia-7",
    title: "Dział 1 — Organizm człowieka",
    curriculumCode: "III.2.1",
  },
  {
    id: "ch-wid7-1",
    textbookId: "tb-wczoraj-i-dzis-7",
    title: "Rozdział 1 — Europa po kongresie wiedeńskim",
    curriculumCode: "XVIII.1",
  },
  {
    id: "ch-dtf7-1",
    textbookId: "tb-deutschtour-fit-7",
    title: "Kapitel 1 — Hallo, wie geht's?",
    curriculumCode: "II.1.1",
  },
]

// ---------------------------------------------------------------------------
// Generated plan — 5 blocks + materials for blocks 2 and 3
// ---------------------------------------------------------------------------

export const DEMO_TOPIC = 'Meine Familie — słownictwo rodzinne i czasownik „haben"'
export const DEMO_SUBJECT = "Niemiecki"
export const DEMO_GRADE = "7"
export const DEMO_ASSUMPTIONS = ["45 min", "grupy 4-osobowe", "dostępny rzutnik"]
export const DEMO_AGENT_STEPS = [
  "Przeanalizowałem Kapitel 3 podręcznika Das ist Deutsch! 2",
  "Ułożyłem 5 bloków w 45 minutach",
  "Dobrałem metody do celu: poznanie nowego materiału",
  "Znalazłem 3 materiały do bloków 2 i 3",
]

interface BlockSeed {
  id: string
  title: string
  method: string
  form: string
  minutes: number
  content: string
  hasMaterials: boolean
}

const blockSeeds: BlockSeed[] = [
  {
    id: "b1",
    title: "Co już wiemy o rodzinie po niemiecku?",
    method: "Burza mózgów",
    form: "Cała klasa",
    minutes: 5,
    content:
      "Nauczyciel zapisuje na tablicy słowo „die Familie\" i prosi uczniów o podawanie wszystkich niemieckich słów, które kojarzą im się z rodziną. Pomysły trafiają na tablicę w formie mapy myśli. Nauczyciel dopytuje: „Wie heißt 'mama' auf Deutsch?\" i wspólnie z klasą porządkuje zebrane słownictwo.",
    hasMaterials: false,
  },
  {
    id: "b2",
    title: "Nowe słownictwo: Vater, Mutter, Geschwister",
    method: "Wykład z prezentacją",
    form: "Cała klasa",
    minutes: 10,
    content:
      "Nauczyciel wprowadza na slajdach nowe słownictwo: der Vater, die Mutter, die Geschwister, der Bruder, die Schwester. Każde słowo pojawia się z obrazkiem i zapisem wymowy, a uczniowie powtarzają je chórem i indywidualnie. Nauczyciel zwraca uwagę na rodzajniki oraz na formę die Geschwister, która występuje tylko w liczbie mnogiej.",
    hasMaterials: true,
  },
  {
    id: "b3",
    title: "Opisz swoje drzewo genealogiczne",
    method: "Ćwiczenie praktyczne",
    form: "Praca w parach",
    minutes: 12,
    content:
      'Uczniowie w parach opisują swoje drzewo genealogiczne po niemiecku, używając słownictwa Vater, Mutter, Bruder, Schwester oraz czasownika haben. Jedna osoba opisuje swoją rodzinę, druga zadaje pytania („Hast du Geschwister?"), następnie się zamieniają.',
    hasMaterials: true,
  },
  {
    id: "b4",
    title: 'Stacje zadaniowe: dopasuj słówka, ułóż zdania z „haben"',
    method: "Metoda aktywizująca",
    form: "Grupy 4-osobowe",
    minutes: 13,
    content:
      'Klasa pracuje w grupach 4-osobowych na dwóch stacjach zadaniowych. Na stacji pierwszej uczniowie dopasowują karty ze słówkami do obrazków członków rodziny (der Vater, die Mutter, der Bruder, die Schwester). Na stacji drugiej układają z rozsypanki wyrazowej zdania z czasownikiem „haben", np. „Ich habe einen Bruder", „Du hast zwei Schwestern". Po około sześciu minutach grupy zamieniają się stacjami.',
    hasMaterials: false,
  },
  {
    id: "b5",
    title: "Szybki quiz podsumowujący słownictwo",
    method: "Utrwalająca",
    form: "Indywidualnie",
    minutes: 5,
    content:
      "Nauczyciel zadaje klasie szybkie pytania ustne: „Wie heißt 'siostra' auf Deutsch?\", „Wie sagt man 'rodzice'?\". Uczniowie odpowiadają indywidualnie, a klasa wspólnie sprawdza poprawność odpowiedzi. Na koniec nauczyciel podsumowuje: dziś poznaliśmy nazwy członków rodziny i czasownik haben.",
    hasMaterials: false,
  },
]

interface MaterialSeed {
  id: string
  blockId: string
  title: string
  source: string
  kind: Material["kind"]
  length: string | null
  rationale: string
}

const materialSeeds: MaterialSeed[] = [
  {
    id: "m1",
    blockId: "b2",
    title: "Meine Familie — Wortschatz",
    source: "YouTube",
    kind: "video",
    length: "5:20",
    rationale: "Słownictwo z wymową, mieści się w 10-minutowym bloku",
  },
  {
    id: "m2",
    blockId: "b2",
    title: "Die Familie — Bildwörterbuch",
    source: "Goethe-Institut",
    kind: "pdf",
    length: null,
    rationale: "Plansza słownictwa do wyświetlenia",
  },
  {
    id: "m3",
    blockId: "b3",
    title: "Karta pracy: drzewo genealogiczne do uzupełnienia",
    source: "PDF",
    kind: "worksheet",
    length: "1 strona",
    rationale: "Do wydruku, uczniowie wypełniają w parach",
  },
]

/** Builds a complete, ready LessonDoc for a fresh plan. */
export function buildDemoDoc(planId: PlanId, brief: Brief): LessonDoc {
  const blocks: Block[] = blockSeeds.map((seed, i) => {
    const items: Material[] = materialSeeds
      .filter((m) => m.blockId === seed.id)
      .map((m) => ({ ...m, status: "proposed" }))
    return {
      id: seed.id,
      index: i,
      title: seed.title,
      method: seed.method,
      form: seed.form,
      minutes: seed.minutes,
      content: { status: "ready", text: seed.content },
      materials: seed.hasMaterials ? { status: "ready", items } : { status: "none" },
    }
  })
  const topic =
    brief.topicSource === "custom" && brief.customTopic?.trim()
      ? brief.customTopic.trim()
      : DEMO_TOPIC
  return {
    planId,
    topic,
    subject: DEMO_SUBJECT,
    grade: brief.grade || DEMO_GRADE,
    lessonMinutes: brief.lessonMinutes,
    blocks,
    assumptions: [`${brief.lessonMinutes} min`, ...DEMO_ASSUMPTIONS.slice(1)],
    agentSteps: DEMO_AGENT_STEPS,
  }
}

// ---------------------------------------------------------------------------
// Material search results (POST /api/plans/:planId/materials/search)
// ---------------------------------------------------------------------------

export const materialSearchPool: Omit<Material, "id" | "blockId" | "status">[] = [
  {
    title: "Familienmitglieder — ćwiczenia interaktywne",
    source: "LearningApps",
    kind: "link",
    length: null,
    rationale: "Interaktywne dopasowywanie słówek, dobre na rzutnik",
  },
  {
    title: "Der Haben-Rap",
    source: "YouTube",
    kind: "video",
    length: "2:45",
    rationale: "Piosenka utrwalająca odmianę czasownika haben",
  },
  {
    title: "Meine Familie — karta pracy z lukami",
    source: "Deutsch mit Marija",
    kind: "worksheet",
    length: "2 strony",
    rationale: "Zadania z lukami do pracy indywidualnej lub w parach",
  },
  {
    title: "Familie und Verwandte — nagranie wymowy",
    source: "Goethe-Institut",
    kind: "audio",
    length: "3:10",
    rationale: "Wzorcowa wymowa słownictwa rodzinnego do wspólnego powtarzania",
  },
]

// ---------------------------------------------------------------------------
// Exam tasks (POST /api/plans/:planId/exam/generate)
// ---------------------------------------------------------------------------

const abcdSeeds: Pick<ExamTask, "prompt" | "options" | "points">[] = [
  {
    // Verbatim demo task — must always be first when abcd count > 0.
    prompt: "Wähle die richtige Antwort: Ich ___ zwei Brüder.",
    options: ["hast", "habe", "hat"],
    points: 1,
  },
  {
    prompt: "Wähle die richtige Antwort: ___ du eine Schwester?",
    options: ["Hast", "Habe", "Hat"],
    points: 1,
  },
  {
    prompt: "Wähle die richtige Antwort: Wir ___ eine große Familie.",
    options: ["habt", "haben", "hat"],
    points: 1,
  },
  {
    prompt: "Wähle die richtige Antwort: Der Bruder und die Schwester das sind die ___.",
    options: ["Eltern", "Geschwister", "Großeltern"],
    points: 1,
  },
  {
    prompt: "Wähle die richtige Antwort: Meine Mutter und mein Vater sind meine ___.",
    options: ["Geschwister", "Kinder", "Eltern"],
    points: 1,
  },
]

const shortSeeds: Pick<ExamTask, "prompt" | "points">[] = [
  { prompt: "Przetłumacz na niemiecki: Mam dwie siostry.", points: 2 },
  { prompt: "Przetłumacz na niemiecki: Mój brat ma na imię Tomek.", points: 2 },
  {
    prompt: "Odpowiedz po niemiecku pełnym zdaniem: Hast du Geschwister?",
    points: 2,
  },
  {
    prompt: "Uzupełnij zdanie właściwą formą czasownika haben: Meine Eltern ___ zwei Kinder.",
    points: 2,
  },
]

const longSeeds: Pick<ExamTask, "prompt" | "points">[] = [
  {
    prompt: "Opisz swoją rodzinę po niemiecku (4–5 zdań), użyj czasownika haben.",
    points: 5,
  },
  {
    prompt:
      "Napisz po niemiecku krótki tekst o wymarzonej rodzinie: kto do niej należy i ile ma rodzeństwa (4–5 zdań).",
    points: 5,
  },
]

const matchSeeds: Pick<ExamTask, "prompt" | "pairs" | "points">[] = [
  {
    prompt: "Połącz słowa niemieckie z ich polskimi odpowiednikami (1 pkt za parę).",
    pairs: [
      { left: "der Vater", right: "ojciec" },
      { left: "die Mutter", right: "matka" },
      { left: "die Geschwister", right: "rodzeństwo" },
      { left: "der Bruder", right: "brat" },
    ],
    points: 4,
  },
  {
    prompt: "Połącz słowa niemieckie z ich polskimi odpowiednikami (1 pkt za parę).",
    pairs: [
      { left: "die Schwester", right: "siostra" },
      { left: "die Eltern", right: "rodzice" },
      { left: "die Großmutter", right: "babcia" },
    ],
    points: 3,
  },
]

/** Difficulty tweaks wording only — the tasks themselves stay the same. */
function difficultySuffix(difficulty: ExamDifficulty): string {
  switch (difficulty) {
    case "easy":
      return " (Możesz posiłkować się słowniczkiem z podręcznika.)"
    case "hard":
      return " (Pamiętaj o poprawnych rodzajnikach i szyku zdania.)"
    case "medium":
      return ""
  }
}

export function buildExamTasks(
  counts: Record<ExamTaskType, number>,
  difficulty: ExamDifficulty,
  nextId: () => string
): ExamTask[] {
  const tasks: ExamTask[] = []
  const suffix = difficultySuffix(difficulty)

  const take = <T>(pool: T[], i: number): T => {
    const item = pool[i % pool.length]
    if (item === undefined) throw new Error("buildExamTasks: empty seed pool")
    return item
  }

  for (let i = 0; i < (counts.abcd ?? 0); i++) {
    const seed = take(abcdSeeds, i)
    tasks.push({ id: nextId(), type: "abcd", ...seed })
  }
  for (let i = 0; i < (counts.short ?? 0); i++) {
    const seed = take(shortSeeds, i)
    tasks.push({ id: nextId(), type: "short", ...seed, prompt: seed.prompt + suffix })
  }
  for (let i = 0; i < (counts.long ?? 0); i++) {
    const seed = take(longSeeds, i)
    tasks.push({ id: nextId(), type: "long", ...seed, prompt: seed.prompt + suffix })
  }
  for (let i = 0; i < (counts.match ?? 0); i++) {
    const seed = take(matchSeeds, i)
    tasks.push({ id: nextId(), type: "match", ...seed })
  }
  return tasks
}

export function estimateExamMinutes(counts: Record<ExamTaskType, number>): number {
  return (
    (counts.abcd ?? 0) * 1 +
    (counts.short ?? 0) * 2 +
    (counts.long ?? 0) * 8 +
    (counts.match ?? 0) * 3
  )
}
