import { HttpResponse, delay, http } from "msw"
import { chapters, textbooks } from "../data/lesson-fixtures"

/** Case- and diacritic-insensitive normalization ("Słówka" → "slowka"). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
}

export const textbookHandlers = [
  // GET /api/textbooks?q= → Textbook[]
  http.get("/api/textbooks", async ({ request }) => {
    await delay(300)
    const q = normalize(new URL(request.url).searchParams.get("q") ?? "").trim()
    const results = q
      ? textbooks.filter((t) => normalize(`${t.title} ${t.publisher}`).includes(q))
      : textbooks
    return HttpResponse.json(results)
  }),

  // GET /api/textbooks/:id/chapters → Chapter[]
  http.get("/api/textbooks/:id/chapters", async ({ params }) => {
    await delay(300)
    const textbook = textbooks.find((t) => t.id === params.id)
    if (!textbook) {
      return HttpResponse.json({ message: "Nie znaleziono podręcznika" }, { status: 404 })
    }
    return HttpResponse.json(chapters.filter((c) => c.textbookId === textbook.id))
  }),
]
