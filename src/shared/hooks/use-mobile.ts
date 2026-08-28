import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void) {
  const mediaQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mediaQueryList.addEventListener("change", callback)
  return () => mediaQueryList.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
}

function getServerSnapshot() {
  return false
}

/**
 * Tracks the `(max-width: 767px)` media query via useSyncExternalStore, so
 * updates stay tear-free under concurrent rendering and need no effect/state
 * dance to avoid an SSR/CSR mismatch flash.
 */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
