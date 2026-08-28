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

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>
  )
})
