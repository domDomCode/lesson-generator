import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"

import { AppSidebar } from "@/app/sidebar"

export const rootRoute = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <AppSidebar />
      <div className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </div>
  )
}
