import type { ReactNode } from "react"
import { Link, type ErrorComponentProps } from "@tanstack/react-router"

import { Button } from "@/shared/ui/button"

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <h1 className="font-heading text-xl text-foreground">{title}</h1>
      {children}
    </div>
  )
}

/** Router-level fallback for an unknown URL. */
export function RouteNotFound() {
  return (
    <Shell title="Nie ma takiej strony">
      <p className="text-sm text-muted-foreground">Wróć do briefu i zacznij od nowa.</p>
      <Button asChild size="sm" className="mt-1">
        <Link to="/zalozenia-lekcji">Do briefu</Link>
      </Button>
    </Shell>
  )
}

/** Router-level fallback for an error thrown while rendering a route. */
export function RouteError({ error }: ErrorComponentProps) {
  return (
    <Shell title="Coś poszło nie tak">
      <p className="max-w-sm text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Nieoczekiwany błąd."}
      </p>
      <Button size="sm" className="mt-1" onClick={() => window.location.reload()}>
        Odśwież
      </Button>
    </Shell>
  )
}
