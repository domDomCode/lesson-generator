import * as React from "react"

import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"

type Step = "intro" | "details"

/** Sample usage of the responsive Dialog: a trigger plus a two-step body to show the height animation. */
export function DialogDemo() {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<Step>("intro")

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Delay the reset past the close animation so the step change isn't visible mid-close.
      window.setTimeout(() => setStep("intro"), 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        {step === "intro" ? (
          <>
            <DialogHeader>
              <DialogTitle>Responsive dialog</DialogTitle>
              <DialogDescription>
                This is a centered, fading modal on desktop and a sliding bottom
                drawer on mobile. Resize your window (or open on a phone) to see it
                switch.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setStep("details")}>Continue</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>More details</DialogTitle>
              <DialogDescription>
                Switching steps changes the content height, and the dialog animates
                to match instead of snapping.
              </DialogDescription>
            </DialogHeader>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>Mobile: slide-in/out bottom drawer with a drag handle.</li>
              <li>Desktop: fade + subtle scale modal, centered on screen.</li>
              <li>Height and content transitions animate on every step change.</li>
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("intro")}>
                Back
              </Button>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
