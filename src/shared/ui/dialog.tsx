import * as React from "react"
import { X } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"
import { AnimatedHeight } from "@/shared/ui/animated-height"

/**
 * Responsive dialog: a fading, centered modal on desktop (`md:` and up) and
 * a bottom drawer that slides in/out below that. The mobile/desktop switch
 * is done entirely with Tailwind's `md:` breakpoint (not JS) so it can never
 * drift from what the browser itself considers the viewport to be — no
 * hook, no hydration timing, no stale match. Both variants share the same
 * Radix Dialog primitive, so triggers, focus trapping, scroll locking and
 * Escape/overlay-dismiss behave identically — only the presentation and
 * animation change per viewport.
 */
function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  contentClassName,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  contentClassName?: string
  showCloseButton?: boolean
}) {
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 bg-popover text-popover-foreground shadow-lg outline-none",
          // Mobile: bottom drawer, sliding in/out.
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-border duration-300 data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
          // Desktop (md and up): centered modal, fading + subtle scale.
          // `left-1/2` (not `inset-x-*`) on purpose — tailwind-merge treats
          // `inset-x-*` and `left-*` as the same conflict group, so pairing
          // them here would silently drop one of the two.
          "md:top-1/2 md:left-1/2 md:bottom-auto md:w-[calc(100%-2rem)] md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border-t-0 md:border md:duration-200 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:fade-in-0 md:data-[state=closed]:fade-out-0 md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        <div
          aria-hidden
          className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25 md:hidden"
        />
        <AnimatedHeight
          className={cn(
            "flex flex-col gap-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-5",
            contentClassName
          )}
        >
          {children}
        </AnimatedHeight>
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground opacity-70 outline-none transition-opacity hover:bg-muted hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-base leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
