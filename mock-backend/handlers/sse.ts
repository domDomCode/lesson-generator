// Tiny SSE helper for the plan-generation stream.
//
// Wire format per event (see PlanStreamEvent in the shared contract):
//   id: <monotonic sequence>
//   event: <event.type>
//   data: <JSON of the whole event object>
//
// Note: the JSON payload INCLUDES the `type` field (redundant with `event:`
// but simpler for the client, which can parse `data` straight into the
// PlanStreamEvent union). Keep this consistent on both sides.
import { HttpResponse } from "msw"
import type { PlanStreamEvent } from "@/features/lesson-planner/model/types"

const encoder = new TextEncoder()

export type SseSend = (event: PlanStreamEvent) => void

/**
 * Builds a text/event-stream HttpResponse. `run` drives the choreography via
 * `send`; the stream closes when `run` settles. Aborted requests stop
 * enqueueing: `send` becomes a no-op once `signal` is aborted or the
 * controller has been torn down.
 */
export function sseResponse(
  signal: AbortSignal,
  run: (send: SseSend) => Promise<void>
) {
  let seq = 0
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send: SseSend = (event) => {
        if (signal.aborted) return
        seq += 1
        const frame = `id: ${seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
        try {
          controller.enqueue(encoder.encode(frame))
        } catch {
          // Controller already closed (client went away) — drop the event.
        }
      }
      void run(send)
        .catch(() => {
          // Choreography errors just end the stream; the client sees EOF.
        })
        .finally(() => {
          try {
            controller.close()
          } catch {
            // Already closed.
          }
        })
    },
  })
  return new HttpResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
    },
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
