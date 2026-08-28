import * as React from "react"
import { X } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

/**
 * Responsive sheet built on the Radix Dialog primitive — the app's standard
 * container for block details, textbook search and material review. Below
 * `md` it slides up from the bottom edge; from `md` up it becomes a centred
 * modal (fade + subtle zoom). The switch is pure Tailwind `md:` classes so
 * it can never drift from the browser's own idea of the viewport.
 */
function Sheet(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPrimitive.Portal data-slot="sheet-portal">
      <DialogPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
      />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col bg-card text-card-foreground shadow-lg ring-1 ring-foreground/10 outline-none",
          // Mobile: bottom sheet sliding in/out.
          "inset-x-0 bottom-0 mx-auto max-h-[88svh] w-full max-w-[720px] rounded-t-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-300 data-[state=closed]:duration-200",
          // Desktop (md and up): centred modal, fading + subtle scale.
          // `left-1/2` (not `inset-x-*`) on purpose — tailwind-merge treats
          // `inset-x-*` and `left-*` as the same conflict group, so pairing
          // them here would silently drop one of the two.
          "md:top-1/2 md:left-1/2 md:bottom-auto md:max-h-[85vh] md:w-[calc(100%-2rem)] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:fade-in-0 md:data-[state=closed]:fade-out-0 md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:duration-200",
          className
        )}
        {...props}
      >
        {/* Grab handle — visual affordance only, dismissal is via overlay/X. */}
        <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border md:hidden" />
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute top-3 right-3 flex size-11 md:top-4 md:right-4 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="size-5" />
            <span className="sr-only">Zamknij</span>
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 px-4 pt-3 pb-2 md:px-6 md:pt-6 md:pb-3", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("pr-10 font-heading text-lg leading-snug font-medium", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Scrollable body between header and (optional) sticky footer. */
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6", className)}
      {...props}
    />
  )
}

/** Sticky action area pinned to the sheet's bottom edge. */
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex shrink-0 items-center gap-2 border-t bg-card px-4 py-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] md:rounded-b-xl md:px-6 md:py-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
}
