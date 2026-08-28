import { useSyncExternalStore } from "react"

import { cn } from "@/shared/lib/utils"

/**
 * Minimal toast: `toast("Przywrócono")`. One short confirmation line that
 * mirrors the action's own name (copy rule: `Przywróć` → `Przywrócono`).
 * Rendered above the sticky bottom bar; auto-dismisses.
 */

interface ToastItem {
  id: number
  message: string
}

let toasts: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function toast(message: string) {
  const item: ToastItem = { id: nextId++, message }
  toasts = [...toasts, item]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== item.id)
    emit()
  }, 2600)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function Toaster({ className }: { className?: string }) {
  const items = useSyncExternalStore(subscribe, () => toasts)
  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4",
        className
      )}
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
