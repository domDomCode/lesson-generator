// Display strings derived from domain objects. Pure — no DOM, no React.

import type { Block } from "./types"

/** Label used everywhere a block is referenced in copy: „Blok 2". */
export function blockLabel(block: Pick<Block, "index">): string {
  return `Blok ${block.index + 1}`
}
