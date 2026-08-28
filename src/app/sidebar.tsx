import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { Info, LayoutGrid, Menu, X } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { useIsMobile } from "@/shared/hooks/use-mobile"
import { cn } from "@/shared/lib/utils"

const navItems = [
  { to: "/", label: "Posts", icon: LayoutGrid },
  { to: "/about", label: "About", icon: Info },
] as const

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          }}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}

/**
 * A static sidebar from `md` up, and a hamburger-triggered slide-in sheet
 * below that. Which one is visible is decided purely by the `md:` classes
 * below, so it can't drift from the browser's own idea of the viewport.
 * `useIsMobile` only steps in for the one thing CSS can't do: if the sheet
 * is left open and the viewport grows past mobile, its React state needs to
 * be reset so it doesn't silently reopen later out of sync with the layout.
 */
export function AppSidebar() {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  // Reset the sheet's open state as a render-time derivation (not an effect)
  // whenever the route changes or the viewport crosses back to desktop.
  const [prevPathname, setPrevPathname] = React.useState(pathname)
  const [prevIsMobile, setPrevIsMobile] = React.useState(isMobile)
  if (pathname !== prevPathname || (prevIsMobile && !isMobile)) {
    setPrevPathname(pathname)
    setPrevIsMobile(isMobile)
    if (open) setOpen(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-4 py-4">
          <span className="font-heading text-sm font-semibold text-sidebar-foreground">
            Quantica
          </span>
        </div>
        <NavLinks />
      </aside>

      <header className="flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-3 py-2.5 md:hidden">
        <DialogPrimitive.Trigger className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Menu className="size-5" />
          <span className="sr-only">Open navigation</span>
        </DialogPrimitive.Trigger>
        <span className="font-heading text-sm font-semibold text-sidebar-foreground">
          Quantica
        </span>
      </header>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 md:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col border-r border-sidebar-border bg-sidebar outline-none md:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left data-[state=open]:duration-300 data-[state=closed]:duration-200"
          )}
        >
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <div className="flex items-center justify-between px-4 py-4">
            <span className="font-heading text-sm font-semibold text-sidebar-foreground">
              Quantica
            </span>
            <DialogPrimitive.Close className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent">
              <X className="size-4" />
              <span className="sr-only">Close navigation</span>
            </DialogPrimitive.Close>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
