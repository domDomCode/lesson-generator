// Rough PDF export of the generated exam — a deliberately minimal,
// hand-rolled single-page PDF (built-in Helvetica, no dependencies).
// It only loosely resembles the exam: header, task lines, points.
// Polish/German characters outside WinAnsi are transliterated.

import type { Exam } from "../../model/types"
import { TASK_TYPE_LABELS } from "./exam-config"

const TRANSLITERATION: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
  Ą: "A",
  Ć: "C",
  Ę: "E",
  Ł: "L",
  Ń: "N",
  Ó: "O",
  Ś: "S",
  Ź: "Z",
  Ż: "Z",
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
  Ä: "Ae",
  Ö: "Oe",
  Ü: "Ue",
  "—": "-",
  "·": "-",
  "„": '"',
  "”": '"',
  "…": "...",
}

function toAscii(text: string): string {
  return text
    .split("")
    .map((ch) => TRANSLITERATION[ch] ?? (ch.charCodeAt(0) < 128 ? ch : "?"))
    .join("")
}

function escapePdfText(text: string): string {
  return toAscii(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function buildExamPdf(exam: Exam): Blob {
  const lines: { text: string; size: number; gapBefore: number }[] = [
    { text: "Sprawdzian", size: 18, gapBefore: 0 },
    {
      text: `${exam.basedOnLabel} - ${exam.totalPoints} pkt - ok. ${exam.estimatedMinutes} min`,
      size: 10,
      gapBefore: 18,
    },
    {
      text: "Imie i nazwisko: ............................  Klasa: ......",
      size: 10,
      gapBefore: 20,
    },
  ]
  exam.tasks.forEach((task, i) => {
    lines.push({
      text: `${i + 1}. (${TASK_TYPE_LABELS[task.type]}, ${task.points} pkt)`,
      size: 11,
      gapBefore: 26,
    })
    lines.push({ text: task.prompt, size: 10, gapBefore: 14 })
    for (const option of task.options ?? []) {
      lines.push({ text: `   ${option}`, size: 10, gapBefore: 13 })
    }
    for (const pair of task.pairs ?? []) {
      lines.push({ text: `   ${pair.left}  .....  ${pair.right}`, size: 10, gapBefore: 13 })
    }
  })

  // Content stream: absolute Td positioning down an A4 page (842pt tall).
  let y = 800
  const ops: string[] = ["BT"]
  for (const line of lines) {
    y -= line.gapBefore
    if (y < 40) break // rough export: one page is enough
    ops.push(`/F1 ${line.size} Tf`, `1 0 0 1 56 ${y} Tm`, `(${escapePdfText(line.text)}) Tj`)
  }
  ops.push("ET")
  const stream = ops.join("\n")

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]

  let pdf = "%PDF-1.4\n"
  const offsets: number[] = []
  objects.forEach((obj, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([pdf], { type: "application/pdf" })
}

/** Builds the rough PDF and hands it to the browser as a download. */
export function downloadExamPdf(exam: Exam) {
  const url = URL.createObjectURL(buildExamPdf(exam))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "sprawdzian.pdf"
  anchor.click()
  URL.revokeObjectURL(url)
}
