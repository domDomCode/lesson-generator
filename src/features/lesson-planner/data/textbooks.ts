// Query hooks for the brief screen: textbook search + chapter lists.
// Thin wrappers over api.ts — the planner store never holds this data,
// it only stores the chosen ids (textbookId, chapterIds).

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type { Chapter, Textbook } from "../model/types"
import { getChapters, searchTextbooks } from "./api"

/** Live search for the textbook picker sheet. Pass an already-debounced q. */
export function useTextbookSearch(q: string) {
  return useQuery<Textbook[]>({
    queryKey: ["textbooks", q],
    queryFn: () => searchTextbooks(q),
    // Keep the previous result list on screen while a new q loads,
    // so the sheet never flashes empty mid-typing.
    placeholderData: keepPreviousData,
  })
}

/**
 * Resolves a chosen textbookId back to its Textbook (for the picker field
 * label after a remount). Reuses the unfiltered search's cache entry.
 */
export function useTextbook(textbookId: string | null) {
  return useQuery({
    queryKey: ["textbooks", ""],
    queryFn: () => searchTextbooks(""),
    enabled: textbookId != null,
    select: (textbooks: Textbook[]) => textbooks.find((t) => t.id === textbookId) ?? null,
  })
}

/** Chapters of the chosen textbook — disabled until one is chosen. */
export function useChapters(textbookId: string | null) {
  return useQuery<Chapter[]>({
    queryKey: ["chapters", textbookId],
    queryFn: () => getChapters(textbookId ?? ""),
    enabled: textbookId != null,
  })
}
