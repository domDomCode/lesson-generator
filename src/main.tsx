import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"
import { router } from "./app/router.tsx"
import { AppProviders } from "./app/providers.tsx"
import "./index.css"

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== "true") {
    return
  }

  // Dynamically imported so MSW never ends up in a production bundle
  // when mocking is disabled.
  const { worker } = await import("../mock-backend/browser")

  return worker.start({
    onUnhandledRequest: "bypass",
  })
}

const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("Missing #root element in index.html")

function render() {
  createRoot(rootEl!).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>
  )
}

// Render even if the mock worker fails to register — a missing dev backend
// shouldn't leave the user staring at a blank page.
enableMocking()
  .catch((err) => {
    console.error("Mock backend failed to start; continuing without it.", err)
  })
  .finally(render)
