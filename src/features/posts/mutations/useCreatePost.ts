import { useMutation, useQueryClient } from "@tanstack/react-query"
import { postsQueryKey } from "../queries/usePosts"
import type { Post } from "../queries/types"

interface CreatePostInput {
  title: string
  body: string
}

async function createPost(input: CreatePostInput): Promise<Post> {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new Error(error?.message ?? "Failed to create post")
  }

  return res.json()
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsQueryKey })
    },
  })
}
