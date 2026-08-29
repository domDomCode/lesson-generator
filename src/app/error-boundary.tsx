import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last-resort boundary so an unhandled render error shows a message instead
 * of a blank page. Route-level errors are handled by the router's
 * defaultErrorComponent; this catches everything above/around it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        role="alert"
        className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-3 p-6 text-center"
      >
        <h1 className="font-heading text-xl">Coś poszło nie tak</h1>
        <p className="text-sm text-muted-foreground">
          Odśwież stronę. Jeśli problem się powtarza, zacznij od nowa od briefu.
        </p>
        <button
          type="button"
          className="mx-auto rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => window.location.reload()}
        >
          Odśwież
        </button>
      </div>
    )
  }
}
