import { useQuery } from "@tanstack/react-query"
import type { Post } from "./types"

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch("/api/posts")

  if (!res.ok) {
    throw new Error("Failed to fetch posts")
  }

  return res.json()
}

export const postsQueryKey = ["posts"] as const

export function usePosts() {
  return useQuery({
    queryKey: postsQueryKey,
    queryFn: fetchPosts,
  })
}
