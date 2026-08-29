import * as React from "react"

import { cn } from "@/shared/lib/utils"

/**
 * Animates height changes when its children change size (eg. swapping
 * between dialog steps), instead of the content jumping instantly.
 */
export function AnimatedHeight({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | "auto">("auto")

  React.useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return

    setHeight(content.offsetHeight)

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.target.getBoundingClientRect().height)
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ height }} className="overflow-hidden transition-[height] duration-300 ease-out">
      <div ref={contentRef} className={cn(className)}>
        {children}
      </div>
    </div>
  )
}
