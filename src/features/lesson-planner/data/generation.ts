// Real SSE client for POST /api/plans/generate.
// The exported signature is a contract: the brief screen calls
// startGeneration(brief) directly from the submit handler (never from an
// effect — StrictMode would double-fire it) and navigates to /plan.

import type { Brief, PlanStreamEvent } from "../model/types"
import { dispatch } from "../state/store"

const GENERATION_FAILED_MESSAGE = "Nie udało się ułożyć planu. Spróbuj ponownie."

/** Single in-flight generation — starting a new one aborts the previous. */
let inflight: AbortController | null = null

export function startGeneration(brief: Brief): void {
  // Regenerate semantics: only one generation at a time.
  inflight?.abort()
  const controller = new AbortController()
  inflight = controller

  dispatch({ type: "generation/started" })
  void run(brief, controller)
}

async function run(brief: Brief, controller: AbortController): Promise<void> {
  try {
    const res = await fetch("/api/plans/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief),
      signal: controller.signal,
    })
    if (!res.ok || !res.body) {
      dispatch({ type: "generation/failed", message: GENERATION_FAILED_MESSAGE })
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let firstRead = true

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      if (firstRead) {
        firstRead = false
        // Non-Chromium + service-worker mocks can deliver the whole body in
        // one chunk — parsing still works, streaming UX just collapses.
        if (import.meta.env.DEV && buffer.includes('"done"')) {
          console.warn("[generation] SSE body arrived in a single read — no incremental streaming")
        }
      }
      buffer = drainFrames(buffer)
    }

    // Flush the decoder and any trailing frame without a closing blank line.
    buffer += decoder.decode()
    buffer = drainFrames(buffer)
    if (buffer.trim().length > 0) handleFrame(buffer)
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return
    dispatch({ type: "generation/failed", message: GENERATION_FAILED_MESSAGE })
  } finally {
    if (inflight === controller) inflight = null
  }
}

/** Dispatches every complete `\n\n`-terminated frame; returns the leftover. */
function drainFrames(buffer: string): string {
  let rest = buffer
  for (;;) {
    const boundary = rest.indexOf("\n\n")
    if (boundary === -1) return rest
    handleFrame(rest.slice(0, boundary))
    rest = rest.slice(boundary + 2)
  }
}

function handleFrame(frame: string): void {
  // Per the SSE format: read `data:` lines, ignore `event:`/`id:`/comments —
  // the mock repeats the event type inside the JSON payload.
  let data = ""
  for (const rawLine of frame.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine
    if (!line.startsWith("data:")) continue
    const value = line.slice(5).startsWith(" ") ? line.slice(6) : line.slice(5)
    data = data.length > 0 ? `${data}\n${value}` : value
  }
  if (data.length === 0) return

  let event: PlanStreamEvent
  try {
    event = JSON.parse(data) as PlanStreamEvent
  } catch {
    return // malformed frame — skip, the stream continues
  }
  if (typeof event !== "object" || event === null || typeof event.type !== "string") return
  dispatch({ type: "generation/event", event })
}
